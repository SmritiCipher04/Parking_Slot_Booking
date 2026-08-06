/**
 * Subscription RESTful API Routes (ExcuseME PLUS)
 * Endpoint: /api/subscriptions
 */

const express = require('express');
const router = express.Router();
const {
  getSubscriptionPlans,
  createSubscriptionOrder,
  verifySubscriptionPayment,
  getMySubscriptions,
  checkActivePassForLocation
} = require('../controllers/subscriptionController');
const { protectUser } = require('../middleware/authMiddleware');

// Public / User routes
router.get('/plans', getSubscriptionPlans);
router.post('/create-order', protectUser, createSubscriptionOrder);
router.post('/verify-payment', protectUser, verifySubscriptionPayment);
router.get('/my-subscriptions', protectUser, getMySubscriptions);
router.get('/active-pass', protectUser, checkActivePassForLocation);

module.exports = router;
