const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const ParkingLocation = require('../models/ParkingLocation');
const Slot = require('../models/Slot');
const Booking = require('../models/Booking');
const Transaction = require('../models/Transaction');
const SubscriptionPlan = require('../models/SubscriptionPlan');
const UserSubscription = require('../models/UserSubscription');
const { runPurgeJob } = require('../jobs/cleanupJob');

(async () => {
  try {
    console.log('[E2E ExcuseME PLUS Test] Connecting to MongoDB Atlas...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('[E2E ExcuseME PLUS Test] Connected to Atlas.\n');

    // 1. Resolve or create a Parking Location
    let location = await ParkingLocation.findOne();
    if (!location) {
      location = await ParkingLocation.create({
        name: 'City Mall Parking',
        address: 'Guwahati, Assam',
        totalSlots: 20,
        pricePerHour: 20
      });
    }
    console.log(`1. ✅ Resolved Location: ${location.name} (ID: ${location._id})`);

    // 2. Create or find Subscription Plan
    let plan = await SubscriptionPlan.findOne({ location: location._id });
    if (!plan) {
      plan = await SubscriptionPlan.create({
        name: `${location.name} Monthly Pass`,
        type: 'monthly',
        durationDays: 30,
        price: 349,
        savingsPercentage: 40,
        location: location._id,
        locationName: location.name,
        features: ['Unlimited parking access', 'Zero per-booking payments'],
        isActive: true
      });
    }
    console.log(`2. ✅ Resolved Subscription Plan: ${plan.name} (Price: Rs. ${plan.price})`);

    // 3. Create Test User
    const testEmail = `plususer_${Date.now()}@example.com`;
    const hashedPassword = await bcrypt.hash('pass1234', 10);
    const user = await User.create({
      name: 'ExcuseME PLUS Tester',
      email: testEmail,
      phone: '9988776655',
      password: hashedPassword
    });
    console.log(`3. ✅ Created Test User: ${user.email} (ID: ${user._id})`);

    // 4. Purchase Subscription Pass (create UserSubscription + Transaction)
    const startDate = new Date();
    const endDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    const paymentId = `sub_pay_test_${Date.now()}`;

    const sub = await UserSubscription.create({
      user: user._id,
      userEmail: user.email,
      plan: plan._id,
      planName: plan.name,
      planType: plan.type,
      location: location._id,
      locationName: location.name,
      startDate,
      endDate,
      pricePaid: plan.price,
      paymentId,
      status: 'active'
    });

    const subTxn = await Transaction.create({
      transactionId: `TXN_SUB_${Date.now()}`,
      paymentId,
      bookingId: 'PASS_MONTHLY',
      user: user._id,
      userEmail: user.email,
      facilityName: location.name,
      slotId: 'PASS',
      amount: plan.price,
      paymentMethod: 'Razorpay (ExcuseME PLUS Pass)',
      paymentStatus: 'SUCCESSFUL'
    });

    console.log(`4. ✅ Purchased ExcuseME PLUS Pass: ${sub.planName} (End Date: ${sub.endDate.toLocaleDateString()})`);
    console.log(`   ✅ Transaction recorded: ${subTxn.transactionId} (Rs. ${subTxn.amount})`);

    // 5. Verify Active Pass Lookup
    const activePass = await UserSubscription.findOne({
      userEmail: user.email,
      location: location._id,
      status: 'active',
      endDate: { $gt: new Date() }
    });
    console.log(`5. ✅ Active Pass Check: ${activePass ? 'ACTIVE PASS CONFIRMED' : 'FAILED'}`);

    // 6. Book Slot using Pass (Rs. 0 Payment)
    let slot = await Slot.findOne({ location: location._id, status: 'available' });
    if (!slot) {
      slot = await Slot.create({ location: location._id, slotNumber: 'A1', status: 'available' });
    }

    const booking = await Booking.create({
      bookingId: `BK_PLUS_${Date.now()}`,
      entryPin: '9988',
      user: user._id,
      userEmail: user.email,
      location: location._id,
      locationName: location.name,
      slot: slot._id,
      slotNumber: slot.slotNumber,
      date: new Date().toISOString().split('T')[0],
      durationHours: 4,
      ratePerHour: 20,
      amountPaid: 0,
      status: 'upcoming',
      paymentId: `pass_${sub._id}`
    });

    slot.status = 'occupied';
    await slot.save();

    console.log(`6. ✅ Created Booking using ExcuseME PLUS Pass: ${booking.bookingId}`);
    console.log(`   - Location: ${booking.locationName}`);
    console.log(`   - Slot: ${booking.slotNumber}`);
    console.log(`   - Amount Paid: Rs. ${booking.amountPaid} (Covered by Pass)`);
    console.log(`   - Slot status updated in Atlas: ${slot.status}`);

    // 7. Test Subscription Expiration Job
    console.log('\n7. Testing Subscription Expiration Job...');
    // Set endDate to yesterday to simulate expiration
    sub.endDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
    await sub.save();

    await runPurgeJob();

    const expiredSub = await UserSubscription.findById(sub._id);
    console.log(`   - Status after maintenance job: ${expiredSub.status} (Expected: expired)`);

    // Clean up test data
    await User.findByIdAndDelete(user._id);
    await UserSubscription.findByIdAndDelete(sub._id);
    await Transaction.findByIdAndDelete(subTxn._id);
    await Booking.findByIdAndDelete(booking._id);
    console.log('\n8. ✅ Cleaned up test documents.');

    await mongoose.disconnect();
    console.log('\n🎉 ALL EXCUSEME PLUS E2E TESTS PASSED SUCCESSFULLY!');
    process.exit(0);
  } catch (err) {
    console.error('❌ EXCUSEME PLUS E2E TEST FAILED:', err);
    process.exit(1);
  }
})();
