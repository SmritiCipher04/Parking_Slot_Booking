const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');

(async () => {
  try {
    console.log('[FixIndexes] Connecting to MongoDB Atlas...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('[FixIndexes] Connected to Atlas.\n');

    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();

    for (const colInfo of collections) {
      const colName = colInfo.name;
      console.log(`Checking indexes for collection "${colName}"...`);
      const col = db.collection(colName);
      const indexes = await col.indexes();

      for (const idx of indexes) {
        console.log(`   - Index: ${idx.name} -> keys:`, JSON.stringify(idx.key));
        // Drop any stale unique indexes on non-existent or legacy fields
        if (idx.name !== '_id_' && idx.name !== 'email_1' && idx.name !== 'bookingId_1' && idx.name !== 'transactionId_1' && idx.name !== 'location_1_slotNumber_1') {
          if (idx.name === 'userId_1' || idx.name.includes('userId') || idx.name.includes('slotId')) {
            console.log(`   ⚠️ DROPPING STALE INDEX: "${idx.name}" from "${colName}"`);
            await col.dropIndex(idx.name);
            console.log(`   ✅ Dropped index "${idx.name}"`);
          }
        }
      }
    }

    console.log('\n[FixIndexes] ✅ Index cleanup complete.');
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('[FixIndexes] ❌ Error:', err.message);
    process.exit(1);
  }
})();
