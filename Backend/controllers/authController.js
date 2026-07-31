/**
 * Auth Controller
 * Handles user registration, bcrypt password hashing, login verification, profile management, and password reset/change.
 * SUPPORTS ZERO-TIMEOUT DUAL FALLBACK: MONGODB ATLAS + IN-MEMORY STORE.
 */

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../models/User');
const dataStore = require('../models/dataStore');

const isDbConnected = () => mongoose.connection.readyState === 1;

const generateToken = (id, role = 'user') => {
  return jwt.sign(
    { id, role },
    process.env.JWT_SECRET || 'excuseme_super_secret_jwt_key_2026_adtu',
    { expiresIn: '7d' }
  );
};

// POST /api/users/register
const register = async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;

    if (!name || !email || !phone || !password) {
      return res.status(400).json({
        success: false,
        message: 'All fields (name, email, phone, password) are required.'
      });
    }

    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address.'
      });
    }

    if (password.length < 4) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 4 characters long.'
      });
    }

    let existingUser = null;

    if (isDbConnected()) {
      try {
        existingUser = await User.findOne({ email: email.toLowerCase() });
      } catch (e) {}
    }

    if (!existingUser) {
      existingUser = await dataStore.findUserByEmail(email);
    }

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email address already exists.'
      });
    }

    let user = null;

    if (isDbConnected()) {
      try {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        user = await User.create({
          name,
          email: email.toLowerCase(),
          phone,
          password: hashedPassword
        });
      } catch (e) {
        console.warn('[DB Register Fallback]:', e.message);
      }
    }

    if (!user) {
      user = await dataStore.createUser({ name, email, phone, password });
    }

    const userId = user._id || user.id;
    const token = generateToken(userId, 'user');

    return res.status(201).json({
      success: true,
      message: 'User registration successful',
      token,
      user: {
        id: userId,
        name: user.name,
        email: user.email,
        phone: user.phone,
        registrationDate: user.registrationDate || new Date()
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/users/login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password.'
      });
    }

    let user = null;

    if (isDbConnected()) {
      try {
        user = await User.findOne({ email: email.toLowerCase() }).select('+password');
      } catch (dbErr) {
        console.warn('[DB Login Fallback]:', dbErr.message);
      }
    }

    if (!user) {
      user = await dataStore.findUserByEmail(email);
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email address or password.'
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email address or password.'
      });
    }

    const userId = user._id || user.id;
    const token = generateToken(userId, 'user');

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: userId,
        name: user.name,
        email: user.email,
        phone: user.phone,
        registrationDate: user.registrationDate || new Date()
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/users/reset-password
const resetPassword = async (req, res) => {
  try {
    const { email, phone, newPassword } = req.body;

    if (!email || !phone || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide registered Email, Phone number, and New Password.'
      });
    }

    if (newPassword.length < 4) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 4 characters long.'
      });
    }

    let resetSuccess = false;

    if (isDbConnected()) {
      try {
        const user = await User.findOne({
          email: email.toLowerCase().trim(),
          phone: phone.trim()
        }).select('+password');

        if (user) {
          const salt = await bcrypt.genSalt(10);
          user.password = await bcrypt.hash(newPassword, salt);
          await user.save();
          resetSuccess = true;
        }
      } catch (e) {}
    }

    if (!resetSuccess) {
      resetSuccess = await dataStore.resetUserPasswordInMemory(email, phone, newPassword);
    }

    if (!resetSuccess) {
      return res.status(404).json({
        success: false,
        message: 'No account found matching provided registered Email and Phone number.'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Password reset successfully! You can now log in with your new password.'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/users/change-password
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Please provide current and new password.' });
    }

    let user = null;

    if (isDbConnected()) {
      try {
        user = await User.findById(req.user._id || req.user.id).select('+password');
        if (user) {
          const isMatch = await bcrypt.compare(currentPassword, user.password);
          if (!isMatch) return res.status(400).json({ success: false, message: 'Incorrect current password.' });

          const salt = await bcrypt.genSalt(10);
          user.password = await bcrypt.hash(newPassword, salt);
          await user.save();
          return res.status(200).json({ success: true, message: 'Password changed successfully.' });
        }
      } catch (e) {}
    }

    user = dataStore.users.find(u => u.email === req.user.email);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) return res.status(400).json({ success: false, message: 'Incorrect current password.' });

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    return res.status(200).json({ success: true, message: 'Password changed successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/users/profile
const getProfile = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      user: {
        id: req.user._id || req.user.id,
        name: req.user.name,
        email: req.user.email,
        phone: req.user.phone,
        registrationDate: req.user.registrationDate || new Date()
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/users/profile
const updateProfile = async (req, res) => {
  try {
    const { name, phone } = req.body;

    if (isDbConnected()) {
      try {
        const user = await User.findByIdAndUpdate(
          req.user._id || req.user.id,
          { name, phone },
          { new: true, runValidators: true }
        );
        if (user) {
          return res.status(200).json({
            success: true,
            message: 'Profile updated successfully',
            user: { id: user._id, name: user.name, email: user.email, phone: user.phone, registrationDate: user.registrationDate }
          });
        }
      } catch (e) {}
    }

    const user = dataStore.users.find(u => u.email === req.user.email);
    if (user) {
      if (name) user.name = name;
      if (phone) user.phone = phone;
    }
    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user: { id: user ? user._id : req.user.id, name, email: req.user.email, phone }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  register,
  login,
  resetPassword,
  changePassword,
  getProfile,
  updateProfile
};
