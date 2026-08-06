/**
 * DeletedAccountLog Mongoose Model
 * Retains snapshot of deleted user profiles, bookings, and transactions for 2 days (48 hours)
 * for admin auditing before automated permanent purge.
 * Collection: deletedaccountlogs
 */

const mongoose = require('mongoose');

const deletedAccountLogSchema = new mongoose.Schema({
  userId: { type: String },
  userName: { type: String, required: true },
  userEmail: { type: String, required: true, lowercase: true },
  userPhone: { type: String, default: '' },
  deletedAt: { type: Date, default: Date.now },
  retainedBookings: { type: Array, default: [] },
  retainedTransactions: { type: Array, default: [] }
}, { bufferCommands: false });

// TTL index to automatically purge documents after 2 days (172800 seconds) in MongoDB Atlas
deletedAccountLogSchema.index({ deletedAt: 1 }, { expireAfterSeconds: 172800 });

module.exports = mongoose.model('DeletedAccountLog', deletedAccountLogSchema);
