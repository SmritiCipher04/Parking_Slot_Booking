/**
 * SubscriptionPlan Mongoose Model
 * Collection: subscriptionplans
 * Defines available ExcuseME PLUS passes per parking location.
 */

const mongoose = require('mongoose');

const subscriptionPlanSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['weekly', 'monthly'],
    required: true
  },
  durationDays: {
    type: Number,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  savingsPercentage: {
    type: Number,
    default: 25
  },
  location: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ParkingLocation',
    required: false
  },
  locationName: {
    type: String,
    required: true
  },
  features: {
    type: [String],
    default: [
      'Unlimited slot reservations at this location',
      'Zero per-booking payments',
      'Priority slot allocation',
      '24/7 parking access'
    ]
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, { bufferCommands: false });

module.exports = mongoose.model('SubscriptionPlan', subscriptionPlanSchema);
