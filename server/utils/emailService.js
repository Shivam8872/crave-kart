const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp-relay.brevo.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false, // Use STARTTLS
    auth: {
        user: process.env.SMTP_USER || '9749d9001@smtp-brevo.com',
        pass: process.env.SMTP_PASS || '20nVaMWfJqFD9Abw'
    },
    tls: {
        rejectUnauthorized: false // Accept self-signed certificates
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
            host: process.env.SMTP_HOST || 'smtp-relay.brevo.com',
            port: process.env.SMTP_PORT || '587',
            user: process.env.SMTP_USER || '9749d9001@smtp-brevo.com',
            // Don't log the actual password
            hasPass: !!(process.env.SMTP_PASS || '20nVaMWfJqFD9Abw')
        });

        const mailOptions = {
            from: `${process.env.FROM_NAME || 'CraveKart Team'} <${process.env.FROM_EMAIL || 'gamexshiv@gmail.com'}>`,
            to: email,
            subject: 'Email Verification - CraveKart',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
                    <div style="text-align: center; margin-bottom: 30px;">
                        <h1 style="color: #4CAF50; margin: 0;">CraveKart</h1>
                    </div>
                    <h2 style="color: #333; text-align: center;">Email Verification</h2>
                    <p style="font-size: 16px; line-height: 1.6;">Thank you for registering with CraveKart. Please use the following OTP to verify your email address:</p>
                    <div style="text-align: center; margin: 30px 0;">
                        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; display: inline-block;">
                            <h1 style="color: #4CAF50; font-size: 36px; letter-spacing: 4px; margin: 0; font-weight: bold;">${otp}</h1>
                        </div>
                    </div>
                    <p style="font-size: 14px; color: #666;">This OTP will expire in 10 minutes.</p>
                    <p style="font-size: 14px; color: #666;">If you didn't request this verification, please ignore this email.</p>
                    <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
                    <p style="font-size: 14px; color: #888; text-align: center;">
                        Best regards,<br>
                        <strong>CraveKart Team</strong>
                    </p>
                </div>
            `
        };

        console.log('Sending email with options:', {
            from: mailOptions.from,
            to: mailOptions.to,
            subject: mailOptions.subject
        });

        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent successfully:', {
            messageId: info.messageId,
            response: info.response
        });
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('Detailed email error:', {
            message: error.message,
            code: error.code,
            command: error.command,
            response: error.response,
            responseCode: error.responseCode
        });
        return { success: false, error: error.message };
    }
};

module.exports = {
    sendOTPEmail
};