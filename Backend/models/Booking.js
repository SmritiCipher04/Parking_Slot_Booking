/**
 * Booking Mongoose Model
 * Represents slot reservations stored in MongoDB Atlas.
 */

const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  bookingId: {
    type: String,
    required: true,
    unique: true
  },
  pin: {
    type: String,
    required: true
  },
  userEmail: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  facilityId: {
    type: String,
    required: true
  },
  facilityName: {
    type: String,
    required: true
  },
  slotId: {
    type: String,
    required: true
  },
  date: {
    type: String,
    required: true
  },
  durationHours: {
    type: Number,
    required: true
  },
  ratePerHour: {
    type: Number,
    required: true
  },
  amountPaid: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['Upcoming', 'Completed', 'Cancelled'],
    default: 'Upcoming'
  },
  paymentId: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Booking', bookingSchema);
