const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../middleware/auth');
const User = require('../models/User');

// Get all doctors
router.get('/doctors',
  isAuthenticated,
  async (req, res) => {
    try {
      const doctors = await User.find({ role: 'doctor' })
        .select('name email picture calendarConnected')
        .sort({ name: 1 });

      res.json({ doctors });
    } catch (error) {
      console.error('Get doctors error:', error);
      res.status(500).json({ message: 'Failed to get doctors' });
    }
  }
);

// Get user by ID
router.get('/:id',
  isAuthenticated,
  async (req, res) => {
    try {
      const user = await User.findById(req.params.id)
        .select('name email picture role calendarConnected');

      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      res.json({ user });
    } catch (error) {
      console.error('Get user error:', error);
      res.status(500).json({ message: 'Failed to get user' });
    }
  }
);

module.exports = router;