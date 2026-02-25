const { createAccountDocument } = require('./src/models/account.model');


const user_id = 'test-user-id';
const testAccountCreation = async () => {
    try {
        const account = await createAccountDocument(user_id);
        const account_id = account.uid;
        console.log(account_id);
    } catch (error) {
        console.error(error);
    }
}

testAccountCreation();
