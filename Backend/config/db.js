/**
 * Database & Configuration Module
 * Connects to MongoDB Atlas and handles database initialization and seeding.
 */

const mongoose = require('mongoose');
const User = require('../models/User');
const Facility = require('../models/Facility');
const Slot = require('../models/Slot');
const Booking = require('../models/Booking');
const Transaction = require('../models/Transaction');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`[DB] Connected to MongoDB Atlas: ${conn.connection.host}`);
    
    // Seed initial data if database is fresh
    await seedDatabase();
    return true;
  } catch (error) {
    console.error('[DB] Database Connection Error:', error.message);
    process.exit(1);
  }
};

const seedDatabase = async () => {
  try {
    // 1. Seed Admin & Default Users
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      await User.create([
        { userId: 'admin1', name: 'System Admin', email: 'admin@excuseme.com', phone: '9999999999', password: 'adminpassword', role: 'admin' },
        { userId: 'u1', name: 'Smriti Sarkar', email: 'smriti@example.com', phone: '9876543210', password: 'password123', role: 'user' }
      ]);
      console.log('[DB Seeder] Seeded default users and admin into MongoDB Atlas.');
    }

    // 2. Seed Facilities
    const facilityCount = await Facility.countDocuments();
    if (facilityCount === 0) {
      const defaultFacilities = [
        { facilityId: 'f1', name: 'City Mall Parking', location: 'Guwahati', totalSlots: 20, ratePerHour: 20 },
        { facilityId: 'f2', name: 'Railway Station Parking', location: 'Guwahati', totalSlots: 20, ratePerHour: 15 },
        { facilityId: 'f3', name: 'ADTU Campus Parking', location: 'Sonapur', totalSlots: 20, ratePerHour: 10 },
        { facilityId: 'f4', name: 'GS Road Parking Complex', location: 'Guwahati', totalSlots: 20, ratePerHour: 25 }
      ];

      await Facility.create(defaultFacilities);
      console.log('[DB Seeder] Seeded default parking facilities into MongoDB Atlas.');

      // 3. Seed 20 Slots per facility
      const letters = ['A', 'B', 'C', 'D'];
      const slotDocs = [];

      for (const fac of defaultFacilities) {
        let idx = 1;
        letters.forEach(letter => {
          for (let num = 1; num <= 5; num++) {
            const slotId = `${letter}${num}`;
            let status = 'available';
            if (fac.facilityId === 'f1' && [2, 6, 12, 17].includes(idx)) status = 'booked';
            if (fac.facilityId === 'f1' && [5, 14].includes(idx)) status = 'reserved';

            slotDocs.push({
              slotId: slotId,
              facilityId: fac.facilityId,
              status: status,
              price: fac.ratePerHour
            });
            idx++;
          }
        });
      }

      await Slot.create(slotDocs);
      console.log('[DB Seeder] Seeded 20 slots per facility into MongoDB Atlas.');
    }
  } catch (err) {
    console.error('[DB Seeder Error]:', err.message);
  }
};

module.exports = { connectDB };
