import dotenv from 'dotenv';

dotenv.config({
    path: process.env.NODE_ENV === 'production' ? '.env.production' : '.env.development',
});

export const config = {
    PORT: process.env.PORT || 3000,
    FRONTEND_URL: process.env.FRONTEND_URL,
    MONGO_URI: process.env.MONGO_URI,
    JWT: {
        ACCESS_SECRET: process.env.JWT_ACCESS_SECRET,
        REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,
        ADMIN_ACCESS_SECRET: process.env.JWT_ADMIN_ACCESS_SECRET || process.env.JWT_ACCESS_SECRET,
        ADMIN_REFRESH_SECRET: process.env.JWT_ADMIN_REFRESH_SECRET || process.env.JWT_REFRESH_SECRET,
        ACCESS_EXPIRES_IN: '30m',
        REFRESH_EXPIRES_IN: '7d',
        ADMIN_ACCESS_EXPIRES_IN: '24h',
        ADMIN_REFRESH_EXPIRES_IN: '7d'
    },
    GOOGLE: {
        CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
        CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
        CALLBACK_URL: process.env.GOOGLE_CALLBACK_URL
    },
    RAZORPAY:{
        RAZORPAY_KEY_ID:  process.env.RAZORPAY_KEY_ID,
        RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET
    },
    CLOUDINARY: {
        CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
        API_KEY: process.env.CLOUDINARY_API_KEY,
        API_SECRET: process.env.CLOUDINARY_API_SECRET
    }
};
