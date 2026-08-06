/**
 * Transaction Mongoose Model
 * Collection: transactions
 * Fields: booking (ref), user (ref), amount, payment ID, payment status, timestamp
 */

const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  transactionId: {
    type: String,
    required: true,
    unique: true
  },
  booking: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    required: false
  },
  bookingId: {
    type: String,
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  userEmail: {
    type: String,
    required: true,
    lowercase: true
  },
  amount: {
    type: Number,
    required: true
  },
  paymentId: {
    type: String,
    required: true
  },
  paymentStatus: {
    type: String,
    default: 'SUCCESSFUL'
  },
  paymentMethod: {
    type: String,
    default: 'Razorpay'
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, { bufferCommands: false });

module.exports = mongoose.model('Transaction', transactionSchema);
