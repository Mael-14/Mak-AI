const { db, admin } = require('../config/firebase');
const { generateRandomString } = require('../utils/uidManager');


const ACCOUNTS_COLLECTION = 'accounts';
const INITIAL_AI_TOKENS = 0;

/**
 * Generates a unique account identifier.
 * Uses a 20-character random alphanumeric string.
 * @returns {string} The generated account ID.
 */
const generateAccountId = () => {
    return generateRandomString(20);
}

/**
 * Creates a new financial account document for a user.
 * @param {string} user_id - The unique ID of the user owning this account.
 * @returns {Promise<Object>} The created account document object.
 * @throws {Error} If the Firestore write operation fails.
 */
const createAccountDocument = async (user_id) => {
    try {
        const uid = generateAccountId();
        const accountDoc = {
            uid,
            user_id: user_id,
            ai_tokens: INITIAL_AI_TOKENS,
            cumulative_balance: 0,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        };

        await db.collection(ACCOUNTS_COLLECTION).doc(uid).set(accountDoc);

        return accountDoc;
    } catch (error) {
        console.error('Error creating account document:', error);
        throw error;
    }
}

/**
 * Retrieves an account document by its unique ID (uid).
 * @param {string} uid - The account's unique identifier.
 * @returns {Promise<Object|null>} The account data including ID, or null if not found.
 * @throws {Error} If the Firestore read operation fails.
 */
const getAccountDocument = async (uid) => {
    try {
        const accountDoc = await db.collection(ACCOUNTS_COLLECTION).doc(uid).get();

        if (!accountDoc.exists) {
            return null;
        }

        return {
            id: accountDoc.id,
            ...accountDoc.data()
        };
    } catch (error) {
        console.error(`Error fetching account document ${uid}:`, error);
        throw error;
    }
}

/**
 * Retrieves an account document by user ID.
 * @param {string} user_id - The user's unique identifier.
 * @returns {Promise<Object|null>} The account data, or null if not found.
 * @throws {Error} If the Firestore read operation fails.
 */
const getAccountDocumentByUserId = async (user_id) => {
    try {
        const accountDoc = await db.collection(ACCOUNTS_COLLECTION).where('user_id', '==', user_id).get();
        if (accountDoc.empty) {
            return null;
        }
        return {
            uid: accountDoc.docs[0].id,
            ...accountDoc.docs[0].data()
            /*account data:
            uid: string,
            user_id: string,
            ai_tokens: number,
            cumulative_balance: number,
            createdAt: Timestamp,
            updatedAt: Timestamp
            */
        };
    } catch (error) {
        console.error('Error getting account document by user ID:', error);
        throw error;
    }
}

/**
 * Updates an existing account document with partial data.
 * @param {string} uid - The account's unique identifier.
 * @param {Object} updates - The fields to update.
 * @returns {Promise<Object>} The updated account document.
 * @throws {Error} If the document is not found or update fails.
 */
const updateAccountDocument = async (uid, updates) => {
    try {
        const updateData = {
            ...updates,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        };

        await db.collection(ACCOUNTS_COLLECTION).doc(uid).update(updateData);

        // Fetch and return the fresh document
        const updatedDoc = await getAccountDocument(uid);
        return updatedDoc;
    } catch (error) {
        if (error.code === 'not-found' || error.message.includes('NOT_FOUND')) {
            throw new Error(`Account document with UID ${uid} not found`);
        }
        console.error(`Error updating account document ${uid}:`, error);
        throw error;
    }
}

module.exports = {
    createAccountDocument,
    getAccountDocument,
    getAccountDocumentByUserId,
    updateAccountDocument
}