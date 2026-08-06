const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const User = require('../models/User');
const Booking = require('../models/Booking');
const Transaction = require('../models/Transaction');

(async () => {
  try {
    console.log('[Test] Connecting to MongoDB Atlas...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('[Test] Connected to Atlas.');

    const testEmail = `test_${Date.now()}@example.com`;
    console.log(`[Test] Attempting to create user: ${testEmail}`);

    const user = await User.create({
      name: 'Test Atlas User',
      email: testEmail,
      phone: '9876543210',
      password: '$2a$10$abcdefghijklmnopqrstuu'
    });

    console.log(`[Test] ✅ User created successfully in Atlas! ID: ${user._id}`);

    const allUsers = await User.find();
    console.log(`[Test] Total users in Atlas: ${allUsers.length}`);
    allUsers.forEach(u => console.log(`   - ${u.name} (${u.email}) [ID: ${u._id}]`));

    const allBookings = await Booking.find();
    console.log(`[Test] Total bookings in Atlas: ${allBookings.length}`);

    const allTxns = await Transaction.find();
    console.log(`[Test] Total transactions in Atlas: ${allTxns.length}`);

    // Clean up test user
    await User.findByIdAndDelete(user._id);
    console.log(`[Test] Cleaned up test user.`);

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('[Test] ❌ ERROR:', err);
    process.exit(1);
  }
})();
