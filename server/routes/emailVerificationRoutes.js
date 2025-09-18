const express = require('express');
const router = express.Router();
const { sendOTPEmail } = require('../utils/emailService');
const { generateOTP, saveOTP, verifyOTP } = require('../utils/otpUtils');
const User = require('../models/User');

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

        // Update user's email verification status
        await User.findOneAndUpdate(
            { email },
            { isEmailVerified: true },
            { new: true }
        );

        res.json({ success: true, message: 'Email verified successfully' });
    } catch (error) {
        console.error('Error in verify-email:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

module.exports = router;