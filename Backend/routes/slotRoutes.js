/**
 * Slot Routes
 */

const express = require('express');
const router = express.Router();
const { getFacilities, addFacility, getAllSlots, updateSlotStatus } = require('../controllers/slotController');

router.get('/facilities', getFacilities);
router.post('/facilities', addFacility);
router.get('/', getAllSlots);
router.put('/:id/status', updateSlotStatus);

module.exports = router;
