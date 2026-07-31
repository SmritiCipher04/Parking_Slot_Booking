/**
 * Main Express Server Entry Point
 * Parking Slot Booking System (ExcuseME)
 * Connected to MongoDB Atlas, bcryptjs Security & Razorpay Gateway
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });
dotenv.config({ path: path.join(__dirname, '../.env') });

const { connectDB } = require('./config/db');
const errorHandler = require('./middleware/errorHandler');
const checkDbConnection = require('./middleware/dbCheck');

// RESTful Route Imports
const userRoutes = require('./routes/userRoutes');
const adminRoutes = require('./routes/adminRoutes');
const locationRoutes = require('./routes/locationRoutes');
const slotRoutes = require('./routes/slotRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const paymentRoutes = require('./routes/paymentRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Initialize Database connection to MongoDB Atlas
connectDB();

// Global Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static Frontend web app
app.use(express.static(path.join(__dirname, '../Frontend')));

// DB Status check middleware for /api routes
app.use('/api', (req, res, next) => {
  if (req.path === '/health' || req.path === '/admin/setup-status') {
    return next();
  }
  checkDbConnection(req, res, next);
});

// REST API Routes
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/locations', locationRoutes);
app.use('/api/slots', slotRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/payment', paymentRoutes); // Route alias

// Health Check API
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ONLINE',
    system: 'ExcuseME Parking Slot Booking API',
    database: 'MongoDB Atlas',
    security: 'bcryptjs + JWT Authorization',
    timestamp: new Date()
  });
});

// Fallback to Frontend index.html for unhandled web routes
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next();
  }
  res.sendFile(path.join(__dirname, '../Frontend/index.html'));
});

// Centralized Error Handling Middleware
app.use(errorHandler);

// Start Server
app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(` ExcuseME Server running on http://localhost:${PORT}`);
  console.log(` Environment Mode : ${process.env.NODE_ENV || 'development'}`);
  console.log(` Database Cluster : MongoDB Atlas Connected`);
  console.log(` Security Engine  : bcryptjs + JWT Authorization`);
  console.log(`=======================================================`);
});
