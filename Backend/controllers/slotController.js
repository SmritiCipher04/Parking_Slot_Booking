/**
 * Slot Controller
 * Provides API handlers for parking facilities and slot availability using MongoDB Atlas.
 */

const Facility = require('../models/Facility');
const Slot = require('../models/Slot');

// GET /api/slots/facilities
const getFacilities = async (req, res) => {
  try {
    const facilities = await Facility.find();
    res.status(200).json({
      success: true,
      data: facilities
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/slots/facilities (Admin: Add new location facility)
const addFacility = async (req, res) => {
  try {
    const { name, location, totalSlots, ratePerHour } = req.body;
    const facilityId = `f_${Date.now()}`;
    const slotsCount = parseInt(totalSlots) || 20;
    const rate = parseFloat(ratePerHour) || 20;

    const newFacility = await Facility.create({
      facilityId,
      name,
      location,
      totalSlots: slotsCount,
      ratePerHour: rate
    });

    // Generate 20 slots for the new facility in MongoDB Atlas
    const letters = ['A', 'B', 'C', 'D'];
    const slotDocs = [];
    letters.forEach(letter => {
      for (let num = 1; num <= 5; num++) {
        slotDocs.push({
          slotId: `${letter}${num}`,
          facilityId: facilityId,
          status: 'available',
          price: rate
        });
      }
    });

    await Slot.create(slotDocs);

    res.status(201).json({
      success: true,
      message: `Facility "${name}" created successfully with 20 slots!`,
      facility: newFacility
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/slots
const getAllSlots = async (req, res) => {
  try {
    const facilityId = req.query.facilityId || 'f1';
    const facility = await Facility.findOne({ facilityId });
    const facilitySlots = await Slot.find({ facilityId });

    res.status(200).json({
      success: true,
      facility: facility || { facilityId, name: 'City Mall Parking', ratePerHour: 20 },
      data: facilitySlots
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/slots/:id/status
const updateSlotStatus = async (req, res) => {
  try {
    const slotId = req.params.id;
    const { facilityId, status } = req.body;

    const slot = await Slot.findOneAndUpdate(
      { slotId, facilityId: facilityId || 'f1' },
      { status },
      { new: true }
    );

    if (!slot) {
      return res.status(404).json({ success: false, message: 'Slot not found' });
    }

    res.status(200).json({
      success: true,
      message: `Slot ${slotId} status updated to ${slot.status}`,
      data: slot
    });
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
