/**
 * Slot Controller
 * Provides API handlers for parking facilities and slot availability using MongoDB Atlas with Memory Fallback.
 */

const mongoose = require('mongoose');
const Facility = require('../models/Facility');
const Slot = require('../models/Slot');
const dataStore = require('../models/dataStore');

const isDbConnected = () => mongoose.connection.readyState === 1;

// GET /api/slots/facilities
const getFacilities = async (req, res) => {
  try {
    if (isDbConnected()) {
      const facilities = await Facility.find();
      return res.status(200).json({ success: true, data: facilities });
    } else {
      return res.status(200).json({ success: true, data: dataStore.facilities });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/slots/facilities
const addFacility = async (req, res) => {
  try {
    const { name, location, totalSlots, ratePerHour } = req.body;
    const facilityId = `f_${Date.now()}`;
    const slotsCount = parseInt(totalSlots) || 20;

    if (isDbConnected()) {
      const newFacility = await Facility.create({
        facilityId,
        name,
        location: location || 'Guwahati',
        totalSlots: slotsCount,
        ratePerHour: parseFloat(ratePerHour) || 20
      });

      const letters = ['A', 'B', 'C', 'D'];
      const slotDocs = [];
      letters.forEach(letter => {
        for (let num = 1; num <= 5; num++) {
          slotDocs.push({ slotId: `${letter}${num}`, facilityId, status: 'available', price: parseFloat(ratePerHour) || 20 });
        }
      });
      await Slot.create(slotDocs);

      return res.status(201).json({ success: true, message: `Facility "${name}" created.`, facility: newFacility });
    } else {
      const newFac = {
        _id: facilityId,
        facilityId,
        name,
        location: location || 'Guwahati',
        totalSlots: slotsCount,
        ratePerHour: parseFloat(ratePerHour) || 20,
        pricePerHour: parseFloat(ratePerHour) || 20
      };
      dataStore.facilities.push(newFac);
      return res.status(201).json({ success: true, message: `Facility "${name}" created.`, facility: newFac });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/slots
const getAllSlots = async (req, res) => {
  try {
    const facilityId = req.query.facilityId || 'f1';

    if (isDbConnected()) {
      const facility = await Facility.findOne({ facilityId });
      const facilitySlots = await Slot.find({ facilityId });

      return res.status(200).json({
        success: true,
        facility: facility || { facilityId, name: 'City Mall Parking', ratePerHour: 20 },
        data: facilitySlots
      });
    } else {
      const facility = dataStore.facilities.find(f => f.facilityId === facilityId) || dataStore.facilities[0];
      const targetId = facility ? (facility.facilityId || facility._id) : 'f1';
      const facilitySlots = dataStore.slots.filter(s => s.facilityId === targetId || s.location === targetId);

      return res.status(200).json({
        success: true,
        facility: facility || { facilityId, name: 'City Mall Parking', ratePerHour: 20 },
        data: facilitySlots
      });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/slots/:id/status
const updateSlotStatus = async (req, res) => {
  try {
    const slotId = req.params.id;
    const { facilityId, status } = req.body;

    if (isDbConnected()) {
      const slot = await Slot.findOneAndUpdate(
        { slotId, facilityId: facilityId || 'f1' },
        { status },
        { new: true }
      );
      if (!slot) return res.status(404).json({ success: false, message: 'Slot not found' });
      return res.status(200).json({ success: true, data: slot });
    } else {
      const slot = dataStore.slots.find(s => s.slotId === slotId || s.slotNumber === slotId);
      if (slot) slot.status = status;
      return res.status(200).json({ success: true, data: slot || { slotId, status } });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getFacilities,
  addFacility,
  getAllSlots,
  updateSlotStatus
};
