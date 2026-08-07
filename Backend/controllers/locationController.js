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
      const locations = await ParkingLocation.find({
        $or: [
          { status: 'active' },
          { status: { $exists: false } }
        ]
      });
      return res.status(200).json({ success: true, data: locations });
    } else {
      const active = dataStore.facilities.filter(f => f.status === 'active' || !f.status);
      return res.status(200).json({ success: true, data: active });
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

const calculateHaversineDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return parseFloat((R * c).toFixed(1));
};

// GET /api/locations/nearby?lat=...&lng=...&radius=15
const getNearbyLocations = async (req, res) => {
  try {
    const lat = parseFloat(req.query.lat);
    const lng = parseFloat(req.query.lng);
    const maxRadius = parseFloat(req.query.radius) || 15;

    if (isNaN(lat) || isNaN(lng)) {
      return res.status(400).json({ success: false, message: 'Please provide valid latitude and longitude parameters.' });
    }

    let allLocations = [];
    if (isDbConnected()) {
      allLocations = await ParkingLocation.find({
        $or: [{ status: 'active' }, { status: { $exists: false } }]
      });
    } else {
      allLocations = dataStore.facilities.filter(f => f.status === 'active' || !f.status);
    }

    const nearbyLocations = allLocations
      .map(loc => {
        const lLat = parseFloat(loc.latitude) || 26.1445;
        const lLng = parseFloat(loc.longitude) || 91.7362;
        const distanceKm = calculateHaversineDistance(lat, lng, lLat, lLng);
        const obj = loc.toObject ? loc.toObject() : loc;
        return {
          ...obj,
          latitude: lLat,
          longitude: lLng,
          distanceKm
        };
      })
      .filter(loc => loc.distanceKm <= maxRadius)
      .sort((a, b) => a.distanceKm - b.distanceKm);

    return res.status(200).json({
      success: true,
      count: nearbyLocations.length,
      searchedCoords: { lat, lng },
      radiusKm: maxRadius,
      data: nearbyLocations
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getLocations,
  getNearbyLocations,
  getSlotsByLocation
};
