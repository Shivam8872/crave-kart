const OTP = require('../models/OTP');
const crypto = require('crypto');

// Generate a 6-digit OTP
const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

// Save OTP to database
const saveOTP = async (email, otp) => {
    try {
        // Delete any existing OTP for this email
        await OTP.deleteMany({ email });
        
        // Create new OTP document
        const otpDoc = new OTP({
            email,
            otp: crypto.createHash('sha256').update(otp).digest('hex') // Store hashed OTP
        });
        
        await otpDoc.save();
        return true;
    } catch (error) {
        console.error('Error saving OTP:', error);
        return false;
    }
};

// Verify OTP
const verifyOTP = async (email, otp) => {
    try {
        const hashedOTP = crypto.createHash('sha256').update(otp).digest('hex');
        const otpDoc = await OTP.findOne({ 
            email,
            otp: hashedOTP
        });
        
        if (!otpDoc) {
            return false;
        }
        
        // Delete the OTP document after successful verification
        await OTP.deleteOne({ _id: otpDoc._id });
        return true;
    } catch (error) {
        console.error('Error verifying OTP:', error);
        return false;
    }
};

module.exports = {
    generateOTP,
    saveOTP,
    verifyOTP
};