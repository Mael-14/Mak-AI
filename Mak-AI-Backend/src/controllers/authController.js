const authService = require('../services/firebase/authService');
const userModel = require('../models/User.model');
const { responseFormatter } = require('../utils/responseFormatter');
const googleAuthService = require('../services/google/googleAuthService');

/**
 * Sign up a new user
 * POST /api/auth/signup
 * Body: { idToken, name, email }
 * Note: User is already created in Firebase Auth by frontend
 * This endpoint creates the Firestore document
 */
const signup = async (req, res, next) => {
  try {
    const { idToken, name, email } = req.body;

    // Validate required fields
    if (!idToken || typeof idToken !== 'string') {
      return res.status(400).json(
        responseFormatter.error('Valid ID token is required', 400)
      );
    }

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json(
        responseFormatter.error('Valid name is required', 400)
      );
    }

    if (!email || typeof email !== 'string' || email.trim().length === 0) {
      return res.status(400).json(
        responseFormatter.error('Valid email is required', 400)
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json(
        responseFormatter.error('Invalid email format', 400)
      );
    }

    // Verify the ID token to get user info
    let decodedToken;
    try {
      decodedToken = await authService.verifyIdToken(idToken);
    } catch (tokenError) {
      if (tokenError.code === 'auth/id-token-expired') {
        return res.status(401).json(
          responseFormatter.error('Token expired. Please try again.', 401)
        );
      }
      if (tokenError.code === 'auth/invalid-id-token') {
        return res.status(401).json(
          responseFormatter.error('Invalid token. Please try again.', 401)
        );
      }
      throw tokenError;
    }

    const uid = decodedToken.uid;
    const tokenEmail = decodedToken.email;

    // Verify email matches token
    if (tokenEmail !== email) {
      return res.status(400).json(
        responseFormatter.error('Email does not match authenticated user', 400)
      );
    }

    // Check if user document already exists in Firestore
    const existingUser = await userModel.getUserDocument(uid);
    if (existingUser) {
      return res.status(409).json(
        responseFormatter.error('User document already exists', 409)
      );
    }

    // Create user document in Firestore
    const userDoc = await userModel.createUserDocument(uid, {
      email: email,
      name: name,
      displayName: name,
      emailVerified: decodedToken.email_verified || false
    });

    // Return success response
    res.status(201).json(
      responseFormatter.success({
        uid: uid,
        email: email,
        name: name,
        emailVerified: decodedToken.email_verified || false,
        createdAt: userDoc.createdAt
      }, 'User document created successfully in Firestore', 201)
    );
  } catch (error) {
    // Handle Firestore errors
    if (error.code === 'permission-denied') {
      return res.status(403).json(
        responseFormatter.error('Permission denied. Please check Firestore rules.', 403)
      );
    }

    next(error);
  }
};

/**
 * Login user (verify credentials and return user info)
 * POST /api/auth/login
 * Body: { email, password }
 * Note: In a real implementation, the client should use Firebase Auth SDK
 * to sign in and send the ID token to verify. This endpoint can verify the token.
 */
const login = async (req, res, next) => {
  try {
    const { email, password, idToken } = req.body;

    // If idToken is provided, verify it (recommended approach)
    if (idToken) {
      try {
        const decodedToken = await authService.verifyIdToken(idToken);
        const userDoc = await userModel.getUserDocument(decodedToken.uid);

        if (!userDoc) {
          // Create user document if it doesn't exist (for existing Firebase Auth users)
          await userModel.createUserDocument(decodedToken.uid, {
            email: decodedToken.email,
            name: decodedToken.name || decodedToken.email.split('@')[0]
          });
        }

        return res.status(200).json(
          responseFormatter.success({
            uid: decodedToken.uid,
            email: decodedToken.email,
            name: decodedToken.name || userDoc?.name,
            emailVerified: decodedToken.email_verified
          }, 'Login successful', 200)
        );
      } catch (error) {
        if (error.code === 'auth/id-token-expired') {
          return res.status(401).json(
            responseFormatter.error('Token expired. Please login again', 401)
          );
        }
        if (error.code === 'auth/id-token-revoked' || error.code === 'auth/invalid-id-token') {
          return res.status(401).json(
            responseFormatter.error('Invalid token', 401)
          );
        }
        throw error;
      }
    }

    // Fallback: Verify email exists (password verification happens on client)
    if (!email) {
      return res.status(400).json(
        responseFormatter.error('Email or idToken is required', 400)
      );
    }

    try {
      const userRecord = await authService.getUserByEmail(email);
      const userDoc = await userModel.getUserDocument(userRecord.uid);

      return res.status(200).json(
        responseFormatter.success({
          uid: userRecord.uid,
          email: userRecord.email,
          name: userRecord.displayName || userDoc?.name,
          emailVerified: userRecord.emailVerified
        }, 'User found. Please verify password on client side', 200)
      );
    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        return res.status(404).json(
          responseFormatter.error('User not found', 404)
        );
      }
      throw error;
    }
  } catch (error) {
    next(error);
  }
};

/**
 * Get current user profile
 * GET /api/auth/me
 * Requires: Authorization header with Bearer token (idToken)
 */
const getCurrentUser = async (req, res, next) => {
  try {
    const uid = req.user.uid;
    
    const userRecord = await authService.getUserByUid(uid);
    const userDoc = await userModel.getUserDocument(uid);

    res.status(200).json(
      responseFormatter.success({
        uid: userRecord.uid,
        email: userRecord.email,
        name: userRecord.displayName || userDoc?.name,
        emailVerified: userRecord.emailVerified,
        createdAt: userDoc?.createdAt,
        updatedAt: userDoc?.updatedAt
      }, 'User profile retrieved successfully', 200)
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Send password reset email
 * POST /api/auth/forgot-password
 * Body: { email }
 */
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json(
        responseFormatter.error('Email is required', 400)
      );
    }

    try {
      const resetData = await authService.sendPasswordResetEmail(email);
      
      // In production, you would send the reset link via email service
      // For now, we'll return it (remove this in production)
      res.status(200).json(
        responseFormatter.success({
          message: 'Password reset link generated',
          // Remove resetLink in production - send via email instead
          resetLink: process.env.NODE_ENV === 'development' ? resetData.resetLink : undefined
        }, 'Password reset email sent', 200)
      );
    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        return res.status(404).json(
          responseFormatter.error('User not found', 404)
        );
      }
      throw error;
    }
  } catch (error) {
    next(error);
  }
};

/**
 * Update user profile
 * PUT /api/auth/profile
 * Requires: Authorization header with Bearer token
 * Body: { name, ...other fields }
 */
const updateProfile = async (req, res, next) => {
  try {
    const uid = req.user.uid;
    const updates = req.body;

    // Remove fields that shouldn't be updated directly
    delete updates.uid;
    delete updates.email;
    delete updates.createdAt;

    // Update Firebase Auth profile
    const authUpdates = {};
    if (updates.name) {
      authUpdates.displayName = updates.name;
    }

    if (Object.keys(authUpdates).length > 0) {
      await authService.updateUserProfile(uid, authUpdates);
    }

    // Update Firestore document
    const updatedDoc = await userModel.updateUserDocument(uid, updates);

    res.status(200).json(
      responseFormatter.success(updatedDoc, 'Profile updated successfully', 200)
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get Google OAuth URL
 * GET /api/auth/google
 * @returns {Object} Google OAuth authorization URL
 */
const getGoogleAuthUrl = async (req, res, next) => {
  try {
    const authUrl = googleAuthService.getGoogleAuthUrl();
    
    res.status(200).json(
      responseFormatter.success({
        authUrl: authUrl
      }, 'Google OAuth URL generated', 200)
    );
  } catch (error) {
    if (error.message.includes('not configured')) {
      return res.status(500).json(
        responseFormatter.error('Google OAuth not configured. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env', 500)
      );
    }
    next(error);
  }
};

/**
 * Handle Google OAuth callback
 * GET /api/auth/google/callback
 * Query: { code } - Authorization code from Google
 */
const handleGoogleCallback = async (req, res, next) => {
  try {
    const { code } = req.query;

    if (!code) {
      return res.status(400).json(
        responseFormatter.error('Authorization code is required', 400)
      );
    }

    // Exchange code for user info
    const googleUserInfo = await googleAuthService.handleGoogleCallback(code);

    // Create or get Firebase user
    const { userRecord, customToken, firestoreDoc } = await googleAuthService.createFirebaseUserFromGoogle(googleUserInfo);

    // Redirect to frontend with custom token
    // Frontend will use this custom token to sign in to Firebase
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:19006';
    const redirectUrl = `${frontendUrl}/auth/google/callback?token=${encodeURIComponent(customToken)}&uid=${userRecord.uid}`;
    
    res.redirect(redirectUrl);
  } catch (error) {
    if (error.message.includes('invalid_grant')) {
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:19006';
      return res.redirect(`${frontendUrl}/auth/google/callback?error=invalid_code`);
    }
    next(error);
  }
};

module.exports = {
  signup,
  login,
  getCurrentUser,
  forgotPassword,
  updateProfile,
  getGoogleAuthUrl,
  handleGoogleCallback
};

