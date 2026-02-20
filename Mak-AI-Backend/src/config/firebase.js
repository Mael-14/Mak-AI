const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

// Initialize Firebase Admin SDK
// serviceAccountKey.json file should be in the backend root directory

let serviceAccount;

try {
    // Try to load from environment variable (for production/cloud deployment)
    const envKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    if (envKey && envKey.trim() !== '') {
        try {
            serviceAccount = JSON.parse(envKey);
            console.log('✓ Firebase service account loaded from environment variable');
        } catch (parseError) {
            console.warn('⚠ Warning: FIREBASE_SERVICE_ACCOUNT_KEY is set but invalid JSON.');
            console.warn('Falling back to serviceAccountKey.json file...');
            // Fall through to file loading
            serviceAccount = null;
        }
    }

    // Load from file if env variable not set or invalid
    if (!serviceAccount) {
        // Try to load from local file (for development)
        // Resolve path relative to this file: src/config/firebase.js -> root/serviceAccountKey.json
        const serviceAccountPath = path.join(__dirname, '../../serviceAccountKey.json');

        // Check if file exists
        if (!fs.existsSync(serviceAccountPath)) {
            throw new Error(
                `Service account key file not found at: ${serviceAccountPath}\n` +
                'Please either:\n' +
                '1. Place serviceAccountKey.json in the backend root directory, or\n' +
                '2. Set FIREBASE_SERVICE_ACCOUNT_KEY environment variable'
            );
        }

        // Read and parse the JSON file
        const serviceAccountData = fs.readFileSync(serviceAccountPath, 'utf8');
        serviceAccount = JSON.parse(serviceAccountData);
        console.log('✓ Firebase service account loaded from file');
    }
} catch (error) {
    console.error('\n❌ Error loading Firebase service account:');
    console.error(error.message);
    console.error('\nTo fix this:');
    console.error('1. Download serviceAccountKey.json from Firebase Console');
    console.error('   (Project Settings > Service Accounts > Generate new private key)');
    console.error('2. Place it in: Mak-AI-Backend/serviceAccountKey.json');
    console.error('3. Or set FIREBASE_SERVICE_ACCOUNT_KEY environment variable\n');
    throw new Error('Firebase configuration is required');
}

// Initialize Firebase Admin if not already initialized
if (admin.apps.length === 0) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: process.env.FIREBASE_DATABASE_URL || `https://${serviceAccount.project_id}.firebaseio.com`
    });
    console.log('✓ Firebase Admin SDK initialized successfully');
} else {
    console.log('✓ Firebase Admin SDK already initialized');
}

const db = admin.firestore();
const auth = admin.auth();

module.exports = {
    admin,
    db,
    auth
};