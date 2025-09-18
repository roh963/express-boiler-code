// src/validators/feedbackValidator.ts
import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/ApiError';

export const CreateFeedbackSchema = z.object({
  name: z.string().min(3, { message: 'Name must be at least 3 characters' }),
  email: z.string().email({ message: 'Invalid email format' }),
  message: z.string().min(10, { message: 'Message must be at least 10 characters' }),
});

export const UpdateFeedbackSchema = z.object({
  name: z.string().min(3, { message: 'Name must be at least 3 characters' }).optional(),
  email: z.string().email({ message: 'Invalid email format' }).optional(),
  message: z.string().min(10, { message: 'Message must be at least 10 characters' }).optional(),
});

export function validateResource(schema: z.ZodSchema<any>) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (result.success) {
      req.body = result.data;
      return next();
    }
    const errors = result.error.issues.map((e) => ({
      field: e.path[0],
      message: e.message,
    }));
    throw new ApiError(400, 'Validation failed', errors);
  };
}
