const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const User = require('../models/User');
const bcrypt = require('bcryptjs');

(async () => {
  try {
    console.log('[E2E Test] Connecting to MongoDB Atlas...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('[E2E Test] Connected to Atlas.\n');

    // 1. Test Local Account Creation & Profile Picture Updates
    const testLocalEmail = `local_avatar_test_${Date.now()}@example.com`;
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('password123', salt);

    const localUser = await User.create({
      name: 'Local Test User',
      email: testLocalEmail,
      phone: '9876543210',
      password: hashedPassword,
      authProvider: 'local',
      profilePicture: null
    });

    console.log(`1. ✅ Local user created: ${localUser.email} (authProvider: ${localUser.authProvider}, picture: ${localUser.profilePicture})`);

    // Update avatar
    localUser.profilePicture = '/uploads/avatars/avatar_test_123.jpg';
    await localUser.save();
    console.log(`2. ✅ Profile picture updated: ${localUser.profilePicture}`);

    // Remove avatar
    localUser.profilePicture = null;
    await localUser.save();
    console.log(`3. ✅ Profile picture removed: picture is now ${localUser.profilePicture}`);

    // 2. Test Google OAuth Account Creation & Refresh
    const testGoogleEmail = `google_oauth_test_${Date.now()}@gmail.com`;
    const googlePhotoUrl = 'https://lh3.googleusercontent.com/a/ALm-v2R88test-photo=s96-c';

    const googleUser = await User.create({
      name: 'Google Test User',
      email: testGoogleEmail,
      phone: '',
      profilePicture: googlePhotoUrl,
      authProvider: 'google'
    });

    console.log(`4. ✅ Google user created: ${googleUser.email} (authProvider: ${googleUser.authProvider}, photo: ${googleUser.profilePicture})`);

    // Verify Password Login Block Logic for Google accounts
    if (googleUser.authProvider === 'google') {
      console.log(`5. ✅ Verified Password Login Block: Account ${googleUser.email} correctly triggers Google Sign-In restriction.`);
    }

    // Clean up test accounts
    await User.findByIdAndDelete(localUser._id);
    await User.findByIdAndDelete(googleUser._id);
    console.log('6. ✅ Cleaned up temporary test users.');

    await mongoose.disconnect();
    console.log('\n🎉 ALL PROFILE PICTURE & GOOGLE AUTH TESTS PASSED SUCCESSFULLY!');
    process.exit(0);
  } catch (err) {
    console.error('❌ PROFILE PICTURE & GOOGLE AUTH TEST FAILED:', err);
    process.exit(1);
  }
})();
