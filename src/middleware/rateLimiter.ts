import rateLimit from 'express-rate-limit';

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
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
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    error: {
      message: 'Too many write requests, please try again later.',
      code: 429,
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});
