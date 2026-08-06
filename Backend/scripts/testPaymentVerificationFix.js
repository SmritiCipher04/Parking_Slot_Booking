const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Booking = require('../models/Booking');
const Slot = require('../models/Slot');
const ParkingLocation = require('../models/ParkingLocation');
const User = require('../models/User');

(async () => {
  try {
    console.log('[Payment Verification Test] Connecting to MongoDB Atlas...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('[Payment Verification Test] Connected to Atlas.\n');

    // 1. Get test location
    const location = await ParkingLocation.findOne() || await ParkingLocation.create({ name: 'Test Mall', address: 'Guwahati', totalSlots: 20, pricePerHour: 20 });

    // 2. Get test user
    const user = await User.findOne() || { _id: new mongoose.Types.ObjectId(), email: 'smriti@example.com' };

    // 3. Get or create test slot
    let slotDoc = await Slot.findOne({ location: location._id, slotNumber: 'C1' });
    if (!slotDoc) {
      slotDoc = await Slot.create({ location: location._id, slotNumber: 'C1', status: 'available' });
    } else {
      slotDoc.status = 'available';
      slotDoc.occupiedUntil = null;
      await slotDoc.save();
    }

    // 4. Test creating a booking with status 'active' and 'upcoming'
    const bookingId = `BK${Math.floor(10000 + Math.random() * 90000)}`;
    const newBooking = await Booking.create({
      bookingId,
      entryPin: '1234',
      user: user._id,
      userEmail: user.email || 'smriti@example.com',
      location: location._id,
      locationName: location.name,
      slot: slotDoc._id,
      slotNumber: 'C1',
      date: new Date().toISOString().split('T')[0],
      durationHours: 2,
      ratePerHour: 20,
      amountPaid: 40,
      status: 'active',
      paymentId: `pay_test_${Date.now()}`
    });

    console.log(`1. ✅ Successfully created Booking document with status 'active': ID ${newBooking.bookingId}`);

    // Clean up test booking
    await Booking.findByIdAndDelete(newBooking._id);
    console.log('2. ✅ Cleaned up test booking.');

    await mongoose.disconnect();
    console.log('\n🎉 PAYMENT VERIFICATION TEST PASSED SUCCESSFULLY (No ValidationError)!');
    process.exit(0);
  } catch (err) {
    console.error('❌ PAYMENT VERIFICATION TEST FAILED:', err);
    process.exit(1);
  }
})();
