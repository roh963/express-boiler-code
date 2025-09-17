import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/ApiError';

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      success: err.success || false,
      message: err.message,
      errors: err.errors,
    });
  }
  res.status(500).json({
    success: false,
    message: 'Internal server error',
  });
};

export function notFoundHandler(req: Request, res: Response, next: NextFunction) {
  res.status(404).json({
    message: 'Not Found',
    code: 404,
    path: req.originalUrl,
    timestamp: new Date().toISOString(),
  });
}
