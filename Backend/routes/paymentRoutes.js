/**
 * Payment Routes
 */

const express = require('express');
const router = express.Router();
const { getKey, createOrder, verifyPayment } = require('../controllers/paymentController');

router.get('/get-key', getKey);
router.post('/create-order', createOrder);
router.post('/verify-payment', verifyPayment);

module.exports = router;
