const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true
    },
    otp: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 600 // Document will be automatically deleted after 10 minutes
    }
});

// Add index for faster queries
otpSchema.index({ email: 1, createdAt: 1 });

module.exports = mongoose.model('OTP', otpSchema);