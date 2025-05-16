// routes/user.js
const express = require('express');
const mongoose= require('mongoose');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const Transaction = require('../models/transaction');
require('dotenv').config();

const router = express.Router();

// =================== AUTH MIDDLEWARE =====================
const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'yoursecretkey');

      const user = await User.findById(decoded.id);
      if (!user) {
        return res.status(401).json({ error: 'Unauthorized: User not found' });
      }

      req.user = user; // Attach full user object if needed
      next();
    } catch (error) {
      console.error('Token verification failed:', error);
      return res.status(401).json({ error: 'Invalid token' });
    }
  } else {
    return res.status(401).json({ error: 'No token provided' });
  }
};

// =================== UPDATE BALANCE =====================
router.post('/updateBalance', authMiddleware, async (req, res) => {
  console.log('Incoming request to update balance');
  console.log('req.user:', req.user);
  console.log('req.body:', req.body);

  const userId = req.user.id;
  const { balance } = req.body;

  if (typeof balance !== 'number') {
    console.log('Invalid balance type:', typeof balance);
    return res.status(400).json({ message: 'Invalid balance value (should be number)' });
  }

  try {
    const updatedUser = await User.findByIdAndUpdate(userId, { balance }, { new: true });
    if (!updatedUser) {
      console.log('User not found for id:', userId);
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ message: 'Balance updated successfully', user: updatedUser });
  } catch (error) {
    console.error('Balance update error:', error);
    res.status(500).json({ message: 'Failed to update balance' });
  }
});


// =================== GET USER BY EMAIL =====================

// This should be the route for fetching the user profile
// routes/user.js or wherever your route is
router.get('/me', authMiddleware, async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: 'Unauthorized: No user info in token' });
    }

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // ✅ Include all needed fields here
    res.json({
      userId: user._id,
      username: user.username,
      email: user.email,
      phoneNumber: user.phoneNumber,   // ✅ added
      dob: user.dob,                   // ✅ added
      balance: user.balance,
      bin: user.bin,
    });
  } catch (err) {
    console.error('Error fetching user data:', err);
    res.status(500).json({ message: 'Error fetching user data' });
  }
});



// Deposit route
router.post('/deposit', authMiddleware, async (req, res) => {
  try {
    const { amount, description } = req.body; // ✅ extract description

    if (!amount || isNaN(amount) || Number(amount) <= 0) {
      return res.status(400).json({ status: 'error', message: 'Invalid amount' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ status: 'error', message: 'User not found' });
    }

    user.balance += Number(amount);
    await user.save();

    const transaction = new Transaction({
      userId: user._id,
      type: 'deposit',
      amount: Number(amount),
      description: description || "" // ✅ include description
    });
    await transaction.save();

    res.json({ status: 'success', balance: user.balance });
  } catch (err) {
    console.error('Deposit error:', err);
    res.status(500).json({ status: 'error', message: 'Server error during deposit' });
  }
});



// Withdraw route
router.post('/withdraw', authMiddleware, async (req, res) => {
  try {
    const { amount, description } = req.body; // ✅ extract description

    if (!amount || isNaN(amount) || Number(amount) <= 0) {
      return res.status(400).json({ status: 'error', message: 'Invalid amount' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ status: 'error', message: 'User not found' });
    }

    if (user.balance < amount) {
      return res.status(400).json({ status: 'error', message: 'Insufficient balance' });
    }

    user.balance -= Number(amount);
    await user.save();

    const transaction = new Transaction({
      userId: user._id,
      type: 'withdraw',
      amount: Number(amount),
      description: description || "" // ✅ include description
    });
    await transaction.save();

    res.json({ status: 'success', balance: user.balance });
  } catch (err) {
    console.error('Withdraw error:', err);
    res.status(500).json({ status: 'error', message: 'Server error during withdraw' });
  }
});


// =================== TRANSACTION HISTORY =====================
// GET /history - Fetch user transaction history
router.get('/history', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { type } = req.query;

    let query = { userId };

    if (type && ['deposit', 'withdraw'].includes(type.toLowerCase())) {
      query.type = type.toLowerCase();
    }

    const transactions = await Transaction.find(query).sort({ createdAt: -1 });

    return res.status(200).json({
      status: "success",
      transactions,
    });

  } catch (error) {
    console.error('Error fetching transaction history:', error);
    res.status(500).json({
      status: "error",
      message: 'Server Error fetching transaction history'
    });
  }
});

// DELETE /history/:id - Delete a specific transaction by ID
router.delete('/history/:id', authMiddleware, async (req, res) => {
    const { id: transactionId } = req.params;
    const userId = req.user?._id;  // Optional chaining to avoid crash

    if (!userId) {
        return res.status(401).json({ message: 'Unauthorized: User not found' });
    }

    if (!mongoose.Types.ObjectId.isValid(transactionId)) {
        return res.status(400).json({ message: 'Invalid transaction ID' });
    }

    try {
        const transaction = await Transaction.findOneAndDelete({
            _id: transactionId,
            userId: userId
        });

        if (!transaction) {
            return res.status(404).json({ message: 'Transaction not found' });
        }

        const user = await User.findById(userId);

        if (transaction.type === 'deposit') {
            user.balance -= transaction.amount;
        } else if (transaction.type === 'withdraw') {
            user.balance += transaction.amount;
        }

        await user.save();

        res.status(200).json({ message: 'Transaction deleted', newBalance: user.balance });
    } catch (err) {
        console.error('Error deleting transaction:', err);
        res.status(500).json({ message: 'Server error' });
    }
});



module.exports = router;
