import CustomError from '../../utils/custom.error.js';

// Name: letters, spaces, hyphens, 1-50 chars
const NAME_REGEX = /^[a-zA-Z\s\-']{1,50}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Password: min 6 chars, at least one letter and one number (optional: one special char)
const PASSWORD_MIN_LENGTH = 6;
const PASSWORD_MAX_LENGTH = 128;

function trimString(val) {
    return typeof val === 'string' ? val.trim() : val;
}

export const validateSignup = (req, res, next) => {
    try {
        const firstName = trimString(req.body.firstName);
        const lastName = trimString(req.body.lastName);
        const email = trimString(req.body.email);
        const password = req.body.password;

        if (!firstName || firstName === '') {
            throw new CustomError('First name is required', 400, true);
        }
        if (firstName.length > 50) {
            throw new CustomError('First name cannot exceed 50 characters', 400, true);
        }
        if (!NAME_REGEX.test(firstName)) {
            throw new CustomError('First name can only contain letters, spaces, hyphens and apostrophes', 400, true);
        }

        if (!lastName || lastName === '') {
            throw new CustomError('Last name is required', 400, true);
        }
        if (lastName.length > 50) {
            throw new CustomError('Last name cannot exceed 50 characters', 400, true);
        }
        if (!NAME_REGEX.test(lastName)) {
            throw new CustomError('Last name can only contain letters, spaces, hyphens and apostrophes', 400, true);
        }

        if (!email || email === '') {
            throw new CustomError('Email is required', 400, true);
        }
        if (email.length > 255) {
            throw new CustomError('Email cannot exceed 255 characters', 400, true);
        }
        if (!EMAIL_REGEX.test(email)) {
            throw new CustomError('Please provide a valid email address', 400, true);
        }

        if (password === undefined || password === null) {
            throw new CustomError('Password is required', 400, true);
        }
        if (typeof password !== 'string') {
            throw new CustomError('Password must be a string', 400, true);
        }
        if (password.length < PASSWORD_MIN_LENGTH) {
            throw new CustomError(`Password must be at least ${PASSWORD_MIN_LENGTH} characters long`, 400, true);
        }
        if (password.length > PASSWORD_MAX_LENGTH) {
            throw new CustomError(`Password cannot exceed ${PASSWORD_MAX_LENGTH} characters`, 400, true);
        }

        req.body.firstName = firstName;
        req.body.lastName = lastName;
        req.body.email = email.toLowerCase();
        req.body.password = password;
        next();
    } catch (error) {
        next(error);
    }
};

export const validateLogin = (req, res, next) => {
    try {
        const email = trimString(req.body.email);
        const password = req.body.password;

        if (!email || email === '') {
            throw new CustomError('Email is required', 400, true);
        }
        if (!EMAIL_REGEX.test(email)) {
            throw new CustomError('Please provide a valid email address', 400, true);
        }

        if (password === undefined || password === null) {
            throw new CustomError('Password is required', 400, true);
        }
        if (typeof password !== 'string') {
            throw new CustomError('Password must be a string', 400, true);
        }
        if (password.length === 0) {
            throw new CustomError('Password is required', 400, true);
        }

        req.body.email = email.toLowerCase();
        req.body.password = password;
        next();
    } catch (error) {
        next(error);
    }
};

export const validateForgotPassword = (req, res, next) => {
    try {
        const email = trimString(req.body.email);
        if (!email || email === '') {
            throw new CustomError('Email is required', 400, true);
        }
        if (!EMAIL_REGEX.test(email)) {
            throw new CustomError('Please provide a valid email address', 400, true);
        }
        req.body.email = email.toLowerCase();
        next();
    } catch (error) {
        next(error);
    }
};

export const validateResetPassword = (req, res, next) => {
    try {
        const email = trimString(req.body.email);
        const otp = req.body.otp;
        const newPassword = req.body.newPassword;
        const confirmPassword = req.body.confirmPassword;

        if (!email || email === '') {
            throw new CustomError('Email is required', 400, true);
        }
        if (!EMAIL_REGEX.test(email)) {
            throw new CustomError('Please provide a valid email address', 400, true);
        }
        if (otp === undefined || otp === null || String(otp).trim() === '') {
            throw new CustomError('OTP is required', 400, true);
        }
        if (typeof newPassword !== 'string') {
            throw new CustomError('New password is required', 400, true);
        }
        if (newPassword.length < PASSWORD_MIN_LENGTH) {
            throw new CustomError(`Password must be at least ${PASSWORD_MIN_LENGTH} characters long`, 400, true);
        }
        if (newPassword.length > PASSWORD_MAX_LENGTH) {
            throw new CustomError(`Password cannot exceed ${PASSWORD_MAX_LENGTH} characters`, 400, true);
        }
        if (newPassword !== confirmPassword) {
            throw new CustomError('Password and confirm password do not match', 400, true);
        }

        req.body.email = email.toLowerCase();
        req.body.otp = String(otp).trim();
        req.body.newPassword = newPassword;
        req.body.confirmPassword = confirmPassword;
        next();
    } catch (error) {
        next(error);
    }
};
