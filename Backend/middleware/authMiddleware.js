/**
 * Authentication & Authorization Middleware
 * Verifies JWT tokens and attaches authenticated user/admin to request object.
 * Supports zero-timeout dual fallback (MongoDB Atlas + Memory DataStore).
 *
 * SECURITY AUDIT FIXES (2026-08-05):
 * - FIXED: Removed hardcoded JWT_SECRET fallback strings from both protectUser and protectAdmin.
 *          A hardcoded fallback secret means any attacker who knows it can forge valid JWT tokens.
 *          JWT_SECRET must be set as an environment variable in .env.
 */

const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../models/User');
const Admin = require('../models/Admin');
const dataStore = require('../models/dataStore');

// Middleware to protect regular user routes
const protectUser = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. No authorization token provided.'
    });
  }

  try {
    // FIX: No hardcoded fallback - JWT_SECRET must be set in .env
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    let user = null;

    if (mongoose.connection.readyState === 1) {
      try {
        if (decoded.id && mongoose.Types.ObjectId.isValid(decoded.id)) {
          user = await User.findById(decoded.id);
        }
        if (!user && decoded.email) {
          user = await User.findOne({ email: decoded.email.toLowerCase() });
        }
      } catch (dbErr) {}
    }

    if (!user) {
      user = dataStore.users.find(u =>
        (u._id && u._id.toString() === decoded.id) ||
        (u.id && u.id.toString() === decoded.id) ||
        (decoded.email && u.email && u.email.toLowerCase() === decoded.email.toLowerCase())
      );
    }

    if (!user) {
      user = {
        _id: decoded.id,
        id: decoded.id,
        name: decoded.name || 'User',
        email: decoded.email || 'user@example.com',
        phone: decoded.phone || ''
      };
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Session expired or invalid token. Please log in again.'
    });
  }
};

// Middleware to protect admin-only routes
const protectAdmin = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Admin access denied. Authorization token required.'
    });
  }

  try {
    // FIX: No hardcoded fallback - JWT_SECRET must be set in .env
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    if (decoded.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Forbidden. Admin privileges required.'
      });
    }

    let admin = null;

    if (mongoose.connection.readyState === 1) {
      try {
        const getAdminModel = require('../models/Admin');
        const Admin = getAdminModel();
        admin = await Admin.findById(decoded.id);
      } catch (e) {}
    }

    if (!admin) {
      admin = dataStore.admins.find(a =>
        (a._id && a._id.toString() === decoded.id) ||
        (a.id && a.id.toString() === decoded.id) ||
        (decoded.username && a.username && a.username.toLowerCase() === decoded.username.toLowerCase())
      );
    }

    if (!admin) {
      admin = {
        _id: decoded.id,
        id: decoded.id,
        username: decoded.username || 'admin'
      };
    }

    req.admin = admin;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Admin session expired or invalid token.'
    });
  }
};

module.exports = {
  protectUser,
  protectAdmin
};
