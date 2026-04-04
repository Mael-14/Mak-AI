const { db, admin } = require('../config/firebase');
const { generateUUID } = require('../utils/uidManager');
const axios = require('axios');
const { PAWAPAY_DEPOSIT_URL,
    PAWAPAY_TRANSACTION_STATUS,
    PAWAPAY_TRANSACTION_TYPE,
    PAWAPAY_TRANSACTION_CANAL,
    PAWAPAY_TRANSACTION_CURRENCY,
    PAWAPAY_TRANSACTION_COUNTRY } = require('../config/pawapayConfig');

const PAWAPAY_API_KEY = process.env.PAWAPAY_API_KEY || '';


const TRANSACTIONS_COLLECTION = 'transactions';
const TransactionType = PAWAPAY_TRANSACTION_TYPE;
const TransactionCanal = PAWAPAY_TRANSACTION_CANAL;
const trasactionCurrency = PAWAPAY_TRANSACTION_CURRENCY;
const transactionStatus = PAWAPAY_TRANSACTION_STATUS.PROCESSING;
const transactionCountry = PAWAPAY_TRANSACTION_COUNTRY;

const generateTransactionId = () => {
    return generateUUID();
}

/**
 * Create a deposit transaction document
 * @param {Object} transactionData - Transaction data
 * @returns {Promise<Object>} The created deposit transaction document
 * @throws {Error} If the Firestore write operation fails
 */
const createDepositTransactionDocument = async (transactionData) => {
    /*
    transactionData = {
        user_id: string,
        account_id: string,
        amount: number,
        phone_number: string,
        provider: string,
    }
    */
    try {
        const uid = generateTransactionId();
        const transactionDoc = {
            deposit_id: uid,
            user_id: transactionData.user_id,
            account_id: transactionData.account_id,
            amount: transactionData.amount,
            phone_number: transactionData.phone_number,
            provider: transactionData.provider,
            type: TransactionType,
            canal: TransactionCanal,
            currency: trasactionCurrency,
            status: transactionStatus,
            country: transactionCountry,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        };

        await db.collection(TRANSACTIONS_COLLECTION).doc(uid).set(transactionDoc);

        return transactionDoc;
    } catch (error) {
        return null;
    }
}

const createPawapayDepositTransaction = async (transactionData) => {
    /*
    This function is used to create a pawapay deposit transaction document via pawapay API by calling the pawapay API endpoint for deposit.
    @param {Object} transactionData - Transaction data
    @returns {Promise<Object>} The created pawapay deposit transaction document
    @throws {Error} If the Pawapay API call fails

    transactionData = {
        deposit_id: string,
        amount: number,
        currency: string,
        canal: string,
        phone_number: string,
        provider: string,
    }
    */
    try {
        const transactionDoc = {
            depositId: transactionData.deposit_id,
            amount: String(transactionData.amount),
            currency: transactionData.currency,
            payer: {
                type: 'MMO',
                accountDetails: {
                    phoneNumber: transactionData.phone_number.replace(/\D/g, ''), // Strip all non-digit characters (including +)
                    provider: transactionData.provider,
                }
            }
        }

        console.log('📝 [PAWAPAY] Request Payload:', JSON.stringify(transactionDoc, null, 2));
        const response = await axios.post(PAWAPAY_DEPOSIT_URL, transactionDoc, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${PAWAPAY_API_KEY}`,
            },
        });
        console.log('🛰️ [PAWAPAY] API Response:', response.data);
        if (response.data.status === 'ACCEPTED') {
            return true;
        } else {
            return false;
        }
    } catch (error) {
        if (error.response) {
            console.error('❌ PawaPay API Rejection:', {
                status: error.response.status,
                data: error.response.data
            });
        } else {
            console.error('❌ PawaPay Network Error:', error.message);
        }
        return null;
    }
}

module.exports = {
    TRANSACTIONS_COLLECTION,
    createDepositTransactionDocument,
    createPawapayDepositTransaction
}