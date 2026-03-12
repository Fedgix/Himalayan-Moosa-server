import catchAsync from '../../../frameworks/middlewares/catch.async.js';
import { sendSuccess } from '../../../utils/response.handler.js';
import CustomError from '../../../utils/custom.error.js';
import HttpStatusCode from '../../../utils/http.status.codes.js';
import adminService from '../services/admin.service.js';

export const AdminAuthController = {
    login: catchAsync(async (req, res) => {
        try {
            const { email, password } = req.body;

            if (!email || !password) {
                throw new CustomError('Email and password are required', HttpStatusCode.BAD_REQUEST, true);
            }

            const result = await adminService.login(email, password);

            return sendSuccess(res, result.message, result.data, HttpStatusCode.OK);
        } catch (error) {
            throw error;
        }
    }),

    verifyToken: catchAsync(async (req, res) => {
        try {
            // req.admin is set by authenticateAdmin middleware
            // It's a plain object from adminResult.data (toJSON())
            const adminId = req.admin?.id || req.admin?._id;
            if (!adminId) {
                throw new CustomError('Admin ID not found in token', HttpStatusCode.UNAUTHORIZED, true);
            }
            const result = await adminService.verifyToken(adminId);

            return sendSuccess(res, 'Token is valid', result.data, HttpStatusCode.OK);
        } catch (error) {
            throw error;
        }
    }),

    refreshToken: catchAsync(async (req, res) => {
        try {
            const refreshToken = req.cookies.refreshToken || req.body.refreshToken;

            if (!refreshToken) {
                throw new CustomError('Refresh token is required', HttpStatusCode.BAD_REQUEST, true);
            }

            const { jwtUtils } = await import('../../../utils/jwt.js');
            const decoded = jwtUtils.verifyAdminRefreshToken(refreshToken);

            // Import Admin model to get the document
            const Admin = (await import('../models/admin.model.js')).default;
            const adminDoc = await Admin.findById(decoded.id);
            
            if (!adminDoc || !adminDoc.isActive) {
                throw new CustomError('Admin not found or inactive', HttpStatusCode.UNAUTHORIZED, true);
            }

            const tokens = jwtUtils.generateAdminTokenPair(adminDoc);

            // Set cookies
            const cookieOptions = {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
                path: '/'
            };

            res.cookie('accessToken', tokens.accessToken, {
                ...cookieOptions,
                maxAge: 24 * 60 * 60 * 1000 // 24 hours
            });

            res.cookie('refreshToken', tokens.refreshToken, {
                ...cookieOptions,
                maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
            });

            return sendSuccess(res, 'Token refreshed successfully', {
                admin: adminDoc.toJSON(),
                accessToken: tokens.accessToken,
                refreshToken: tokens.refreshToken
            }, HttpStatusCode.OK);
        } catch (error) {
            throw error;
        }
    })
};

export default AdminAuthController;

