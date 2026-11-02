/**
 * ============================================================================
 * COFFEE SHOP MANAGEMENT SYSTEM - BACKEND SERVER
 * ============================================================================
 * Main entry point for the Express.js application.
 *
 * Technologies:
 *   - Express.js (REST API framework)
 *   - CORS (Cross-Origin Resource Sharing)
 *   - Key-Value NoSQL Database (Redis / Persistent File Storage)
 *   - Native Node.js crypto & modules
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const db = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const menuRoutes = require('./routes/menuRoutes');
const orderRoutes = require('./routes/orderRoutes');
const { notFoundHandler, globalErrorHandler } = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 5001;

// ============================================================================
// MIDDLEWARE CONFIGURATION
// ============================================================================

// Enable CORS for frontend applications (local Vite dev server and deployed domain)
const corsOptions = {
  origin: process.env.FRONTEND_URL || '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-staff-token']
};
app.use(cors(corsOptions));

// Body parser middleware: parse incoming JSON and URL-encoded bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logger for debugging and transparency
app.use((req, res, next) => {
  const timestamp = new Date().toLocaleTimeString();
  console.log(`[${timestamp}] ${req.method} ${req.originalUrl}`);
  next();
});

// ============================================================================
// SYSTEM & HEALTH CHECK ENDPOINT
// ============================================================================
// Required by Section 5 and Section 9 ("verify that /api/health works")
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'Coffee Shop REST API',
    uptimeSeconds: Math.floor(process.uptime()),
    database: db.getStatus(),
    timestamp: new Date().toISOString()
  });
});

// Root welcome message
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to the Coffee Shop Management REST API!',
    documentation: '/api/health',
    endpoints: {
      health: 'GET /api/health',
      menu: 'GET /api/menu',
      orders: 'GET, POST /api/orders',
      auth: 'POST /api/auth/login'
    }
  });
});

// ============================================================================
// ROUTE MOUNTING
// ============================================================================
app.use('/api/auth', authRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/orders', orderRoutes);

// ============================================================================
// ERROR HANDLING MIDDLEWARE
// ============================================================================
app.use(notFoundHandler);
app.use(globalErrorHandler);

// ============================================================================
// SERVER INITIALIZATION
// ============================================================================
async function startServer() {
  try {
    // 1. Connect to Key-Value database and seed initial menu if required
    await db.connectDatabase();

    // 2. Start HTTP server
    app.listen(PORT, () => {
      console.log('========================================================');
      console.log(` Coffee Shop Server running on port: ${PORT}`);
      console.log(` Health check available at: http://localhost:${PORT}/api/health`);
      console.log(` Menu API available at:     http://localhost:${PORT}/api/menu`);
      console.log(` Orders API available at:   http://localhost:${PORT}/api/orders`);
      console.log('========================================================');
    });
  } catch (error) {
    console.error('Fatal error starting server:', error.message);
    process.exit(1);
  }
}

// Start only if run directly
if (require.main === module) {
  startServer();
}

module.exports = app;

