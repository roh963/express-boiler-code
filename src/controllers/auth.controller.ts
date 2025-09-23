// src/controllers/auth.controller.ts
import RefreshToken from '../models/RefreshToken';
import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import User, { UserRole } from '../models/user.model';
import { ApiError } from '../utils/ApiError';
import bcrypt from 'bcryptjs';
import { signAccessToken, signRefreshToken } from '../services/auth.service';
import { asyncHandler } from '../utils/asyncHandler';
import { OtpService } from '../services/otp.service';
import { io } from '../realtime/socket';

interface UserPayload {
  _id: string;
  email: string;
  role: string;
}

export const register = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, email, password, role } = req.body;
     console.log('req.body:', req.body);

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new ApiError(400, 'Invalid email address', [
        { field: 'email', message: 'Invalid email address' },
      ]);
    }
    if (!password || password.length < 6) {
      throw new ApiError(400, 'Password must be at least 6 characters', [
        { field: 'password', message: 'Password must be at least 6 characters' },
      ]);
    }

    const existing = await User.findOne({ email });
    if (existing) {
      throw new ApiError(400, 'Email already registered', [
        { field: 'email', message: 'Email already registered' },
      ]);
    }
    const rawRole = role?.toString().toUpperCase();
    

    // 6️⃣ Create user

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, passwordHash, role: role === "ADMIN" ? "ADMIN" : "USER", });

    return res.status(201).json({
      success: true,
      data: { id: user._id, email: user.email, name: user.name, role: user.role },
      message: 'User registered',
    });
  } catch (err) {
    next(err); // Ensure error is passed to middleware
  }
});

export const login = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;

    if (!email) {
      throw new ApiError(400, 'Invalid input: expected string, received undefined', [
        { field: 'email', message: 'Invalid input: expected string, received undefined' },
      ]);
    }

    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
      throw new ApiError(401, 'Invalid email or password', [
        { field: 'credentials', message: 'Invalid email or password' },
      ]);
    }
    if (!user.isVerified) {
      throw new ApiError(401, 'Account not verified. Please verify your email.', [
        { field: 'verfication', message: 'Account not verified' },
      ]);
    }
    const accessToken = signAccessToken({ _id: user._id, email: user.email, role: user.role });
    const refreshTokenValue = signRefreshToken({
      _id: user._id,
      email: user.email,
      role: user.role,
    });
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await RefreshToken.create({ user: user._id, token: refreshTokenValue, expiresAt });

    return res.json({
      success: true,
      data: {
        accessToken,
        refreshToken: refreshTokenValue,
        user: { id: user._id, email: user.email, name: user.name  ,role: user.role},
      },
      message: 'Login successful',
    });
  } catch (err) {
    next(err);
  }
});

export const refresh = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      throw new ApiError(400, 'Refresh token required', [
        { field: 'refreshToken', message: 'Refresh token required' },
      ]);
    }
    const stored = await RefreshToken.findOne({ token: refreshToken });
    if (!stored) {
      throw new ApiError(401, 'Invalid refresh token', [
        { field: 'refreshToken', message: 'Invalid refresh token' },
      ]);
    }
    let payload: UserPayload;
    try {
      payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET!) as UserPayload;
    } catch {
      await stored.deleteOne();
      throw new ApiError(401, 'Expired or invalid refresh token', [
        { field: 'refreshToken', message: 'Expired or invalid refresh token' },
      ]);
    }
    const { _id, email, role } = payload;
    const accessToken = signAccessToken({ _id, email, role });
    return res.json({
      success: true,
      data: { accessToken },
      message: 'Token refreshed',
    });
  } catch (err) {
    next(err);
  }
});

export const logout = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      throw new ApiError(400, 'Refresh token required', [
        { field: 'refreshToken', message: 'Refresh token required' },
      ]);
    }
    await RefreshToken.deleteOne({ token: refreshToken });
    return res.status(200).json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (err) {
    next(err);
  }
})



export const sendOtp = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { email } = req.body;
    if (!email) {
      throw new ApiError(400, 'Email is required');
    }

    const otp = await OtpService.generateAndSendOtp(email);
    const response: { success: boolean; message: string; otp?: string } = {
      success: true,
      message: 'OTP sent',
    };

    if (otp) {
      response.otp = otp;
    }

    res.status(200).json(response);
  }
);

export const verifyOtp = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { email, otp } = req.body;
  if (!email || !otp) {
    throw new ApiError(400, 'Email and OTP are required');
  }

  const isValid = await OtpService.verifyOtp(email, otp);
  if (!isValid) {
    throw new ApiError(400, 'Invalid or expired OTP');
  }

  // Update user in MongoDB
  const user = await User.findOneAndUpdate(
    { email: email.toLowerCase() },
    { isVerified: true },
    { new: true }
  );

  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  // Emit otp-verified event to this user's room
  try {
    // if user._id is an ObjectId, convert to string
    io.of('/realtime').to(`user:${user._id}`).emit('otp-verified', {
  success: true,
  message: 'OTP verified',
  userId: user._id,
  timestamp: Date.now(),
});
  } catch (err) {
    // Log but don't block response
    // eslint-disable-next-line no-console
    console.error('Error emitting otp-verified:', err);
  }

  res.status(200).json({ success: true, message: 'OTP verified' });
});