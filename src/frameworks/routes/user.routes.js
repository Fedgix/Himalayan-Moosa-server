import { Router } from 'express';
import { userController } from '../../modules/users/controllers/user.controller.js';
import { authenticateToken, requireRole } from '../middlewares/auth.middleware.js';
import { validateSignup, validateLogin, validateForgotPassword, validateResetPassword } from '../middlewares/auth.validation.js';

const userRouter = Router();

// Public routes – email/password
userRouter.post('/auth/signup', validateSignup, userController.signup);
userRouter.post('/auth/login', validateLogin, userController.login);
userRouter.post('/auth/forgot-password', validateForgotPassword, userController.forgotPassword);
userRouter.post('/auth/reset-password', validateResetPassword, userController.resetPassword);

// Public routes – Google OAuth
userRouter.post('/auth/google/url', userController.generateGoogleAuthUrl);
userRouter.get('/auth/google/callback', userController.googleCallback);
userRouter.post('/auth/refresh-token', userController.refreshToken);

// Temporary test route (always available)
userRouter.post('/auth/test/decode-oauth', userController.decodeOAuthResponse);

// Simple OAuth callback processor
userRouter.post('/auth/process-callback', userController.processOAuthCallback);
// Protected routes
userRouter.get('/profile', authenticateToken, userController.getProfile);
userRouter.patch('/profile', authenticateToken, userController.updateProfile);
userRouter.post('/logout', userController.logout);
userRouter.get('/verify-token', authenticateToken, userController.verifyToken);

// Admin only routes
userRouter.get('/admin/users', 
    authenticateToken, 
    requireRole(['admin']), 
    (req, res) => {
        res.json({ message: 'Admin access granted' });
    }
);




export default userRouter;