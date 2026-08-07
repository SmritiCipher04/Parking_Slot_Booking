/**
 * Partner Controller
 * Handles parking space registration by partners, auto-generation of slots,
 * partner dashboard stats, and facility editing.
 */

const mongoose = require('mongoose');
const ParkingLocation = require('../models/ParkingLocation');
const Slot = require('../models/Slot');
const Booking = require('../models/Booking');
const User = require('../models/User');
const dataStore = require('../models/dataStore');

const isDbConnected = () => mongoose.connection.readyState === 1;

// Helper to auto-generate lettered slots in sets of 5 (A1-A5, B1-B5, etc.)
const generateSlotsForLocation = async (locationId, totalSlotsCount = 20) => {
  const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
  const slotDocs = [];
  let slotsCreated = 0;

  for (let lIndex = 0; lIndex < letters.length && slotsCreated < totalSlotsCount; lIndex++) {
    const letter = letters[lIndex];
    for (let num = 1; num <= 5 && slotsCreated < totalSlotsCount; num++) {
      slotDocs.push({
        location: locationId,
        slotNumber: `${letter}${num}`,
        status: 'available',
        occupiedUntil: null
      });
      slotsCreated++;
    }
  }

  if (isDbConnected()) {
    try {
      await Slot.insertMany(slotDocs);
    } catch (e) {
      console.warn('[Partner Seeder Warning]:', e.message);
    }
  }
  return slotDocs;
};

// POST /api/partner/locations — Register a new partner parking location
const registerPartnerLocation = async (req, res) => {
  try {
    const {
      name,
      address,
      contactName,
      contactEmail,
      contactPhone,
      totalSlots,
      pricePerHour,
      latitude,
      longitude
    } = req.body;

    if (!name || !address || !pricePerHour) {
      return res.status(400).json({
        success: false,
        message: 'Please provide facility name, address, and price per hour.'
      });
    }

    const slotsCount = parseInt(totalSlots) || 20;
    const rate = parseFloat(pricePerHour) || 20;
    const lat = parseFloat(latitude) || 26.1445;
    const lng = parseFloat(longitude) || 91.7362;
    const ownerId = req.user._id || req.user.id;

    let location = null;

    if (isDbConnected()) {
      location = await ParkingLocation.create({
        name,
        address,
        totalSlots: slotsCount,
        pricePerHour: rate,
        latitude: lat,
        longitude: lng,
        ownerId,
        status: 'pending',
        contactName: contactName || req.user.name,
        contactEmail: contactEmail || req.user.email,
        contactPhone: contactPhone || req.user.phone || ''
      });

      // Auto-generate slot grid documents (A1-A5, B1-B5, etc.)
      await generateSlotsForLocation(location._id, slotsCount);

      // Upgrade user role to 'partner'
      await User.findByIdAndUpdate(ownerId, { role: 'partner' });
    } else {
      // Memory fallback
      location = {
        _id: `partner_fac_${Date.now()}`,
        name,
        address,
        totalSlots: slotsCount,
        pricePerHour: rate,
        latitude: lat,
        longitude: lng,
        ownerId,
        status: 'pending',
        contactName: contactName || req.user.name,
        contactEmail: contactEmail || req.user.email,
        contactPhone: contactPhone || req.user.phone || '',
        createdAt: new Date()
      };
      dataStore.facilities.push(location);

      const memSlots = generateSlotsForLocation(location._id, slotsCount);
      memSlots.forEach(s => dataStore.slots.push({ ...s, facilityId: location._id }));

      let memUser = dataStore.users.find(u => u._id === ownerId || u.id === ownerId);
      if (memUser) memUser.role = 'partner';
    }

    return res.status(201).json({
      success: true,
      message: `Parking space "${name}" registered successfully! It is now pending admin approval.`,
      location
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/partner/dashboard — Get partner's registered locations, bookings, and revenue
const getPartnerDashboard = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const userEmail = req.user.email ? req.user.email.toLowerCase() : '';

    let locations = [];
    let bookings = [];

    if (isDbConnected()) {
      locations = await ParkingLocation.find({
        $or: [
          { ownerId: userId },
          { contactEmail: userEmail }
        ]
      }).sort({ createdAt: -1 });

      const locationIds = locations.map(l => l._id);
      const locationNames = locations.map(l => l.name);

      bookings = await Booking.find({
        $or: [
          { location: { $in: locationIds } },
          { locationName: { $in: locationNames } }
        ]
      }).sort({ createdAt: -1 });
    } else {
      locations = dataStore.facilities.filter(f =>
        (f.ownerId && f.ownerId.toString() === userId.toString()) ||
        (f.contactEmail && f.contactEmail.toLowerCase() === userEmail)
      );

      const locNames = locations.map(l => l.name);
      bookings = dataStore.bookings.filter(b => locNames.includes(b.locationName));
    }

    const totalLocations = locations.length;
    const totalBookings = bookings.filter(b => b.status !== 'cancelled').length;
    const totalRevenue = bookings.filter(b => b.status !== 'cancelled').reduce((sum, b) => sum + (b.amountPaid || 0), 0);

    return res.status(200).json({
      success: true,
      stats: {
        totalLocations,
        totalBookings,
        totalRevenue
      },
      locations,
      bookings
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/partner/locations/:id — Edit facility details or update pricing
const updatePartnerLocation = async (req, res) => {
  try {
    const locationId = req.params.id;
    const { pricePerHour, address, contactPhone } = req.body;
    const userId = req.user._id || req.user.id;

    if (isDbConnected()) {
      const location = await ParkingLocation.findOne({ _id: locationId, ownerId: userId });
      if (!location) {
        return res.status(404).json({ success: false, message: 'Parking facility not found or unauthorized.' });
      }

      if (pricePerHour) location.pricePerHour = parseFloat(pricePerHour);
      if (address) location.address = address;
      if (contactPhone) location.contactPhone = contactPhone;

      await location.save();
      return res.status(200).json({ success: true, message: 'Facility details updated successfully.', location });
    } else {
      const location = dataStore.facilities.find(f => (f._id === locationId || f.facilityId === locationId) && f.ownerId === userId);
      if (!location) return res.status(404).json({ success: false, message: 'Facility not found.' });

      if (pricePerHour) location.pricePerHour = parseFloat(pricePerHour);
      if (address) location.address = address;

      return res.status(200).json({ success: true, message: 'Facility details updated.', location });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  registerPartnerLocation,
  getPartnerDashboard,
  updatePartnerLocation,
  generateSlotsForLocation
};
