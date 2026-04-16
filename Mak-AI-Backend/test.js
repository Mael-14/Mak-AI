require('dotenv').config();
const { createDepositTransaction } = require('./src/services/financial_service/deposit');

const req = {
    body: {
        amount: '1000',
        user_id: 'lzjqCmTluIdFxAqZvQ0yZsFSJ5Q2',
        phone_number: '237670930530',
        provider: 'MTN_MOMO_CM',
    }
};

const res = {
    status: (code) => ({
        json: (data) => { console.log(`Response [${code}]:`, data); return data; }
    })
};

const testCreateDepositTransaction = async () => {
    try {
        const depositTransaction = await createDepositTransaction(req, res).then((data) => {
            console.log(data);
        }).catch((error) => {
            console.error(error);
        });
    } catch (error) {
        console.error(error);
    }
}

testCreateDepositTransaction();