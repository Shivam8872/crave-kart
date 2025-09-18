
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { generateOTP, saveOTP } = require('../utils/otpUtils');
const { sendOTPEmail } = require('../utils/emailService');

// Get JWT secret from environment variable or use a default for development (not secure for production)
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key_for_development';

// Helper function to generate JWT token
const generateToken = (user) => {
  return jwt.sign(
    { 
      id: user._id,
      email: user.email,
      userType: user.userType 
    }, 
    JWT_SECRET, 
    { expiresIn: '30d' }
  );
};

// Get all users
router.get('/', async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get single user
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Send OTP for email verification
router.post('/send-otp', async (req, res) => {
  const { email } = req.body;
  
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const otp = require('../utils/otpUtils').generateOTP();
    require('../utils/otpUtils').storeOTP(email, otp);
    
    const emailSent = await require('../utils/emailService')
      .sendVerificationEmail(email, otp);
    
    if (emailSent) {
      res.json({ success: true, message: 'OTP sent successfully' });
    } else {
      res.status(500).json({ success: false, message: 'Failed to send OTP email' });
    }
  } catch (error) {
    console.error('Error sending OTP:', error);
    res.status(500).json({ message: 'Error sending OTP' });
  }
});

// Verify email with OTP
router.post('/verify-email', async (req, res) => {
  const { email, otp } = req.body;
  
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isValid = require('../utils/otpUtils').verifyOTP(email, otp);
    if (isValid) {
      user.isEmailVerified = true;
      await user.save();
      res.json({ success: true, message: 'Email verified successfully' });
    } else {
      res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
    }
  } catch (error) {
    console.error('Error verifying email:', error);
    res.status(500).json({ message: 'Error verifying email' });
  }
});

// Create user (signup) - restrict to customer and shopOwner only
router.post('/', async (req, res) => {
  const { email, password, name, userType, emailVerifiedToken } = req.body;
  
  try {
    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }
    
    // Validate user type - restrict to customer and shopOwner only
    if (!['customer', 'shopOwner'].includes(userType)) {
      return res.status(400).json({ message: 'Invalid user type' });
    }

    // Require prior OTP verification via emailVerifiedToken
    if (!emailVerifiedToken) {
      return res.status(400).json({ message: 'Email not verified. Please verify OTP before registration.' });
    }

    try {
      const decoded = jwt.verify(emailVerifiedToken, JWT_SECRET);
      if (!decoded?.email || decoded.email.toLowerCase() !== email.toLowerCase()) {
        return res.status(400).json({ message: 'Email verification token does not match the provided email.' });
      }
    } catch (e) {
      return res.status(400).json({ message: 'Invalid or expired email verification token. Please verify OTP again.' });
    }
    
    const user = new User({
      email,
      password,
      name,
      userType,
      isEmailVerified: false
    });
    
    const newUser = await user.save();
    const userResponse = { ...newUser._doc };
    delete userResponse.password;

    // Issue token on successful registration (email already verified via token)
    const token = generateToken(newUser);
    
    res.status(201).json({
      ...userResponse,
      token
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  
  try {
    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }
    
    // Enforce email verification before allowing login
    if (!user.isEmailVerified) {
      try {
        // Generate and save OTP, then send email (best-effort; do not block on errors)
        const otp = generateOTP();
        await saveOTP(email, otp);
        await sendOTPEmail(email, otp);
      } catch (e) {
        console.error('Error resending OTP during login:', e);
      }
      return res.status(403).json({
        message: 'Email not verified. We have sent a new verification code to your email. Please verify to continue.'
      });
    }
    
    // Use the comparePassword method we added to the User model
    const isMatch = await user.comparePassword(password);
    
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }
    
    const userResponse = { ...user._doc };
    delete userResponse.password;
    
    // Generate token
    const token = generateToken(user);
    
    res.json({
      ...userResponse,
      token
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: err.message });
  }
});

// Update user
router.patch('/:id', async (req, res) => {
  // Don't allow changing userType to admin through the API
  if (req.body.userType === 'admin') {
    delete req.body.userType;
  }
  
  try {
    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    ).select('-password');
    
    res.json(updatedUser);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Create a secured endpoint for admin creation (would need proper authentication in production)
// For demonstration only - in a real app, you'd use middleware to check if the request comes from a trusted source
router.post('/create-admin', async (req, res) => {
  const { email, password, name, secretKey } = req.body;
  
  // Check for a secret key that only the application owner would know
  // In production, use a proper auth mechanism or only allow creation through database operations
  if (secretKey !== process.env.ADMIN_SECRET_KEY) {
    return res.status(403).json({ message: 'Unauthorized' });
  }
  
  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }
    
    const user = new User({
      email,
      password,
      name,
      userType: 'admin'
    });
    
    const newUser = await user.save();
    const userResponse = { ...newUser._doc };
    delete userResponse.password;
    
    // Generate token
    const token = generateToken(newUser);
    
    res.status(201).json({
      ...userResponse,
      token
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;
