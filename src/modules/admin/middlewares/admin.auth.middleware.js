import { jwtUtils } from '../../../utils/jwt.js';
import adminService from '../services/admin.service.js';
import CustomError from '../../../utils/custom.error.js';
import catchAsync from '../../../frameworks/middlewares/catch.async.js';

export const authenticateAdmin = catchAsync(async (req, res, next) => {
    console.log("Admin auth - req.cookies.accessToken: ", req.cookies.accessToken);
    console.log("Admin auth - req.cookies: ", req.cookies);
    console.log("Admin auth - Authorization header: ", req.headers.authorization);

    let token = null;

    // First priority: Check Authorization header
    if (req.headers.authorization?.startsWith('Bearer ')) {
        token = req.headers.authorization.split(' ')[1];
        console.log("Admin token from Authorization header: ", token);
    }
    
    // Second priority: Fallback to cookies
    if (!token) {
        token = req.cookies.accessToken;
        console.log("Admin token from cookies: ", token);
    }

    if (!token) {
        throw new CustomError('Admin access token required', 401);
    }

    try {
        // Verify admin token using admin JWT secret
        const decoded = jwtUtils.verifyAdminAccessToken(token);
        console.log("Admin decoded token: ", decoded);

        // Check if token has admin type
        if (decoded.type !== 'admin') {
            throw new CustomError('Invalid admin token', 401);
        }

        // Get admin from database
        const adminResult = await adminService.getAdminById(decoded.id);
        
        if (!adminResult.success || !adminResult.data) {
            throw new CustomError('Admin not found', 401);
        }

        const admin = adminResult.data;

        if (!admin.isActive) {
            throw new CustomError('Admin account is deactivated', 401);
        }

        // Attach admin to request
        req.admin = admin;
        next();
    } catch (error) {
        console.log("Admin authentication error: ", error);
        
        if (error.name === 'TokenExpiredError') {
            throw new CustomError('Admin access token expired', 401);
        }
        
        if (error.name === 'JsonWebTokenError') {
            throw new CustomError('Invalid admin access token format', 401);
        }
        
        throw error;
    }
});

export const requireAdminRole = (roles = ['admin', 'super_admin']) => {
    return (req, res, next) => {
        if (!req.admin) {
            throw new CustomError('Admin authentication required', 401);
        }

        if (!roles.includes(req.admin.role)) {
            throw new CustomError('Insufficient admin permissions', 403);
        }

        next();
    };
};

