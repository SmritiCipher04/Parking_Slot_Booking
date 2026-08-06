/**
 * One-time fix script: drops the stale slotId_1_facilityId_1 index
 * that causes duplicate key errors when seeding slots.
 * Run once: node Backend/scripts/fixSlotIndex.js
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');

(async () => {
  await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 8000 });
  console.log('[Fix] Connected to Atlas.');
  const db = mongoose.connection.db;
  const collections = await db.listCollections({ name: 'slots' }).toArray();
  if (collections.length > 0) {
    try {
      await db.collection('slots').dropIndex('slotId_1_facilityId_1');
      console.log('[Fix] ✅ Dropped stale index slotId_1_facilityId_1 from slots collection.');
    } catch (e) {
      console.log('[Fix] Index may not exist or already dropped:', e.message);
    }
    // Also drop and re-seed slots so locations have proper slot documents
    await db.collection('slots').deleteMany({});
    console.log('[Fix] ✅ Cleared stale slot documents. Server will re-seed on next restart.');
  }
  await mongoose.disconnect();
  console.log('[Fix] Done. Restart the server with: npm start');
  process.exit(0);
})().catch(e => { console.error(e.message); process.exit(1); });
