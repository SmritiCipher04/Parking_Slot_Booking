/**
 * Admin Mongoose Model
 * Dedicated Database: admin_db
 * Collection: admins
 * Fields: username, hashed password (select: false), createdAt
 */

const mongoose = require('mongoose');

const adminSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Admin username is required'],
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: [true, 'Admin password is required'],
    select: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, { bufferCommands: false });

/**
 * Returns the Admin Mongoose model targeted at the separate `admin_db` database on Atlas.
 */
const getAdminModel = () => {
  if (mongoose.connection.readyState === 1) {
    const adminDb = mongoose.connection.useDb('admin_db', { useCache: true });
    return adminDb.models.Admin || adminDb.model('Admin', adminSchema);
  }
  return mongoose.models.Admin || mongoose.model('Admin', adminSchema);
};

module.exports = getAdminModel;
