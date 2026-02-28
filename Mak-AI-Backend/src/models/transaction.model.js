const { db, admin } = require('../config/firebase');
const { generateUUID } = require('../utils/uidManager');
const axios = require('axios');
const { PAWAPAY_DEPOSIT_URL } = require('../config/pawapayConfig');
const PAWAPAY_API_KEY = process.env.PAWAPAY_API_KEY || '';


const TRANSACTIONS_COLLECTION = 'transactions';
const TransactionType = 'Deposit';
const TransactionCanal = 'MMO';
const trasactionCurrency = 'XAF';
const transactionStatus = 'Pending';
const transactionCountry = 'CMR';

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
        const accountDetails = {
            phoneNumber: transactionData.phone_number,
            provider: transactionData.provider,
        }
        const payer = {
            type: transactionData.canal,
            accountDetails: accountDetails,
        }
        const transactionDoc = {
            depositId: transactionData.deposit_id,
            amount: String(transactionData.amount),
            currency: transactionData.currency,
            payer: payer,
        }

        /**transaction for pawapay:
        transactionDoc = {
            depositId: string,
            amount: string,
            currency: string,
            payer: {
                type: string,
                accountDetails: {
                    phoneNumber: string,
                    provider: string,
                },
            },
        }
        */

        const response = await axios.post(PAWAPAY_DEPOSIT_URL, transactionDoc, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${PAWAPAY_API_KEY}`,
            },
        });
        if (response.data.status === 'ACCEPTED') {
            return true;
        } else {
            return false;
        }
    } catch (error) {
        return null;
    }
}

module.exports = {
    createDepositTransactionDocument,
    createPawapayDepositTransaction
}