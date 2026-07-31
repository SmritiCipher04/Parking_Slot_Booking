/**
 * Admin Mongoose Model
 * Collection: admins
 * Fields: username, hashed password (select: false), createdAt
 * Created ONLY via One-Time Admin Setup (/admin-setup)
 */

const mongoose = require('mongoose');

const adminSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Admin username is required'],
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: [true, 'Admin password is required'],
    select: false // EXCLUDED by default from all queries
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Admin', adminSchema);
