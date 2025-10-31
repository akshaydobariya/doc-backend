const User = require('../models/User');

// Authentication middleware
exports.isAuthenticated = async (req, res, next) => {
  try {
    // Check for session.user (current auth system)
    if (!req.session.user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    // Populate req.user with user data from database
    const user = await User.findById(req.session.user.id);
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({ message: 'Authentication error' });
  }
};

// Role-based middleware
exports.hasRole = (roles) => {
  return (req, res, next) => {
    // Check session.user.role (current auth system) or req.user.role (from isAuthenticated)
    const userRole = req.session.user?.role || req.user?.role;
    if (!userRole || !roles.includes(userRole)) {
      return res.status(403).json({ message: 'Access denied' });
    }
    next();
  };
};