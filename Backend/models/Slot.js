/**
 * Slot Mongoose Model
 * Collection: slots
 * Fields: location (ref), slotNumber, status (available/occupied/reserved)
 */

const mongoose = require('mongoose');

const slotSchema = new mongoose.Schema({
  location: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ParkingLocation',
    required: true
  },
  slotNumber: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['available', 'occupied', 'reserved'],
    default: 'available'
  }
}, { bufferCommands: false });

slotSchema.index({ location: 1, slotNumber: 1 }, { unique: true });

module.exports = mongoose.model('Slot', slotSchema);
