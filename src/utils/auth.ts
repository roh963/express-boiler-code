import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';

type UserPayload = {
  _id: string;
  role: string;
  email: string;
};

const JWT_SECRET = process.env.JWT_SECRET!;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET!;
const ACCESS_TOKEN_TTL_MIN = parseInt(process.env.ACCESS_TOKEN_TTL_MIN || '15', 10);
const REFRESH_TOKEN_TTL_DAYS = parseInt(process.env.REFRESH_TOKEN_TTL_DAYS || '7', 10);

export function signAccessToken(payload: object) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: `${ACCESS_TOKEN_TTL_MIN}m` });
}

export function signRefreshToken(payload: object) {
  return jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: `${REFRESH_TOKEN_TTL_DAYS}d` });
}

export function verifyAccessToken(req: Request, res: Response, next: NextFunction) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ error: { message: 'Unauthorized', code: 401 } });
  }
  const token = auth.split(' ')[1];
  try {
  const payload = jwt.verify(token, JWT_SECRET) as UserPayload;
  req.user = payload;
  next();
  } catch {
    return res.status(401).json({ error: { message: 'Invalid token', code: 401 } });
  }
}

export function roleGuard(roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: { message: 'Forbidden', code: 403 } });
    }
    next();
  };
}
