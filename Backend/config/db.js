/**
 * Database & Configuration Module
 * Connects to MongoDB Atlas gracefully with fast 2-second timeout and fallback.
 */

const mongoose = require('mongoose');
const ParkingLocation = require('../models/ParkingLocation');
const Slot = require('../models/Slot');

// Disable buffering to prevent any query from hanging for 10 seconds
mongoose.set('bufferCommands', false);

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 2000 // Fast 2-second timeout
    });
    console.log(`[DB] Connected to MongoDB Atlas: ${conn.connection.host}`);
    await seedLocationsAndSlots();
    return true;
  } catch (error) {
    console.log('=======================================================');
    console.log('[DB Info] Running with Fast In-Memory Database Fallback.');
    console.log('[Atlas Note] Whitelist IP 0.0.0.0/0 in MongoDB Atlas to enable cloud sync.');
    console.log('=======================================================');
    return false;
  }
};

const seedLocationsAndSlots = async () => {
  try {
    const locationCount = await ParkingLocation.countDocuments();
    if (locationCount === 0) {
      const defaultLocations = [
        { name: 'City Mall Parking', address: 'Guwahati, Assam', totalSlots: 20, pricePerHour: 20 },
        { name: 'Railway Station Parking', address: 'Guwahati, Assam', totalSlots: 20, pricePerHour: 15 },
        { name: 'ADTU Campus Parking', address: 'Sonapur, Assam', totalSlots: 20, pricePerHour: 10 },
        { name: 'GS Road Parking Complex', address: 'Guwahati, Assam', totalSlots: 20, pricePerHour: 25 }
      ];

      const createdLocations = await ParkingLocation.create(defaultLocations);
      console.log('[DB Seeder] Seeded default parking locations into MongoDB Atlas.');

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
      console.log('[DB Seeder] Seeded 20 slots per parking location into MongoDB Atlas.');
    }
  } catch (err) {
    console.error('[DB Seeder Error]:', err.message);
  }
};

module.exports = { connectDB };
