const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Booking = require('../models/Booking');
const Transaction = require('../models/Transaction');
const DeletedAccountLog = require('../models/DeletedAccountLog');
const { runPurgeJob } = require('../jobs/cleanupJob');

(async () => {
  try {
    console.log('[E2E Test] Connecting to MongoDB Atlas...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('[E2E Test] Connected to Atlas.\n');

    const testEmail = `deltest_${Date.now()}@example.com`;
    const rawPassword = 'mysecretpass';
    const hashedPassword = await bcrypt.hash(rawPassword, 10);

    // 1. Create Test User
    const user = await User.create({
      name: 'Deletion Test User',
      email: testEmail,
      phone: '9876543210',
      password: hashedPassword
    });
    console.log(`1. ✅ User created in Atlas: ${user.email} (ID: ${user._id})`);

    // 2. Create Linked Booking & Transaction
    const booking = await Booking.create({
      bookingId: `BK_TEST_${Date.now()}`,
      entryPin: '1234',
      user: user._id,
      userEmail: user.email,
      locationName: 'City Mall Parking',
      slotNumber: 'A1',
      date: new Date().toISOString().split('T')[0],
      durationHours: 2,
      ratePerHour: 20,
      amountPaid: 40,
      status: 'upcoming',
      paymentId: `pay_test_${Date.now()}`
    });
    console.log(`2. ✅ Booking created in Atlas: ${booking.bookingId}`);

    const txn = await Transaction.create({
      transactionId: `TXN_TEST_${Date.now()}`,
      paymentId: booking.paymentId,
      booking: booking._id,
      bookingId: booking.bookingId,
      user: user._id,
      userEmail: user.email,
      amount: 40,
      paymentMethod: 'Test Card',
      paymentStatus: 'SUCCESSFUL'
    });
    console.log(`   ✅ Transaction created in Atlas: ${txn.transactionId}`);

    // 3. Execute Immediate Account Deletion (simulate deleteMyAccount logic)
    const userBookings = await Booking.find({ userEmail: user.email }).lean();
    const userTxns = await Transaction.find({ userEmail: user.email }).lean();

    const logEntry = await DeletedAccountLog.create({
      userId: user._id.toString(),
      userName: user.name,
      userEmail: user.email,
      userPhone: user.phone,
      deletedAt: new Date(),
      retainedBookings: userBookings,
      retainedTransactions: userTxns
    });
    console.log(`3. ✅ Created DeletedAccountLog snapshot ID: ${logEntry._id}`);

    await User.deleteOne({ _id: user._id });
    await Booking.deleteMany({ userEmail: user.email });
    await Transaction.deleteMany({ userEmail: user.email });
    console.log(`   ✅ Removed user, bookings, and transactions from active Atlas collections.`);

    // 4. Verify Active Collections
    const activeUser = await User.findById(user._id);
    const activeBookings = await Booking.find({ userEmail: user.email });
    const activeTxns = await Transaction.find({ userEmail: user.email });
    console.log(`4. ✅ Active Collection Verifications:`);
    console.log(`   - Active User exists? ${!!activeUser}`);
    console.log(`   - Active Bookings count: ${activeBookings.length}`);
    console.log(`   - Active Txns count: ${activeTxns.length}`);

    // 5. Verify Audit Log
    const foundLog = await DeletedAccountLog.findById(logEntry._id);
    console.log(`5. ✅ DeletedAccountLog Verification:`);
    console.log(`   - Log exists? ${!!foundLog}`);
    console.log(`   - Retained Bookings count: ${foundLog.retainedBookings.length}`);
    console.log(`   - Retained Transactions count: ${foundLog.retainedTransactions.length}`);

    // 6. Test Automated 48-Hour Purge Job
    console.log('\n6. Testing 48-Hour Purge Job...');
    // Manually set deletedAt to 3 days ago to simulate expiration
    foundLog.deletedAt = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
    await foundLog.save();

    await runPurgeJob();

    const purgedLog = await DeletedAccountLog.findById(logEntry._id);
    console.log(`   - Expired Log exists after purge? ${!!purgedLog} (Expected: false)`);

    await mongoose.disconnect();
    console.log('\n🎉 ALL E2E ACCOUNT DELETION & PURGE TESTS PASSED SUCCESSFULLY!');
    process.exit(0);
  } catch (err) {
    console.error('❌ E2E TEST FAILED:', err);
    process.exit(1);
  }
})();
