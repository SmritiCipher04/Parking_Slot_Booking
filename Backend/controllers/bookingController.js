/**
 * Booking Controller
 * Handles user reservation creation, queries, cancellation, and extensions with Memory Fallback.
 */

const mongoose = require('mongoose');
const Booking = require('../models/Booking');
const Slot = require('../models/Slot');
const Transaction = require('../models/Transaction');
const dataStore = require('../models/dataStore');

const isDbConnected = () => mongoose.connection.readyState === 1;

// GET /api/bookings
const getUserBookings = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const email = req.user.email ? req.user.email.toLowerCase() : '';

    if (isDbConnected()) {
      const bookings = await Booking.find({ user: userId }).sort({ createdAt: -1 });
      return res.status(200).json({ success: true, count: bookings.length, data: bookings });
    } else {
      const userBookings = dataStore.bookings.filter(b => b.userEmail === email || b.user === userId);
      return res.status(200).json({ success: true, count: userBookings.length, data: userBookings });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/bookings/:id
const getBookingById = async (req, res) => {
  try {
    const bookingId = req.params.id;

    if (isDbConnected()) {
      const booking = await Booking.findOne({ bookingId, user: req.user._id });
      if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
      return res.status(200).json({ success: true, data: booking });
    } else {
      const booking = dataStore.bookings.find(b => b.bookingId === bookingId);
      if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
      return res.status(200).json({ success: true, data: booking });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/bookings/:id/cancel
const cancelBooking = async (req, res) => {
  try {
    const bookingId = req.params.id;

    if (isDbConnected()) {
      const booking = await Booking.findOneAndUpdate(
        { bookingId, user: req.user._id },
        { status: 'cancelled' },
        { new: true }
      );
      if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });

      await Slot.findByIdAndUpdate(booking.slot, { status: 'available' });
      return res.status(200).json({ success: true, message: `Booking ${bookingId} cancelled successfully.`, data: booking });
    } else {
      const booking = dataStore.bookings.find(b => b.bookingId === bookingId);
      if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });

      booking.status = 'cancelled';
      const slot = dataStore.slots.find(s => s.slotNumber === booking.slotNumber || s.id === booking.slotNumber);
      if (slot) slot.status = 'available';

      return res.status(200).json({ success: true, message: `Booking ${bookingId} cancelled successfully.`, data: booking });
    }
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

    if (isDbConnected()) {
      const booking = await Booking.findOne({ bookingId, user: req.user._id });
      if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });

      const extraCost = hours * (booking.ratePerHour || 20);
      booking.durationHours += hours;
      booking.amountPaid += extraCost;
      await booking.save();

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

      return res.status(200).json({ success: true, message: `Booking extended by ${hours} hours! Extra amount: Rs. ${extraCost}`, extraCost, data: booking });
    } else {
      const booking = dataStore.bookings.find(b => b.bookingId === bookingId);
      if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });

      const extraCost = hours * (booking.ratePerHour || 20);
      booking.durationHours += hours;
      booking.amountPaid += extraCost;

      dataStore.transactions.push({
        transactionId: `TXN_${Math.floor(100000 + Math.random() * 900000)}`,
        paymentId: `pay_ext_${Date.now()}`,
        bookingId: booking.bookingId,
        userEmail: req.user.email,
        amount: extraCost,
        paymentMethod: 'Razorpay Extension',
        paymentStatus: 'SUCCESSFUL',
        timestamp: new Date()
      });

      return res.status(200).json({ success: true, message: `Booking extended by ${hours} hours! Extra amount: Rs. ${extraCost}`, extraCost, data: booking });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/transactions
const getUserTransactions = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const email = req.user.email ? req.user.email.toLowerCase() : '';

    if (isDbConnected()) {
      const transactions = await Transaction.find({ user: userId }).sort({ timestamp: -1 });
      return res.status(200).json({ success: true, count: transactions.length, data: transactions });
    } else {
      const userTxns = dataStore.transactions.filter(t => t.userEmail === email || t.user === userId);
      return res.status(200).json({ success: true, count: userTxns.length, data: userTxns });
    }
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
