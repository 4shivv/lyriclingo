const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');

// Import the entire controller as an object
const authController = require('../controllers/authController');

// Public routes
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/forgot-password', authController.forgotPassword);
router.get('/verify-reset-token/:token', authController.verifyResetToken);
router.post('/reset-password', authController.resetPassword);

// Protected routes
router.get('/me', authMiddleware, authController.getCurrentUser);

module.exports = router; 