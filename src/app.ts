import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { config } from './utils/config';
import { errorHandler, notFoundHandler } from './middlewares/error.middleware';
import healthRouter from './routes/health.route';
import { Request, Response } from 'express';

const app = express();

// Security Middlewares
app.use(helmet());
app.use(
  cors({
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      if (!origin || config.corsWhitelist.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  })
);
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
  })
);

// Body parser
app.use(express.json());

// Logger (dev only)
if (config.env === 'development') {
  app.use(morgan('dev', { 
    skip: (req: Request, res: Response) => false,
  }));
}

// Routes
app.use('/health', healthRouter);

// 404 Handler
app.use(notFoundHandler);

// Error Handler
app.use(errorHandler);

export default app;
