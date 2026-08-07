/**
 * Admin Controller
 * Handles One-Time Admin Setup, Admin Authentication (bcrypt), Dashboard Summary Stats, Location CRUD, Master Bookings, Users List, and Payments.
 * NO DEFAULT CREDENTIALS. NO PASSWORDS EXPOSED. SUPPORTS DUAL MEMORY FALLBACK.
 *
 * SECURITY AUDIT FIXES (2026-08-05):
 * - FIXED: Removed hardcoded JWT_SECRET fallback string. process.env.JWT_SECRET is required.
 * - VERIFIED: Admin password stored as bcrypt hash (genSalt + hash) - never plain text.
 * - VERIFIED: Admin login uses only bcrypt.compare() - no === fallback.
 * - VERIFIED: getAllUsers explicitly strips password before returning - password never in API response.
 */

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const getAdminModel = require('../models/Admin');
const User = require('../models/User');
const ParkingLocation = require('../models/ParkingLocation');
const Slot = require('../models/Slot');
const Booking = require('../models/Booking');
const Transaction = require('../models/Transaction');
const dataStore = require('../models/dataStore');

const isDbConnected = () => mongoose.connection.readyState === 1;

const generateAdminToken = (id, username = '') => {
  return jwt.sign(
    { id, role: 'admin', username },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

// GET /api/admin/setup-status
const getSetupStatus = async (req, res) => {
  try {
    let adminCount = 0;
    if (isDbConnected()) {
      const Admin = getAdminModel();
      adminCount = await Admin.countDocuments();
    } else {
      adminCount = dataStore.admins.length;
    }
    res.status(200).json({ success: true, isConfigured: adminCount > 0 });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/admin/setup
const setupAdmin = async (req, res) => {
  try {
    const Admin = getAdminModel();
    let adminCount = isDbConnected() ? await Admin.countDocuments() : dataStore.admins.length;

    if (adminCount > 0) {
      return res.status(403).json({
        success: false,
        message: 'Admin setup already completed. Setup is permanently disabled.'
      });
    }

    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Please provide both username and password for admin setup.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    let adminId;
    if (isDbConnected()) {
      const admin = await Admin.create({
        username: username.toLowerCase().trim(),
        password: hashedPassword
      });
      adminId = admin._id;
    } else {
      const admin = {
        _id: `admin_${Date.now()}`,
        username: username.toLowerCase().trim(),
        password: hashedPassword,
        createdAt: new Date()
      };
      dataStore.admins.push(admin);
      adminId = admin._id;
    }

    const token = generateAdminToken(adminId, username.toLowerCase().trim());
    res.status(201).json({
      success: true,
      message: 'Admin account created successfully in admin_db database. Setup is now permanently disabled.',
      token,
      admin: { id: adminId, username: username.toLowerCase().trim() }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/admin/login
const adminLogin = async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Please provide admin username and password.' });
    }

    if (isDbConnected()) {
      const Admin = getAdminModel();
      const admin = await Admin.findOne({ username: username.toLowerCase().trim() }).select('+password');
      if (!admin) return res.status(401).json({ success: false, message: 'Invalid admin credentials.' });

      // VERIFIED: Only bcrypt.compare() used - no === plain-text fallback
      const isMatch = await bcrypt.compare(password, admin.password);
      if (!isMatch) return res.status(401).json({ success: false, message: 'Invalid admin credentials.' });

      const token = generateAdminToken(admin._id, admin.username);
      // password: intentionally excluded from response
      return res.status(200).json({ success: true, token, admin: { id: admin._id, username: admin.username } });
    } else {
      const admin = dataStore.admins.find(a => a.username === username.toLowerCase().trim());
      if (!admin) return res.status(401).json({ success: false, message: 'Invalid admin credentials.' });

      // VERIFIED: Only bcrypt.compare() used for memory store admin login too
      const isMatch = await bcrypt.compare(password, admin.password);
      if (!isMatch) return res.status(401).json({ success: false, message: 'Invalid admin credentials.' });

      const token = generateAdminToken(admin._id, admin.username);
      // password: intentionally excluded from response
      return res.status(200).json({ success: true, token, admin: { id: admin._id, username: admin.username } });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/admin/dashboard-stats
const getDashboardStats = async (req, res) => {
  try {
    const UserSubscription = require('../models/UserSubscription');

    if (isDbConnected()) {
      const totalUsers = await User.countDocuments();
      const totalBookings = await Booking.countDocuments();
      const totalLocations = await ParkingLocation.countDocuments();
      const totalSubscriptions = await UserSubscription.countDocuments();

      const revenueAgg = await Booking.aggregate([
        { $match: { status: { $ne: 'cancelled' } } },
        { $group: { _id: null, total: { $sum: '$amountPaid' } } }
      ]);
      const bookingRevenue = revenueAgg.length > 0 ? revenueAgg[0].total : 0;

      const subRevenueAgg = await UserSubscription.aggregate([
        { $match: { status: { $ne: 'cancelled' } } },
        { $group: { _id: null, total: { $sum: '$pricePaid' } } }
      ]);
      const subscriptionRevenue = subRevenueAgg.length > 0 ? subRevenueAgg[0].total : 0;
      const totalRevenue = bookingRevenue + subscriptionRevenue;

      const todayStr = new Date().toISOString().split('T')[0];
      const todayBookings = await Booking.countDocuments({ date: todayStr });

      return res.status(200).json({
        success: true,
        stats: {
          totalUsers,
          totalBookings,
          totalLocations,
          totalSubscriptions,
          bookingRevenue,
          subscriptionRevenue,
          totalRevenue,
          todayBookings
        }
      });
    } else {
      const totalUsers = dataStore.users.length;
      const totalBookings = dataStore.bookings.length;
      const totalLocations = dataStore.facilities.length;
      const totalSubscriptions = dataStore.userSubscriptions.length;

      const bookingRevenue = dataStore.bookings.filter(b => b.status !== 'cancelled').reduce((sum, b) => sum + (b.amountPaid || 0), 0);
      const subscriptionRevenue = dataStore.userSubscriptions.filter(s => s.status !== 'cancelled').reduce((sum, s) => sum + (s.pricePaid || 0), 0);
      const totalRevenue = bookingRevenue + subscriptionRevenue;

      return res.status(200).json({
        success: true,
        stats: {
          totalUsers,
          totalBookings,
          totalLocations,
          totalSubscriptions,
          bookingRevenue,
          subscriptionRevenue,
          totalRevenue,
          todayBookings: totalBookings
        }
      });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/admin/users
const getAllUsers = async (req, res) => {
  try {
    if (isDbConnected()) {
      // FIX: select('-password') explicitly excludes the password hash from admin user-list API.
      // Even though User schema has select:false, this is an explicit double-guard.
      const users = await User.find().select('-password').sort({ registrationDate: -1 });
      return res.status(200).json({ success: true, count: users.length, data: users });
    } else {
      // FIX: Destructuring to strip password from all memory-store users before returning
      const safeUsers = dataStore.users.map(({ password, ...u }) => u);
      return res.status(200).json({ success: true, count: safeUsers.length, data: safeUsers });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Location CRUD
const getAllLocations = async (req, res) => {
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

// GET /api/admin/pending-locations
const getPendingLocations = async (req, res) => {
  try {
    if (isDbConnected()) {
      const locations = await ParkingLocation.find({ status: 'pending' }).sort({ createdAt: -1 });
      return res.status(200).json({ success: true, count: locations.length, data: locations });
    } else {
      const pending = dataStore.facilities.filter(f => f.status === 'pending');
      return res.status(200).json({ success: true, count: pending.length, data: pending });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/admin/locations/:id/approve
const approveLocation = async (req, res) => {
  try {
    const locationId = req.params.id;

    if (isDbConnected()) {
      const location = await ParkingLocation.findByIdAndUpdate(
        locationId,
        { status: 'active', rejectionReason: '' },
        { new: true }
      );
      if (!location) return res.status(404).json({ success: false, message: 'Location not found.' });

      return res.status(200).json({
        success: true,
        message: `Parking location "${location.name}" approved! It is now active in search results.`,
        location
      });
    } else {
      const location = dataStore.facilities.find(f => f._id === locationId || f.facilityId === locationId);
      if (!location) return res.status(404).json({ success: false, message: 'Location not found.' });

      location.status = 'active';
      location.rejectionReason = '';
      return res.status(200).json({
        success: true,
        message: `Parking location "${location.name}" approved!`,
        location
      });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/admin/locations/:id/reject
const rejectLocation = async (req, res) => {
  try {
    const locationId = req.params.id;
    const { rejectionReason } = req.body;

    if (isDbConnected()) {
      const location = await ParkingLocation.findByIdAndUpdate(
        locationId,
        { status: 'rejected', rejectionReason: rejectionReason || 'Does not meet criteria' },
        { new: true }
      );
      if (!location) return res.status(404).json({ success: false, message: 'Location not found.' });

      return res.status(200).json({
        success: true,
        message: `Parking location "${location.name}" rejected.`,
        location
      });
    } else {
      const location = dataStore.facilities.find(f => f._id === locationId || f.facilityId === locationId);
      if (!location) return res.status(404).json({ success: false, message: 'Location not found.' });

      location.status = 'rejected';
      location.rejectionReason = rejectionReason || 'Does not meet criteria';
      return res.status(200).json({ success: true, message: `Parking location "${location.name}" rejected.`, location });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const createLocation = async (req, res) => {
  try {
    const { name, address, totalSlots, pricePerHour, latitude, longitude } = req.body;
    const slotsCount = parseInt(totalSlots) || 20;

    if (isDbConnected()) {
      const location = await ParkingLocation.create({
        name,
        address: address || 'Guwahati',
        totalSlots: slotsCount,
        pricePerHour: parseFloat(pricePerHour) || 20,
        latitude: parseFloat(latitude) || 26.1445,
        longitude: parseFloat(longitude) || 91.7362
      });

      const letters = ['A', 'B', 'C', 'D'];
      const slotDocs = [];
      letters.forEach(letter => {
        for (let num = 1; num <= 5; num++) {
          slotDocs.push({ location: location._id, slotNumber: `${letter}${num}`, status: 'available' });
        }
      });

      await Slot.create(slotDocs);
      return res.status(201).json({ success: true, message: `Location "${name}" created.`, location });
    } else {
      const newLoc = {
        _id: `f_${Date.now()}`,
        facilityId: `f_${Date.now()}`,
        name,
        address: address || 'Guwahati',
        totalSlots: slotsCount,
        pricePerHour: parseFloat(pricePerHour) || 20,
        ratePerHour: parseFloat(pricePerHour) || 20,
        latitude: parseFloat(latitude) || 26.1445,
        longitude: parseFloat(longitude) || 91.7362
      };
      dataStore.facilities.push(newLoc);
      return res.status(201).json({ success: true, message: `Location "${name}" created.`, location: newLoc });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateLocation = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, address, pricePerHour, latitude, longitude } = req.body;

    if (isDbConnected()) {
      const updateFields = { name, address, pricePerHour };
      if (latitude !== undefined) updateFields.latitude = parseFloat(latitude);
      if (longitude !== undefined) updateFields.longitude = parseFloat(longitude);

      const location = await ParkingLocation.findByIdAndUpdate(id, updateFields, { new: true });
      return res.status(200).json({ success: true, message: 'Location updated', location });
    } else {
      const loc = dataStore.facilities.find(f => f._id === id || f.facilityId === id);
      if (loc) {
        if (name) loc.name = name;
        if (address) loc.address = address;
        if (pricePerHour) { loc.pricePerHour = parseFloat(pricePerHour); loc.ratePerHour = parseFloat(pricePerHour); }
        if (latitude !== undefined) loc.latitude = parseFloat(latitude);
        if (longitude !== undefined) loc.longitude = parseFloat(longitude);
      }
      return res.status(200).json({ success: true, message: 'Location updated', location: loc });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const deleteLocation = async (req, res) => {
  try {
    const { id } = req.params;
    if (isDbConnected()) {
      await ParkingLocation.findByIdAndDelete(id);
      await Slot.deleteMany({ location: id });
    } else {
      const idx = dataStore.facilities.findIndex(f => f._id === id || f.facilityId === id);
      if (idx !== -1) dataStore.facilities.splice(idx, 1);
    }
    return res.status(200).json({ success: true, message: 'Location deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Master Bookings
const getAllBookings = async (req, res) => {
  try {
    if (isDbConnected()) {
      const bookings = await Booking.find().populate('user', 'name email phone').sort({ createdAt: -1 });
      return res.status(200).json({ success: true, count: bookings.length, data: bookings });
    } else {
      return res.status(200).json({ success: true, count: dataStore.bookings.length, data: dataStore.bookings });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateBookingStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (isDbConnected()) {
      const booking = await Booking.findByIdAndUpdate(id, { status }, { new: true });
      if (status === 'cancelled' && booking) {
        await Slot.findByIdAndUpdate(booking.slot, { status: 'available' });
      }
      return res.status(200).json({ success: true, message: `Booking status updated to ${status}`, booking });
    } else {
      const booking = dataStore.bookings.find(b => b.bookingId === id || b._id === id);
      if (booking) booking.status = status;
      return res.status(200).json({ success: true, message: `Booking status updated to ${status}`, booking });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Master Transactions
const getAllTransactions = async (req, res) => {
  try {
    if (isDbConnected()) {
      const transactions = await Transaction.find().populate('user', 'name email').sort({ timestamp: -1 });
      return res.status(200).json({ success: true, count: transactions.length, data: transactions });
    } else {
      return res.status(200).json({ success: true, count: dataStore.transactions.length, data: dataStore.transactions });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getSetupStatus,
  setupAdmin,
  adminLogin,
  getDashboardStats,
  getAllUsers,
  getAllLocations,
  getPendingLocations,
  approveLocation,
  rejectLocation,
  createLocation,
  updateLocation,
  deleteLocation,
  getAllBookings,
  updateBookingStatus,
  getAllTransactions
};
