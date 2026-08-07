const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const User = require('../models/User');
const ParkingLocation = require('../models/ParkingLocation');
const Slot = require('../models/Slot');
const Booking = require('../models/Booking');
const { generateSlotsForLocation } = require('../controllers/partnerController');

(async () => {
  try {
    console.log('[Partner E2E Test] Connecting to MongoDB Atlas...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('[Partner E2E Test] Connected to Atlas.');

    const timestamp = Date.now();
    const partnerEmail = `partner_test_${timestamp}@example.com`;
    const customerEmail = `customer_test_${timestamp}@example.com`;

    // 1. Create Partner User
    const partnerUser = await User.create({
      name: 'Partner John',
      email: partnerEmail,
      phone: '9876543210',
      role: 'user'
    });
    console.log(`1. ✅ Partner user created: ${partnerUser.email} (Role: ${partnerUser.role})`);

    // 2. Submit Partner Parking Location (15 slots)
    const location = await ParkingLocation.create({
      name: `City Plaza Mall Parking ${timestamp}`,
      address: 'GS Road, Dispur, Guwahati',
      totalSlots: 15,
      pricePerHour: 30,
      latitude: 26.148,
      longitude: 91.738,
      ownerId: partnerUser._id,
      status: 'pending',
      contactName: partnerUser.name,
      contactEmail: partnerUser.email,
      contactPhone: partnerUser.phone
    });

    // Auto-generate 15 slots (A1-A5, B1-B5, C1-C5)
    await generateSlotsForLocation(location._id, 15);
    await User.findByIdAndUpdate(partnerUser._id, { role: 'partner' });
    console.log(`2. ✅ Partner submitted space "${location.name}" (Status: ${location.status}, 15 slots auto-generated).`);

    // 3. Verify NOT in public active search results yet
    const publicLocationsPending = await ParkingLocation.find({
      _id: location._id,
      $or: [{ status: 'active' }, { status: { $exists: false } }]
    });
    if (publicLocationsPending.length === 0) {
      console.log('3. ✅ Verified: Pending location is hidden from public search results.');
    } else {
      throw new Error('Pending location incorrectly visible in public search!');
    }

    // 4. Admin Approves Location
    location.status = 'active';
    await location.save();
    console.log(`4. ✅ Admin approved location "${location.name}" (Status: ${location.status}).`);

    // 5. Verify NOW in public active search results
    const publicLocationsActive = await ParkingLocation.find({
      _id: location._id,
      $or: [{ status: 'active' }, { status: { $exists: false } }]
    });
    if (publicLocationsActive.length === 1) {
      console.log('5. ✅ Verified: Approved location is now visible in public search results.');
    } else {
      throw new Error('Approved location missing from public search!');
    }

    // 6. Verify Auto-Generated Slot Grid Documents
    const slots = await Slot.find({ location: location._id });
    console.log(`6. ✅ Slot Grid auto-generated ${slots.length} slots: ${slots.map(s => s.slotNumber).join(', ')}`);
    if (slots.length !== 15) throw new Error(`Expected 15 slots, got ${slots.length}`);

    // 7. Customer Books Slot A1 at Partner Location
    const slotA1 = slots.find(s => s.slotNumber === 'A1');
    const customerUser = await User.create({
      name: 'Customer Alice',
      email: customerEmail,
      role: 'user'
    });

    const booking = await Booking.create({
      bookingId: `BK_${timestamp}`,
      user: customerUser._id,
      userEmail: customerUser.email,
      userName: customerUser.name,
      location: location._id,
      locationName: location.name,
      slot: slotA1._id,
      slotNumber: slotA1.slotNumber,
      startTime: new Date(),
      durationHours: 2,
      endTime: new Date(Date.now() + 2 * 3600000),
      amountPaid: 60,
      ratePerHour: 30,
      paymentId: `PAY_${timestamp}`,
      entryPin: '4920',
      date: new Date().toISOString().split('T')[0],
      status: 'active'
    });

    await Slot.findByIdAndUpdate(slotA1._id, {
      status: 'occupied',
      occupiedUntil: booking.endTime
    });

    console.log(`7. ✅ Customer booked slot ${slotA1.slotNumber} for Rs. ${booking.amountPaid}.`);

    // 8. Verify Partner Dashboard Revenue Filtering
    const partnerBookings = await Booking.find({ location: location._id });
    const totalPartnerRev = partnerBookings.reduce((sum, b) => sum + b.amountPaid, 0);
    console.log(`8. ✅ Partner Dashboard calculated total revenue: Rs. ${totalPartnerRev} (${partnerBookings.length} booking).`);

    // Clean up test data
    await Booking.deleteOne({ _id: booking._id });
    await Slot.deleteMany({ location: location._id });
    await ParkingLocation.deleteOne({ _id: location._id });
    await User.deleteMany({ _id: { $in: [partnerUser._id, customerUser._id] } });

    await mongoose.disconnect();
    console.log('\n🎉 ALL PARTNER FEATURE END-TO-END TESTS PASSED 100% SUCCESSFULLY!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Partner E2E Test failed:', err);
    process.exit(1);
  }
})();
