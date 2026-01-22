const express = require('express');
const router = express.Router();

// Import services to test
const { admin } = require('../config/firebase');
const googleAuthService = require('../services/google/googleAuthService');

/**
 * Basic health check
 * GET /api/health
 */
router.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Backend API is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

/**
 * Detailed health check with service status
 * GET /api/health/detailed
 */
router.get('/detailed', async (req, res) => {
  const healthStatus = {
    success: true,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    services: {
      server: {
        status: 'healthy',
        message: 'Express server is running'
      },
      firebase: {
        status: 'unknown',
        message: 'Not tested'
      },
      googleOAuth: {
        status: 'unknown',
        message: 'Not tested'
      },
      environment: {
        status: 'unknown',
        message: 'Not tested'
      }
    }
  };

  // Test Firebase connection
  try {
    await admin.auth().listUsers(1);
    healthStatus.services.firebase = {
      status: 'healthy',
      message: 'Firebase Admin SDK is connected'
    };
  } catch (error) {
    healthStatus.services.firebase = {
      status: 'unhealthy',
      message: `Firebase connection failed: ${error.message}`,
      error: error.code || 'unknown'
    };
    healthStatus.success = false;
  }

  // Test Google OAuth configuration
  try {
    const authUrl = googleAuthService.getGoogleAuthUrl();
    if (authUrl && authUrl.includes('accounts.google.com')) {
      healthStatus.services.googleOAuth = {
        status: 'healthy',
        message: 'Google OAuth is configured correctly'
      };
    } else {
      healthStatus.services.googleOAuth = {
        status: 'unhealthy',
        message: 'Google OAuth URL generation failed'
      };
      healthStatus.success = false;
    }
  } catch (error) {
    healthStatus.services.googleOAuth = {
      status: 'unhealthy',
      message: `Google OAuth not configured: ${error.message}`,
      error: error.message
    };
    // Don't mark as failed if OAuth is just not configured
    if (!error.message.includes('not configured')) {
      healthStatus.success = false;
    }
  }

  // Test environment variables
  const requiredEnvVars = ['PORT'];
  const optionalEnvVars = ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET', 'FRONTEND_URL'];
  const missingRequired = requiredEnvVars.filter(v => !process.env[v]);
  const missingOptional = optionalEnvVars.filter(v => !process.env[v]);

  if (missingRequired.length > 0) {
    healthStatus.services.environment = {
      status: 'unhealthy',
      message: `Missing required environment variables: ${missingRequired.join(', ')}`,
      missing: missingRequired
    };
    healthStatus.success = false;
  } else {
    healthStatus.services.environment = {
      status: 'healthy',
      message: 'Required environment variables are set',
      missingOptional: missingOptional.length > 0 ? missingOptional : undefined
    };
  }

  const statusCode = healthStatus.success ? 200 : 503;
  res.status(statusCode).json(healthStatus);
});

/**
 * Test Firebase connection
 * GET /api/health/firebase
 */
router.get('/firebase', async (req, res) => {
  try {
    // Try to list users (limited to 1 for performance)
    const listUsersResult = await admin.auth().listUsers(1);
    
    res.status(200).json({
      success: true,
      message: 'Firebase Admin SDK is connected and working',
      timestamp: new Date().toISOString(),
      test: {
        canListUsers: true,
        userCount: listUsersResult.users.length
      }
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      message: 'Firebase connection failed',
      error: {
        code: error.code || 'unknown',
        message: error.message
      },
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Test Google OAuth configuration
 * GET /api/health/google-oauth
 */
router.get('/google-oauth', (req, res) => {
  try {
    const authUrl = googleAuthService.getGoogleAuthUrl();
    
    if (authUrl && authUrl.includes('accounts.google.com')) {
      res.status(200).json({
        success: true,
        message: 'Google OAuth is configured correctly',
        timestamp: new Date().toISOString(),
        test: {
          canGenerateAuthUrl: true,
          authUrlLength: authUrl.length,
          // Don't expose full URL for security, just confirm it exists
          authUrlPreview: authUrl.substring(0, 50) + '...'
        }
      });
    } else {
      res.status(503).json({
        success: false,
        message: 'Google OAuth URL generation failed',
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    res.status(503).json({
      success: false,
      message: 'Google OAuth not configured',
      error: {
        message: error.message
      },
      timestamp: new Date().toISOString(),
      note: 'This is expected if Google OAuth credentials are not set in .env'
    });
  }
});

/**
 * Test environment configuration
 * GET /api/health/environment
 */
router.get('/environment', (req, res) => {
  const requiredEnvVars = ['PORT'];
  const optionalEnvVars = [
    'GOOGLE_CLIENT_ID',
    'GOOGLE_CLIENT_SECRET',
    'GOOGLE_REDIRECT_URI',
    'FRONTEND_URL',
    'BACKEND_URL',
    'NODE_ENV'
  ];

  const envStatus = {
    required: {},
    optional: {},
    missingRequired: [],
    missingOptional: []
  };

  requiredEnvVars.forEach(v => {
    if (process.env[v]) {
      envStatus.required[v] = 'set';
    } else {
      envStatus.required[v] = 'missing';
      envStatus.missingRequired.push(v);
    }
  });

  optionalEnvVars.forEach(v => {
    if (process.env[v]) {
      envStatus.optional[v] = 'set';
    } else {
      envStatus.optional[v] = 'missing';
      envStatus.missingOptional.push(v);
    }
  });

  const isHealthy = envStatus.missingRequired.length === 0;

  res.status(isHealthy ? 200 : 503).json({
    success: isHealthy,
    message: isHealthy 
      ? 'All required environment variables are set'
      : 'Some required environment variables are missing',
    timestamp: new Date().toISOString(),
    environment: envStatus,
    note: 'Optional variables are recommended but not required'
  });
});

module.exports = router;

