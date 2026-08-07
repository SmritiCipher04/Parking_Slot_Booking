const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const { getNearbyLocations } = require('../controllers/locationController');

(async () => {
  try {
    console.log('[Nearby Location Search Test] Connecting to MongoDB Atlas...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('[Nearby Location Search Test] Connected to Atlas.\n');

    // 1. Test nearby facilities search in Guwahati (26.1445, 91.7362)
    const reqGuwahati = {
      query: { lat: '26.1445', lng: '91.7362', radius: '15' }
    };
    let guwahatiResult = null;
    const resGuwahati = {
      status: (code) => ({
        json: (data) => {
          guwahatiResult = { code, data };
        }
      })
    };

    await getNearbyLocations(reqGuwahati, resGuwahati);

    if (guwahatiResult && guwahatiResult.data.success && guwahatiResult.data.count > 0) {
      console.log(`1. ✅ Nearby Search (Guwahati radius 15km): Found ${guwahatiResult.data.count} facilities.`);
      guwahatiResult.data.data.forEach(loc => {
        console.log(`   - ${loc.name}: ${loc.distanceKm} km away (${loc.address})`);
      });
    } else {
      throw new Error('Guwahati nearby search failed!');
    }

    // 2. Test nearby facilities search in London (51.5074, -0.1278) -> should return 0
    const reqLondon = {
      query: { lat: '51.5074', lng: '-0.1278', radius: '15' }
    };
    let londonResult = null;
    const resLondon = {
      status: (code) => ({
        json: (data) => {
          londonResult = { code, data };
        }
      })
    };

    await getNearbyLocations(reqLondon, resLondon);

    if (londonResult && londonResult.data.success && londonResult.data.count === 0) {
      console.log(`\n2. ✅ Nearby Search (London radius 15km): Correctly returned 0 facilities.`);
    } else {
      throw new Error('London nearby search should return 0 facilities!');
    }

    await mongoose.disconnect();
    console.log('\n🎉 ALL NEARBY LOCATION SEARCH TESTS PASSED 100% SUCCESSFULLY!');
    process.exit(0);
  } catch (err) {
    console.error('❌ NEARBY LOCATION SEARCH TEST FAILED:', err);
    process.exit(1);
  }
})();
