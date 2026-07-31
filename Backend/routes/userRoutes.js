/**
 * User RESTful API Routes
 * Endpoint: /api/users
 */

const express = require('express');
const router = express.Router();
const { register, login, getProfile, updateProfile } = require('../controllers/authController');
const { protectUser } = require('../middleware/authMiddleware');

router.post('/register', register);
router.post('/login', login);
router.get('/profile', protectUser, getProfile);
router.put('/profile', protectUser, updateProfile);

module.exports = router;
