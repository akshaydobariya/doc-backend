const express = require('express');
const router = express.Router();
const { isAuthenticated, hasRole } = require('../middleware/auth');
const Appointment = require('../models/Appointment');

// Get all appointments for a user (doctor or client)
router.get('/', 
  isAuthenticated,
  async (req, res) => {
    try {
      const query = req.user.role === 'doctor' 
        ? { doctor: req.user._id }
        : { client: req.user._id };

      const appointments = await Appointment.find(query)
        .populate('doctor')
        .populate('client')
        .populate('slot')
        .sort({ createdAt: -1 });

      res.json({ appointments });
    } catch (error) {
      console.error('Get appointments error:', error);
      res.status(500).json({ message: 'Failed to get appointments' });
    }
  }
);

// Get appointment by ID
router.get('/:id',
  isAuthenticated,
  async (req, res) => {
    try {
      const appointment = await Appointment.findById(req.params.id)
        .populate('doctor')
        .populate('client')
        .populate('slot');

      if (!appointment) {
        return res.status(404).json({ message: 'Appointment not found' });
      }

      // Check if user has access to this appointment
      if (req.user.role === 'client' && appointment.client.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Access denied' });
      }

      if (req.user.role === 'doctor' && appointment.doctor.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Access denied' });
      }

      res.json({ appointment });
    } catch (error) {
      console.error('Get appointment error:', error);
      res.status(500).json({ message: 'Failed to get appointment' });
    }
  }
);

// Update appointment status
router.patch('/:id/status',
  isAuthenticated,
  hasRole(['doctor']),
  async (req, res) => {
    try {
      const { status } = req.body;
      const appointment = await Appointment.findOneAndUpdate(
        { _id: req.params.id, doctor: req.user._id },
        { status },
        { new: true }
      )
      .populate('doctor')
      .populate('client')
      .populate('slot');

      if (!appointment) {
        return res.status(404).json({ message: 'Appointment not found' });
      }

      res.json({ appointment });
    } catch (error) {
      console.error('Update appointment error:', error);
      res.status(500).json({ message: 'Failed to update appointment' });
    }
  }
);

module.exports = router;