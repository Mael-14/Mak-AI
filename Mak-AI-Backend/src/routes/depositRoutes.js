const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { createDepositTransaction } = require('../services/financial_service/deposit');

/**
 * @route   POST /api/deposit
 * @desc    Create a deposit transaction
 * @access  Private
 */
router.post('/deposit', authenticateToken, createDepositTransaction);

module.exports = router;