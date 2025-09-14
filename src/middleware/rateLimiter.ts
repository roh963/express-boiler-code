import rateLimit from 'express-rate-limit';

export const authLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 5,
  message: {
    error: {
      message: 'Too many auth requests, please try again later.',
      code: 429,
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const writeLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 10 minutes
  max: 5,
  message: {
    error: {
      message: 'Too many write requests, please try again later.',
      code: 429,
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});
