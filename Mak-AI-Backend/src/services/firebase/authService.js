const { auth, db } = require('../../config/firebase');

/**
 * Create a new user with email and password
 * @param {string} email - User email
 * @param {string} password - User password
 * @param {string} name - User display name
 * @returns {Promise<Object>} User record with uid
 */
const createUser = async (email, password, name) => {
  try {
    // Create user in Firebase Authentication
    const userRecord = await auth.createUser({
      email: email,
      password: password,
      displayName: name,
      emailVerified: false
    });

    return userRecord;
  } catch (error) {
    throw error;
  }
};

/**
 * Verify user credentials and get user record
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Promise<Object>} User record
 */
const verifyUserCredentials = async (email, password) => {
  try {
    // Get user by email
    const userRecord = await auth.getUserByEmail(email);
    
    // Note: Firebase Admin SDK doesn't verify passwords directly
    // Password verification happens on the client side with Firebase Auth SDK
    // For backend verification, we'll use a custom token approach or
    // verify the ID token sent from the client
    
    return userRecord;
  } catch (error) {
    throw error;
  }
};

/**
 * Verify Firebase ID token from client
 * @param {string} idToken - Firebase ID token from client
 * @returns {Promise<Object>} Decoded token with user info
 */
const verifyIdToken = async (idToken) => {
  try {
    const decodedToken = await auth.verifyIdToken(idToken);
    return decodedToken;
  } catch (error) {
    throw error;
  }
};

/**
 * Get user by email
 * @param {string} email - User email
 * @returns {Promise<Object>} User record
 */
const getUserByEmail = async (email) => {
  try {
    const userRecord = await auth.getUserByEmail(email);
    return userRecord;
  } catch (error) {
    throw error;
  }
};

/**
 * Get user by UID
 * @param {string} uid - User UID
 * @returns {Promise<Object>} User record
 */
const getUserByUid = async (uid) => {
  try {
    const userRecord = await auth.getUser(uid);
    return userRecord;
  } catch (error) {
    throw error;
  }
};

/**
 * Send password reset email
 * @param {string} email - User email
 * @returns {Promise<void>}
 */
const sendPasswordResetEmail = async (email) => {
  try {
    // Note: Password reset emails are typically sent from the client side
    // using Firebase Auth SDK. However, we can generate a password reset link
    // using Admin SDK for custom email handling
    const userRecord = await auth.getUserByEmail(email);
    
    // Generate password reset link
    const resetLink = await auth.generatePasswordResetLink(email);
    
    return {
      resetLink,
      email: userRecord.email
    };
  } catch (error) {
    throw error;
  }
};

/**
 * Update user profile
 * @param {string} uid - User UID
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} Updated user record
 */
const updateUserProfile = async (uid, updates) => {
  try {
    const userRecord = await auth.updateUser(uid, updates);
    return userRecord;
  } catch (error) {
    throw error;
  }
};

/**
 * Delete user account
 * @param {string} uid - User UID
 * @returns {Promise<void>}
 */
const deleteUser = async (uid) => {
  try {
    await auth.deleteUser(uid);
  } catch (error) {
    throw error;
  }
};

module.exports = {
  createUser,
  verifyUserCredentials,
  verifyIdToken,
  getUserByEmail,
  getUserByUid,
  sendPasswordResetEmail,
  updateUserProfile,
  deleteUser
};

