const express = require('express');
const db = require('../db');
const verifyToken = require('../middleware/auth');
const router = express.Router();

router.get('/balance', verifyToken, async (req, res) => {
    try {
        const [accounts] = await db.execute('SELECT * FROM accounts WHERE user_id = ?', [req.userId]);
        res.json(accounts);
    } catch (error) {
        console.error('Balance fetch error:', error);
        res.status(500).json({ 
            message: 'Server error',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

router.get('/history', verifyToken, async (req, res) => {
    try {
        // Get all account IDs for the user
        const [accounts] = await db.execute('SELECT id FROM accounts WHERE user_id = ?', [req.userId]);
        if (accounts.length === 0) return res.json([]);

        const accountIds = accounts.map(a => a.id);

        // Fix: Properly handle IN clause with array by creating placeholders
        // mysql2 doesn't automatically expand arrays in IN clauses
        if (accountIds.length === 0) {
            return res.json([]);
        }

        const placeholders = accountIds.map(() => '?').join(',');
        
        const query = `
            SELECT t.*, 
                   fa.account_number as from_account, 
                   ta.account_number as to_account
            FROM transactions t
            LEFT JOIN accounts fa ON t.from_account_id = fa.id
            LEFT JOIN accounts ta ON t.to_account_id = ta.id
            WHERE t.from_account_id IN (${placeholders}) OR t.to_account_id IN (${placeholders})
            ORDER BY t.created_at DESC
        `;

        // Pass accountIds twice (once for each IN clause) and spread them
        const [transactions] = await db.execute(query, [...accountIds, ...accountIds]);

        res.json(transactions);
    } catch (error) {
        console.error('Transaction history error:', error);
        res.status(500).json({ message: 'Server error', error: process.env.NODE_ENV === 'development' ? error.message : undefined });
    }
});

module.exports = router;
