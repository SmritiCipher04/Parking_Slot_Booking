/**
 * Booking Controller
 * Handles user reservation creation, queries, cancellation, and extensions in MongoDB Atlas.
 */

const Booking = require('../models/Booking');
const Slot = require('../models/Slot');
const Transaction = require('../models/Transaction');

// GET /api/bookings (Logged-in User Bookings)
const getUserBookings = async (req, res) => {
  try {
    const userId = req.user._id;
    const bookings = await Booking.find({ user: userId }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: bookings.length,
      data: bookings
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/bookings/:id
const getBookingById = async (req, res) => {
  try {
    const booking = await Booking.findOne({ bookingId: req.params.id, user: req.user._id });
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    res.status(200).json({
      success: true,
      data: booking
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/bookings/:id/cancel
const cancelBooking = async (req, res) => {
  try {
    const bookingId = req.params.id;
    const booking = await Booking.findOneAndUpdate(
      { bookingId, user: req.user._id },
      { status: 'cancelled' },
      { new: true }
    );

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found or not owned by user' });
    }

    // Free the slot in MongoDB Atlas
    await Slot.findByIdAndUpdate(booking.slot, { status: 'available' });

    res.status(200).json({
      success: true,
      message: `Booking ${bookingId} cancelled successfully.`,
      data: booking
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/bookings/:id/extend
const extendBooking = async (req, res) => {
  try {
    const bookingId = req.params.id;
    const { extraHours } = req.body;
    const hours = parseInt(extraHours) || 1;

    const booking = await Booking.findOne({ bookingId, user: req.user._id });
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    const extraCost = hours * booking.ratePerHour;
    booking.durationHours += hours;
    booking.amountPaid += extraCost;
    await booking.save();

    // Log extension transaction in MongoDB Atlas
    await Transaction.create({
      transactionId: `TXN_${Math.floor(100000 + Math.random() * 900000)}`,
      paymentId: `pay_ext_${Date.now()}`,
      booking: booking._id,
      bookingId: booking.bookingId,
      user: req.user._id,
      userEmail: req.user.email,
      amount: extraCost,
      paymentMethod: 'Razorpay Extension',
      paymentStatus: 'SUCCESSFUL'
    });

    res.status(200).json({
      success: true,
      message: `Booking extended by ${hours} hours! Extra amount: Rs. ${extraCost}`,
      extraCost,
      data: booking
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/transactions (Logged-in User Payment History)
const getUserTransactions = async (req, res) => {
  try {
    const userId = req.user._id;
    const transactions = await Transaction.find({ user: userId }).sort({ timestamp: -1 });

    res.status(200).json({
      success: true,
      count: transactions.length,
      data: transactions
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getUserBookings,
  getBookingById,
  cancelBooking,
  extendBooking,
  getUserTransactions
};
