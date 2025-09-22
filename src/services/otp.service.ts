import { redis } from '../utils/redis.config';
import crypto from 'crypto';
import { ApiError } from '../utils/ApiError';
import nodemailer from 'nodemailer';

const OTP_TTL = 300; // 5 minutes in seconds
const MAX_ATTEMPTS =3;

export class OtpService {
    static async generateAndSendOtp(email: string): Promise<string | null> {
        const otp = crypto.randomInt(100000, 999999).toString();
        const otpKey = `otp:${email.toLowerCase()}`;
        const attemptsKey = `otp_attempts:${email.toLowerCase()}`;

        // Store OTP in Redis with TTL
        await redis.set(otpKey, otp, 'EX', OTP_TTL);
        // Reset attempts on new OTP
        await redis.set(attemptsKey, '0', 'EX', OTP_TTL);

        // Send OTP via email (using nodemailer)
        try {
            const testAccount = await nodemailer.createTestAccount();

            // 2. Create transporter
            const transporter = nodemailer.createTransport({
                host: testAccount.smtp.host,
                port: testAccount.smtp.port,
                secure: testAccount.smtp.secure,
                auth: {
                    user: testAccount.user,
                    pass: testAccount.pass,
                },
            });

           const info=  await transporter.sendMail({
                from: '"App" <no-reply@app.com>',
                to: email,
                subject: 'Your OTP Code',
                text: `Your OTP is ${otp}. It expires in 5 minutes.`,
            });

             console.log("Preview URL:", nodemailer.getTestMessageUrl(info));

            // Return OTP only in non-production or if explicitly allowed
            if (
                process.env.NODE_ENV !== 'production' ||
                process.env.SHOW_OTP_IN_RESPONSE === 'true'
            ) {
                return otp;
            }
            return null;
        } catch (error) {
            throw new ApiError(500, 'Failed to send OTP');
        }
    }

    static async verifyOtp(email: string, otp: string): Promise<boolean> {
        const otpKey = `otp:${email.toLowerCase()}`;
        const attemptsKey = `otp_attempts:${email.toLowerCase()}`;

        // Check attempts
        const attempts = parseInt((await redis.get(attemptsKey)) || '0');
        if (attempts >= MAX_ATTEMPTS) {
            await redis.del(otpKey); // Delete OTP if max attempts reached
            throw new ApiError(429, 'Too many attempts. Please request a new OTP.');
        }

        // Get stored OTP
        const storedOtp = await redis.get(otpKey);
        if (!storedOtp) {
            throw new ApiError(400, 'OTP expired or invalid');
        }

        // Increment attempts
        await redis.incr(attemptsKey);

        if (storedOtp === otp) {
            // Clear Redis keys
            await redis.del(otpKey);
            await redis.del(attemptsKey);
            return true;
        }

        throw new ApiError(400, 'Invalid OTP');
    }
}