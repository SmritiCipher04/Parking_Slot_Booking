/**
 * Parking Location Controller
 * Handles public querying of locations and slots.
 */

const ParkingLocation = require('../models/ParkingLocation');
const Slot = require('../models/Slot');

// GET /api/locations
const getLocations = async (req, res) => {
  try {
    const locations = await ParkingLocation.find();
    res.status(200).json({
      success: true,
      data: locations
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/locations/:id/slots
const getSlotsByLocation = async (req, res) => {
  try {
    const locationId = req.params.id;
    let location = await ParkingLocation.findById(locationId);
    
    if (!location) {
      location = await ParkingLocation.findOne();
    }

    if (!location) {
      return res.status(404).json({ success: false, message: 'Parking location not found' });
    }

    const slots = await Slot.find({ location: location._id });

    res.status(200).json({
      success: true,
      location,
      data: slots
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getLocations,
  getSlotsByLocation
};
