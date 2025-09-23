import { Router } from 'express';
import * as authController from '../controllers/auth.controller';
import { validateRegister, validateLogin } from '../validators/authValidator';
import { authLimiter, otpRateLimit, sendRateLimit } from '../middleware/rateLimiter';

const router = Router();

router.post('/register', authLimiter, validateRegister, authController.register);
router.post('/login', authLimiter, validateLogin, authController.login);
router.post('/refresh', authLimiter, authController.refresh);
router.post('/logout', authLimiter, authController.logout);

router.post('/send-otp',  sendRateLimit, authController.sendOtp);
router.post('/verify-otp',  otpRateLimit, authController.verifyOtp);
export default router;
