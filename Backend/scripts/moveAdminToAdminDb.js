const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const AdminSchema = require('../models/Admin').schema || new mongoose.Schema({
  username: { type: String, required: true, unique: true, trim: true, lowercase: true },
  password: { type: String, required: true, select: false },
  createdAt: { type: Date, default: Date.now }
});

(async () => {
  try {
    console.log('[MoveAdmin] Connecting to MongoDB Atlas...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('[MoveAdmin] Connected to Atlas.\n');

    // 1. Target the separate `admin` database on the same Atlas cluster
    const adminDb = mongoose.connection.useDb('admin', { useCache: true });
    const AdminInAdminDb = adminDb.models.Admin || adminDb.model('Admin', AdminSchema);

    // 2. Hash password "54321" using bcrypt
    const rawPassword = '54321';
    const adminUsername = 'admin@example.com';
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(rawPassword, salt);

    // 3. Upsert admin document into `admin` database -> `admins` collection
    const adminDoc = await AdminInAdminDb.findOneAndUpdate(
      { username: adminUsername },
      { username: adminUsername, password: hashedPassword, createdAt: new Date() },
      { upsert: true, new: true, runValidators: true }
    );

    console.log(`1. ✅ Admin account created/updated in separate 'admin' database:`);
    console.log(`   - Database : admin`);
    console.log(`   - Collection: admins`);
    console.log(`   - Username  : ${adminDoc.username}`);
    console.log(`   - Mongo ID  : ${adminDoc._id}`);

    // 4. Drop the legacy `admins` collection from `parking_booking` database if it exists
    const parkingDb = mongoose.connection.useDb('parking_booking', { useCache: true });
    const parkingCols = await parkingDb.db.listCollections({ name: 'admins' }).toArray();

    if (parkingCols.length > 0) {
      await parkingDb.db.collection('admins').drop();
      console.log(`\n2. ✅ Dropped 'admins' collection from 'parking_booking' database.`);
    } else {
      console.log(`\n2. 'admins' collection does not exist in 'parking_booking' database.`);
    }

    // 5. Verify final collections in both databases
    const adminDbCols = await adminDb.db.listCollections().toArray();
    const parkingDbCols = await parkingDb.db.listCollections().toArray();

    console.log(`\n3. Verification:`);
    console.log(`   - 'admin' database collections           :`, adminDbCols.map(c => c.name));
    console.log(`   - 'parking_booking' database collections :`, parkingDbCols.map(c => c.name));

    await mongoose.disconnect();
    console.log('\n[MoveAdmin] Complete.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error during admin db migration:', err);
    process.exit(1);
  }
})();
