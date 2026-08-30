const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');

// Helper to sign JWT token
const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET || 'supersecretstudynookkey12345',
    { expiresIn: '7d' }
  );
};

// Cookie configuration options
const getCookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
});

// Register User
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, photoURL } = req.body;

    if (!name || !email || !password || !photoURL) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Password validation: minimum 6 characters, at least 1 uppercase, 1 lowercase
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }
    if (!/[A-Z]/.test(password)) {
      return res.status(400).json({ message: 'Password must contain at least one uppercase letter' });
    }
    if (!/[a-z]/.test(password)) {
      return res.status(400).json({ message: 'Password must contain at least one lowercase letter' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create User
    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      photoURL
    });

    await newUser.save();

    // Generate JWT token
    const token = generateToken(newUser._id);

    // Send token in HTTP-only cookie
    res.cookie('token', token, getCookieOptions());

    res.status(201).json({
      message: 'Registration successful!',
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        photoURL: newUser.photoURL
      }
    });

  } catch (error) {
    res.status(500).json({ message: 'Server error during registration', error: error.message });
  }
});

// Login User
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    // Google users who haven't set a password
    if (!user.password) {
      return res.status(400).json({ message: 'Account was registered using Google. Please log in with Google.' });
    }

    // Compare passwords
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    // Generate token
    const token = generateToken(user._id);

    // Set HTTP-only cookie
    res.cookie('token', token, getCookieOptions());

    res.json({
      message: 'Logged in successfully!',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        photoURL: user.photoURL
      }
    });

  } catch (error) {
    res.status(500).json({ message: 'Server error during login', error: error.message });
  }
});

// Google Authentication Route
router.post('/google-login', async (req, res) => {
  try {
    const { name, email, photoURL } = req.body;

    if (!email || !name || !photoURL) {
      return res.status(400).json({ message: 'Incomplete user info from Google' });
    }

    // Check if user exists
    let user = await User.findOne({ email });

    if (!user) {
      // Register Google user directly
      user = new User({
        name,
        email,
        photoURL
      });
      await user.save();
    }

    // Generate token
    const token = generateToken(user._id);

    // Set cookie
    res.cookie('token', token, getCookieOptions());

    res.json({
      message: 'Google login successful!',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        photoURL: user.photoURL
      }
    });

  } catch (error) {
    res.status(500).json({ message: 'Server error during Google auth', error: error.message });
  }
});

// Logout User
router.post('/logout', (req, res) => {
  res.clearCookie('token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax'
  });
  res.json({ message: 'Logged out successfully!' });
});

// Fetch current user details
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ user });
  } catch (error) {
    res.status(500).json({ message: 'Server error retrieving user data', error: error.message });
  }
});

module.exports = router;
