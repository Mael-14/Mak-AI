const express = require('express');
const cors = require('cors');
const errorHandler = require('./middleware/errorHandler');

// Import routes
const authRoutes = require('./routes/auth');
const healthRoutes = require('./routes/health');
const examRoutes = require('./routes/examRoutes');

const app = express();

// Middleware
// CORS configuration - allow all origins in development for easier testing
const corsOptions = process.env.NODE_ENV === 'production'
  ? {
    origin: process.env.FRONTEND_URL || 'http://localhost:19006',
    credentials: true
  }
  : {
    origin: true, // Allow all origins in development
    credentials: true
  };

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Basic health check route (root level)
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/health', healthRoutes);
app.use('/api/exams', examRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    statusCode: 404
  });
});

// Error handler (must be last)
app.use(errorHandler);

module.exports = app;

