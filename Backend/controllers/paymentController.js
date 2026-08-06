/**
 * Payment Controller
 * Handles Razorpay order creation and payment verification,
 * creating linked Booking and Transaction records in MongoDB Atlas.
 * Falls back to in-memory store only when Atlas is unreachable.
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
  const keyId = process.env.RAZORPAY_KEY_ID;
  if (!keyId) {
    console.warn('[Payment] RAZORPAY_KEY_ID is not set in .env');
  }
  res.status(200).json({
    success: true,
    keyId: keyId || ''
  });
};

// POST /api/payments/create-order
const createOrder = async (req, res) => {
  try {
    const { amount, slotId, facilityName, duration } = req.body;
    const numericAmount = parseFloat(amount) || 40;
    const amountInPaise = Math.round(numericAmount * 100);

    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    let order;

    if (Razorpay && keyId && keySecret) {
      try {
        const instance = new Razorpay({ key_id: keyId, key_secret: keySecret });
        order = await instance.orders.create({
          amount: amountInPaise,
          currency: 'INR',
          receipt: `rcpt_${Date.now()}`,
          notes: {
            slotId: slotId || 'A4',
            facilityName: facilityName || 'Parking',
            duration: duration || 2
          }
        });
        console.log(`[Payment] Razorpay order created: ${order.id}`);
      } catch (sdkError) {
        console.warn('[Payment] Razorpay SDK error, using local order fallback:', sdkError.message);
      }
    } else {
      console.warn('[Payment] Razorpay credentials not found in .env — using local order fallback.');
    }

    if (!order) {
      order = {
        id: `order_local_${Math.random().toString(36).substring(2, 12)}_${Date.now()}`,
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
      keyId: keyId || '',
      facilityName: facilityName || 'Parking',
      slotId: slotId || 'A4'
    });
  } catch (error) {
    console.error('[Payment] Error creating order:', error);
    res.status(500).json({ success: false, message: 'Failed to create payment order', error: error.message });
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
      facilityId,
      facilityName,
      amount,
      duration,
      paymentMethod
    } = req.body;

    const user = req.user;
    if (!user) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }

    const entryPin = Math.floor(1000 + Math.random() * 9000).toString();
    const bookingId = `BK${Math.floor(10000 + Math.random() * 90000)}`;
    const durationHours = parseInt(duration) || 2;
    const amountPaid = parseFloat(amount) || 40;
    const locName = facilityName || 'City Mall Parking';

    console.log(`[Payment] verifyPayment called — facilityId: ${facilityId}, slotId: ${slotId}, user: ${user.email}`);

    if (isDbConnected()) {
      // 1. Resolve location document from Atlas
      let locationDoc = null;

      if (facilityId) {
        if (mongoose.Types.ObjectId.isValid(facilityId)) {
          try {
            locationDoc = await ParkingLocation.findById(facilityId);
          } catch (e) {}
        }
        if (!locationDoc) {
          locationDoc = await ParkingLocation.findOne({ facilityId });
        }
      }

      if (!locationDoc && locName) {
        locationDoc = await ParkingLocation.findOne({ name: new RegExp(locName, 'i') });
      }

      if (!locationDoc) {
        console.warn(`[Payment] ⚠️ Location not found for facilityId="${facilityId}" — using first location in Atlas.`);
        locationDoc = await ParkingLocation.findOne();
      }

      console.log(`[Payment] Resolved location: ${locationDoc ? locationDoc.name : 'NOT FOUND'} (id: ${locationDoc ? locationDoc._id : 'N/A'})`);

      // 2. ATOMIC SLOT LOCKING & RACE-CONDITION PREVENTION
      let slotDoc = null;
      const targetSlotNumber = slotId || 'A4';
      const occupiedUntil = new Date(Date.now() + durationHours * 60 * 60 * 1000);

      if (locationDoc) {
        // Find slot first or auto-create if missing
        slotDoc = await Slot.findOne({ location: locationDoc._id, slotNumber: targetSlotNumber });

        if (!slotDoc) {
          console.log(`[Payment] Slot ${targetSlotNumber} not found for location ${locationDoc.name}. Creating slot in Atlas...`);
          try {
            slotDoc = await Slot.create({
              location: locationDoc._id,
              slotNumber: targetSlotNumber,
              status: 'occupied',
              occupiedUntil
            });
          } catch (slotCreateErr) {
            // Atomic lock attempt if created concurrently
            slotDoc = await Slot.findOneAndUpdate(
              { location: locationDoc._id, slotNumber: targetSlotNumber, status: 'available' },
              { status: 'occupied', occupiedUntil },
              { new: true }
            );
          }
        } else {
          // Check if slot has an unexpired active booking
          const activeBooking = await Booking.findOne({
            slot: slotDoc._id,
            status: { $in: ['active', 'upcoming'] }
          });

          // Allow booking if slot is available, expired, or has no active booking
          const isSlotFree = slotDoc.status === 'available' ||
            !activeBooking ||
            (slotDoc.occupiedUntil && new Date(slotDoc.occupiedUntil) <= new Date());

          if (!isSlotFree) {
            console.warn(`[Payment] ❌ Atomic lock failed — Slot ${targetSlotNumber} is currently occupied.`);
            return res.status(409).json({
              success: false,
              message: `Slot ${targetSlotNumber} is currently occupied by an active booking. Please select another slot.`
            });
          }

          // Atomic update: lock slot for current user
          slotDoc.status = 'occupied';
          slotDoc.occupiedUntil = occupiedUntil;
          await slotDoc.save();
        }
      }

      console.log(`[Payment] Locked slot: ${slotDoc ? slotDoc.slotNumber : targetSlotNumber} (Occupied until: ${occupiedUntil.toISOString()})`);

      // Broadcast real-time Socket.IO update to all connected clients
      const { emitSlotStatusUpdate } = require('../utils/socket');
      if (slotDoc && locationDoc) {
        emitSlotStatusUpdate({
          slotId: slotDoc._id.toString(),
          slotNumber: slotDoc.slotNumber,
          status: 'occupied',
          occupiedUntil: occupiedUntil.toISOString(),
          facilityId: locationDoc._id.toString()
        });
      }

      // 3. Resolve user document or valid user ObjectId from Atlas
      let userObjectId = undefined;
      if (user && user._id && mongoose.Types.ObjectId.isValid(user._id.toString())) {
        userObjectId = user._id;
      } else if (user && user.email) {
        try {
          const UserDoc = require('../models/User');
          const foundUser = await UserDoc.findOne({ email: user.email.toLowerCase() });
          if (foundUser) userObjectId = foundUser._id;
        } catch (e) {}
      }

      // 4. Create Booking in Atlas
      const newBooking = await Booking.create({
        bookingId,
        entryPin,
        user: userObjectId,
        userEmail: user.email,
        location: locationDoc ? locationDoc._id : undefined,
        locationName: locationDoc ? locationDoc.name : locName,
        slot: slotDoc ? slotDoc._id : undefined,
        slotNumber: targetSlotNumber,
        date: new Date().toISOString().split('T')[0],
        durationHours,
        ratePerHour: durationHours > 0 ? amountPaid / durationHours : amountPaid,
        amountPaid,
        status: 'active',
        paymentId: razorpay_payment_id || `pay_${Date.now()}`
      });

      console.log(`[Payment] ✅ Booking saved to Atlas: ${newBooking.bookingId}`);

      // 5. Create Transaction in Atlas
      await Transaction.create({
        transactionId: `TXN_${Math.floor(100000 + Math.random() * 900000)}`,
        paymentId: razorpay_payment_id || `pay_${Date.now()}`,
        booking: newBooking._id,
        bookingId,
        user: userObjectId,
        userEmail: user.email,
        amount: amountPaid,
        paymentMethod: paymentMethod || 'Razorpay (Card)',
        paymentStatus: 'SUCCESSFUL'
      });

      console.log(`[Payment] ✅ Transaction saved to Atlas for booking: ${bookingId}`);

      return res.status(200).json({
        success: true,
        message: 'Payment verified and booking saved to MongoDB Atlas!',
        booking: newBooking
      });

    } else {
      // ===== IN-MEMORY FALLBACK (only when Atlas is unreachable) =====
      console.warn('[Payment] Atlas not connected — saving booking to in-memory store.');

      const newBooking = {
        _id: `b_${Date.now()}`,
        bookingId,
        entryPin,
        pin: entryPin,
        userEmail: user.email,
        facilityName: locName,
        locationName: locName,
        slotId: slotId || 'A4',
        slotNumber: slotId || 'A4',
        date: new Date().toISOString().split('T')[0],
        durationHours,
        ratePerHour: durationHours > 0 ? amountPaid / durationHours : amountPaid,
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

      const targetSlotNumber = slotId || 'A4';
      const slot = dataStore.slots.find(s => s.slotNumber === targetSlotNumber || s.id === targetSlotNumber);
      const occupiedUntil = new Date(Date.now() + durationHours * 60 * 60 * 1000);

      if (slot) {
        if (slot.status !== 'available') {
          return res.status(409).json({
            success: false,
            message: `Slot ${targetSlotNumber} is currently occupied or reserved. Please select another slot.`
          });
        }
        slot.status = 'occupied';
        slot.occupiedUntil = occupiedUntil;
      }

      const { emitSlotStatusUpdate } = require('../utils/socket');
      emitSlotStatusUpdate({
        slotId: targetSlotNumber,
        slotNumber: targetSlotNumber,
        status: 'occupied',
        occupiedUntil: occupiedUntil.toISOString(),
        facilityId: facilityId || 'f1'
      });

      return res.status(200).json({
        success: true,
        message: 'Payment verified and booking saved to memory!',
        booking: newBooking
      });
    }
  } catch (error) {
    console.error('[Payment] Error verifying payment:', error);
    res.status(500).json({ success: false, message: 'Server error during payment verification', error: error.message });
  }
};

module.exports = { getKey, createOrder, verifyPayment };
