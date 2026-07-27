/**
 * Transaction Mongoose Model
 * Represents payment transaction receipts stored in MongoDB Atlas.
 */

const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  transactionId: {
    type: String,
    required: true,
    unique: true
  },
  paymentId: {
    type: String,
    required: true
  },
  bookingId: {
    type: String,
    required: true
  },
  userEmail: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  facilityName: {
    type: String,
    required: true
  },
  slotId: {
    type: String,
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  paymentMethod: {
    type: String,
    default: 'Razorpay'
  },
  status: {
    type: String,
    default: 'SUCCESSFUL'
  },
  date: {
    type: String,
    default: () => new Date().toLocaleDateString('en-GB')
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Transaction', transactionSchema);
