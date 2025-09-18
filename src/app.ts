//app.ts

import './types/express/index';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import { config } from './utils/config';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { authLimiter, writeLimiter } from './middleware/rateLimiter';
import healthRouter from './routes/health.route';
import feedbackRouter from './routes/feedback.route';
import { connectDB } from './db';
import authRoutes from './routes/auth.route';

const app = express();

connectDB();

// Security Middlewares
app.use(helmet());

// CORS setup
const allowedOrigins = (process.env.CORS_ORIGINS || '')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  }),
);

// Rate limiting
app.use('/auth', authLimiter);
app.use(['/', '/api'], (req, res, next) => {
  if (['POST', 'PUT', 'DELETE'].includes(req.method)) {
    return writeLimiter(req, res, next);
  }
  next();
});

// Body parser
app.use(express.json());

// Logger (dev only)
if (config.env === 'development') {
  app.use(morgan('dev'));
}

// Routes
app.use('/health', healthRouter);
app.use('/auth', authRoutes);
app.use('/api/feedback', feedbackRouter);

app.get("/", (req, res) => {
  res.send("🚀 Express + TypeScript backend is live!");
});

// 404 Handler
app.use(notFoundHandler);

// Error Handler
app.use(errorHandler);

export default app;
