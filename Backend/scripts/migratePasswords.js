/**
 * Password Migration Script
 * Detects and re-hashes any plain-text passwords found in the MongoDB 'users' collection.
 *
 * HOW TO USE:
 *   cd Backend
 *   node scripts/migratePasswords.js
 *
 * WHAT IT DOES:
 *   1. Connects to MongoDB Atlas using the MONGODB_URI from .env
 *   2. Fetches all users with their password field (select: '+password')
 *   3. Checks each password: if it does NOT start with '$2a$' or '$2b$', it is plain text
 *   4. Re-hashes the plain-text password with bcrypt.hash(password, 10)
 *   5. Saves the hashed password back to the document
 *   6. Reports a full migration summary
 *
 * SAFE TO RUN MULTIPLE TIMES: Already-hashed passwords are detected and skipped.
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

if (!process.env.MONGODB_URI) {
  console.error('[MIGRATION ERROR] MONGODB_URI is not set in .env. Aborting.');
  process.exit(1);
}

if (!process.env.JWT_SECRET) {
  console.warn('[MIGRATION WARNING] JWT_SECRET is not set in .env. This is a security risk.');
}

// Inline User schema with select: false overridden for migration
const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  phone: String,
  password: { type: String, select: false },
  registrationDate: Date
});
const User = mongoose.model('User', userSchema);

const isBcryptHash = (str) => {
  return typeof str === 'string' && (str.startsWith('$2a$') || str.startsWith('$2b$'));
};

const run = async () => {
  console.log('\n[Migration] Connecting to MongoDB Atlas...');
  try {
    await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 5000 });
    console.log('[Migration] Connected successfully.\n');
  } catch (err) {
    console.error('[Migration] Could not connect to MongoDB:', err.message);
    process.exit(1);
  }

  const users = await User.find().select('+password');
  console.log(`[Migration] Found ${users.length} user(s) in the database.\n`);

  let alreadyHashed = 0;
  let migrated = 0;
  let skippedNoPassword = 0;
  let errors = 0;

  for (const user of users) {
    if (!user.password) {
      console.warn(`  [SKIP] ${user.email} — no password field found.`);
      skippedNoPassword++;
      continue;
    }

    if (isBcryptHash(user.password)) {
      console.log(`  [OK]   ${user.email} — password is already a bcrypt hash.`);
      alreadyHashed++;
    } else {
      // Plain-text password detected — re-hash it
      console.warn(`  [FIX]  ${user.email} — plain-text password detected! Re-hashing...`);
      try {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(user.password, salt);
        user.password = hashedPassword;
        await user.save();
        console.log(`         ✅ ${user.email} — password successfully re-hashed.`);
        migrated++;
      } catch (err) {
        console.error(`         ❌ ${user.email} — error during re-hashing:`, err.message);
        errors++;
      }
    }
  }

  console.log('\n==============================');
  console.log('  MIGRATION SUMMARY');
  console.log('==============================');
  console.log(`  Total users scanned : ${users.length}`);
  console.log(`  Already hashed      : ${alreadyHashed}`);
  console.log(`  Migrated (re-hashed): ${migrated}`);
  console.log(`  Skipped (no pass)   : ${skippedNoPassword}`);
  console.log(`  Errors              : ${errors}`);
  console.log('==============================\n');

  if (migrated > 0) {
    console.log('[Migration] ✅ Plain-text passwords have been re-hashed with bcrypt.');
    console.log('[Migration] ⚠️  NOTE: Migrated users will need to use their ORIGINAL password to log in,');
    console.log('            as it is now stored as the bcrypt hash of that same plain-text value.');
  } else if (errors === 0) {
    console.log('[Migration] ✅ No plain-text passwords found. Database is clean.');
  }

  await mongoose.disconnect();
  console.log('[Migration] Disconnected from MongoDB. Done.\n');
  process.exit(0);
};

run().catch(err => {
  console.error('[Migration] Unhandled error:', err.message);
  process.exit(1);
});
