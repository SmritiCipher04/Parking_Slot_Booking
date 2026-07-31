/**
 * Admin Mongoose Model
 * Collection: admins
 * Fields: username, hashed password (select: false), createdAt
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
    select: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, { bufferCommands: false });

module.exports = mongoose.model('Admin', adminSchema);
