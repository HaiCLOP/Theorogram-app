import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import routes from './routes';
import { startRescanJob } from './jobs/rescanTheories';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
    origin: FRONTEND_URL,
    credentials: true,
}));

// Request logging
app.use(morgan('combined'));

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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

// Error handler
app.use((err: any, req: Request, res: Response, next: any) => {
    console.error('Server error:', err);
    res.status(500).json({
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? err.message : undefined,
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
