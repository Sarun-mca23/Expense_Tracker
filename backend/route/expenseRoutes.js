// routes/expenseRoutes.js
const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const authMiddleware = require('../route/user');
const Expense = require('../models/expense');  // make sure model file name is correct!


// Adding expense to the database with user's email instead of userId
router.post('/add', async (req, res) => {
  const { description, category, amount, email } = req.body;

  if (!description || !category || !amount || !email) {
    return res.status(400).json({ message: 'All fields are required.' });
  }

  try {
    // Add the expense
    const newExpense = new Expense({
      description,
      category,
      amount,
      email, // Save email instead of userId
    });

    await newExpense.save();

    res.status(200).json({ message: 'Expense added successfully' });
  } catch (error) {
    console.error('Error adding expense:', error);
    res.status(500).json({ message: 'Failed to add expense' });
  }
});



// Backend route for fetching expenses by email
router.get('/byEmail', async (req, res) => {
  const { email } = req.query;

  if (!email) {
    return res.status(400).json({ message: 'Email is required.' });
  }

  try {
    const expenses = await Expense.find({ email }).sort({ createdAt: -1 });
    res.status(200).json(expenses);
  } catch (error) {
    console.error('Error fetching expenses by email:', error);
    res.status(500).json({ message: 'Failed to fetch expenses.' });
  }
});


module.exports = router;
