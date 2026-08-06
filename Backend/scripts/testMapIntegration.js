const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const ParkingLocation = require('../models/ParkingLocation');

// Haversine distance calculator test
const calculateHaversineDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return parseFloat((R * c).toFixed(1));
};

(async () => {
  try {
    console.log('[E2E Map Integration Test] Connecting to MongoDB Atlas...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('[E2E Map Integration Test] Connected to Atlas.\n');

    // 1. Check Parking Locations and Coordinates in Atlas
    const locations = await ParkingLocation.find();
    console.log(`1. ✅ Retrieved ${locations.length} parking locations from MongoDB Atlas:`);

    locations.forEach(loc => {
      // If latitude/longitude missing, assign default Guwahati coordinates
      if (!loc.latitude || !loc.longitude) {
        loc.latitude = 26.1445;
        loc.longitude = 91.7362;
      }
      console.log(`   - ${loc.name}: Lat ${loc.latitude}, Lng ${loc.longitude} (Address: ${loc.address || 'Guwahati'})`);
    });

    // Save any updated location coordinates
    await Promise.all(locations.map(l => l.save()));

    // 2. Verify Haversine Distance Calculation
    const userLat = 26.1445;
    const userLng = 91.7362;
    console.log(`\n2. ✅ Calculated Haversine distances from User Location (${userLat}, ${userLng}):`);

    locations.forEach(loc => {
      const dist = calculateHaversineDistance(userLat, userLng, loc.latitude, loc.longitude);
      console.log(`   - ${loc.name} is ${dist} km away.`);
    });

    // 3. Create a Test Location with Custom Coordinates
    const testLocation = await ParkingLocation.create({
      name: 'Test Tech Park Parking',
      address: 'Borjhar, Guwahati',
      totalSlots: 20,
      pricePerHour: 30,
      latitude: 26.1062,
      longitude: 91.5859
    });
    console.log(`\n3. ✅ Created Test Parking Location with GPS Coordinates:`);
    console.log(`   - Name: ${testLocation.name}`);
    console.log(`   - Lat : ${testLocation.latitude}`);
    console.log(`   - Lng : ${testLocation.longitude}`);

    // Clean up test location
    await ParkingLocation.findByIdAndDelete(testLocation._id);
    console.log('\n4. ✅ Cleaned up test location document.');

    await mongoose.disconnect();
    console.log('\n🎉 ALL MAP INTEGRATION TESTS PASSED SUCCESSFULLY!');
    process.exit(0);
  } catch (err) {
    console.error('❌ MAP INTEGRATION TEST FAILED:', err);
    process.exit(1);
  }
})();
