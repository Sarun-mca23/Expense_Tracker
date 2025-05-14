// backend/server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./route/auth');
const userRoutes = require('./route/user');
const expenseRoutes = require('./route/expenseRoutes');

const app = express();

// Middleware
const allowedOrigins = [
  "http://localhost:3000",
  "https://expense-tracker-frontend-bz32.onrender.com"
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true
}));

app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/expenses', expenseRoutes);


// DB + Server Start
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ Database connected successfully');
    app.listen(process.env.PORT, () => {
      console.log(`🚀 Server running at http://localhost:${process.env.PORT}`);
    });
  })
  .catch(err => console.error('❌ MongoDB connection error:', err));
