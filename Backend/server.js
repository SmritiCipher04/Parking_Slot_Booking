/**
 * Main Express Server Entry Point
 * Parking Slot Booking System (ExcuseME)
 * Connected to MongoDB Atlas, bcryptjs Security, Razorpay Gateway & React SPA Frontend
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });
dotenv.config({ path: path.join(__dirname, '../.env') });

// SECURITY: Validate critical environment variables at startup.
// If JWT_SECRET is missing, the server cannot sign or verify tokens securely.
// Fail fast rather than silently using a hardcoded fallback.
if (!process.env.JWT_SECRET) {
  console.error('[STARTUP ERROR] JWT_SECRET is not set in .env. Refusing to start — this would be a critical security vulnerability.');
  process.exit(1);
}

if (!process.env.MONGODB_URI) {
  console.warn('[STARTUP WARNING] MONGODB_URI is not set in .env. Running in memory-only mode.');
}

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

// Serve static React SPA dist or Frontend web app
const distPath = path.join(__dirname, '../Frontend/dist');
const frontendPath = path.join(__dirname, '../Frontend');
const staticPath = fs.existsSync(distPath) ? distPath : frontendPath;

app.use(express.static(staticPath));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

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
app.use('/api/subscriptions', require('./routes/subscriptionRoutes'));

// Secure Configuration Endpoint (Google Maps API Key)
app.get('/api/config/maps-key', (req, res) => {
  const mapsKey = process.env.GOOGLE_MAP_API || process.env.VITE_GOOGLE_MAP_API || '';
  res.status(200).json({ success: true, key: mapsKey });
});

// Health Check API
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ONLINE',
    system: 'ExcuseME Parking Slot Booking API',
    frontend: 'React.js SPA',
    database: 'MongoDB Atlas',
    security: 'bcryptjs + JWT Authorization',
    timestamp: new Date()
  });
});

// Fallback to Frontend index.html for unhandled web routes (SPA Routing support)
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next();
  }
  const indexPath = fs.existsSync(path.join(distPath, 'index.html'))
    ? path.join(distPath, 'index.html')
    : path.join(frontendPath, 'index.html');

  res.sendFile(indexPath);
});

// Centralized Error Handling Middleware
app.use(errorHandler);

const http = require('http');
const server = http.createServer(app);
const { initSocket } = require('./utils/socket');
initSocket(server);

const { startPurgeSchedule } = require('./jobs/cleanupJob');

// Start Server
server.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(` ExcuseME Server running on http://localhost:${PORT}`);
  console.log(` Real-Time Engine : Socket.IO WebSocket Server Active`);
  console.log(` Frontend App  : React.js Single Page Application`);
  console.log(` Database      : MongoDB Atlas Connected`);
  console.log(` Security      : bcryptjs + JWT Authorization`);
  console.log(`=======================================================`);
  // Start automated 48-hour deleted accounts purge & slot auto-expiry jobs
  startPurgeSchedule();
});
