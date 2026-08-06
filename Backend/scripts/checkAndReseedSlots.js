/**
 * Check Atlas slot/location counts and re-seed if empty.
 * Run: node Backend/scripts/checkAndReseedSlots.js
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const ParkingLocation = require('../models/ParkingLocation');
const Slot = require('../models/Slot');

(async () => {
  try {
    console.log('[Check] Connecting to MongoDB Atlas...');
    await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 8000 });
    console.log('[Check] Connected.\n');

    const locCount = await ParkingLocation.countDocuments();
    const slotCount = await Slot.countDocuments();
    console.log(`Locations in Atlas : ${locCount}`);
    console.log(`Slots in Atlas     : ${slotCount}`);

    if (slotCount === 0) {
      console.log('\n[Seeder] Slots are empty. Re-seeding...');
      const locations = await ParkingLocation.find();

      if (locations.length === 0) {
        console.log('[Seeder] No locations found either. Creating default locations first...');
        const defaultLocations = [
          { name: 'City Mall Parking', address: 'Guwahati, Assam', totalSlots: 20, pricePerHour: 20 },
          { name: 'Railway Station Parking', address: 'Guwahati, Assam', totalSlots: 20, pricePerHour: 15 },
          { name: 'ADTU Campus Parking', address: 'Sonapur, Assam', totalSlots: 20, pricePerHour: 10 },
          { name: 'GS Road Parking Complex', address: 'Guwahati, Assam', totalSlots: 20, pricePerHour: 25 }
        ];
        const created = await ParkingLocation.create(defaultLocations);
        locations.push(...created);
        console.log(`[Seeder] Created ${created.length} parking locations.`);
      }

      const letters = ['A', 'B', 'C', 'D'];
      const slotDocs = [];

      for (const loc of locations) {
        // Check if slots already exist for this location (safety guard)
        const existing = await Slot.countDocuments({ location: loc._id });
        if (existing > 0) {
          console.log(`[Seeder] Location "${loc.name}" already has ${existing} slots — skipping.`);
          continue;
        }

        let idx = 1;
        for (const letter of letters) {
          for (let num = 1; num <= 5; num++) {
            const slotNumber = `${letter}${num}`;
            let status = 'available';
            // Seed a few occupied/reserved for realism (only on first location)
            if (loc.name === 'City Mall Parking') {
              if ([2, 6, 12, 17].includes(idx)) status = 'occupied';
              if ([5, 14].includes(idx)) status = 'reserved';
            }
            slotDocs.push({ location: loc._id, slotNumber, status });
            idx++;
          }
        }
        console.log(`[Seeder] Prepared 20 slots for "${loc.name}"`);
      }

      if (slotDocs.length > 0) {
        await Slot.insertMany(slotDocs, { ordered: false });
        console.log(`\n[Seeder] ✅ Successfully seeded ${slotDocs.length} slots into Atlas.`);
      } else {
        console.log('[Seeder] All locations already had slots. Nothing to seed.');
      }
    } else {
      console.log('\n✅ Slots are present in Atlas — no re-seeding needed.');
    }

    const finalSlots = await Slot.countDocuments();
    const finalLocs = await ParkingLocation.countDocuments();
    console.log(`\nFinal Atlas state:`);
    console.log(`  Locations : ${finalLocs}`);
    console.log(`  Slots     : ${finalSlots}`);

    await mongoose.disconnect();
    console.log('\n[Check] Disconnected. Done.');
    process.exit(0);
  } catch (err) {
    console.error('[Check] Error:', err.message);
    process.exit(1);
  }
})();
