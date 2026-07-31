/**
 * Booking RESTful API Routes
 * Endpoint: /api/bookings
 */

const express = require('express');
const router = express.Router();
const { getUserBookings, getBookingById, cancelBooking, extendBooking } = require('../controllers/bookingController');
const { protectUser } = require('../middleware/authMiddleware');

router.use(protectUser);

router.get('/', getUserBookings);
router.get('/:id', getBookingById);
router.put('/:id/cancel', cancelBooking);
router.put('/:id/extend', extendBooking);

module.exports = router;
