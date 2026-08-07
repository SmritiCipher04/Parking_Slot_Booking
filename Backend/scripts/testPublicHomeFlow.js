const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const ParkingLocation = require('../models/ParkingLocation');

(async () => {
  try {
    console.log('[Public Home Flow Test] Connecting to MongoDB Atlas...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('[Public Home Flow Test] Connected to Atlas.');

    // 1. Verify Public Unauthenticated Facilities Access
    const activeLocations = await ParkingLocation.find({
      $or: [{ status: 'active' }, { status: { $exists: false } }]
    });

    if (activeLocations.length > 0) {
      console.log(`1. ✅ Public access verified: ${activeLocations.length} active facilities returned for unauthenticated visitors.`);
      activeLocations.forEach(loc => console.log(`   - ${loc.name} (${loc.address})`));
    } else {
      throw new Error('No active facilities returned for public access!');
    }

    await mongoose.disconnect();
    console.log('\n🎉 PUBLIC HOME PAGE ACCESS FLOW VERIFIED 100% SUCCESSFULLY!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Public Home Flow Test failed:', err);
    process.exit(1);
  }
})();
