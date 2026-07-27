/**
 * Auth Routes
 */

const express = require('express');
const router = express.Router();
const { login, register, adminLogin, updateProfile, getAllUsers } = require('../controllers/authController');

router.post('/login', login);
router.post('/register', register);
router.post('/admin-login', adminLogin);
router.put('/profile', updateProfile);
router.get('/users', getAllUsers);

module.exports = router;
