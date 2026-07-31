/**
 * Admin RESTful API Routes
 * Endpoint: /api/admin
 */

const express = require('express');
const router = express.Router();
const {
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
} = require('../controllers/adminController');
const { protectAdmin } = require('../middleware/authMiddleware');

// Public Setup & Login Endpoints
router.get('/setup-status', getSetupStatus);
router.post('/setup', setupAdmin); // One-Time Setup route
router.post('/login', adminLogin);

// Protected Admin Dashboard & Management Endpoints
router.get('/dashboard-stats', protectAdmin, getDashboardStats);
router.get('/users', protectAdmin, getAllUsers);
router.get('/locations', protectAdmin, getAllLocations);
router.post('/locations', protectAdmin, createLocation);
router.put('/locations/:id', protectAdmin, updateLocation);
router.delete('/locations/:id', protectAdmin, deleteLocation);
router.get('/bookings', protectAdmin, getAllBookings);
router.put('/bookings/:id/status', protectAdmin, updateBookingStatus);
router.get('/transactions', protectAdmin, getAllTransactions);

module.exports = router;
