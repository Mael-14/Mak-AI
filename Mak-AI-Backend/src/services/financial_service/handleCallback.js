const { searchTransactionByDepositId, updateTransactionStatus } = require('./setTransactStatus');
const { PAWAPAY_TRANSACTION_STATUS } = require('../../config/pawapayConfig');
const { responseFormatter } = require('../../utils/responseFormatter');

const handleDepositCallback = async (req) => {
    try {
        const payload = req.body;
        console.log('🔄 [CALLBACK] Incoming from PawaPay:', JSON.stringify(payload, null, 2));

        // PawaPay webhooks are flat, but some tests might wrap them in { data: { ... } }
        const data = payload.data || payload; 
        const deposit_id = data.depositId;
        const status = data.status;

        console.log(`📍 [CALLBACK] Transaction ID: ${deposit_id}, Status: ${status}`);
        
        if (!deposit_id) {
            console.error('❌ [CALLBACK] Error: Missing depositId in payload');
            return false;
        }

        const transaction = await searchTransactionByDepositId(deposit_id);
        if (!transaction) {
            console.error(`❌ [CALLBACK] Transaction NOT found for ID: ${deposit_id}`);
            return false;
        }

        if (status === PAWAPAY_TRANSACTION_STATUS.COMPLETED || status === PAWAPAY_TRANSACTION_STATUS.FAILED) {
            await updateTransactionStatus(transaction.deposit_id, status.toUpperCase());
            console.log(`✅ [CALLBACK] Transaction ${deposit_id} updated to ${status}`);
        } else {
            console.log(`ℹ️ [CALLBACK] Transaction ${deposit_id} status ${status} ignored`);
            return false;
        }
        return true;
    } catch (error) {
        console.error('Error handling callback:', error);
        return false; //TODO: add notification to admin (email, sms or whatsapp)
    }
}

module.exports = {
    handleDepositCallback
}