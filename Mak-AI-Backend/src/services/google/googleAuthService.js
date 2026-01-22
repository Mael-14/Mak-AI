const { OAuth2Client } = require('google-auth-library');
const authService = require('../firebase/authService');
const userModel = require('../../models/User.model');

// Initialize Google OAuth2 Client
const getGoogleOAuthClient = () => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  // Backend callback URL - Google will redirect here with authorization code
  const redirectUri = process.env.GOOGLE_REDIRECT_URI || `${process.env.BACKEND_URL || 'http://192.168.1.192:5000'}/api/auth/google/callback`;

  if (!clientId || !clientSecret) {
    throw new Error('Google OAuth credentials not configured. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env');
  }

  return new OAuth2Client(
    clientId,
    clientSecret,
    redirectUri
  );
};

/**
 * Generate Google OAuth authorization URL
 * @returns {string} Authorization URL
 */
const getGoogleAuthUrl = () => {
  try {
    const oauth2Client = getGoogleOAuthClient();
    
    const scopes = [
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile',
      'openid'
    ];

    const url = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      prompt: 'select_account', // Force account selection
    });

    return url;
  } catch (error) {
    throw error;
  }
};

/**
 * Exchange authorization code for tokens and get user info
 * @param {string} code - Authorization code from Google
 * @returns {Promise<Object>} User information and tokens
 */
const handleGoogleCallback = async (code) => {
  try {
    const oauth2Client = getGoogleOAuthClient();
    
    // Exchange code for tokens
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // Get user info from Google
    const ticket = await oauth2Client.verifyIdToken({
      idToken: tokens.id_token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    
    return {
      email: payload.email,
      name: payload.name,
      picture: payload.picture,
      emailVerified: payload.email_verified,
      googleId: payload.sub,
      idToken: tokens.id_token,
      accessToken: tokens.access_token,
    };
  } catch (error) {
    throw error;
  }
};

/**
 * Create or get Firebase user from Google authentication
 * @param {Object} googleUserInfo - User info from Google
 * @returns {Promise<Object>} Firebase user record and custom token
 */
const createFirebaseUserFromGoogle = async (googleUserInfo) => {
  try {
    const { email, name, picture, emailVerified, googleId } = googleUserInfo;

    // Check if user already exists
    let userRecord;
    try {
      userRecord = await authService.getUserByEmail(email);
      
      // User exists, update if needed
      if (!userRecord.displayName && name) {
        await authService.updateUserProfile(userRecord.uid, {
          displayName: name,
          photoURL: picture,
          emailVerified: emailVerified
        });
        userRecord = await authService.getUserByUid(userRecord.uid);
      }
    } catch (error) {
      // User doesn't exist, create new one
      if (error.code === 'auth/user-not-found') {
        // Create user in Firebase Auth without password (OAuth user)
        const { admin } = require('../../config/firebase');
        userRecord = await admin.auth().createUser({
          email: email,
          displayName: name,
          photoURL: picture,
          emailVerified: emailVerified,
          disabled: false
        });
        
        // Get updated user record
        userRecord = await authService.getUserByUid(userRecord.uid);
      } else {
        throw error;
      }
    }

    // Create or update Firestore document
    const existingUserDoc = await userModel.getUserDocument(userRecord.uid);
    if (!existingUserDoc) {
      await userModel.createUserDocument(userRecord.uid, {
        email: email,
        name: name,
        displayName: name,
        photoURL: picture,
        emailVerified: emailVerified,
        googleId: googleId,
        provider: 'google'
      });
    } else {
      // Update existing document
      await userModel.updateUserDocument(userRecord.uid, {
        name: name,
        displayName: name,
        photoURL: picture,
        emailVerified: emailVerified,
        googleId: googleId,
        provider: 'google'
      });
    }

    // Generate custom token for frontend
    const { admin } = require('../../config/firebase');
    const customToken = await admin.auth().createCustomToken(userRecord.uid);

    return {
      userRecord,
      customToken,
      firestoreDoc: await userModel.getUserDocument(userRecord.uid)
    };
  } catch (error) {
    throw error;
  }
};

module.exports = {
  getGoogleAuthUrl,
  handleGoogleCallback,
  createFirebaseUserFromGoogle
};

