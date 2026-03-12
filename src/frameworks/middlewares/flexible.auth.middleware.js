// Flexible authentication middleware that supports both user and admin tokens
import { jwtUtils } from '../../utils/jwt.js';
import { userService } from '../../modules/users/services/user.service.js';
import adminService from '../../modules/admin/services/admin.service.js';
import CustomError from '../../utils/custom.error.js';
import catchAsync from './catch.async.js';

export const authenticateFlexible = catchAsync(async (req, res, next) => {
    let token = null;

    // First priority: Check Authorization header
    if (req.headers.authorization?.startsWith('Bearer ')) {
        token = req.headers.authorization.split(' ')[1];
    }
    
    // Second priority: Fallback to cookies
    if (!token) {
        token = req.cookies.accessToken;
    }

    if (!token) {
        throw new CustomError('Access token required', 401);
    }

    try {
        // Try to verify as admin token first
        try {
            const decoded = jwtUtils.verifyAdminAccessToken(token);
            
            // If token has admin type, authenticate as admin
            if (decoded.type === 'admin') {
                const adminResult = await adminService.getAdminById(decoded.id);
                
                if (!adminResult.success || !adminResult.data) {
                    throw new CustomError('Admin not found', 401);
                }

                const admin = adminResult.data;

                if (!admin.isActive) {
                    throw new CustomError('Admin account is deactivated', 401);
                }

                req.admin = admin;
                req.user = null; // Clear user if admin
                return next();
            }
        } catch (adminError) {
            // If admin token verification fails, try user token
            // Continue to user authentication below
        }

        // Try to verify as user token
        const decoded = jwtUtils.verifyAccessToken(token);
        
        const user = await userService.findByEmail(decoded.email);
        if (!user || !user.isActive) {
            throw new CustomError('User not found or inactive', 401);
        }

        req.user = user;
        req.admin = null; // Clear admin if user
        return next();
    } catch (error) {
        console.log("Flexible authentication error: ", error);
        
        if (error.name === 'TokenExpiredError') {
            throw new CustomError('Access token expired', 401);
        }
        
        if (error.name === 'JsonWebTokenError') {
            throw new CustomError('Invalid access token format', 401);
        }
        
        throw error;
    }
});

