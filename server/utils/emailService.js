const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp-relay.brevo.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false,
    auth: {
        user: process.env.SMTP_USER || '9749d9001@smtp-brevo.com',
        pass: process.env.SMTP_PASS || '20nVaMWfJqFD9Abw'
    }
});

// Verify transporter configuration
transporter.verify((error, success) => {
    if (error) {
        console.error('SMTP Verification Error:', error);
    } else {
        console.log('SMTP Server is ready to take messages');
    }
});

const sendOTPEmail = async (email, otp) => {
    try {
        console.log('Attempting to send email with config:', {
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT,
            user: process.env.SMTP_USER,
            // Don't log the actual password
            hasPass: !!process.env.SMTP_PASS
        });

        const mailOptions = {
            from: 'gamexshiv@gmail.com',
            to: email,
            subject: 'Email Verification - CraveKart',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #333;">Email Verification</h2>
                    <p>Thank you for registering with CraveKart. Please use the following OTP to verify your email address:</p>
                    <h1 style="color: #4CAF50; font-size: 32px; letter-spacing: 2px;">${otp}</h1>
                    <p>This OTP will expire in 10 minutes.</p>
                    <p>If you didn't request this verification, please ignore this email.</p>
                    <p>Best regards,<br>CraveKart Team</p>
                </div>
            `
        };

        console.log('Sending email with options:', {
            to: mailOptions.to,
            subject: mailOptions.subject
        });

        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent successfully:', info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('Detailed email error:', error);
        return { success: false, error: error.message };
    }
};

module.exports = {
    sendOTPEmail
};