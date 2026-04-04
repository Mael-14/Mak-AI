const authService = require('../services/firebase/authService');
const { responseFormatter } = require('../utils/responseFormatter');

/**
 * Middleware to verify Firebase ID token
 * Expects Authorization header: Bearer <idToken>
 */
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    console.log('🛡️ [AUTH] Incoming request to:', req.path);
    console.log('🔑 [AUTH] Authorization header:', authHeader ? 'Found (Bearer ...)' : 'MISSING ❌');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json(
        responseFormatter.error('Authorization token required', 401)
      );
    }

    const idToken = authHeader.split('Bearer ')[1];

    if (!idToken) {
      return res.status(401).json(
        responseFormatter.error('Invalid authorization token format', 401)
      );
    }

    // Verify the token
    const decodedToken = await authService.verifyIdToken(idToken);

    // Attach user info to request object
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      emailVerified: decodedToken.email_verified
    };

    next();
  } catch (error) {
    if (error.code === 'auth/id-token-expired') {
      return res.status(401).json(
        responseFormatter.error('Token expired. Please login again', 401)
      );
    }
    if (error.code === 'auth/id-token-revoked' || error.code === 'auth/invalid-id-token') {
      return res.status(401).json(
        responseFormatter.error('Invalid or revoked token', 401)
      );
    }

    return res.status(401).json(
      responseFormatter.error('Authentication failed', 401)
    );
  }
};

module.exports = {
  authenticateToken
};

