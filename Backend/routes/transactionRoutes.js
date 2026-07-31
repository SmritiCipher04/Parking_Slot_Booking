/**
 * Transaction RESTful API Routes
 * Endpoint: /api/transactions
 */

const express = require('express');
const router = express.Router();
const { getUserTransactions } = require('../controllers/bookingController');
const { protectUser } = require('../middleware/authMiddleware');

router.get('/', protectUser, getUserTransactions);

module.exports = router;
