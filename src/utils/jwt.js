import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';
import CustomError from './custom.error.js';
import HttpStatusCode from './http.status.codes.js';

export const jwtUtils = {
    generateAccessToken: (payload, expiresIn = null) => {
        return jwt.sign(payload, config.JWT.ACCESS_SECRET, {
            expiresIn: expiresIn || config.JWT.ACCESS_EXPIRES_IN
        });
    },

    generateRefreshToken: (payload, expiresIn = null) => {
        return jwt.sign(payload, config.JWT.REFRESH_SECRET, {
            expiresIn: expiresIn || config.JWT.REFRESH_EXPIRES_IN
        });
    },

    generateTokenPair: (user) => {
        const payload = {
            id: user.id || user._id,
            email: user.email,
            role: user.role
        };

        return {
            accessToken: jwtUtils.generateAccessToken(payload),
            refreshToken: jwtUtils.generateRefreshToken(payload)
        };
    },

    verifyAccessToken: (token) => {
        try {
            const res = jwt.verify(token, config.JWT.ACCESS_SECRET);
            console.log("_res: ",res)
            return res;
        } catch (error) {
            throw new CustomError('Invalid or expired access token', HttpStatusCode.UNAUTHORIZED);
        }
    },

    verifyRefreshToken: (token) => {
        try {
            return jwt.verify(token, config.JWT.REFRESH_SECRET);
        } catch (error) {
            throw new CustomError('Invalid or expired refresh token', HttpStatusCode.UNAUTHORIZED);
        }
    },

    // Admin JWT functions
    generateAdminAccessToken: (payload, expiresIn = null) => {
        return jwt.sign(payload, config.JWT.ADMIN_ACCESS_SECRET, {
            expiresIn: expiresIn || config.JWT.ADMIN_ACCESS_EXPIRES_IN
        });
    },

    generateAdminRefreshToken: (payload, expiresIn = null) => {
        return jwt.sign(payload, config.JWT.ADMIN_REFRESH_SECRET, {
            expiresIn: expiresIn || config.JWT.ADMIN_REFRESH_EXPIRES_IN
        });
    },

    generateAdminTokenPair: (admin) => {
        const payload = {
            id: admin._id,
            email: admin.email,
            role: admin.role,
            type: 'admin'
        };

        return {
            accessToken: jwtUtils.generateAdminAccessToken(payload),
            refreshToken: jwtUtils.generateAdminRefreshToken(payload)
        };
    },

    verifyAdminAccessToken: (token) => {
        try {
            const res = jwt.verify(token, config.JWT.ADMIN_ACCESS_SECRET);
            return res;
        } catch (error) {
            throw new CustomError('Invalid or expired admin access token', HttpStatusCode.UNAUTHORIZED);
        }
    },

    verifyAdminRefreshToken: (token) => {
        try {
            return jwt.verify(token, config.JWT.ADMIN_REFRESH_SECRET);
        } catch (error) {
            throw new CustomError('Invalid or expired admin refresh token', HttpStatusCode.UNAUTHORIZED);
        }
    }
};