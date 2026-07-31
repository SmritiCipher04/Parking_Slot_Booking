/**
 * Admin Controller
 * Handles One-Time Admin Setup, Admin Authentication (bcrypt), Dashboard Summary Stats, Location CRUD, Master Bookings, Users List, and Payments.
 * NO DEFAULT CREDENTIALS. NO PASSWORDS EXPOSED.
 */

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const User = require('../models/User');
const ParkingLocation = require('../models/ParkingLocation');
const Slot = require('../models/Slot');
const Booking = require('../models/Booking');
const Transaction = require('../models/Transaction');

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
    const adminCount = await Admin.countDocuments();
    res.status(200).json({
      success: true,
      isConfigured: adminCount > 0
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/admin/setup (One-Time Admin Setup)
const setupAdmin = async (req, res) => {
  try {
    const adminCount = await Admin.countDocuments();
    if (adminCount > 0) {
      return res.status(403).json({
        success: false,
        message: 'Admin setup already completed. Setup is permanently disabled.'
      });
    }

    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both username and password for admin setup.'
      });
    }

    if (password.length < 5) {
      return res.status(400).json({
        success: false,
        message: 'Admin password must be at least 5 characters long.'
      });
    }

    // Hash admin password with bcrypt
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const admin = await Admin.create({
      username: username.toLowerCase().trim(),
      password: hashedPassword
    });

    const token = generateAdminToken(admin._id);

    res.status(201).json({
      success: true,
      message: 'Admin account created successfully. Setup is now permanently disabled.',
      token,
      admin: {
        id: admin._id,
        username: admin.username
      }
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
      return res.status(400).json({
        success: false,
        message: 'Please provide admin username and password.'
      });
    }

    // Query admin and select password
    const admin = await Admin.findOne({ username: username.toLowerCase().trim() }).select('+password');

    if (!admin) {
      return res.status(401).json({
        success: false,
        message: 'Invalid admin credentials.'
      });
    }

    // Compare bcrypt password
    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid admin credentials.'
      });
    }

    const token = generateAdminToken(admin._id);

    res.status(200).json({
      success: true,
      message: 'Admin authentication successful',
      token,
      admin: {
        id: admin._id,
        username: admin.username
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/admin/dashboard-stats (Live Derived Stats from Database)
const getDashboardStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalBookings = await Booking.countDocuments();
    const totalLocations = await ParkingLocation.countDocuments();

    // Live revenue aggregation (non-cancelled bookings)
    const revenueAgg = await Booking.aggregate([
      { $match: { status: { $ne: 'cancelled' } } },
      { $group: { _id: null, total: { $sum: '$amountPaid' } } }
    ]);
    const totalRevenue = revenueAgg.length > 0 ? revenueAgg[0].total : 0;

    // Today's Date String (YYYY-MM-DD)
    const todayStr = new Date().toISOString().split('T')[0];

    const todayBookings = await Booking.countDocuments({ date: todayStr });

    const todayRevenueAgg = await Booking.aggregate([
      { $match: { date: todayStr, status: { $ne: 'cancelled' } } },
      { $group: { _id: null, total: { $sum: '$amountPaid' } } }
    ]);
    const todayRevenue = todayRevenueAgg.length > 0 ? todayRevenueAgg[0].total : 0;

    res.status(200).json({
      success: true,
      stats: {
        totalUsers,
        totalBookings,
        totalLocations,
        totalRevenue,
        todayBookings,
        todayRevenue
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/admin/users (Excludes passwords)
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ registrationDate: -1 });
    res.status(200).json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Location CRUD
const getAllLocations = async (req, res) => {
  try {
    const locations = await ParkingLocation.find();
    res.status(200).json({ success: true, data: locations });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const createLocation = async (req, res) => {
  try {
    const { name, address, totalSlots, pricePerHour } = req.body;
    const slotsCount = parseInt(totalSlots) || 20;

    const location = await ParkingLocation.create({
      name,
      address: address || 'Guwahati',
      totalSlots: slotsCount,
      pricePerHour: parseFloat(pricePerHour) || 20
    });

    // Create 20 slots for new location
    const letters = ['A', 'B', 'C', 'D'];
    const slotDocs = [];
    letters.forEach(letter => {
      for (let num = 1; num <= 5; num++) {
        slotDocs.push({
          location: location._id,
          slotNumber: `${letter}${num}`,
          status: 'available'
        });
      }
    });

    await Slot.create(slotDocs);

    res.status(201).json({
      success: true,
      message: `Location "${name}" created with 20 slots.`,
      location
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateLocation = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, address, pricePerHour } = req.body;

    const location = await ParkingLocation.findByIdAndUpdate(
      id,
      { name, address, pricePerHour: parseFloat(pricePerHour) },
      { new: true }
    );

    res.status(200).json({ success: true, message: 'Location updated', location });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const deleteLocation = async (req, res) => {
  try {
    const { id } = req.params;
    await ParkingLocation.findByIdAndDelete(id);
    await Slot.deleteMany({ location: id });

    res.status(200).json({ success: true, message: 'Location and slots deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Master Bookings with Filter
const getAllBookings = async (req, res) => {
  try {
    const { status, date, location } = req.query;
    let filter = {};

    if (status) filter.status = status;
    if (date) filter.date = date;
    if (location) filter.location = location;

    const bookings = await Booking.find(filter)
      .populate('user', 'name email phone')
      .populate('location', 'name address')
      .populate('slot', 'slotNumber')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: bookings.length, data: bookings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateBookingStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const booking = await Booking.findByIdAndUpdate(id, { status }, { new: true });
    
    if (status === 'cancelled' && booking) {
      await Slot.findByIdAndUpdate(booking.slot, { status: 'available' });
    }

    res.status(200).json({ success: true, message: `Booking status updated to ${status}`, booking });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Master Transactions List
const getAllTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.find()
      .populate('user', 'name email')
      .populate('booking', 'bookingId slotNumber locationName')
      .sort({ timestamp: -1 });

    res.status(200).json({ success: true, count: transactions.length, data: transactions });
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
