import dotenv from 'dotenv';

dotenv.config({
    path: process.env.NODE_ENV === 'production' ? '.env.production' : '.env.development',
});

/** Single source of truth for all email configuration. Reusable across app. */
export const emailConfig = {
    smtp: {
        host: process.env.EMAIL_HOST || 'smtp.gmail.com',
        port: Number(process.env.EMAIL_PORT) || 587,
        secure: process.env.EMAIL_SECURE === 'true',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    },
    addresses: {
        admin: process.env.ADMIN_EMAIL,
        from: process.env.FROM_EMAIL,
        fromName: process.env.FROM_NAME || 'App'
    },
    app: {
        baseUrl: process.env.BASE_URL || 'https://rizo-server.onrender.com',
        name: process.env.APP_NAME || process.env.FROM_NAME || 'App',
        rateLimitDelay: 500
    },
    templates: {
        contact: {
            subject: (name) => `🔔 New Contact Form Submission - ${name}`,
            defaultStatus: 'Pending'
        },
        productAlert: {
            subject: (productName) => `🎉 New Product Alert - ${productName}`,
            placeholderImage: 'https://via.placeholder.com/400x400?text=Product+Image'
        },
        orderConfirmation: {
            subject: (orderId) => `📦 Order Confirmation - Order #${orderId}`,
            defaultStatus: 'Processing',
            defaultDelivery: '5-7 business days'
        },
        orderNotification: {
            subject: (orderId) => `🛒 New Order Received - Order #${orderId}`,
            defaultPaymentMethod: 'Not specified',
            defaultNotes: 'No special instructions'
        },
        passwordReset: {
            subject: (appName) => `${appName} – Password reset OTP`,
            otpExpiryMinutes: 10
        }
    }
};