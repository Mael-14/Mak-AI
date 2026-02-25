const { db, admin } = require('../config/firebase');
const { generateUUID } = require('../utils/uidManager');


const TRANSACTIONS_COLLECTION = 'transactions';
const TransactionType = 'Deposit';
const TransactionCanal = 'MMO';
const trasactionCurrency = 'XAF';
const transactionStatus = 'Pending';
const transactionCountry = 'CMR';

const generateTransactionId = () => {
    return generateUUID();
}

const createTransactionDocument = async (transactionData) => {
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
            uid,
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
        throw error;
    }
}

module.exports = {
    createTransactionDocument
}