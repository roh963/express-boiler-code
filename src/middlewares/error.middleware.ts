import { Request, Response, NextFunction } from 'express';

export function notFoundHandler(req: Request, res: Response, next: NextFunction) {
  res.status(404).json({
    message: 'Not Found',
    code: 404,
    path: req.originalUrl,
    timestamp: new Date().toISOString(),
  });
}

export function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  const status = err.status || 500;
  const isProd = process.env.NODE_ENV === 'production';
  res.status(status).json({
    message: err.message || 'Internal Server Error',
    code: status,
    path: req.originalUrl,
    timestamp: new Date().toISOString(),
    ...(isProd ? {} : { stack: err.stack }),
  });
}
