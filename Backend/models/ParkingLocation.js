/**
 * ParkingLocation Mongoose Model
 * Collection: parkingLocations
 * Fields: name, address, total slots, price/hour
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
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('ParkingLocation', parkingLocationSchema);
