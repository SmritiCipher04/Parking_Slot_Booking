/**
 * Transaction Routes
 */

const express = require('express');
const router = express.Router();
const { getTransactions } = require('../controllers/bookingController');

router.get('/', getTransactions);

module.exports = router;
