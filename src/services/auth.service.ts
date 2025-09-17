// src/utils/auth.ts
import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import { ApiError } from '../utils/ApiError';

type UserPayload = {
  _id: string;
  role: string;
  email: string;
};

const JWT_SECRET = process.env.JWT_SECRET!;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET!;
const ACCESS_TOKEN_TTL_MIN = parseInt(process.env.ACCESS_TOKEN_TTL_MIN || '15', 10);
const REFRESH_TOKEN_TTL_DAYS = parseInt(process.env.REFRESH_TOKEN_TTL_DAYS || '7', 10);

export class AuthService {
  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
  }

  async comparePassword(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }

  generateToken(userId: string, email: string): string {
    return jwt.sign({ userId, email }, process.env.JWT_SECRET || 'fallback-secret', {
      expiresIn: '24h',
    });
  }

  verifyToken(token: string): any {
    return jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
  }
}

export function signAccessToken(payload: object) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: `${ACCESS_TOKEN_TTL_MIN}m` });
}

export function signRefreshToken(payload: object) {
  return jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: `${REFRESH_TOKEN_TTL_DAYS}d` });
}

export function verifyAccessToken(req: Request, res: Response, next: NextFunction) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    throw new ApiError(401, 'Unauthorized', [{ field: 'token', message: 'Unauthorized' }]);
  }
  const token = auth.split(' ')[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET) as UserPayload;
    req.user = payload;
    next();
  } catch {
    throw new ApiError(401, 'Invalid token', [
      { field: 'token', message: 'Invalid or expired token' },
    ]);
  }
}

export function roleGuard(roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      throw new ApiError(403, 'Forbidden', [{ field: 'role', message: 'Forbidden' }]);
    }
    next();
  };
}
