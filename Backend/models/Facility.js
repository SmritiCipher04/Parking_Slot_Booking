/**
 * Facility Mongoose Model
 * Represents parking location facilities stored in MongoDB Atlas.
 */

const mongoose = require('mongoose');

const facilitySchema = new mongoose.Schema({
  facilityId: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  location: {
    type: String,
    required: true,
    trim: true
  },
  totalSlots: {
    type: Number,
    default: 20
  },
  ratePerHour: {
    type: Number,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Facility', facilitySchema);
