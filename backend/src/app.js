const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const errorHandler = require('./middlewares/errorHandler');
const { getDBStatus } = require('./config/db');
const { apiLimiter } = require('./middlewares/rateLimiter');

// Route imports
const authRoutes = require('./routes/authRoutes');
const membershipPlanRoutes = require('./routes/membershipPlanRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const trainerRoutes = require('./routes/trainerRoutes');
const clubRoutes = require('./routes/clubRoutes');
const scheduleRoutes = require('./routes/scheduleRoutes');
const inquiryRoutes = require('./routes/inquiryRoutes');
const newsletterRoutes = require('./routes/newsletterRoutes');
const adminRoutes = require('./routes/adminRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const membershipRoutes = require('./routes/membershipRoutes');
const trainerDashboardRoutes = require('./routes/trainerDashboardRoutes');
const trainerApplicationRoutes = require('./routes/trainerApplicationRoutes');

const app = express();

// Trust reverse proxy on Render / Cloudflare / Vercel for rate-limiting & IP resolution
app.set('trust proxy', 1);

// Security Headers with Helmet
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginEmbedderPolicy: false,
}));

// Robust Production CORS Configuration for Vercel & Localhost
const allowedOrigins = [
  'https://qnox.vercel.app',
  'https://qnox.onrender.com',
  'http://localhost:3000',
  'http://localhost:5173',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:5173',
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow non-browser requests or same-origin
    if (!origin) return callback(null, true);
    if (
      allowedOrigins.includes(origin) ||
      origin.endsWith('.vercel.app') ||
      origin.endsWith('.onrender.com')
    ) {
      return callback(null, true);
    }
    // Graceful open access for public API
    return callback(null, true);
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  credentials: true,
  maxAge: 86400,
}));

// Preflight handler
app.options('*', cors());

// Body Parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static file serving for user and admin uploads
app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')));

// Logging
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Rate Limiter
app.use('/api', apiLimiter);

// Health check & System info
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ONLINE',
    service: 'QNOX GYM Luxury Sanctuary Core API',
    timestamp: new Date().toISOString(),
    database: getDBStatus(),
    version: '2.0.0',
    environment: process.env.NODE_ENV || 'development',
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/membership-plans', membershipPlanRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/trainers', trainerRoutes);
app.use('/api/clubs', clubRoutes);
app.use('/api/schedule', scheduleRoutes);
app.use('/api/inquiries', inquiryRoutes);
app.use('/api/newsletter', newsletterRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/memberships', membershipRoutes);
app.use('/api/trainer-portal', trainerDashboardRoutes);
app.use('/api/trainer', trainerApplicationRoutes);

// Root greeting
app.get('/', (req, res) => {
  res.json({
    brand: 'QNOX GYM',
    tagline: 'Where Human Performance Meets Pure Architectural Luxury',
    philosophy: 'Training For Life',
    apiDocumentation: {
      health: '/api/health',
      auth: '/api/auth',
      membershipPlans: '/api/membership-plans',
      payments: '/api/payments',
      bookings: '/api/bookings',
      trainers: '/api/trainers',
      clubs: '/api/clubs',
      schedule: '/api/schedule',
      inquiries: '/api/inquiries',
      newsletter: '/api/newsletter',
      admin: '/api/admin',
      upload: '/api/upload',
    },
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Resource not found on QNOX API: ${req.originalUrl}`,
  });
});

// Centralized error handler
app.use(errorHandler);

module.exports = app;
