// src/validators/authValidator.ts
import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/ApiError';

export const registerSchema = z.object({
  name: z.string().min(3, { message: 'Name must be at least 3 characters' }),
  email: z.string().email({ message: 'Invalid email address' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
});

export const loginSchema = z.object({
  email: z.string().email({ message: 'Invalid email address' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
});

export function validateRegister(req: Request, res: Response, next: NextFunction) {
  const result = registerSchema.safeParse(req.body);
  if (result.success) {
    req.body = result.data;
    return next();
  }
  const errors = result.error.issues.map((e) => ({
    field: e.path[0],
    message: e.message,
  }));
  throw new ApiError(400, 'Validation failed', errors);
}

export function validateLogin(req: Request, res: Response, next: NextFunction) {
  const result = loginSchema.safeParse(req.body);
  if (result.success) {
    req.body = result.data;
    return next();
  }
  const errors = result.error.issues.map((e) => ({
    field: e.path[0],
    message: e.message,
  }));
  throw new ApiError(400, 'Validation failed', errors);
}
