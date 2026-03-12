import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser'; 
import { errorHandler } from '../middlewares/error.handler.js';
import indexRouter from '../routes/index.routes.js';
import { config } from '../../config/env.js';
import morgan from 'morgan';


const app = express();

const allowedOrigins = [
    config.FRONTEND_URL,
    'http://localhost:3000',
    'http://localhost:5173',
    'http://localhost:5000',
    'https://admin.janathagarage.in',
    'https://www.janathagarage.in',
].filter(Boolean);

// CORS configuration - Simplified and permissive for development
const corsOptions = {
    origin: function (origin, callback) {
        // Allow requests with no origin (mobile apps, postman, etc.)
        if (!origin) {
            return callback(null, true);
        }
        
        // In development, allow all localhost origins
        if (process.env.NODE_ENV !== 'production') {
            if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
                return callback(null, true);
            }
        }
        
        // Check allowed origins
        if (allowedOrigins.includes(origin)) {
            return callback(null, true);
        }
        
        // Default deny
        callback(new Error('Not allowed by CORS'));
    },
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'PUT', 'OPTIONS'],
    allowedHeaders: [
        'Content-Type', 
        'Authorization', 
        'X-Requested-With',
        'Accept',
        'Origin',
        'Access-Control-Request-Method',
        'Access-Control-Request-Headers'
    ],
    exposedHeaders: ['Authorization'],
    credentials: true,
    optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

// Basic middleware (after CORS)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Enhanced Morgan logging with custom format
morgan.token('cookies', (req) => {
    return req.cookies ? JSON.stringify(req.cookies) : 'none';
});

morgan.token('body', (req) => {
    if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
        // Don't log sensitive data like passwords
        const body = { ...req.body };
        if (body.password) body.password = '[HIDDEN]';
        if (body.refreshToken) body.refreshToken = `[TOKEN:${body.refreshToken.substring(0, 20)}...]`;
        return JSON.stringify(body);
    }
    return '';
});

morgan.token('headers', (req) => {
    const importantHeaders = {
        'origin': req.headers.origin,
        'referer': req.headers.referer,
        'user-agent': req.headers['user-agent']?.substring(0, 50) + '...',
        'authorization': req.headers.authorization ? `Bearer ${req.headers.authorization.substring(7, 27)}...` : 'none',
        'cookie': req.headers.cookie ? `[${req.headers.cookie.length} chars]` : 'none',
        'content-type': req.headers['content-type']
    };
    return JSON.stringify(importantHeaders);
});

// Custom Morgan format for detailed logging
const detailedFormat = ':date[iso] :method :url :status :response-time ms | Origin: :headers | Cookies: :cookies | Body: :body';

app.use(morgan(detailedFormat));

// Routes
app.use('/api', indexRouter);

// Error handling
app.use(errorHandler);

export default app;