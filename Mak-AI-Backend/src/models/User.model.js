const { db, admin } = require('../config/firebase');


const USERS_COLLECTION = 'users';

/**
 * Create user document in Firestore
 * @param {string} uid - Firebase Auth UID
 * @param {Object} userData - User data to store
 * @returns {Promise<Object>} Created user document
 */
const createUserDocument = async (uid, userData) => {
  try {
    const userDoc = {
      uid,
      email: userData.email,
      name: userData.name || userData.displayName,
      account_id: userData.account_id,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      emailVerified: false,
      ...userData
    };

    await db.collection(USERS_COLLECTION).doc(uid).set(userDoc);

    return userDoc;
  } catch (error) {
    throw error;
  }
};

/**
 * Get user document from Firestore
 * @param {string} uid - User UID
 * @returns {Promise<Object|null>} User document or null
 */
const getUserDocument = async (uid) => {
  try {
    const userDoc = await db.collection(USERS_COLLECTION).doc(uid).get();

    if (!userDoc.exists) {
      return null;
    }

    return {
      id: userDoc.id,
      ...userDoc.data()
    };
  } catch (error) {
    throw error;
  }
};

/**
 * Get user document by email
 * @param {string} email - User email
 * @returns {Promise<Object|null>} User document or null
 */
const getUserDocumentByEmail = async (email) => {
  try {
    const usersRef = db.collection(USERS_COLLECTION);
    const snapshot = await usersRef.where('email', '==', email).limit(1).get();

    if (snapshot.empty) {
      return null;
    }

    const userDoc = snapshot.docs[0];
    return {
      id: userDoc.id,
      ...userDoc.data()
    };
  } catch (error) {
    throw error;
  }
};

/**
 * Update user document in Firestore
 * @param {string} uid - User UID
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} Updated user document
 */
const updateUserDocument = async (uid, updates) => {
  try {
    const updateData = {
      ...updates,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    await db.collection(USERS_COLLECTION).doc(uid).update(updateData);

    const updatedDoc = await getUserDocument(uid);
    return updatedDoc;
  } catch (error) {
    if (error.code === 'not-found') {
      throw new Error(`User document with UID ${uid} not found`);
    }
    throw error;
  }
};

/**
 * Delete user document from Firestore
 * @param {string} uid - User UID
 * @returns {Promise<void>}
 */
const deleteUserDocument = async (uid) => {
  try {
    await db.collection(USERS_COLLECTION).doc(uid).delete();
  } catch (error) {
    throw error;
  }
};

module.exports = {
  createUserDocument,
  getUserDocument,
  getUserDocumentByEmail,
  updateUserDocument,
  deleteUserDocument
};

