/**
 * Database & Configuration Module
 * Connects to MongoDB Atlas gracefully with timeout and fallback.
 * Seeds default admin and parking locations on first Atlas connection.
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const ParkingLocation = require('../models/ParkingLocation');
const Slot = require('../models/Slot');
const getAdminModel = require('../models/Admin');

// Disable buffering to prevent any query from hanging when DB is offline
mongoose.set('bufferCommands', false);

const connectDB = async () => {
  // If no URI is provided, skip connection attempt entirely
  if (!process.env.MONGODB_URI) {
    console.log('=======================================================');
    console.log('[DB Info] MONGODB_URI not set. Running in memory-only mode.');
    console.log('=======================================================');
    return false;
  }

  try {
    console.log('[DB] Attempting MongoDB Atlas connection...');
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      // Increased from 2s to 8s to handle slow Atlas responses and network latency
      serverSelectionTimeoutMS: 8000,
      socketTimeoutMS: 30000,
      connectTimeoutMS: 10000,
    });
    console.log(`[DB] ✅ Connected to MongoDB Atlas: ${conn.connection.host}`);
    console.log('[DB] 📦 Data WILL be persisted to Atlas cloud database.');
    await seedDefaultData();
    return true;
  } catch (error) {
    console.log('=======================================================');
    console.log('[DB] ❌ MongoDB Atlas connection FAILED.');
    console.log(`[DB] Reason: ${error.message}`);
    console.log('');
    console.log('[DB] WHY THIS HAPPENS:');
    console.log('  1. Your IP is not whitelisted in MongoDB Atlas Network Access.');
    console.log('     → Fix: Atlas Dashboard → Network Access → Add IP Address');
    console.log('         → Click "Allow Access From Anywhere" (0.0.0.0/0)');
    console.log('  2. MongoDB Atlas cluster is paused or deleted.');
    console.log('     → Fix: Resume the cluster in Atlas Dashboard.');
    console.log('  3. MONGODB_URI credentials are wrong.');
    console.log(`     → Check: ${process.env.MONGODB_URI ? 'URI is set in .env' : 'URI is MISSING from .env'}`);
    console.log('');
    console.log('[DB] ⚠️  Running with In-Memory Fallback — data WILL BE LOST on restart.');
    console.log('[DB] ⚠️  Users and transactions will NOT persist until Atlas is reachable.');
    console.log('=======================================================');
    return false;
  }
};

const seedDefaultData = async () => {
  try {
    // Seed default admin (admin@example.com / 54321) in admin_db database
    const Admin = getAdminModel();
    const adminCount = await Admin.countDocuments();
    if (adminCount === 0) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('54321', salt);
      await Admin.create({
        username: 'admin@example.com',
        password: hashedPassword
      });
      console.log('[DB Seeder] ✅ Seeded default admin (admin@example.com) into admin_db database in MongoDB Atlas.');
    }

    // Seed default parking locations and slots
    const locationCount = await ParkingLocation.countDocuments();
    if (locationCount === 0) {
      const defaultLocations = [
        { name: 'City Mall Parking', address: 'GS Road, Christian Basti, Guwahati', totalSlots: 20, pricePerHour: 20, latitude: 26.1445, longitude: 91.7362 },
        { name: 'Railway Station Parking', address: 'Paltan Bazar, Guwahati', totalSlots: 20, pricePerHour: 15, latitude: 26.1818, longitude: 91.7510 },
        { name: 'ADTU Campus Parking', address: 'Sonapur, Guwahati, Assam', totalSlots: 20, pricePerHour: 10, latitude: 26.1158, longitude: 91.9790 },
        { name: 'GS Road Parking Complex', address: 'Bhangagarh, Guwahati', totalSlots: 20, pricePerHour: 25, latitude: 26.1550, longitude: 91.7650 }
      ];

      const createdLocations = await ParkingLocation.create(defaultLocations);
      console.log('[DB Seeder] ✅ Seeded default parking locations into MongoDB Atlas.');

      const letters = ['A', 'B', 'C', 'D'];
      const slotDocs = [];

      createdLocations.forEach((loc, locIndex) => {
        let idx = 1;
        letters.forEach(letter => {
          for (let num = 1; num <= 5; num++) {
            const slotNumber = `${letter}${num}`;
            let status = 'available';
            if (locIndex === 0 && [2, 6, 12, 17].includes(idx)) status = 'occupied';
            if (locIndex === 0 && [5, 14].includes(idx)) status = 'reserved';

            slotDocs.push({
              location: loc._id,
              slotNumber: slotNumber,
              status: status
            });
            idx++;
          }
        });
      });

      await Slot.create(slotDocs);
      console.log('[DB Seeder] ✅ Seeded 20 slots per parking location into MongoDB Atlas.');
    }
  } catch (err) {
    console.error('[DB Seeder Error]:', err.message);
  }
};

module.exports = { connectDB };
