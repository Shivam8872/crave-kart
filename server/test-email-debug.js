const mongoose = require('mongoose');
const { sendOTPEmail } = require('./utils/emailService');
const { generateOTP, saveOTP, verifyOTP } = require('./utils/otpUtils');
require('dotenv').config();

async function connectToDatabase() {
    try {
        const dbUrl = process.env.MONGODB_URI || 'mongodb://localhost:27017/food-delivery-app';
        console.log('Connecting to MongoDB:', dbUrl);
        await mongoose.connect(dbUrl);
        console.log('✅ Connected to MongoDB');
        return true;
    } catch (error) {
        console.error('❌ MongoDB Connection error:', error);
        return false;
    }
}

async function testSMTPConnection() {
    console.log('🔧 Testing SMTP Configuration...');
    console.log('Environment variables:');
    console.log('- SMTP_HOST:', process.env.SMTP_HOST || 'smtp-relay.brevo.com');
    console.log('- SMTP_PORT:', process.env.SMTP_PORT || '587');
    console.log('- SMTP_USER:', process.env.SMTP_USER || '9749d9001@smtp-brevo.com');
    console.log('- SMTP_PASS:', process.env.SMTP_PASS ? '***configured***' : '***using default***');
    console.log('- FROM_EMAIL:', process.env.FROM_EMAIL || 'gamexshiv@gmail.com');
    console.log('- FROM_NAME:', process.env.FROM_NAME || 'CraveKart Team');
    console.log('');
}

async function testEmailVerification() {
    try {
        console.log('🚀 Starting comprehensive email verification test...\n');

        // Test SMTP configuration
        await testSMTPConnection();

        // First ensure database connection
        const isConnected = await connectToDatabase();
        if (!isConnected) {
            throw new Error('Failed to connect to MongoDB');
        }

        // Test 1: Generate OTP
        console.log('📝 Test 1: Generating OTP...');
        const testEmail = 'gamexshiv@gmail.com'; // Your email
        const otp = generateOTP();
        console.log(`Generated OTP: ${otp} for email: ${testEmail}\n`);

        // Test 2: Save OTP
        console.log('💾 Test 2: Saving OTP to database...');
        const otpSaved = await saveOTP(testEmail, otp);
        console.log(`OTP saved successfully: ${otpSaved}\n`);

        if (!otpSaved) {
            throw new Error('Failed to save OTP to database');
        }

        // Test 3: Send OTP Email
        console.log('📧 Test 3: Sending OTP email...');
        console.log('This may take a few seconds...');
        
        const emailResult = await sendOTPEmail(testEmail, otp);
        console.log('Email sending result:', emailResult);
        
        if (emailResult.success) {
            console.log('✅ Email sent successfully!');
            console.log('📬 Please check your email inbox (and spam folder) for the OTP.');
        } else {
            console.log('❌ Email sending failed:', emailResult.error);
        }
        console.log('');

        // Test 4: Verify OTP (optional - you can manually test this)
        console.log('🔍 Test 4: OTP verification test...');
        const isValid = await verifyOTP(testEmail, otp);
        console.log(`OTP verification result: ${isValid}\n`);

        if (emailResult.success) {
            console.log('🎉 Email test completed successfully!');
            console.log('📋 Next steps:');
            console.log('1. Check your email inbox for the OTP');
            console.log('2. If you don\'t see it, check your spam folder');
            console.log('3. Try sending an OTP through your application');
        } else {
            console.log('❌ Email test failed. Please check the error messages above.');
        }

        await mongoose.disconnect();
        process.exit(0);
    } catch (error) {
        console.error('💥 Test failed:', error);
        console.log('\n🔧 Troubleshooting tips:');
        console.log('1. Verify your SMTP credentials are correct');
        console.log('2. Check if your Brevo account is active');
        console.log('3. Ensure your .env file is properly configured');
        console.log('4. Check your internet connection');
        
        await mongoose.disconnect();
        process.exit(1);
    }
}

// Add graceful shutdown
process.on('SIGINT', async () => {
    console.log('\n🛑 Shutting down gracefully...');
    await mongoose.disconnect();
    process.exit(0);
});

testEmailVerification();
