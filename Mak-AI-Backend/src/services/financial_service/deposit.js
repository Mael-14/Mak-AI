const userModel = require('../../models/User.model');
const accountModel = require('../../models/account.model');
const { responseFormatter } = require('../../utils/responseFormatter');
const { createPawapayDepositTransaction, createDepositTransactionDocument } = require('../../models/transaction.model');

const createDepositTransaction = async (req, res, next) => {
    const { amount, user_id, phone_number, provider } = req.body;
    try {
        // Get account id from user document
        const account_id = await userModel.getUserSpecificDataByUserId('account_id', user_id);
        if (!account_id) {
            return res.status(404).json(responseFormatter.error('Account not found', 404));
        }
       //create deposit transaction document
       const deposit_transaction = await createDepositTransactionDocument({
        user_id: user_id,
        account_id: account_id,
        amount: amount,
        phone_number: phone_number,
        provider: provider,
       });

       if (!deposit_transaction) {
        return res.status(404).json(responseFormatter.error('Deposit transaction not created', 404));
       }

       //create pawapay deposit transaction
       const pawapay_transaction = await createPawapayDepositTransaction({
        deposit_id: deposit_transaction.deposit_id,
        amount: deposit_transaction.amount,
        currency: deposit_transaction.currency,
        canal: deposit_transaction.canal.toUpperCase(),
        phone_number: deposit_transaction.phone_number,
        provider: deposit_transaction.provider,
       });

       if (pawapay_transaction === false) {
        return res.status(404).json(responseFormatter.error('Pawapay transaction not created', 404));
       }
       else if (pawapay_transaction === true) {
        return res.status(200).json(responseFormatter.success({deposit_id: deposit_transaction.deposit_id}, 'Pawapay transaction created successfully'));
       } else if (pawapay_transaction === null) {
        return res.status(500).json(responseFormatter.error('Error creating pawapay transaction', 500));
       }
    } catch (error) {
        console.error('Error creating deposit transaction:', error);
        return res.status(500).json(responseFormatter.error('Error creating deposit transaction', 500));
    }
};

module.exports = { createDepositTransaction };