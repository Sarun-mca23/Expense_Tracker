// backend/models/User.js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true },
  dob: { type: Date, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true }, // hashed password
  phoneNumber: { type: String, required: true},
  balance: { type: Number, default: 0 },
  bin: { type: String } // BIN field
});

module.exports = mongoose.model('User', userSchema);
