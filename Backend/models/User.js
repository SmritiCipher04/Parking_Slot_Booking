/**
 * User Mongoose Model
 * Collection: users
 * Fields: name, email, phone, hashed password (select: false), registrationDate
 */

const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Full name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email address is required'],
    unique: true,
    lowercase: true,
    trim: true
  },
  phone: {
    type: String,
    required: false,
    trim: true
  },
  password: {
    type: String,
    required: false,
    select: false
  },
  profilePicture: {
    type: String,
    default: null
  },
  authProvider: {
    type: String,
    enum: ['local', 'google'],
    default: 'local'
  },
  role: {
    type: String,
    enum: ['user', 'partner', 'admin'],
    default: 'user'
  },
  registrationDate: {
    type: Date,
    default: Date.now
  }
}, { bufferCommands: false }); // Disable buffering to prevent 10,000ms timeouts when DB is offline

module.exports = mongoose.model('User', userSchema);
