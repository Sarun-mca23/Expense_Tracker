// models/Expense.js
const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
  email: { type: String, required: true }, // Changed from userId to email
  description: { type: String, required: true },
  category: { type: String, required: true },
  amount: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Expense', expenseSchema);
