const express = require('express');
const db = require('../db');
const verifyToken = require('../middleware/auth');
const router = express.Router();

router.post('/transfer', verifyToken, async (req, res) => {
    const { toAccountId, amount } = req.body;
    
    // Input validation
    if (!toAccountId || !amount) {
        return res.status(400).json({ message: 'Account number and amount are required' });
    }

    if (typeof toAccountId !== 'string' || toAccountId.trim().length === 0) {
        return res.status(400).json({ message: 'Invalid account number format' });
    }

    const transferAmount = parseFloat(amount);

    if (isNaN(transferAmount) || transferAmount <= 0) {
        return res.status(400).json({ message: 'Invalid amount. Must be a positive number' });
    }

    if (transferAmount > 999999999.99) {
        return res.status(400).json({ message: 'Amount exceeds maximum limit' });
    }

    let connection;
    try {
        connection = await db.getConnection();
        await connection.beginTransaction();

        // 1. Get Sender Account
        const [senderAccounts] = await connection.execute(
            'SELECT * FROM accounts WHERE user_id = ? FOR UPDATE',
            [req.userId]
        );
        if (senderAccounts.length === 0) {
            throw new Error('Sender account not found');
        }
        const senderAccount = senderAccounts[0];

        if (senderAccount.balance < transferAmount) {
            throw new Error('Insufficient funds');
        }

        // 2. Get Receiver Account
        const [receiverAccounts] = await connection.execute(
            'SELECT * FROM accounts WHERE account_number = ? FOR UPDATE',
            [toAccountId.trim()]
        );
        if (receiverAccounts.length === 0) {
            throw new Error('Receiver account not found');
        }
        const receiverAccount = receiverAccounts[0];

        if (senderAccount.id === receiverAccount.id) {
            throw new Error('Cannot transfer to self');
        }

        // 3. Deduct from Sender
        await connection.execute(
            'UPDATE accounts SET balance = balance - ? WHERE id = ?',
            [transferAmount, senderAccount.id]
        );

        // 4. Add to Receiver
        await connection.execute(
            'UPDATE accounts SET balance = balance + ? WHERE id = ?',
            [transferAmount, receiverAccount.id]
        );

        // 5. Record Transaction
        await connection.execute(
            'INSERT INTO transactions (from_account_id, to_account_id, amount, type, status) VALUES (?, ?, ?, ?, ?)',
            [senderAccount.id, receiverAccount.id, transferAmount, 'transfer', 'success']
        );

        await connection.commit();
        res.json({ message: 'Transfer successful' });

    } catch (error) {
        if (connection) {
            try {
                await connection.rollback();
            } catch (rollbackError) {
                console.error('Rollback error:', rollbackError);
            }
        }
        console.error('Transfer error:', error);
        
        // Determine appropriate status code
        const isClientError = error.message && (
            error.message.includes('not found') ||
            error.message.includes('Insufficient funds') ||
            error.message.includes('Cannot transfer')
        );
        
        res.status(isClientError ? 400 : 500).json({ 
            message: error.message || 'Transfer failed' 
        });
    } finally {
        if (connection) {
            connection.release();
        }
    }
});

module.exports = router;
