

import RefreshToken from '../models/RefreshToken';
import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import User from '../models/user.model';
import { ApiResponse } from '../utils/ApiResponse';
import { ApiError } from '../utils/ApiError';
import bcrypt from 'bcryptjs';
import { signAccessToken, signRefreshToken } from '../utils/auth';

export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, email, password } = req.body;
    const existing = await User.findOne({ email });
    if (existing) throw new ApiError(400, 'Email already registered');
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, passwordHash });
    return res.status(201).json(new ApiResponse(201, { id: user._id, email: user.email, name: user.name }, 'User registered'));
  } catch (err) {
    next(err);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) throw new ApiError(401, 'Invalid email or password');
    const valid = await user.comparePassword(password);
    if (!valid) throw new ApiError(401, 'Invalid email or password');
    const accessToken = signAccessToken({ _id: user._id, email: user.email, role: user.role });
    const refreshTokenValue = signRefreshToken({ _id: user._id, email: user.email, role: user.role });
    // Store refresh token in DB
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    await RefreshToken.create({ user: user._id, token: refreshTokenValue, expiresAt });
    return res.json(new ApiResponse(200, { accessToken, refreshToken: refreshTokenValue }, 'Login successful'));
  } catch (err) {
    next(err);
  }
};

export const refresh = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) throw new ApiError(400, 'Refresh token required');
    // Find in DB
    const stored = await RefreshToken.findOne({ token: refreshToken });
    if (!stored) throw new ApiError(401, 'Invalid refresh token');
    // Verify JWT
    let payload;
    try {
      payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET!);
    } catch {
      await stored.deleteOne();
      throw new ApiError(401, 'Expired or invalid refresh token');
    }
    // Issue new access token
    const { _id, email, role } = payload as any;
    const accessToken = signAccessToken({ _id, email, role });
    return res.json(new ApiResponse(200, { accessToken }, 'Token refreshed'));
  } catch (err) {
    next(err);
  }
};

export const logout = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) throw new ApiError(400, 'Refresh token required');
    await RefreshToken.deleteOne({ token: refreshToken });
    return res.status(200).json(new ApiResponse(200, null, 'Logged out successfully'));
  } catch (err) {
    next(err);
  }
};
