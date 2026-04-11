//auth.middleware.js

import { jwtUtils } from '../../utils/jwt.js';
import { userService } from '../../modules/users/services/user.service.js';
import CustomError from '../../utils/custom.error.js';
import catchAsync from './catch.async.js';

export const authenticateToken = catchAsync(async (req, res, next) => {
    console.log("req.cookies.accessToken: ", req.cookies.accessToken);
    console.log("req.cookies: ", req.cookies);
    console.log("Authorization header: ", req.headers.authorization);

    let token = null;

    // First priority: Check Authorization header (for requests from frontend axios interceptor)
    if (req.headers.authorization?.startsWith('Bearer ')) {
        token = req.headers.authorization.split(' ')[1];
        console.log("Token from Authorization header: ", token);
    }
    
    // Second priority: Fallback to cookies (for direct browser requests)
    if (!token) {
        token = req.cookies.accessToken;
        console.log("Token from cookies: ", token);
    }

    if (!token) {
        throw new CustomError('Access token required', 401);
    }

    try {
        const decoded = jwtUtils.verifyAccessToken(token);
        console.log("_decoded: ", decoded);
        
        const user = await userService.findByEmail(decoded.email);
        if (!user || !user.isActive) {
            throw new CustomError('User not found or inactive', 401);
        }

        req.user = user;
        next();
    } catch (error) {
        console.log("Authentication error: ", error);
        
        if (error.name === 'TokenExpiredError') {
            throw new CustomError('Access token expired', 401);
        }
        
        // Handle JWT malformed error
        if (error.name === 'JsonWebTokenError') {
            throw new CustomError('Invalid access token format', 401);
        }
        
        throw new CustomError('Invalid access token', 401);
    }
});

export const requireRole = (roles) => {
    return (req, res, next) => {
        if (!req.user) {
            throw new CustomError('Authentication required', 401);
        }

        if (!roles.includes(req.user.role)) {
            throw new CustomError('Insufficient permissions', 403);
        }

        next();
    };
};

// Alias for authenticateToken
export const authMiddleware = authenticateToken;

/**
 * Sets req.user when a valid Bearer/cookie token is present; otherwise req.user = null (no error).
 */
export const optionalAuthenticateToken = catchAsync(async (req, res, next) => {
    req.user = null;
    let token = null;
    if (req.headers.authorization?.startsWith("Bearer ")) {
        token = req.headers.authorization.split(" ")[1];
    }
    if (!token) {
        token = req.cookies?.accessToken;
    }
    if (!token) {
        return next();
    }
    try {
        const decoded = jwtUtils.verifyAccessToken(token);
        const user = await userService.findByEmail(decoded.email);
        if (user && user.isActive) {
            req.user = user;
        }
    } catch {
        req.user = null;
    }
    next();
});

/**
 * After optionalAuthenticateToken: req.owner = { userId } or { guestId } from X-Guest-Id.
 * Guests must send a stable id (e.g. UUID) — same header for all cart/wishlist calls.
 */
export const resolveUserOrGuest = catchAsync(async (req, res, next) => {
    const uid = req.user?._id ?? req.user?.id;
    const raw = req.headers["x-guest-id"] ?? req.headers["X-Guest-Id"];
    const guestId = typeof raw === "string" ? raw.trim() : "";

    if (uid) {
        req.owner = { userId: uid, guestId: null };
        return next();
    }
    if (guestId.length >= 8 && guestId.length <= 128) {
        req.owner = { userId: null, guestId };
        return next();
    }
    throw new CustomError(
        "Sign in, or send header X-Guest-Id with a stable guest id (8–128 chars, e.g. UUID from localStorage).",
        400,
        true
    );
});