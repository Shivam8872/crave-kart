const express = require('express');
const router = express.Router();
const { sendOTPEmail } = require('../utils/emailService');
const { generateOTP, saveOTP, verifyOTP } = require('../utils/otpUtils');
const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Get JWT secret from environment variable or use a default for development (not secure for production)
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key_for_development';

// Route to send OTP
router.post('/send-verification-otp', async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ success: false, message: 'Email is required' });
        }

        // Generate OTP
        const otp = generateOTP();
        
        // Save OTP to database
        const otpSaved = await saveOTP(email, otp);
        if (!otpSaved) {
            return res.status(500).json({ success: false, message: 'Error saving OTP' });
        }

        // Send OTP via email
        const emailResult = await sendOTPEmail(email, otp);
        if (!emailResult.success) {
            return res.status(500).json({ success: false, message: 'Error sending email' });
        }

        res.json({ success: true, message: 'OTP sent successfully' });
    } catch (error) {
        console.error('Error in send-verification-otp:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// Route to verify OTP
router.post('/verify-email', async (req, res) => {
    try {
        const { email, otp } = req.body;

        if (!email || !otp) {
            return res.status(400).json({ success: false, message: 'Email and OTP are required' });
        }

        // Verify OTP
        const isValid = await verifyOTP(email, otp);
        if (!isValid) {
            return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
        }

        // Update user's email verification status and return updated user with token
        const updatedUser = await User.findOneAndUpdate(
            { email },
            { isEmailVerified: true },
            { new: true }
        ).select('-password');

        if (!updatedUser) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Issue a fresh token after verification
        const token = jwt.sign(
            { id: updatedUser._id, email: updatedUser.email, userType: updatedUser.userType },
            JWT_SECRET,
            { expiresIn: '30d' }
        );

        res.json({ success: true, message: 'Email verified successfully', user: updatedUser, token });
    } catch (error) {
        console.error('Error in verify-email:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// Route to verify OTP without requiring a user
router.post('/verify-otp', async (req, res) => {
    try {
        const { email, otp } = req.body;

        if (!email || !otp) {
            return res.status(400).json({ success: false, message: 'Email and OTP are required' });
        }

        // Verify OTP
        const isValid = await verifyOTP(email, otp);
        if (!isValid) {
            return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
        }

        // Issue a short-lived emailVerifiedToken for signup
        const emailVerifiedToken = jwt.sign(
            { email },
            JWT_SECRET,
            { expiresIn: '1h' }
        );

        res.json({ success: true, message: 'OTP verified successfully', emailVerifiedToken });
    } catch (error) {
        console.error('Error in verify-otp:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

module.exports = router;