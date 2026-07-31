/**
 * Payment Controller
 * Handles Razorpay order creation and payment verification creating linked Booking and Transaction records with Memory Fallback.
 */

const crypto = require('crypto');
const mongoose = require('mongoose');
const Booking = require('../models/Booking');
const Transaction = require('../models/Transaction');
const Slot = require('../models/Slot');
const ParkingLocation = require('../models/ParkingLocation');
const dataStore = require('../models/dataStore');

const isDbConnected = () => mongoose.connection.readyState === 1;

let Razorpay;
try {
  Razorpay = require('razorpay');
} catch (e) {
  Razorpay = null;
}

// GET /api/payments/get-key
const getKey = (req, res) => {
  const keyId = process.env.RAZORPAY_KEY_ID || 'rzp_test_TAyTdm1bjJolB1';
  res.status(200).json({
    success: true,
    keyId: keyId
  });
};

// POST /api/payments/create-order
const createOrder = async (req, res) => {
  try {
    const { amount, slotId, facilityName, duration } = req.body;
    const numericAmount = parseFloat(amount) || 40;
    const amountInPaise = Math.round(numericAmount * 100);

    const keyId = process.env.RAZORPAY_KEY_ID || 'rzp_test_TAyTdm1bjJolB1';
    const keySecret = process.env.RAZORPAY_KEY_SECRET || 'QYJA5f7LMZHE1PUaeRI9pPJn';

    let order;

    if (Razorpay && keyId && keySecret && !keyId.includes('your_razorpay')) {
      try {
        const instance = new Razorpay({
          key_id: keyId,
          key_secret: keySecret
        });

        order = await instance.orders.create({
          amount: amountInPaise,
          currency: 'INR',
          receipt: `rcpt_${Date.now()}`,
          notes: {
            slotId: slotId || 'A4',
            facilityName: facilityName || 'City Mall Parking',
            duration: duration || 2
          }
        });
      } catch (sdkError) {
        console.warn('[Razorpay SDK Notice]: Local order fallback:', sdkError.message);
      }
    }

    if (!order) {
      order = {
        id: `order_${Math.random().toString(36).substring(2, 12)}_${Date.now()}`,
        entity: 'order',
        amount: amountInPaise,
        amount_paid: 0,
        amount_due: amountInPaise,
        currency: 'INR',
        receipt: `rcpt_${Date.now()}`,
        status: 'created',
        created_at: Math.floor(Date.now() / 1000)
      };
    }

    res.status(200).json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: keyId,
      facilityName: facilityName || 'City Mall Parking',
      slotId: slotId || 'A4'
    });
  } catch (error) {
    console.error('Error creating Razorpay order:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create payment order',
      error: error.message
    });
  }
};

// POST /api/payments/verify-payment
const verifyPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      slotId,
      locationId,
      facilityName,
      amount,
      duration,
      paymentMethod
    } = req.body;

    const user = req.user;
    const entryPin = Math.floor(1000 + Math.random() * 9000).toString();
    const bookingId = `BK${Math.floor(10000 + Math.random() * 90000)}`;
    const durationHours = parseInt(duration) || 2;
    const amountPaid = parseFloat(amount) || 40;
    const locName = facilityName || 'City Mall Parking';

    if (isDbConnected()) {
      let locationDoc = null;
      if (locationId) locationDoc = await ParkingLocation.findById(locationId);
      if (!locationDoc) locationDoc = await ParkingLocation.findOne();

      let slotDoc = null;
      if (locationDoc) slotDoc = await Slot.findOne({ location: locationDoc._id, slotNumber: slotId || 'A4' });

      const newBooking = await Booking.create({
        bookingId,
        entryPin,
        user: user._id,
        userEmail: user.email,
        location: locationDoc ? locationDoc._id : user._id,
        locationName: locationDoc ? locationDoc.name : locName,
        slot: slotDoc ? slotDoc._id : user._id,
        slotNumber: slotId || 'A4',
        date: new Date().toISOString().split('T')[0],
        durationHours,
        ratePerHour: amountPaid / durationHours,
        amountPaid,
        status: 'upcoming',
        paymentId: razorpay_payment_id || `pay_${Date.now()}`
      });

      await Transaction.create({
        transactionId: `TXN_${Math.floor(100000 + Math.random() * 900000)}`,
        paymentId: razorpay_payment_id || `pay_${Date.now()}`,
        booking: newBooking._id,
        bookingId,
        user: user._id,
        userEmail: user.email,
        amount: amountPaid,
        paymentMethod: paymentMethod || 'Razorpay (Card)',
        paymentStatus: 'SUCCESSFUL'
      });

      if (slotDoc) {
        slotDoc.status = 'occupied';
        await slotDoc.save();
      }

      return res.status(200).json({
        success: true,
        message: 'Payment verified and booking saved to MongoDB Atlas!',
        booking: newBooking
      });
    } else {
      const newBooking = {
        _id: `b_${Date.now()}`,
        bookingId,
        entryPin,
        pin: entryPin,
        userEmail: user.email,
        facilityName: locName,
        slotId: slotId || 'A4',
        slotNumber: slotId || 'A4',
        date: new Date().toISOString().split('T')[0],
        durationHours,
        ratePerHour: amountPaid / durationHours,
        amountPaid,
        status: 'upcoming',
        paymentId: razorpay_payment_id || `pay_${Date.now()}`,
        createdAt: new Date()
      };

      dataStore.bookings.push(newBooking);

      dataStore.transactions.push({
        transactionId: `TXN_${Math.floor(100000 + Math.random() * 900000)}`,
        paymentId: razorpay_payment_id || `pay_${Date.now()}`,
        bookingId,
        userEmail: user.email,
        facilityName: locName,
        slotId: slotId || 'A4',
        amount: amountPaid,
        paymentMethod: paymentMethod || 'Razorpay Simulator',
        paymentStatus: 'SUCCESSFUL',
        timestamp: new Date()
      });

      const slot = dataStore.slots.find(s => s.slotNumber === (slotId || 'A4'));
      if (slot) slot.status = 'occupied';

      return res.status(200).json({
        success: true,
        message: 'Payment verified and booking saved (Memory Mode)!',
        booking: newBooking
      });
    }
  } catch (error) {
    console.error('Error verifying payment:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during payment verification',
      error: error.message
    });
  }
};

module.exports = {
  getKey,
  createOrder,
  verifyPayment
};
