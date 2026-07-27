/**
 * Slot Mongoose Model
 * Represents individual parking slots stored in MongoDB Atlas.
 */

const mongoose = require('mongoose');

const slotSchema = new mongoose.Schema({
  slotId: {
    type: String,
    required: true
  },
  facilityId: {
    type: String,
    required: true,
    ref: 'Facility'
  },
  status: {
    type: String,
    enum: ['available', 'booked', 'reserved'],
    default: 'available'
  },
  price: {
    type: Number,
    required: true
  }
});

// Composite unique index for slotId + facilityId
slotSchema.index({ slotId: 1, facilityId: 1 }, { unique: true });

module.exports = mongoose.model('Slot', slotSchema);
