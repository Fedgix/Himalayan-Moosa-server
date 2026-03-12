import { userRepository } from '../repositories/user.repository.js';
import { passwordResetOtpRepository } from '../repositories/password-reset-otp.repository.js';
import { UserEntity } from '../entity/user.entity.js';
import CustomError from '../../../utils/custom.error.js';
import bcrypt from 'bcryptjs';
import { sendOtp } from '../../../utils/email.service.js';

const SALT_ROUNDS = 10;
const PASSWORD_MIN_LENGTH = 6;
const PASSWORD_MAX_LENGTH = 128;

export const userService = {
    async signup({ firstName, lastName, email, password }) {
        const existing = await userRepository.findByEmail(email);
        if (existing) {
            throw new CustomError('User with this email already exists', 409);
        }
        const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
        const name = `${firstName} ${lastName}`.trim();
        const user = await userRepository.create({
            firstName,
            lastName,
            name,
            email,
            password: hashedPassword
        });
        return user;
    },

    async login(email, password) {
        const userDoc = await userRepository.findByEmailForAuth(email);
        if (!userDoc) {
            throw new CustomError('Invalid email or password', 401);
        }
        if (!userDoc.password) {
            throw new CustomError('This account uses Google sign-in. Please sign in with Google.', 401);
        }
        const match = await bcrypt.compare(password, userDoc.password);
        if (!match) {
            throw new CustomError('Invalid email or password', 401);
        }
        return new UserEntity(userDoc);
    },

    async findById(id) {
        console.log("User_id: ",id)
        if (!id) {
            throw new CustomError('User ID is required', 400);
        }
        
        const user = await userRepository.findById(id);
        if (!user) {
            throw new CustomError('User not found', 404);
        }
        
        return user;
    },

    async findByEmail(email) {
        if (!email) {
            throw new CustomError('Email is required', 400);
        }
        
        return await userRepository.findByEmail(email);
    },

    async findOrCreateGoogleUser(profileData) {
        // Validate required fields
        if (!profileData.googleId || !profileData.email || !profileData.name) {
            throw new CustomError('Missing required Google profile data', 400);
        }

        try {
            return await userRepository.findOrCreateGoogleUser(profileData);
        } catch (error) {
            throw new CustomError('Failed to process Google user', 500, true, error.message);
        }
    },

    async updateProfile(id, updateData) {
        const user = await this.findById(id);
        
        // Remove sensitive fields that shouldn't be updated directly
        const { googleId, role, ...allowedUpdates } = updateData;
        
        return await userRepository.update(id, allowedUpdates);
    },

    async forgotPassword(email) {
        const userDoc = await userRepository.findByEmailForAuth(email);
        if (!userDoc) {
            return;
        }
        if (!userDoc.password) {
            return;
        }
        const otp = String(Math.floor(100000 + Math.random() * 900000));
        await passwordResetOtpRepository.create(email, otp);
        const userName = userDoc.firstName || userDoc.name || 'User';
        await sendOtp(email, otp, { userName });
    },

    async resetPassword(email, otp, newPassword, confirmPassword) {
        if (newPassword !== confirmPassword) {
            throw new CustomError('Password and confirm password do not match', 400);
        }
        if (typeof newPassword !== 'string' || newPassword.length < PASSWORD_MIN_LENGTH) {
            throw new CustomError(`Password must be at least ${PASSWORD_MIN_LENGTH} characters long`, 400);
        }
        if (newPassword.length > PASSWORD_MAX_LENGTH) {
            throw new CustomError(`Password cannot exceed ${PASSWORD_MAX_LENGTH} characters`, 400);
        }
        const otpDoc = await passwordResetOtpRepository.findValid(email, otp);
        if (!otpDoc) {
            throw new CustomError('Invalid or expired OTP. Please request a new one.', 400);
        }
        const userDoc = await userRepository.findByEmailForAuth(email);
        if (!userDoc) {
            throw new CustomError('User not found', 404);
        }
        if (!userDoc.password) {
            throw new CustomError('This account uses Google sign-in. Cannot reset password.', 400);
        }
        const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);
        await userRepository.update(userDoc._id.toString(), { password: hashedPassword });
        await passwordResetOtpRepository.deleteByEmail(email);
    }
};
