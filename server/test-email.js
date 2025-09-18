const mongoose = require('mongoose');
const { sendOTPEmail } = require('./utils/emailService');
const { generateOTP, saveOTP, verifyOTP } = require('./utils/otpUtils');
require('dotenv').config();

async function connectToDatabase() {
    try {
        const dbUrl = process.env.MONGODB_URI || 'mongodb://localhost:27017/food-delivery-app';
        await mongoose.connect(dbUrl);
        console.log('✅ Connected to MongoDB Atlas');
        return true;
    } catch (error) {
        console.error('❌ MongoDB Connection error:', error);
        return false;
    }
}

async function testEmailVerification() {
    try {
        console.log('Starting email verification test...\n');

        // First ensure database connection
        const isConnected = await connectToDatabase();
        if (!isConnected) {
            throw new Error('Failed to connect to MongoDB Atlas');
        }

        // Test 1: Generate OTP
        console.log('Test 1: Generating OTP...');
        const testEmail = 'gamexshiv@gmail.com';
        const otp = generateOTP();
        console.log(`Generated OTP: ${otp} for email: ${testEmail}\n`);

        // Test 2: Save OTP
        console.log('Test 2: Saving OTP to database...');
        const otpSaved = await saveOTP(testEmail, otp);
        console.log(`OTP saved successfully: ${otpSaved}\n`);

        // Test 3: Send OTP Email
        console.log('Test 3: Sending OTP email...');
        const emailResult = await sendOTPEmail(testEmail, otp);
        console.log('Email sending result:', emailResult, '\n');

        // Test 4: Verify OTP
        console.log('Test 4: Verifying OTP...');
        const isValid = await verifyOTP(testEmail, otp);
        console.log(`OTP verification result: ${isValid}\n`);

        console.log('All tests completed successfully!');
        await mongoose.disconnect();
        process.exit(0);
    } catch (error) {
        console.error('Test failed:', error);
        await mongoose.disconnect();
        process.exit(1);
    }
}

testEmailVerification();