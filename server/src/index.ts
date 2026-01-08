import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import routes from './routes';
import { startRescanJob } from './jobs/rescanTheories';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

// Security middleware
app.use(helmet());

// Rate limiting - SECURITY FIX
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // 100 requests per window
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests, please try again later' },
});
app.use(limiter);

// Stricter rate limit for auth endpoints
export const authLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 5, // Only 5 attempts per minute
    message: { error: 'Too many authentication attempts, please try again later' },
});

// CORS configuration - validate origin
const allowedOrigins = [FRONTEND_URL, 'http://localhost:3000'];
app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (mobile apps, Postman) in dev
        if (!origin && process.env.NODE_ENV !== 'production') {
            return callback(null, true);
        }
        if (origin && allowedOrigins.includes(origin)) {
            return callback(null, true);
        }
        callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
}));

// Request logging (reduced in production)
if (process.env.NODE_ENV === 'production') {
    app.use(morgan('short'));
} else {
    app.use(morgan('combined'));
}

// Body parsing with size limit - SECURITY FIX
app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: true, limit: '100kb' }));

// Health check
app.get('/health', (req: Request, res: Response) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api', routes);

// 404 handler
app.use((req: Request, res: Response) => {
    res.status(404).json({ error: 'Route not found' });
});

// Error handler - SECURITY: Never expose internal errors
app.use((err: any, req: Request, res: Response, next: any) => {
    // Log the full error for debugging
    console.error('Server error:', err);

    // Return generic message to client
    res.status(500).json({
        error: 'Internal server error',
        // Only in development, provide request ID for debugging
        requestId: process.env.NODE_ENV === 'development' ? Date.now().toString(36) : undefined,
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`
╔═══════════════════════════════════════╗
║         THEOROGRAM SERVER             ║
║   Ideas over people. Reason over     ║
║   reaction. Signal over noise.       ║
╚═══════════════════════════════════════╝

Server running on port ${PORT}
Frontend URL: ${FRONTEND_URL}
Environment: ${process.env.NODE_ENV || 'development'}
  `);

    // Start background jobs
    startRescanJob();
});

export default app;
