const { responseFormatter } = require('../utils/responseFormatter');

/**
 * Global error handler middleware
 */
const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  // Firebase Auth errors
  if (err.code && err.code.startsWith('auth/')) {
    const statusCode = err.code === 'auth/user-not-found' ? 404 :
                      err.code === 'auth/email-already-exists' ? 409 :
                      err.code === 'auth/invalid-email' ? 400 :
                      err.code === 'auth/weak-password' ? 400 : 400;

    return res.status(statusCode).json(
      responseFormatter.error(err.message || 'Authentication error', statusCode)
    );
  }

  // Firestore errors
  if (err.code && err.code.startsWith('firestore/')) {
    return res.status(500).json(
      responseFormatter.error('Database error', 500)
    );
  }

  // Validation errors
  if (err.name === 'ValidationError') {
    return res.status(400).json(
      responseFormatter.error(err.message, 400, err.errors)
    );
  }

  // Default error
  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || 'Internal server error';

  res.status(statusCode).json(
    responseFormatter.error(message, statusCode)
  );
};

module.exports = errorHandler;

