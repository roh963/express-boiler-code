import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User, { IUser } from '../models/user.model';

const JWT_SECRET = process.env.JWT_SECRET!;

export async function verifyAccessToken(req: Request, res: Response, next: NextFunction) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ errors: [{ field: 'token', message: 'Unauthorized' }] });
  }
  const token = auth.split(' ')[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET) as { id: string; role: string };
    const user = await User.findById(payload.id);
    if (!user) return res.status(401).json({ errors: [{ field: 'token', message: 'User not found' }] });
    req.user = { _id: user._id, role: user.role } as IUser;
    next();
  } catch {
    return res.status(401).json({ errors: [{ field: 'token', message: 'Invalid or expired token' }] });
  }
}
