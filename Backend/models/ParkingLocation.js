/**
 * ParkingLocation Mongoose Model
 * Collection: parkinglocations
 * Fields: name, address, totalSlots, pricePerHour, latitude, longitude
 */

const mongoose = require('mongoose');

const parkingLocationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Parking location name is required'],
    trim: true
  },
  address: {
    type: String,
    required: [true, 'Parking address is required'],
    trim: true
  },
  totalSlots: {
    type: Number,
    required: true,
    default: 20
  },
  pricePerHour: {
    type: Number,
    required: [true, 'Price per hour is required']
  },
  latitude: {
    type: Number,
    required: false,
    default: 26.1445
  },
  longitude: {
    type: Number,
    required: false,
    default: 91.7362
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, { bufferCommands: false });

module.exports = mongoose.model('ParkingLocation', parkingLocationSchema);
