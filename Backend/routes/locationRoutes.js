/**
 * Location RESTful API Routes
 * Endpoint: /api/locations
 */

const express = require('express');
const router = express.Router();
const { getLocations, getSlotsByLocation } = require('../controllers/locationController');

router.get('/', getLocations);
router.get('/:id/slots', getSlotsByLocation);

module.exports = router;
