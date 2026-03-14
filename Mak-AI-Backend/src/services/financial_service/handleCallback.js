const { searchTransactionByDepositId, updateTransactionStatus } = require('./setTransactStatus');
const { PAWAPAY_TRANSACTION_STATUS } = require('../../config/pawapayConfig');
const { responseFormatter } = require('../../utils/responseFormatter');

const handleDepositCallback = async (req) => {
    try {
        const deposit_callback = req.body;
        const deposit_id = deposit_callback.data.depositId;
        const status = deposit_callback.data.status;
        const transaction = await searchTransactionByDepositId(deposit_id);
        if (status === PAWAPAY_TRANSACTION_STATUS.COMPLETED || status === PAWAPAY_TRANSACTION_STATUS.FAILED) {
            updateTransactionStatus(transaction.deposit_id, status.toUpperCase());
        } else {
            return false; //TODO: add notification to admin (email, sms or whatsapp)
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