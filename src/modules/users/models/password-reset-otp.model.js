import mongoose from 'mongoose';

const passwordResetOtpSchema = new mongoose.Schema({
    email: { type: String, required: true, lowercase: true },
    otp: { type: String, required: true },
    expiresAt: { type: Date, required: true }
}, { timestamps: true });

passwordResetOtpSchema.index({ email: 1 });
passwordResetOtpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const PasswordResetOtp = mongoose.model('PasswordResetOtp', passwordResetOtpSchema);
export default PasswordResetOtp;
