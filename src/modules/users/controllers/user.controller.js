import { userService } from '../services/user.service.js';
import { oauthStateService } from '../services/oauth.state.service.js';
import { jwtUtils } from '../../../utils/jwt.js';
import { sendSuccess } from '../../../utils/response.handler.js';
import catchAsync from '../../../frameworks/middlewares/catch.async.js';
import CustomError from '../../../utils/custom.error.js';
import { config } from '../../../config/env.js';

// Store for state validation (in production, use Redis)
const stateStore = new Map();

const setAuthCookies = (res, tokens, user) => {
    const cookieOptions = {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        path: '/',
        domain: process.env.NODE_ENV === 'production' ? '.onrender.com' : undefined
    };
    res.cookie('accessToken', tokens.accessToken, { ...cookieOptions, maxAge: 30 * 60 * 1000 });
    res.cookie('refreshToken', tokens.refreshToken, { ...cookieOptions, maxAge: 7 * 24 * 60 * 60 * 1000 });
};

export const userController = {
    // Signup with email and password
    signup: catchAsync(async (req, res, next) => {
        const user = await userService.signup(req.body);
        const tokens = jwtUtils.generateTokenPair(user);
        setAuthCookies(res, tokens, user);
        sendSuccess(res, 'Account created successfully', {
            user: user.toJSON(),
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken
        });
    }),

    // Login with email and password
    login: catchAsync(async (req, res, next) => {
        const user = await userService.login(req.body.email, req.body.password);
        const tokens = jwtUtils.generateTokenPair(user);
        setAuthCookies(res, tokens, user);
        sendSuccess(res, 'Logged in successfully', {
            user: user.toJSON(),
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken
        });
    }),

    // Forgot password: send OTP to email (only if account exists with password)
    forgotPassword: catchAsync(async (req, res, next) => {
        await userService.forgotPassword(req.body.email);
        sendSuccess(res, 'If an account exists with this email, you will receive an OTP shortly.');
    }),

    // Reset password: verify OTP and set new password
    resetPassword: catchAsync(async (req, res, next) => {
        const { email, otp, newPassword, confirmPassword } = req.body;
        await userService.resetPassword(email, otp, newPassword, confirmPassword);
        sendSuccess(res, 'Password has been reset successfully. You can now log in with your new password.');
    }),

    // Generate Google OAuth URL with proper state management
    generateGoogleAuthUrl: catchAsync(async (req, res, next) => {
        const { endpoint } = req.body || {};
        
        try {
            // Create state in database (5 minute expiry)
            const { state, nonce } = await oauthStateService.createState(endpoint || '', 5);
            
            const params = new URLSearchParams({
                client_id: config.GOOGLE.CLIENT_ID,
                redirect_uri: config.GOOGLE.CALLBACK_URL,
                response_type: 'code',
                scope: 'openid profile email',
                state: state,
                access_type: 'offline',
                prompt: 'consent'
            });

            const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;

            sendSuccess(res, 'Google auth URL generated successfully', {
                authUrl: googleAuthUrl,
                state: state // Send to frontend for reference
            });
        } catch (error) {
            throw new CustomError('Failed to generate Google auth URL', 500, true, error.message);
        }
    }),

    // Handle Google OAuth callback with proper validation
    googleCallback: catchAsync(async (req, res, next) => {
        const { code, state, error } = req.query;
    
        // Handle OAuth errors
        if (error) {
            console.error('OAuth error:', error);
            return res.redirect(`${config.FRONTEND_URL}/auth/error?error=${encodeURIComponent(error)}`);
        }
    
        // Validate required parameters
        if (!code || !state) {
            return res.redirect(`${config.FRONTEND_URL}/auth/error?error=missing_parameters`);
        }
    
        try {
            // Validate and consume state from database
            const storedState = await oauthStateService.consumeState(state);
            
            // Exchange authorization code for tokens
            const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                    client_id: config.GOOGLE.CLIENT_ID,
                    client_secret: config.GOOGLE.CLIENT_SECRET,
                    code: code,
                    grant_type: 'authorization_code',
                    redirect_uri: config.GOOGLE.CALLBACK_URL,
                }),
            });
            
            if (!tokenResponse.ok) {
                throw new Error(`Token exchange failed: ${tokenResponse.status}`);
            }
    
            const tokenData = await tokenResponse.json();
    
            if (!tokenData.access_token) {
                throw new Error('No access token received from Google');
            }
    
            // Get user profile using OpenID Connect userinfo endpoint
            const profileResponse = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
                headers: {
                    'Authorization': `Bearer ${tokenData.access_token}`,
                },
            });
    
            if (!profileResponse.ok) {
                throw new Error(`Profile fetch failed: ${profileResponse.status}`);
            }
    
            const profile = await profileResponse.json();
    
            if (!profile.sub) {
                throw new Error('Invalid user profile received from Google');
            }
    
            // Find or create user in database
            const user = await userService.findOrCreateGoogleUser({
                googleId: profile.sub,
                name: profile.name,
                email: profile.email,
                avatar: profile.picture
            });
    
            // Generate JWT tokens
            const tokens = jwtUtils.generateTokenPair(user);
    
            // Set regular cookies (accessible via JavaScript)
            const cookieOptions = {
                httpOnly: false, // Changed to false to allow JavaScript access
                secure: process.env.NODE_ENV === 'production', // Only secure in production
                sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', // 'none' for cross-origin in production
                path: '/',
                domain: process.env.NODE_ENV === 'production' ? '.onrender.com' : undefined // Set domain for production
            };
            
            res.cookie('accessToken', tokens.accessToken, {
                ...cookieOptions,
                maxAge: 30 * 60 * 1000 // 30 minutes
            });
            
            res.cookie('refreshToken', tokens.refreshToken, {
                ...cookieOptions,
                maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
            });

            // Prepare user data for frontend (exclude sensitive info) and include tokens
            const userData = {
                id: user.id,
                name: user.name,
                email: user.email,
                avatar: user.avatar,
                // Add tokens for frontend developer flexibility
                accessToken: tokens.accessToken,
                refreshToken: tokens.refreshToken,
                // Add any other non-sensitive user fields you need
            };
    
            // Encode user data as base64 to safely pass in URL
            const encodedUserData = Buffer.from(JSON.stringify(userData)).toString('base64');
            
            // Redirect to frontend with user data and success flag
            const redirectPath = storedState.endpoint || '';
            const separator = redirectPath.includes('?') ? '&' : '?';
            
            res.redirect(`${config.FRONTEND_URL}/${redirectPath}${separator}auth=success&user=${encodedUserData}`);
    
        } catch (error) {
            console.error('Google OAuth callback error:', error);
            
            // Handle specific OAuth state errors
            if (error.message?.includes('Invalid or expired state') || 
                error.message?.includes('State has expired')) {
                return res.redirect(`${config.FRONTEND_URL}/auth/error?error=invalid_state`);
            }
            
            res.redirect(`${config.FRONTEND_URL}/auth/error?error=${encodeURIComponent('authentication_failed')}`);
        }
    }),

    // Get current user profile
    getProfile: catchAsync(async (req, res, next) => {
        if (!req.user) {
            throw new CustomError('User not authenticated', 401);
        }

        const user = await userService.findById(req.user.id);
        sendSuccess(res, 'Profile retrieved successfully', { user: user.toJSON() });
    }),

    // Update user profile
    updateProfile: catchAsync(async (req, res, next) => {
        if (!req.user) {
            throw new CustomError('User not authenticated', 401);
        }

        const updatedUser = await userService.updateProfile(req.user.id, req.body);
        sendSuccess(res, 'Profile updated successfully', { user: updatedUser.toJSON() });
    }),

    // Logout user with cookie cleanup
    logout: catchAsync(async (req, res, next) => {
        // Clear cookies
        res.clearCookie('accessToken');
        res.clearCookie('refreshToken');
        
        sendSuccess(res, 'Logged out successfully');
    }),

    // Refresh access token
    refreshToken: catchAsync(async (req, res, next) => {
        const refreshToken = req.cookies.refreshToken || req.body.refreshToken;
        console.log("_refreshToken: ", refreshToken);
        console.log("All cookies: ", req.cookies);
        
        if (!refreshToken) {
            throw new CustomError('Refresh token is required', 400);
        }
    
        const decoded = jwtUtils.verifyRefreshToken(refreshToken);
        console.log("_decoded: ", decoded);
        
        const user = await userService.findByEmail(decoded.email);
    
        if (!user || !user.isActive) {
            throw new CustomError('User not found', 404);
        }
    
        const tokens = jwtUtils.generateTokenPair(user);
    
        // Updated cookie options - regular cookies accessible via JavaScript
        const cookieOptions = {
            httpOnly: false, // Changed to false to allow JavaScript access
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
            path: '/',
            domain: process.env.NODE_ENV === 'production' ? '.onrender.com' : undefined
        };
    
        res.cookie('accessToken', tokens.accessToken, {
            ...cookieOptions,
            maxAge: 15 * 60 * 1000
        });
    
        res.cookie('refreshToken', tokens.refreshToken, {
            ...cookieOptions,
            maxAge: 7 * 24 * 60 * 60 * 1000
        });
    
        sendSuccess(res, 'Token refreshed successfully', {
            user: user.toJSON(),
            // Include tokens in response for frontend developer flexibility
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken
        });
    }),

    // Verify token endpoint
    verifyToken: catchAsync(async (req, res, next) => {
        if (!req.user) {
            throw new CustomError('Invalid token', 401);
        }

        sendSuccess(res, 'Token is valid', { user: req.user.toJSON() });
    }),

    // Development only: Decode OAuth response
    decodeOAuthResponse: catchAsync(async (req, res, next) => {
        const { callbackUrl } = req.body;

        if (!callbackUrl) {
            throw new CustomError('Callback URL is required', 400);
        }

        try {
            // Parse the URL to extract query parameters
            const url = new URL(callbackUrl);
            const userParam = url.searchParams.get('user');
            const authStatus = url.searchParams.get('auth');

            if (!userParam) {
                throw new CustomError('No user data found in callback URL', 400);
            }

            if (authStatus !== 'success') {
                throw new CustomError('Authentication was not successful', 400);
            }

            // Decode the base64 user data
            const decodedData = JSON.parse(Buffer.from(userParam, 'base64').toString());

            // Validate the decoded data
            if (!decodedData.id || !decodedData.email || !decodedData.accessToken || !decodedData.refreshToken) {
                throw new CustomError('Invalid user data structure', 400);
            }

            // Return the decoded data
            sendSuccess(res, 'OAuth response decoded successfully', {
                user: {
                    id: decodedData.id,
                    name: decodedData.name,
                    email: decodedData.email,
                    avatar: decodedData.avatar
                },
                tokens: {
                    accessToken: decodedData.accessToken,
                    refreshToken: decodedData.refreshToken
                },
                originalUrl: callbackUrl
            });

        } catch (error) {
            if (error instanceof CustomError) {
                throw error;
            }
            
            console.error('Error decoding OAuth response:', error);
            throw new CustomError('Failed to decode OAuth response', 500);
        }
    }),


    // Simple OAuth callback processor - extracts tokens from callback URL
    processOAuthCallback: catchAsync(async (req, res, next) => {
        const { callbackUrl } = req.body;

        if (!callbackUrl) {
            throw new CustomError('Callback URL is required', 400);
        }

        try {
            console.log('🔄 Processing OAuth callback URL...');
            
            // Make a request to the callback URL to get the tokens
            const response = await fetch(callbackUrl, {
                method: 'GET',
                redirect: 'manual' // Don't follow redirects automatically
            });

            if (response.status >= 300 && response.status < 400) {
                // Handle redirect
                const redirectUrl = response.headers.get('location');
                console.log('📍 Redirect URL:', redirectUrl);
                
                if (redirectUrl && redirectUrl.includes('user=')) {
                    const url = new URL(redirectUrl);
                    const userParam = url.searchParams.get('user');
                    const authStatus = url.searchParams.get('auth');
                    
                    if (userParam && authStatus === 'success') {
                        const decodedData = JSON.parse(Buffer.from(userParam, 'base64').toString());
                        
                        console.log('✅ Tokens extracted successfully!');
                        
                        return sendSuccess(res, 'OAuth callback processed successfully', {
                            user: {
                                id: decodedData.id,
                                name: decodedData.name,
                                email: decodedData.email,
                                avatar: decodedData.avatar
                            },
                            tokens: {
                                accessToken: decodedData.accessToken,
                                refreshToken: decodedData.refreshToken
                            },
                            originalCallbackUrl: callbackUrl,
                            redirectUrl: redirectUrl
                        });
                    }
                }
            }

            throw new CustomError('No user data found in OAuth callback', 400);

        } catch (error) {
            console.error('❌ Error processing OAuth callback:', error);
            
            if (error instanceof CustomError) {
                throw error;
            }
            
            throw new CustomError('Failed to process OAuth callback', 500, true, error.message);
        }
    })
};