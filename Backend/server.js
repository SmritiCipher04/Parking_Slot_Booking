/**
 * Main Express Server Entry Point
 * Parking Slot Booking System (ExcuseME)
 * Connected to MongoDB Atlas & Razorpay Gateway
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from current directory (.env) or root directory
dotenv.config({ path: path.join(__dirname, '.env') });
dotenv.config({ path: path.join(__dirname, '../.env') });

const { connectDB } = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

// Route Imports
const paymentRoutes = require('./routes/paymentRoutes');
const slotRoutes = require('./routes/slotRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const authRoutes = require('./routes/authRoutes');
const transactionRoutes = require('./routes/transactionRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Initialize Database connection to MongoDB Atlas
connectDB();

// Global Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static Frontend files
app.use(express.static(path.join(__dirname, '../Frontend')));

// API Routes
app.use('/api/payment', paymentRoutes);
app.use('/api/slots', slotRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/transactions', transactionRoutes);

// Health Check API
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ONLINE',
    system: 'ExcuseME Parking Slot Booking API',
    database: 'MongoDB Atlas',
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
  console.log(` Razorpay Key ID  : ${process.env.RAZORPAY_KEY_ID ? process.env.RAZORPAY_KEY_ID : 'NOT SET'}`);
  console.log(`=======================================================`);
});
