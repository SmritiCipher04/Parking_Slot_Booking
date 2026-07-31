/**
 * Booking Mongoose Model
 * Collection: bookings
 * Fields: user (ref), slot (ref), location (ref), date, duration, status (upcoming/completed/cancelled), entry PIN
 */

const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  bookingId: {
    type: String,
    required: true,
    unique: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  userEmail: {
    type: String,
    required: true,
    lowercase: true
  },
  location: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ParkingLocation',
    required: true
  },
  locationName: {
    type: String,
    required: true
  },
  slot: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Slot',
    required: true
  },
  slotNumber: {
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
    enum: ['upcoming', 'completed', 'cancelled'],
    default: 'upcoming'
  },
  entryPin: {
    type: String,
    required: true
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
