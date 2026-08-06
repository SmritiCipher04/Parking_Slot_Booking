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
    console.log('[TestDb] Connecting to MongoDB Atlas...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('[TestDb] Connected to Atlas.\n');

    // Test creating `admin_db` database
    const adminDb = mongoose.connection.useDb('admin_db', { useCache: true });
    const AdminInAdminDb = adminDb.models.Admin || adminDb.model('Admin', AdminSchema);

    const rawPassword = '54321';
    const adminUsername = 'admin@example.com';
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(rawPassword, salt);

    const adminDoc = await AdminInAdminDb.findOneAndUpdate(
      { username: adminUsername },
      { username: adminUsername, password: hashedPassword, createdAt: new Date() },
      { upsert: true, new: true, runValidators: true }
    );

    console.log(`1. ✅ Admin account created in separate 'admin_db' database in Atlas:`);
    console.log(`   - Database : admin_db`);
    console.log(`   - Collection: admins`);
    console.log(`   - Username  : ${adminDoc.username}`);
    console.log(`   - Mongo ID  : ${adminDoc._id}`);

    // Drop legacy `admins` collection from `parking_booking` database
    const parkingDb = mongoose.connection.useDb('parking_booking', { useCache: true });
    const parkingCols = await parkingDb.db.listCollections({ name: 'admins' }).toArray();

    if (parkingCols.length > 0) {
      await parkingDb.db.collection('admins').drop();
      console.log(`\n2. ✅ Dropped legacy 'admins' collection from 'parking_booking' database.`);
    }

    const adminDbCols = await adminDb.db.listCollections().toArray();
    const parkingDbCols = await parkingDb.db.listCollections().toArray();

    console.log(`\n3. Verification:`);
    console.log(`   - 'admin_db' database collections        :`, adminDbCols.map(c => c.name));
    console.log(`   - 'parking_booking' database collections :`, parkingDbCols.map(c => c.name));

    await mongoose.disconnect();
    console.log('\n[TestDb] Complete.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error during test db creation:', err);
    process.exit(1);
  }
})();
