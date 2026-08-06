const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');

(async () => {
  try {
    console.log('[Delete Useless User] Connecting to MongoDB Atlas...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('[Delete Useless User] Connected to Atlas.');

    const db = mongoose.connection.db;
    const usersCollection = db.collection('users');

    // Delete by ID or unhashed password match
    const targetId = new mongoose.Types.ObjectId('6a66f1b02040adfc655d29dd');
    const deleteResult = await usersCollection.deleteMany({
      $or: [
        { _id: targetId },
        { password: 'password123', email: 'smriti@example.com' }
      ]
    });

    console.log(`\n✅ Deleted ${deleteResult.deletedCount} useless user document(s) from 'users' collection in MongoDB Atlas.`);

    // Display remaining users in collection
    const remainingUsers = await usersCollection.find({}, { projection: { password: 0 } }).toArray();
    console.log(`\nRemaining users in 'users' collection (${remainingUsers.length}):`);
    remainingUsers.forEach(u => console.log(` - ID: ${u._id}, Email: ${u.email}, Name: ${u.name}`));

    await mongoose.disconnect();
    console.log('\n🎉 Cleaned up useless user document successfully!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Failed to delete user document:', err);
    process.exit(1);
  }
})();
