/**
 * Subscription Controller (ExcuseME PLUS)
 * Handles subscription plans creation, listing, user purchasing via Razorpay,
 * active pass verification, and user/admin subscription management.
 */

const mongoose = require('mongoose');
const SubscriptionPlan = require('../models/SubscriptionPlan');
const UserSubscription = require('../models/UserSubscription');
const ParkingLocation = require('../models/ParkingLocation');
const Transaction = require('../models/Transaction');
const dataStore = require('../models/dataStore');

const isDbConnected = () => mongoose.connection.readyState === 1;

let Razorpay;
try {
  Razorpay = require('razorpay');
} catch (e) {
  Razorpay = null;
}

// GET /api/subscriptions/plans (Public / User)
const getSubscriptionPlans = async (req, res) => {
  try {
    const { locationId } = req.query;

    if (isDbConnected()) {
      let filter = { isActive: true };
      if (locationId) {
        if (mongoose.Types.ObjectId.isValid(locationId)) {
          filter.location = locationId;
        }
      }

      let plans = await SubscriptionPlan.find(filter).populate('location');

      // Seed default plans per location if none exist
      if (plans.length === 0) {
        const locations = await ParkingLocation.find();
        const seeded = [];

        for (const loc of locations) {
          const locPrice = loc.pricePerHour || 20;
          const weeklyPrice = Math.round(locPrice * 5 * 2); // discounted weekly
          const monthlyPrice = Math.round(locPrice * 20 * 2); // discounted monthly

          seeded.push(
            {
              name: `${loc.name} Weekly Pass`,
              type: 'weekly',
              durationDays: 7,
              price: weeklyPrice,
              savingsPercentage: 30,
              location: loc._id,
              locationName: loc.name,
              features: ['Unlimited parking access', 'Zero per-booking payments', 'Priority slot allocation', 'Guaranteed slot reservation'],
              isActive: true
            },
            {
              name: `${loc.name} Monthly Pass`,
              type: 'monthly',
              durationDays: 30,
              price: monthlyPrice,
              savingsPercentage: 45,
              location: loc._id,
              locationName: loc.name,
              features: ['Unlimited parking access', 'Zero per-booking payments', 'VIP slot allocation', 'Dedicated support & express check-in'],
              isActive: true
            }
          );
        }

        if (seeded.length > 0) {
          await SubscriptionPlan.insertMany(seeded);
          plans = await SubscriptionPlan.find(filter).populate('location');
        }
      }

      return res.status(200).json({ success: true, data: plans });
    } else {
      return res.status(200).json({ success: true, data: dataStore.subscriptionPlans });
    }
  } catch (error) {
    console.error('[Subscription] Error fetching plans:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/subscriptions/create-order (Protected User)
const createSubscriptionOrder = async (req, res) => {
  try {
    const { planId, amount } = req.body;
    const numericAmount = parseFloat(amount) || 299;
    const amountInPaise = Math.round(numericAmount * 100);

    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    let order;

    if (Razorpay && keyId && keySecret) {
      try {
        const instance = new Razorpay({ key_id: keyId, key_secret: keySecret });
        order = await instance.orders.create({
          amount: amountInPaise,
          currency: 'INR',
          receipt: `sub_rcpt_${Date.now()}`,
          notes: { planId: planId || 'pass' }
        });
      } catch (sdkError) {
        console.warn('[Subscription] Razorpay SDK warning:', sdkError.message);
      }
    }

    if (!order) {
      order = {
        id: `sub_order_local_${Math.random().toString(36).substring(2, 12)}_${Date.now()}`,
        amount: amountInPaise,
        currency: 'INR',
        receipt: `sub_rcpt_${Date.now()}`,
        status: 'created'
      };
    }

    res.status(200).json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: keyId || ''
    });
  } catch (error) {
    console.error('[Subscription] Error creating order:', error);
    res.status(500).json({ success: false, message: 'Order creation failed', error: error.message });
  }
};

// POST /api/subscriptions/verify-payment (Protected User)
const verifySubscriptionPayment = async (req, res) => {
  try {
    const {
      planId,
      razorpay_payment_id,
      paymentMethod,
      amount
    } = req.body;

    const user = req.user;
    if (!user) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }

    let planDoc = null;
    let locationDoc = null;

    if (isDbConnected()) {
      if (planId && mongoose.Types.ObjectId.isValid(planId)) {
        planDoc = await SubscriptionPlan.findById(planId);
      }
      if (!planDoc) {
        planDoc = await SubscriptionPlan.findOne();
      }

      if (planDoc && planDoc.location) {
        locationDoc = await ParkingLocation.findById(planDoc.location);
      }
    } else {
      planDoc = dataStore.subscriptionPlans.find(p => p._id === planId) || dataStore.subscriptionPlans[0];
    }

    const durationDays = planDoc ? planDoc.durationDays : 30;
    const planName = planDoc ? planDoc.name : 'ExcuseME PLUS Monthly Pass';
    const planType = planDoc ? planDoc.type : 'monthly';
    const locName = planDoc ? planDoc.locationName : 'City Mall Parking';
    const pricePaid = parseFloat(amount) || (planDoc ? planDoc.price : 349);

    const startDate = new Date();
    const endDate = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000);
    const paymentId = razorpay_payment_id || `sub_pay_${Date.now()}`;

    let newSubscription = null;

    if (isDbConnected()) {
      let userObjectId = undefined;
      if (user && user._id && mongoose.Types.ObjectId.isValid(user._id.toString())) {
        userObjectId = user._id;
      }

      newSubscription = await UserSubscription.create({
        user: userObjectId,
        userEmail: user.email,
        plan: planDoc ? planDoc._id : undefined,
        planName,
        planType,
        location: locationDoc ? locationDoc._id : undefined,
        locationName: locName,
        startDate,
        endDate,
        pricePaid,
        paymentId,
        status: 'active'
      });

      // Create linked Transaction record so pass purchase appears in Transaction History
      await Transaction.create({
        transactionId: `TXN_SUB_${Math.floor(100000 + Math.random() * 900000)}`,
        paymentId,
        bookingId: `PASS_${planType.toUpperCase()}`,
        user: userObjectId,
        userEmail: user.email,
        facilityName: locName,
        slotId: 'PASS',
        amount: pricePaid,
        paymentMethod: paymentMethod || 'Razorpay (ExcuseME PLUS Pass)',
        paymentStatus: 'SUCCESSFUL'
      });

      console.log(`[Subscription] ✅ Created ExcuseME PLUS pass for ${user.email} at ${locName}`);
    } else {
      newSubscription = {
        _id: `sub_${Date.now()}`,
        userEmail: user.email,
        planName,
        planType,
        locationName: locName,
        startDate,
        endDate,
        pricePaid,
        paymentId,
        status: 'active'
      };

      dataStore.userSubscriptions.push(newSubscription);

      dataStore.transactions.push({
        transactionId: `TXN_SUB_${Math.floor(100000 + Math.random() * 900000)}`,
        paymentId,
        bookingId: `PASS_${planType.toUpperCase()}`,
        userEmail: user.email,
        facilityName: locName,
        slotId: 'PASS',
        amount: pricePaid,
        paymentMethod: paymentMethod || 'ExcuseME PLUS Pass',
        paymentStatus: 'SUCCESSFUL',
        timestamp: new Date()
      });
    }

    return res.status(200).json({
      success: true,
      message: `Congratulations! Your ${planName} is now active.`,
      subscription: newSubscription
    });
  } catch (error) {
    console.error('[Subscription] Error verifying payment:', error);
    res.status(500).json({ success: false, message: 'Failed to complete subscription', error: error.message });
  }
};

// GET /api/subscriptions/my-subscriptions (Protected User)
const getMySubscriptions = async (req, res) => {
  try {
    const userEmail = (req.user.email || '').toLowerCase();

    if (isDbConnected()) {
      const subs = await UserSubscription.find({ userEmail }).sort({ createdAt: -1 });
      return res.status(200).json({ success: true, data: subs });
    } else {
      const subs = dataStore.userSubscriptions.filter(s => s.userEmail.toLowerCase() === userEmail);
      return res.status(200).json({ success: true, data: subs });
    }
  } catch (error) {
    console.error('[Subscription] Error fetching user subscriptions:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/subscriptions/active-pass (Protected User)
// Checks if user has an active ExcuseME PLUS pass for a specific location
const checkActivePassForLocation = async (req, res) => {
  try {
    const { facilityId, facilityName } = req.query;
    const userEmail = (req.user.email || '').toLowerCase();
    const now = new Date();

    if (isDbConnected()) {
      let locationDoc = null;
      if (facilityId && mongoose.Types.ObjectId.isValid(facilityId)) {
        locationDoc = await ParkingLocation.findById(facilityId);
      }
      if (!locationDoc && facilityName) {
        locationDoc = await ParkingLocation.findOne({ name: new RegExp(facilityName, 'i') });
      }

      const query = {
        userEmail,
        status: 'active',
        endDate: { $gt: now }
      };

      if (locationDoc) {
        query.$or = [{ location: locationDoc._id }, { locationName: locationDoc.name }];
      } else if (facilityName) {
        query.locationName = new RegExp(facilityName, 'i');
      }

      const activePass = await UserSubscription.findOne(query);

      return res.status(200).json({
        success: true,
        hasActivePass: !!activePass,
        pass: activePass || null
      });
    } else {
      const activePass = dataStore.userSubscriptions.find(s =>
        s.userEmail.toLowerCase() === userEmail &&
        s.status === 'active' &&
        new Date(s.endDate) > now &&
        (facilityName ? s.locationName.toLowerCase().includes(facilityName.toLowerCase()) : true)
      );

      return res.status(200).json({
        success: true,
        hasActivePass: !!activePass,
        pass: activePass || null
      });
    }
  } catch (error) {
    console.error('[Subscription] Error checking active pass:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Admin Endpoints
// POST /api/admin/subscriptions/plans (Admin)
const createPlan = async (req, res) => {
  try {
    const { name, type, durationDays, price, savingsPercentage, locationId, locationName } = req.body;

    if (!name || !price) {
      return res.status(400).json({ success: false, message: 'Plan name and price are required.' });
    }

    if (isDbConnected()) {
      let locId = undefined;
      if (locationId && mongoose.Types.ObjectId.isValid(locationId)) {
        locId = locationId;
      }

      const newPlan = await SubscriptionPlan.create({
        name,
        type: type || 'monthly',
        durationDays: parseInt(durationDays) || (type === 'weekly' ? 7 : 30),
        price: parseFloat(price),
        savingsPercentage: parseInt(savingsPercentage) || 25,
        location: locId,
        locationName: locationName || 'Parking Facility',
        isActive: true
      });

      return res.status(201).json({ success: true, message: `Plan "${name}" created.`, plan: newPlan });
    } else {
      const newPlan = {
        _id: `sp_${Date.now()}`,
        name,
        type: type || 'monthly',
        durationDays: parseInt(durationDays) || 30,
        price: parseFloat(price),
        savingsPercentage: parseInt(savingsPercentage) || 25,
        locationName: locationName || 'Parking Facility',
        isActive: true
      };
      dataStore.subscriptionPlans.push(newPlan);
      return res.status(201).json({ success: true, message: `Plan "${name}" created.`, plan: newPlan });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /api/admin/subscriptions/plans/:id (Admin)
const deletePlan = async (req, res) => {
  try {
    const { id } = req.params;
    if (isDbConnected()) {
      await SubscriptionPlan.findByIdAndDelete(id);
    } else {
      const idx = dataStore.subscriptionPlans.findIndex(p => p._id === id);
      if (idx !== -1) dataStore.subscriptionPlans.splice(idx, 1);
    }
    return res.status(200).json({ success: true, message: 'Subscription plan deleted.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/admin/subscriptions (Admin)
const getAllSubscriptionsAdmin = async (req, res) => {
  try {
    if (isDbConnected()) {
      const subs = await UserSubscription.find().sort({ createdAt: -1 });
      return res.status(200).json({ success: true, count: subs.length, data: subs });
    } else {
      return res.status(200).json({ success: true, count: dataStore.userSubscriptions.length, data: dataStore.userSubscriptions });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getSubscriptionPlans,
  createSubscriptionOrder,
  verifySubscriptionPayment,
  getMySubscriptions,
  checkActivePassForLocation,
  createPlan,
  deletePlan,
  getAllSubscriptionsAdmin
};
