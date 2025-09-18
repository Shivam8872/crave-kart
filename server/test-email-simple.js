const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: 'smtp-relay.brevo.com',
    port: 587,
    secure: false,
    auth: {
        user: '9749d9001@smtp-brevo.com',
        pass: '20nVaMWfJqFD9Abw'
    }
});

async function testEmailSending() {
    try {
        console.log('Starting email test...\n');

        // Test: Send test email
        console.log('Sending test email...');
        const testEmail = 'gamexshiv@gmail.com';
        const testOTP = '123456';

        const mailOptions = {
            from: 'gamexshiv@gmail.com',
            to: testEmail,
            subject: 'Test Email - CraveKart',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #333;">Email Verification Test</h2>
                    <p>This is a test email from CraveKart. If you received this, the email service is working correctly.</p>
                    <h1 style="color: #4CAF50; font-size: 32px; letter-spacing: 2px;">${testOTP}</h1>
                    <p>This is a test OTP.</p>
                    <p>Best regards,<br>CraveKart Team</p>
                </div>
            `
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent successfully!');
        console.log('Message ID:', info.messageId);
        console.log('\nAll tests completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Test failed:', error);
        process.exit(1);
    }
}

testEmailSending();