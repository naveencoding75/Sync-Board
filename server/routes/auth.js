const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const router = express.Router();

// REGISTER
router.post('/register', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Hash the password (encrypt it)
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const user = await User.create({ email, password: hashedPassword });
    res.json({ message: "User registered!", userId: user._id });
  } catch (err) {
    res.status(400).json({ error: "Email already exists or invalid data" });
  }
});

// LOGIN
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });

  if (!user) return res.status(400).json({ error: "User not found" });

  // Check password
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) return res.status(400).json({ error: "Invalid credentials" });

  // Generate Token (The "Key Card")
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
  
  res.json({ token, userId: user._id });
});

module.exports = router;