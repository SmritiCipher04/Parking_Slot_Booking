/**
 * DeletionRequest Mongoose Model
 * Tracks user account deletion requests pending admin approval.
 * Collection: deletionrequests
 */

const mongoose = require('mongoose');

const deletionRequestSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  userName: { type: String, required: true },
  userEmail: { type: String, required: true, lowercase: true },
  userPhone: { type: String, default: '' },
  reason: { type: String, default: 'No reason provided' },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  requestedAt: { type: Date, default: Date.now },
  reviewedAt: { type: Date },
  reviewedBy: { type: String, default: '' }
}, { bufferCommands: false });

module.exports = mongoose.model('DeletionRequest', deletionRequestSchema);
