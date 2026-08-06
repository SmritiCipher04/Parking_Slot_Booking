/**
 * User RESTful API Routes
 * Endpoint: /api/users
 */

const express = require('express');
const router = express.Router();
const {
  register,
  login,
  googleLogin,
  uploadProfilePicture,
  removeProfilePicture,
  resetPassword,
  changePassword,
  getProfile,
  updateProfile
} = require('../controllers/authController');
const { deleteMyAccount } = require('../controllers/deletionController');
const { protectUser } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

// Public routes
router.post('/register', register);
router.post('/login', login);
router.post('/google-login', googleLogin);
router.post('/reset-password', resetPassword);

// Protected routes
router.put('/change-password', protectUser, changePassword);
router.get('/profile', protectUser, getProfile);
router.put('/profile', protectUser, updateProfile);
router.post('/profile-picture', protectUser, upload.single('profilePicture'), uploadProfilePicture);
router.delete('/profile-picture', protectUser, removeProfilePicture);

// Immediate self-service account deletion (supports /delete-account and /request-deletion)
router.post('/delete-account', protectUser, deleteMyAccount);
router.post('/request-deletion', protectUser, deleteMyAccount);
router.get('/deletion-request-status', protectUser, (req, res) => res.json({ success: true, request: null }));

module.exports = router;
