const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const ParkingLocation = require('../models/ParkingLocation');

(async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('[Update Coordinates] Connected to MongoDB Atlas...');

    const updates = [
      { name: /City Mall/i, lat: 26.1445, lng: 91.7362, address: 'GS Road, Christian Basti, Guwahati' },
      { name: /Railway/i, lat: 26.1818, lng: 91.7510, address: 'Paltan Bazar, Guwahati' },
      { name: /GS Road/i, lat: 26.1550, lng: 91.7650, address: 'Bhangagarh, Guwahati' },
      { name: /ADTU/i, lat: 26.1158, lng: 91.9790, address: 'Sonapur, Guwahati, Assam' }
    ];

    for (const u of updates) {
      await ParkingLocation.updateMany(
        { name: u.name },
        { latitude: u.lat, longitude: u.lng, address: u.address }
      );
    }

    const all = await ParkingLocation.find();
    console.log('✅ Updated locations in Atlas with GPS coordinates:');
    all.forEach(l => console.log(` - ${l.name}: Lat ${l.latitude}, Lng ${l.longitude} (${l.address})`));

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
