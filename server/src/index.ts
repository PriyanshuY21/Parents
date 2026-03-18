import 'dotenv/config';
import express, { Application, Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';

import logger from './config/logger';
import authRoutes    from './routes/auth';
import analyzeRoutes from './routes/analyze';
import historyRoutes from './routes/history';

const app: Application = express();
const PORT = parseInt(process.env.PORT ?? '4000', 10);

app.locals.logger = logger;

// ── Security headers ──────────────────────────────────────────────────────────
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc:   ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        fontSrc:    ["'self'", 'https://fonts.gstatic.com'],
        imgSrc:     ["'self'", 'data:', 'blob:'],
        scriptSrc:  ["'self'"],
        connectSrc: ["'self'"],
      },
    },
    crossOriginEmbedderPolicy: false,
  })
);

// ── CORS ──────────────────────────────────────────────────────────────────────
app.use(
  cors({
    origin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// ── Global rate limit ─────────────────────────────────────────────────────────
app.use(
  rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS ?? '900000'),
    max: parseInt(process.env.RATE_LIMIT_MAX ?? '100'),
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests, please try again later.' },
  })
);

// ── Body parsers ──────────────────────────────────────────────────────────────
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: false, limit: '1mb' }));

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'HealthLens API',
    timestamp: new Date().toISOString(),
    auth: 'Ed25519 / EdDSA asymmetric JWT',
    hipaa_notice: 'No PHI is stored or logged by this service.',
  });
});

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/auth',    authRoutes);
app.use('/api/analyze', analyzeRoutes);
app.use('/api/history', historyRoutes);

// ── 404 ───────────────────────────────────────────────────────────────────────
app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: 'Route not found.' });
});

// ── Global error handler ──────────────────────────────────────────────────────
app.use((err: Error & { status?: number; expose?: boolean }, req: Request, res: Response, _next: NextFunction) => {
  logger.error({ message: err.message, stack: err.stack, path: req.path });
  res.status(err.status ?? 500).json({
    error: err.expose ? err.message : 'Internal server error.',
  });
});

app.listen(PORT, () => {
  logger.info(`HealthLens server running on port ${PORT}`);
  logger.info('Auth: Ed25519 asymmetric JWT (jose library)');
  logger.info('HIPAA notice: No PHI is persisted to any database.');
});

export default app;
