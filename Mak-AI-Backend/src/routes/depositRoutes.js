const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { createDepositTransaction } = require('../services/financial_service/deposit');
const { handleDepositCallback } = require('../services/financial_service/handleCallback');

/**
 * @route   POST /api/deposit
 * @desc    Create a deposit transaction
 * @access  Private
 */
router.post('/', authenticateToken, createDepositTransaction);

/**
 * @route   POST /api/deposit/callback
 * @desc    Handle a deposit callback
 * @access  Public
 */
router.post('/callback', async (req, res) => {
    res.status(200);
    try {
        await handleDepositCallback(req);
    } catch (error) {
        console.error('Error handling deposit callback:', error); //TODO: add notification to admin (email, sms or whatsapp)
    }
});

module.exports = router;