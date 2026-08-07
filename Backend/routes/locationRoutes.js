/**
 * Location RESTful API Routes
 * Endpoint: /api/locations
 */

const express = require('express');
const router = express.Router();
const { getLocations, getNearbyLocations, getSlotsByLocation } = require('../controllers/locationController');

router.get('/', getLocations);
router.get('/nearby', getNearbyLocations);
router.get('/:id/slots', getSlotsByLocation);

module.exports = router;
