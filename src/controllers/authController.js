const { client, scopes } = require('../config/google');
const User = require('../models/User');
const DoctorAvailability = require('../models/DoctorAvailability');
const calendarController = require('./calendarController');

exports.googleAuthUrl = (req, res) => {
  try {
    const { role } = req.query;

    console.log('Google Auth URL requested for role:', role);

    if (!role || !['doctor', 'client'].includes(role)) {
      console.error('Invalid role:', role);
      return res.status(400).json({ message: 'Invalid role specified' });
    }

    // Check if Google client is configured
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
      console.error('Google OAuth credentials not configured');
      return res.status(500).json({
        message: 'OAuth is not configured on the server. Please contact support.'
      });
    }

    const url = client.generateAuthUrl({
      access_type: 'offline',
      prompt: 'consent', // Force consent screen to get refresh token
      scope: scopes,
      state: role // Pass the role through state parameter
    });

    console.log('Generated OAuth URL successfully');
    res.json({ url });
  } catch (error) {
    console.error('Error generating Google Auth URL:', error);
    res.status(500).json({
      message: 'Failed to generate authentication URL',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

exports.googleCallback = async (req, res) => {
  const { code, state } = req.body;
  const role = state;

  // Validate inputs
  if (!code) {
    return res.status(400).json({ message: 'Authorization code is required' });
  }

  if (!role || !['doctor', 'client'].includes(role)) {
    return res.status(400).json({ message: 'Invalid role specified' });
  }

  try {
    // Exchange code for tokens
    const { tokens } = await client.getToken(code);

    // Verify the ID token
    const ticket = await client.verifyIdToken({
      idToken: tokens.id_token,
      audience: process.env.GOOGLE_CLIENT_ID
    });

    const payload = ticket.getPayload();

    // Find or create user
    let user = await User.findOne({ googleId: payload.sub });

    if (!user) {
      user = new User({
        email: payload.email,
        googleId: payload.sub,
        name: payload.name,
        picture: payload.picture,
        role: role,
        refreshToken: tokens.refresh_token
      });
      await user.save();
    } else {
      // Update refresh token if provided
      if (tokens.refresh_token) {
        user.refreshToken = tokens.refresh_token;
      }
      // Update user info if changed
      user.name = payload.name;
      user.picture = payload.picture;
      await user.save();
    }

    // Set user session
    req.session.user = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      picture: user.picture,
      calendarConnected: user.calendarConnected
    };

    console.log('Session set:', { userId: user._id, role: user.role, sessionID: req.sessionID });

    // For doctors: Auto-setup webhook and sync calendar on first login
    if (user.role === 'doctor') {
      try {
        // Check if this is first login (no availability settings yet)
        const existingAvailability = await DoctorAvailability.findOne({ doctor: user._id });

        if (!existingAvailability) {
          // First time login - initialize availability with defaults
          const availability = new DoctorAvailability({
            doctor: user._id,
            standardAvailability: [
              { dayOfWeek: 1, startTime: '09:00', endTime: '17:00', enabled: true }, // Monday
              { dayOfWeek: 2, startTime: '09:00', endTime: '17:00', enabled: true }, // Tuesday
              { dayOfWeek: 3, startTime: '09:00', endTime: '17:00', enabled: true }, // Wednesday
              { dayOfWeek: 4, startTime: '09:00', endTime: '17:00', enabled: true }, // Thursday
              { dayOfWeek: 5, startTime: '09:00', endTime: '17:00', enabled: true }, // Friday
              { dayOfWeek: 6, startTime: '09:00', endTime: '17:00', enabled: false }, // Saturday (disabled)
              { dayOfWeek: 0, startTime: '09:00', endTime: '17:00', enabled: false }  // Sunday (disabled)
            ],
            appointmentTypes: [
              { name: 'Consultation', duration: 30, color: '#2196F3', enabled: true },
              { name: 'Treatment', duration: 60, color: '#4CAF50', enabled: true },
              { name: 'Follow-up', duration: 20, color: '#FF9800', enabled: true }
            ],
            rules: {
              bufferTimeBefore: 10,
              bufferTimeAfter: 5,
              minLeadTime: 24,
              maxAdvanceBooking: 60,
              maxAppointmentsPerDay: 12
            }
          });
          await availability.save();
          console.log('Default availability created for new doctor:', user.email);
        }

        // Auto-sync calendar (setup webhook)
        console.log('Auto-syncing calendar for doctor:', user.email);
        req.user = user; // Set req.user for calendarController
        await calendarController.syncCalendar(req, {
          json: () => {},
          status: () => ({ json: () => {} })
        });

        user.calendarConnected = true;
        await user.save();
        console.log('Calendar synced and webhook setup completed for:', user.email);
      } catch (syncError) {
        console.error('Auto-sync error (non-blocking):', syncError.message);
        // Don't fail login if sync fails
      }
    }

    // Explicitly save session before responding
    req.session.save((err) => {
      if (err) {
        console.error('Session save error:', err);
        return res.status(500).json({ message: 'Failed to save session' });
      }

      console.log('Session saved successfully, sessionID:', req.sessionID);
      console.log('Cookie being sent:', req.session.cookie);

      // Ensure CORS headers are set for cookie
      res.header('Access-Control-Allow-Credentials', 'true');

      res.json({
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          picture: user.picture,
          calendarConnected: user.calendarConnected
        },
        sessionId: req.sessionID // Send session ID for debugging
      });
    });
  } catch (error) {
    console.error('Google auth error:', error);

    // Handle specific error types
    if (error.message === 'invalid_grant') {
      return res.status(400).json({
        message: 'Authorization code expired or already used. Please try logging in again.'
      });
    }

    res.status(500).json({
      message: 'Authentication failed. Please try again.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

exports.getCurrentUser = async (req, res) => {
  console.log('getCurrentUser called - Session ID:', req.sessionID);
  console.log('getCurrentUser - Session data:', req.session);
  console.log('getCurrentUser - User from session:', req.session.user);

  if (!req.session.user) {
    console.log('No user in session - returning 401');
    return res.status(401).json({ message: 'Not authenticated' });
  }

  try {
    // Get fresh user data from database to ensure up-to-date info
    const user = await User.findById(req.session.user.id);
    if (!user) {
      console.log('User not found in database:', req.session.user.id);
      return res.status(404).json({ message: 'User not found' });
    }

    console.log('User found:', user.email);

    // Update session with fresh data
    req.session.user = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      picture: user.picture,
      calendarConnected: user.calendarConnected
    };

    res.json({
      user: req.session.user
    });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.logout = (req, res) => {
  req.session.destroy(err => {
    if (err) {
      return res.status(500).json({ message: 'Logout failed' });
    }
    res.json({ message: 'Logged out successfully' });
  });
};