const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Slot = require('../models/Slot');
const Booking = require('../models/Booking');
const ParkingLocation = require('../models/ParkingLocation');
const { runSlotExpirationJob } = require('../jobs/cleanupJob');

(async () => {
  try {
    console.log('[Real-Time E2E Test] Connecting to MongoDB Atlas...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('[Real-Time E2E Test] Connected to Atlas.\n');

    // 1. Get or create test parking location
    let location = await ParkingLocation.findOne();
    if (!location) {
      location = await ParkingLocation.create({
        name: 'Realtime Test Hub',
        address: 'GS Road, Guwahati',
        totalSlots: 20,
        pricePerHour: 20
      });
    }

    // 2. Clear or reset test slot B4 to available
    let testSlot = await Slot.findOne({ location: location._id, slotNumber: 'B4' });
    if (!testSlot) {
      testSlot = await Slot.create({
        location: location._id,
        slotNumber: 'B4',
        status: 'available',
        occupiedUntil: null
      });
    } else {
      testSlot.status = 'available';
      testSlot.occupiedUntil = null;
      await testSlot.save();
    }

    console.log('1. ✅ Prepared Test Slot B4 (status: available)');

    // 3. Test Atomic Booking & Race-Condition Lock
    const occupiedUntil = new Date(Date.now() + 2 * 60 * 60 * 1000);
    const firstLock = await Slot.findOneAndUpdate(
      { _id: testSlot._id, status: 'available' },
      { status: 'occupied', occupiedUntil },
      { new: true }
    );
    console.log(`2. ✅ First Booking Lock Succeeded for Slot B4 (Occupied until: ${firstLock.occupiedUntil.toLocaleTimeString()})`);

    // Concurrent second booking attempt MUST FAIL (atomically returns null)
    const secondLockAttempt = await Slot.findOneAndUpdate(
      { _id: testSlot._id, status: 'available' },
      { status: 'occupied', occupiedUntil },
      { new: true }
    );

    if (secondLockAttempt === null) {
      console.log('3. ✅ Race-Condition Prevention Verified: Simultaneous booking attempt on Slot B4 was correctly BLOCKED!');
    } else {
      throw new Error('Race condition check failed: Second booking lock should have failed!');
    }

    // 4. Test Auto-Expiration Job
    // Set occupiedUntil to 1 minute in the past to simulate expiration
    firstLock.occupiedUntil = new Date(Date.now() - 60000);
    await firstLock.save();

    console.log('\n4. ⏳ Simulated time passage past occupiedUntil. Executing auto-expiration maintenance job...');
    await runSlotExpirationJob();

    const expiredCheck = await Slot.findById(testSlot._id);
    if (expiredCheck.status === 'available' && expiredCheck.occupiedUntil === null) {
      console.log('5. ✅ Slot Auto-Expiration Job Verified: Slot B4 automatically reverted back to AVAILABLE!');
    } else {
      throw new Error(`Slot auto-expiration failed: status is ${expiredCheck.status}`);
    }

    await mongoose.disconnect();
    console.log('\n🎉 ALL REAL-TIME SLOT BOOKING TESTS PASSED SUCCESSFULLY!');
    process.exit(0);
  } catch (err) {
    console.error('❌ REAL-TIME SLOT BOOKING TEST FAILED:', err);
    process.exit(1);
  }
})();
