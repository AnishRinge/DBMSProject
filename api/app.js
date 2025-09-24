const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
require('dotenv').config();

const { testConnection } = require('./config/database');

// Import routes
const authRoutes = require('./routes/auth');
const cityRoutes = require('./routes/cities');
const hotelRoutes = require('./routes/hotels');
const roomTypeRoutes = require('./routes/roomtypes');
const bookingRoutes = require('./routes/bookings');
const paymentRoutes = require('./routes/payments');
const reviewRoutes = require('./routes/reviews');
const seasonalPricingRoutes = require('./routes/seasonal-pricing');

const app = express();
const PORT = process.env.PORT || 3000;
const API_VERSION = process.env.API_VERSION || 'v1';

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(limiter);

// CORS configuration
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression middleware
app.use(compression());

// Logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Travel Booking API is running',
    timestamp: new Date().toISOString(),
    version: API_VERSION,
    environment: process.env.NODE_ENV || 'development'
  });
});

// API documentation endpoint
app.get(`/api/${API_VERSION}`, (req, res) => {
  res.json({
    success: true,
    message: 'Travel & Hotel Booking System API',
    version: API_VERSION,
    documentation: {
      endpoints: {
        auth: {
          'POST /auth/register': 'Register a new user',
          'POST /auth/login': 'Login user',
          'POST /auth/logout': 'Logout user'
        },
        cities: {
          'GET /cities': 'Get all cities',
          'GET /cities/:city_id/hotels': 'Get hotels in a city'
        },
        hotels: {
          'GET /hotels/:hotel_id': 'Get hotel details with room types',
          'GET /hotels/:hotel_id/reviews': 'Get hotel reviews'
        },
        roomTypes: {
          'GET /roomtypes/:room_type_id/availability': 'Check room availability',
          'GET /roomtypes/:room_type_id/calendar': 'Get availability calendar'
        },
        bookings: {
          'POST /bookings': 'Create a new booking',
          'GET /bookings/:booking_id': 'Get booking details',
          'PUT /bookings/:booking_id/cancel': 'Cancel a booking',
          'GET /users/:user_id/bookings': 'Get user bookings'
        },
        payments: {
          'POST /payments': 'Process payment for booking',
          'GET /payments/:payment_id': 'Get payment details',
          'POST /payments/:payment_id/refund': 'Process refund (Admin only)'
        },
        reviews: {
          'POST /reviews': 'Add a review',
          'GET /reviews/:review_id': 'Get specific review',
          'PUT /reviews/:review_id': 'Update review',
          'DELETE /reviews/:review_id': 'Delete review',
          'POST /reviews/:review_id/helpful': 'Mark review as helpful',
          'GET /reviews/recent': 'Get recent reviews'
        },
        seasonalPricing: {
          'GET /seasonal-pricing': 'Get seasonal pricing rules',
          'POST /seasonal-pricing': 'Create pricing rule (Admin only)',
          'GET /seasonal-pricing/:pricing_id': 'Get specific pricing rule',
          'PUT /seasonal-pricing/:pricing_id': 'Update pricing rule (Admin only)',
          'DELETE /seasonal-pricing/:pricing_id': 'Delete pricing rule (Admin only)',
          'GET /seasonal-pricing/room-types/:room_type_id/current-price': 'Get current price'
        }
      },
      authentication: 'Bearer token required for protected endpoints',
      baseUrl: `${req.protocol}://${req.get('host')}/api/${API_VERSION}`
    }
  });
});

// API Routes
app.use(`/api/${API_VERSION}/auth`, authRoutes);
app.use(`/api/${API_VERSION}/cities`, cityRoutes);
app.use(`/api/${API_VERSION}/hotels`, hotelRoutes);
app.use(`/api/${API_VERSION}/roomtypes`, roomTypeRoutes);
app.use(`/api/${API_VERSION}/bookings`, bookingRoutes);
app.use(`/api/${API_VERSION}/payments`, paymentRoutes);
app.use(`/api/${API_VERSION}/reviews`, reviewRoutes);
app.use(`/api/${API_VERSION}/seasonal-pricing`, seasonalPricingRoutes);

// Add the users/:user_id/bookings route to bookings
app.use(`/api/${API_VERSION}/users`, bookingRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found',
    path: req.originalUrl,
    method: req.method,
    suggestion: `Try GET /api/${API_VERSION} for API documentation`
  });
});

// Global error handler
app.use((error, req, res, next) => {
  console.error('Global error handler:', error);
  
  // Handle specific error types
  if (error.type === 'entity.parse.failed') {
    return res.status(400).json({
      success: false,
      message: 'Invalid JSON in request body'
    });
  }

  if (error.code === 'EBADCSRFTOKEN') {
    return res.status(403).json({
      success: false,
      message: 'Invalid CSRF token'
    });
  }

  // Default error response
  res.status(error.status || 500).json({
    success: false,
    message: error.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  });
});

// Graceful shutdown handler
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});

// Start server
const startServer = async () => {
  try {
    // Test database connection
    await testConnection();
    
    app.listen(PORT, () => {
      console.log(`🚀 Travel Booking API running on port ${PORT}`);
      console.log(`📚 API Documentation: http://localhost:${PORT}/api/${API_VERSION}`);
      console.log(`🏥 Health Check: http://localhost:${PORT}/health`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Only start server if this file is run directly
if (require.main === module) {
  startServer();
}

module.exports = app;