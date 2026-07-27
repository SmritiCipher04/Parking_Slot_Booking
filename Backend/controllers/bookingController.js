/**
 * Booking Controller
 * Manages user booking records, history, cancellations, and extensions via MongoDB Atlas.
 */

const Booking = require('../models/Booking');
const Slot = require('../models/Slot');
const Transaction = require('../models/Transaction');

// GET /api/bookings
const getUserBookings = async (req, res) => {
  try {
    const email = req.query.email;
    const filter = (email && req.query.all !== 'true') ? { userEmail: email.toLowerCase() } : {};
    
    const bookings = await Booking.find(filter).sort({ createdAt: -1 });

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
    const booking = await Booking.findOne({ bookingId: req.params.id });
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
      { bookingId },
      { status: 'Cancelled' },
      { new: true }
    );

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    // Free the slot in MongoDB Atlas
    await Slot.findOneAndUpdate(
      { slotId: booking.slotId, facilityId: booking.facilityId },
      { status: 'available' }
    );

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

    const booking = await Booking.findOne({ bookingId });
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
      bookingId: booking.bookingId,
      userEmail: booking.userEmail,
      facilityName: booking.facilityName,
      slotId: booking.slotId,
      amount: extraCost,
      paymentMethod: 'Razorpay Extension',
      status: 'SUCCESSFUL'
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

// GET /api/transactions
const getTransactions = async (req, res) => {
  try {
    const email = req.query.email;
    const filter = (email && req.query.all !== 'true') ? { userEmail: email.toLowerCase() } : {};
    
    const transactions = await Transaction.find(filter).sort({ createdAt: -1 });

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
  getTransactions
};
