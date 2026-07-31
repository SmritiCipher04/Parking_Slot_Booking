/**
 * Parking Location Controller
 * Handles public querying of locations and slots with Memory Fallback.
 */

const mongoose = require('mongoose');
const ParkingLocation = require('../models/ParkingLocation');
const Slot = require('../models/Slot');
const dataStore = require('../models/dataStore');

const isDbConnected = () => mongoose.connection.readyState === 1;

// GET /api/locations
const getLocations = async (req, res) => {
  try {
    if (isDbConnected()) {
      const locations = await ParkingLocation.find();
      return res.status(200).json({ success: true, data: locations });
    } else {
      return res.status(200).json({ success: true, data: dataStore.facilities });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/locations/:id/slots
const getSlotsByLocation = async (req, res) => {
  try {
    const locationId = req.params.id;

    if (isDbConnected()) {
      let location = await ParkingLocation.findById(locationId);
      if (!location) location = await ParkingLocation.findOne();
      if (!location) return res.status(404).json({ success: false, message: 'Location not found' });

      const slots = await Slot.find({ location: location._id });
      return res.status(200).json({ success: true, location, data: slots });
    } else {
      const location = dataStore.facilities.find(f => f.facilityId === locationId || f._id === locationId) || dataStore.facilities[0];
      const targetId = location ? (location.facilityId || location._id) : 'f1';
      const slots = dataStore.slots.filter(s => s.facilityId === targetId || s.location === targetId);

      return res.status(200).json({ success: true, location, data: slots });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getLocations,
  getSlotsByLocation
};
