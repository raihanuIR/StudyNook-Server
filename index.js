require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const connectDB = require('./config/db');

// Connect to Database
connectDB();

const app = express();

// Middleware
const allowedOrigins = [
  process.env.CLIENT_URL || 'http://localhost:5173',
  'http://localhost:5173',
  'https://studynook-booking.web.app',
  'https://studynook-booking.firebaseapp.com'
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (
      allowedOrigins.indexOf(origin) !== -1 ||
      origin.endsWith('.vercel.app') ||
      (process.env.CLIENT_URL && origin === process.env.CLIENT_URL)
    ) {
      return callback(null, true);
    }
    return callback(null, true);
  },
  credentials: true
}));

app.use(express.json());
app.use(cookieParser());

// Database connection middleware for Serverless invocations
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    console.error('Database connection error in request middleware:', err);
    res.status(500).json({ 
      message: 'Failed to connect to database. Please check MongoDB Atlas IP access whitelist (0.0.0.0/0).', 
      error: err.message 
    });
  }
});

// Route Imports
const authRoutes = require('./routes/auth');
const roomRoutes = require('./routes/rooms');
const bookingRoutes = require('./routes/bookings');

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/bookings', bookingRoutes);

// Base Endpoint
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to the StudyNook API Server!' });
});

// 404 Route handler for API endpoints
app.use((req, res, next) => {
  res.status(404).json({ message: 'API Endpoint not found' });
});

// Global Error Handler Middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    message: err.message || 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? err.stack : {}
  });
});

const PORT = process.env.PORT || 5000;
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`Server running in development mode on port ${PORT}`);
  });
} else {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = app;
