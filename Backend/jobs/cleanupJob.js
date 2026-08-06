/**
 * Automated Maintenance & Slot Expiration Job
 * 1. Purges DeletedAccountLog records older than 48 hours.
 * 2. Marks UserSubscriptions as 'expired' once their endDate passes.
 * 3. Checks occupied slots whose occupiedUntil timestamp has passed, automatically
 *    reverts them to 'available', marks linked booking as 'completed', and emits real-time Socket.IO updates.
 */

const mongoose = require('mongoose');
const DeletedAccountLog = require('../models/DeletedAccountLog');
const UserSubscription = require('../models/UserSubscription');
const Slot = require('../models/Slot');
const Booking = require('../models/Booking');
const dataStore = require('../models/dataStore');
const { emitSlotStatusUpdate } = require('../utils/socket');

const TWO_DAYS_MS = 48 * 60 * 60 * 1000;

const runSlotExpirationJob = async () => {
  try {
    const now = new Date();

    if (mongoose.connection.readyState === 1) {
      // Find all occupied slots whose occupiedUntil time has passed
      const expiredSlots = await Slot.find({
        status: 'occupied',
        occupiedUntil: { $ne: null, $lte: now }
      });

      for (const slot of expiredSlots) {
        slot.status = 'available';
        slot.occupiedUntil = null;
        await slot.save();

        // Update linked booking status to completed
        await Booking.updateMany(
          { slot: slot._id, status: { $in: ['active', 'upcoming', 'pending', 'confirmed'] } },
          { status: 'completed' }
        );

        console.log(`[Slot Auto-Expiry] ⏰ Slot ${slot.slotNumber} at facility ${slot.location} automatically set to AVAILABLE.`);

        // Real-time broadcast
        emitSlotStatusUpdate({
          slotId: slot._id.toString(),
          slotNumber: slot.slotNumber,
          status: 'available',
          occupiedUntil: null,
          facilityId: slot.location.toString()
        });
      }
    } else {
      // Memory store fallback
      dataStore.facilities.forEach(fac => {
        const facId = fac.facilityId || fac._id || fac.id;
        const slots = dataStore.slots[facId] || [];

        slots.forEach(slot => {
          if (slot.status === 'occupied' && slot.occupiedUntil && new Date(slot.occupiedUntil) <= now) {
            slot.status = 'available';
            slot.occupiedUntil = null;

            console.log(`[Slot Auto-Expiry Memory] ⏰ Slot ${slot.slotNumber} at facility ${facId} automatically set to AVAILABLE.`);

            emitSlotStatusUpdate({
              slotId: slot._id || slot.slotId,
              slotNumber: slot.slotNumber,
              status: 'available',
              occupiedUntil: null,
              facilityId: facId
            });
          }
        });
      });
    }
  } catch (err) {
    console.error('[Slot Expiration Job Error]:', err.message);
  }
};

const runPurgeJob = async () => {
  try {
    const cutoffDate = new Date(Date.now() - TWO_DAYS_MS);
    const now = new Date();

    if (mongoose.connection.readyState === 1) {
      // 1. Purge 48-hour deleted account logs
      const result = await DeletedAccountLog.deleteMany({ deletedAt: { $lt: cutoffDate } });
      if (result.deletedCount > 0) {
        console.log(`[Purge Job] ✅ Purged ${result.deletedCount} expired deleted-account records (older than 48 hours) from MongoDB Atlas.`);
      }

      // 2. Automatically mark expired subscriptions
      const expireResult = await UserSubscription.updateMany(
        { status: 'active', endDate: { $lt: now } },
        { status: 'expired' }
      );
      if (expireResult.modifiedCount > 0) {
        console.log(`[Subscription Job] ⏰ Marked ${expireResult.modifiedCount} ExcuseME PLUS subscription passes as EXPIRED.`);
      }
    } else {
      // Memory store fallback
      const initialCount = dataStore.deletedAccountLogs.length;
      dataStore.deletedAccountLogs = dataStore.deletedAccountLogs.filter(
        log => new Date(log.deletedAt) >= cutoffDate
      );
      const purgedCount = initialCount - dataStore.deletedAccountLogs.length;
      if (purgedCount > 0) {
        console.log(`[Purge Job] ✅ Purged ${purgedCount} expired deleted-account records from memory store.`);
      }

      dataStore.userSubscriptions.forEach(sub => {
        if (sub.status === 'active' && new Date(sub.endDate) < now) {
          sub.status = 'expired';
        }
      });
    }

    // Run slot expiration check
    await runSlotExpirationJob();
  } catch (err) {
    console.error('[Maintenance Job Error]:', err.message);
  }
};

// Start periodic cleanup timer (runs every 1 minute for slot expiration, hourly for 48h purge)
const startPurgeSchedule = () => {
  runPurgeJob(); // Run immediately on startup
  setInterval(runSlotExpirationJob, 30 * 1000); // Check slot expiry every 30 seconds
  setInterval(runPurgeJob, 60 * 60 * 1000); // Check 48h account purge hourly
};

module.exports = {
  runPurgeJob,
  runSlotExpirationJob,
  startPurgeSchedule
};
