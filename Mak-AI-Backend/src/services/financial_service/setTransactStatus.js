const { db } = require('../../config/firebase');
const { TRANSACTIONS_COLLECTION } = require('../../models/transaction.model');

const updateTransactionStatus = async (transactionId, status) => {
    try {
        const transactionDoc = await db.collection(TRANSACTIONS_COLLECTION).doc(transactionId).get();
        if (!transactionDoc.exists) {
            return null;
        }
        const transactionData = transactionDoc.data();
        if (transactionData.status === status) {
            return true;
        }
        transactionData.status = status;
        await transactionDoc.ref.update(transactionData);
        return true;
    } catch (error) {
        console.error('Error setting transaction status:', error);
        return false;
    }
}

const searchTransactionByDepositId = async (depositId) => {
    try {
        const transactionDoc = await db.collection(TRANSACTIONS_COLLECTION).where('deposit_id', '==', depositId).get();
        if (transactionDoc.empty) {
            return null;
        }
        return transactionDoc.docs[0].data();
    } catch (error) {
        console.error('Error searching transaction by deposit id:', error);
        return null;
    }
}

module.exports = {
    updateTransactionStatus,
    searchTransactionByDepositId
}