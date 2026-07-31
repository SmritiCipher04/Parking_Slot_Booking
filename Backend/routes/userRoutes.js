/**
 * User RESTful API Routes
 * Endpoint: /api/users
 */

const express = require('express');
const router = express.Router();
const { register, login, resetPassword, changePassword, getProfile, updateProfile } = require('../controllers/authController');
const { protectUser } = require('../middleware/authMiddleware');

router.post('/register', register);
router.post('/login', login);
router.post('/reset-password', resetPassword);

// Protected routes
router.put('/change-password', protectUser, changePassword);
router.get('/profile', protectUser, getProfile);
router.put('/profile', protectUser, updateProfile);

module.exports = router;
