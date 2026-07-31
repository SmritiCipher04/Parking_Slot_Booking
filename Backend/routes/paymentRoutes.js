/**
 * Payment RESTful API Routes
 * Endpoint: /api/payments
 */

const express = require('express');
const router = express.Router();
const { getKey, createOrder, verifyPayment } = require('../controllers/paymentController');
const { protectUser } = require('../middleware/authMiddleware');

router.get('/get-key', getKey);
router.post('/create-order', protectUser, createOrder);
router.post('/verify-payment', protectUser, verifyPayment);

module.exports = router;
