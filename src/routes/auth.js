const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Get Google OAuth URL
router.get('/google/url', authController.googleAuthUrl);

// Handle Google OAuth callback
router.post('/google/callback', authController.googleCallback);

// Get current user
router.get('/current-user', authController.getCurrentUser);

// Logout
router.post('/logout', authController.logout);

module.exports = router;