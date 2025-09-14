import jwt from 'jsonwebtoken';
import { IUser } from '../models/user.model';

const JWT_SECRET = process.env.JWT_SECRET!;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET!;
const ACCESS_TOKEN_TTL_MIN = parseInt(process.env.ACCESS_TOKEN_TTL_MIN || '15', 10);
const REFRESH_TOKEN_TTL_DAYS = parseInt(process.env.REFRESH_TOKEN_TTL_DAYS || '7', 10);

export function generateAccessToken(user: IUser) {
  return jwt.sign(
    { id: user._id, role: user.role },
    JWT_SECRET,
    { expiresIn: `${ACCESS_TOKEN_TTL_MIN}m` }
  );
}

export function generateRefreshToken(user: IUser) {
  return jwt.sign(
    { id: user._id, role: user.role },
    JWT_REFRESH_SECRET,
    { expiresIn: `${REFRESH_TOKEN_TTL_DAYS}d` }
  );
}
