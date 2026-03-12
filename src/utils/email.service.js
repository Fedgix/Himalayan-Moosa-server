/**
 * Reusable email service. Use for any purpose: OTP, verification, notifications.
 * Single transporter from emailConfig; exposes sendMail and helpers (e.g. sendOtp).
 */
import { emailConfig } from '../config/emailConfig.js';
import { createTransporter, sendEmail as sendEmailUtil } from './emailUtils.js';

let _transporter = null;

function getTransporter() {
    if (!_transporter) {
        _transporter = createTransporter(emailConfig.smtp);
    }
    return _transporter;
}

const from = () =>
    `"${emailConfig.addresses.fromName}" <${emailConfig.addresses.from}>`;

/**
 * Send a single email. Options: to, subject, html, text (optional).
 * @param {{ to: string, subject: string, html: string, text?: string }} options
 */
export async function sendMail(options) {
    const { to, subject, html, text } = options;
    if (!to || !subject || !html) {
        throw new Error('sendMail requires to, subject, and html');
    }
    const mailOptions = {
        from: from(),
        to,
        subject,
        html,
        ...(text && { text })
    };
    const result = await sendEmailUtil(
        getTransporter(),
        mailOptions,
        'Email'
    );
    return result;
}

/**
 * Send OTP email (e.g. for password reset). Uses config.templates.passwordReset.
 * @param {string} to - Recipient email
 * @param {string} otp - OTP code (e.g. 6 digits)
 * @param {{ appName?: string, userName?: string }} meta - Optional app name and user name for template
 */
export async function sendOtp(to, otp, meta = {}) {
    const appName = meta.appName || emailConfig.app.name;
    const userName = meta.userName || 'User';
    const subject = emailConfig.templates.passwordReset.subject(appName);
    const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Password reset</title></head>
<body style="font-family: sans-serif; line-height: 1.5; color: #333;">
  <p>Hi ${userName},</p>
  <p>Your one-time password (OTP) for resetting your password is:</p>
  <p style="font-size: 24px; font-weight: bold; letter-spacing: 4px;">${otp}</p>
  <p>This OTP is valid for ${emailConfig.templates.passwordReset.otpExpiryMinutes} minutes. Do not share it with anyone.</p>
  <p>If you did not request this, please ignore this email.</p>
  <p>— ${appName}</p>
</body>
</html>`;
    const text = `Your password reset OTP is: ${otp}. Valid for ${emailConfig.templates.passwordReset.otpExpiryMinutes} minutes.`;
    return sendMail({ to, subject, html, text });
}

export async function validateConnection() {
    const transporter = getTransporter();
    try {
        await transporter.verify();
        return { success: true, message: 'Email service connection successful' };
    } catch (error) {
        console.error('Email service connection error:', error);
        return {
            success: false,
            message: 'Email service connection failed',
            error: error.message
        };
    }
}

export { getTransporter };
