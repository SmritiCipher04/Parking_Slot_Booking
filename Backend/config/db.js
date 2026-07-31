/**
 * Database & Configuration Module
 * Connects to MongoDB Atlas and initializes default parking locations and slots if empty.
 * NO DEFAULT ADMIN CREDENTIALS ARE SEEDED.
 */

const mongoose = require('mongoose');
const ParkingLocation = require('../models/ParkingLocation');
const Slot = require('../models/Slot');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`[DB] Connected to MongoDB Atlas: ${conn.connection.host}`);
    
    // Seed initial locations and slots if fresh database
    await seedLocationsAndSlots();
    return true;
  } catch (error) {
    console.error('[DB] Database Connection Error:', error.message);
    process.exit(1);
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
