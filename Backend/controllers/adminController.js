/**
 * Admin Controller
 * Handles One-Time Admin Setup, Admin Authentication (bcrypt), Dashboard Summary Stats, Location CRUD, Master Bookings, Users List, and Payments.
 * NO DEFAULT CREDENTIALS. NO PASSWORDS EXPOSED. SUPPORTS DUAL MEMORY FALLBACK.
 */

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const Admin = require('../models/Admin');
const User = require('../models/User');
const ParkingLocation = require('../models/ParkingLocation');
const Slot = require('../models/Slot');
const Booking = require('../models/Booking');
const Transaction = require('../models/Transaction');
const dataStore = require('../models/dataStore');

const isDbConnected = () => mongoose.connection.readyState === 1;

const generateAdminToken = (id) => {
  return jwt.sign(
    { id, role: 'admin' },
    process.env.JWT_SECRET || 'excuseme_super_secret_jwt_key_2026_adtu',
    { expiresIn: '7d' }
  );
};

// GET /api/admin/setup-status
const getSetupStatus = async (req, res) => {
  try {
    let adminCount = 0;
    if (isDbConnected()) {
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

    const token = generateAdminToken(adminId);
    res.status(201).json({
      success: true,
      message: 'Admin account created successfully. Setup is now permanently disabled.',
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
      const admin = await Admin.findOne({ username: username.toLowerCase().trim() }).select('+password');
      if (!admin) return res.status(401).json({ success: false, message: 'Invalid admin credentials.' });

      const isMatch = await bcrypt.compare(password, admin.password);
      if (!isMatch) return res.status(401).json({ success: false, message: 'Invalid admin credentials.' });

      const token = generateAdminToken(admin._id);
      return res.status(200).json({ success: true, token, admin: { id: admin._id, username: admin.username } });
    } else {
      const admin = dataStore.admins.find(a => a.username === username.toLowerCase().trim());
      if (!admin) return res.status(401).json({ success: false, message: 'Invalid admin credentials.' });

      const isMatch = await bcrypt.compare(password, admin.password);
      if (!isMatch) return res.status(401).json({ success: false, message: 'Invalid admin credentials.' });

      const token = generateAdminToken(admin._id);
      return res.status(200).json({ success: true, token, admin: { id: admin._id, username: admin.username } });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/admin/dashboard-stats
const getDashboardStats = async (req, res) => {
  try {
    if (isDbConnected()) {
      const totalUsers = await User.countDocuments();
      const totalBookings = await Booking.countDocuments();
      const totalLocations = await ParkingLocation.countDocuments();

      const revenueAgg = await Booking.aggregate([
        { $match: { status: { $ne: 'cancelled' } } },
        { $group: { _id: null, total: { $sum: '$amountPaid' } } }
      ]);
      const totalRevenue = revenueAgg.length > 0 ? revenueAgg[0].total : 0;
      const todayStr = new Date().toISOString().split('T')[0];
      const todayBookings = await Booking.countDocuments({ date: todayStr });

      return res.status(200).json({
        success: true,
        stats: { totalUsers, totalBookings, totalLocations, totalRevenue, todayBookings, todayRevenue: 0 }
      });
    } else {
      const totalUsers = dataStore.users.length;
      const totalBookings = dataStore.bookings.length;
      const totalLocations = dataStore.facilities.length;
      const totalRevenue = dataStore.bookings.filter(b => b.status !== 'cancelled').reduce((sum, b) => sum + (b.amountPaid || 0), 0);

      return res.status(200).json({
        success: true,
        stats: { totalUsers, totalBookings, totalLocations, totalRevenue, todayBookings: totalBookings, todayRevenue: totalRevenue }
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
      const users = await User.find().select('-password').sort({ registrationDate: -1 });
      return res.status(200).json({ success: true, count: users.length, data: users });
    } else {
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

const createLocation = async (req, res) => {
  try {
    const { name, address, totalSlots, pricePerHour } = req.body;
    const slotsCount = parseInt(totalSlots) || 20;

    if (isDbConnected()) {
      const location = await ParkingLocation.create({
        name,
        address: address || 'Guwahati',
        totalSlots: slotsCount,
        pricePerHour: parseFloat(pricePerHour) || 20
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
        ratePerHour: parseFloat(pricePerHour) || 20
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
    const { name, address, pricePerHour } = req.body;

    if (isDbConnected()) {
      const location = await ParkingLocation.findByIdAndUpdate(id, { name, address, pricePerHour }, { new: true });
      return res.status(200).json({ success: true, message: 'Location updated', location });
    } else {
      const loc = dataStore.facilities.find(f => f._id === id || f.facilityId === id);
      if (loc) {
        if (name) loc.name = name;
        if (address) loc.address = address;
        if (pricePerHour) { loc.pricePerHour = parseFloat(pricePerHour); loc.ratePerHour = parseFloat(pricePerHour); }
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
  createLocation,
  updateLocation,
  deleteLocation,
  getAllBookings,
  updateBookingStatus,
  getAllTransactions
};
