import PasswordResetOtp from '../models/password-reset-otp.model.js';
import { emailConfig } from '../../../config/emailConfig.js';

const OTP_EXPIRY_MINUTES = emailConfig.templates.passwordReset.otpExpiryMinutes;

export const passwordResetOtpRepository = {
    async create(email, otp) {
        const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);
        await PasswordResetOtp.deleteMany({ email });
        const doc = await PasswordResetOtp.create({ email: email.toLowerCase(), otp, expiresAt });
        return { email: doc.email, expiresAt: doc.expiresAt };
    },

    async findValid(email, otp) {
        const doc = await PasswordResetOtp.findOne({
            email: email.toLowerCase(),
            otp,
            expiresAt: { $gt: new Date() }
        });
        return doc;
    },

    async deleteByEmail(email) {
        const result = await PasswordResetOtp.deleteMany({ email: email.toLowerCase() });
        return result.deletedCount;
    }
};
