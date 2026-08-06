const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Admin = require('../models/Admin');
const User = require('../models/User');

(async () => {
  try {
    console.log('[Admin Setup] Connecting to MongoDB Atlas...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('[Admin Setup] Connected to Atlas.\n');

    // 1. Remove legacy admin document from the `users` collection
    const deleteUserAdminResult = await User.deleteMany({
      $or: [
        { role: 'admin' },
        { email: 'admin@excuseme.com' },
        { email: 'admin@example.com' }
      ]
    });
    console.log(`1. ✅ Removed ${deleteUserAdminResult.deletedCount} legacy admin records from the 'users' collection.`);

    // 2. Hash password "54321" using bcrypt
    const rawPassword = '54321';
    const adminUsername = 'admin@example.com';
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(rawPassword, salt);

    // Sanity check: confirm bcrypt hash format
    if (!hashedPassword.startsWith('$2a$') && !hashedPassword.startsWith('$2b$')) {
      throw new Error('bcrypt hashing failed');
    }

    // 3. Upsert admin document in the separate `admins` collection
    const adminDoc = await Admin.findOneAndUpdate(
      { username: adminUsername },
      { username: adminUsername, password: hashedPassword, createdAt: new Date() },
      { upsert: true, new: true, runValidators: true }
    );

    console.log(`2. ✅ Admin credentials updated in separate 'admins' collection in Atlas:`);
    console.log(`   - Username : ${adminDoc.username}`);
    console.log(`   - Password : [BCRYPT HASH STORED: ${hashedPassword}]`);
    console.log(`   - Mongo ID : ${adminDoc._id}`);

    // Verify users collection has no admin entries
    const remainingUserAdmins = await User.countDocuments({
      $or: [{ role: 'admin' }, { email: 'admin@example.com' }, { email: 'admin@excuseme.com' }]
    });
    console.log(`3. ✅ Verified 'users' collection has ${remainingUserAdmins} admin documents.`);

    await mongoose.disconnect();
    console.log('\n[Admin Setup] Complete.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error during admin setup:', err);
    process.exit(1);
  }
})();
