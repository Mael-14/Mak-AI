const admin = require('firebase-admin');
require('dotenv').config();

// Initialize Firebase Admin SDK
// Make sure to set FIREBASE_SERVICE_ACCOUNT_KEY as environment variable
// or create a serviceAccountKey.json file in the config directory

let serviceAccount;

try {
  // Try to load from environment variable (for production/cloud deployment)
  if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
  } else {
    // Try to load from local file (for development)
    serviceAccount = require('../../serviceAccountKey.json');
  }
} catch (error) {
  console.error('Error loading Firebase service account:', error.message);
  console.error('Please set FIREBASE_SERVICE_ACCOUNT_KEY environment variable or add serviceAccountKey.json file');
  throw new Error('Firebase configuration is required');
}

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: process.env.FIREBASE_DATABASE_URL || `https://${serviceAccount.project_id}.firebaseio.com`
  });
}

const db = admin.firestore();
const auth = admin.auth();

module.exports = {
  admin,
  db,
  auth
};

