/**
 * Partner RESTful API Routes
 * Endpoint: /api/partner
 */

const express = require('express');
const router = express.Router();
const {
  registerPartnerLocation,
  getPartnerDashboard,
  updatePartnerLocation
} = require('../controllers/partnerController');
const { protectUser } = require('../middleware/authMiddleware');

// All partner routes require user authentication
router.use(protectUser);

router.post('/locations', registerPartnerLocation);
router.get('/dashboard', getPartnerDashboard);
router.put('/locations/:id', updatePartnerLocation);

module.exports = router;
