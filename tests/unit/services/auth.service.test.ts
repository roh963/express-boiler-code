import { AuthService } from '../../../src/services/auth.service';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

// Mock external dependencies
jest.mock('bcrypt');
jest.mock('jsonwebtoken');

const mockedBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;
const mockedJwt = jwt as jest.Mocked<typeof jwt>;

describe('AuthService', () => {
  let authService: AuthService;

  beforeEach(() => {
    authService = new AuthService();
    jest.clearAllMocks();
  });

  describe('hashPassword', () => {
    it('should hash password correctly', async () => {
      const password = 'testPassword123';
      const hashedPassword = 'hashedPassword123';

      mockedBcrypt.hash.mockResolvedValue(hashedPassword as never);

      const result = await authService.hashPassword(password);

      expect(mockedBcrypt.hash).toHaveBeenCalledWith(password, 10);
      expect(result).toBe(hashedPassword);
    });

    it('should throw error when hashing fails', async () => {
      const password = 'testPassword123';
      const error = new Error('Hashing failed');

      mockedBcrypt.hash.mockRejectedValue(error as never);

      await expect(authService.hashPassword(password)).rejects.toThrow('Hashing failed');
    });
  });

  describe('comparePassword', () => {
    it('should return true for matching passwords', async () => {
      const password = 'testPassword123';
      const hashedPassword = 'hashedPassword123';

      mockedBcrypt.compare.mockResolvedValue(true as never);

      const result = await authService.comparePassword(password, hashedPassword);

      expect(mockedBcrypt.compare).toHaveBeenCalledWith(password, hashedPassword);
      expect(result).toBe(true);
    });

    it('should return false for non-matching passwords', async () => {
      const password = 'testPassword123';
      const hashedPassword = 'hashedPassword123';

      mockedBcrypt.compare.mockResolvedValue(false as never);

      const result = await authService.comparePassword(password, hashedPassword);

      expect(result).toBe(false);
    });
  });

  describe('generateToken', () => {
    it('should generate JWT token with correct payload', () => {
      const userId = 'user123';
      const email = 'test@example.com';
      const token = 'generated.jwt.token';

      mockedJwt.sign.mockReturnValue(token as never);

      const result = authService.generateToken(userId, email);

      expect(mockedJwt.sign).toHaveBeenCalledWith(
        { userId, email },
        process.env.JWT_SECRET || 'fallback-secret',
        { expiresIn: '24h' },
      );
      expect(result).toBe(token);
    });
  });

  describe('verifyToken', () => {
    it('should verify valid token', () => {
      const token = 'valid.jwt.token';
      const decodedPayload = { userId: 'user123', email: 'test@example.com' };

      mockedJwt.verify.mockReturnValue(decodedPayload as never);

      const result = authService.verifyToken(token);

      expect(mockedJwt.verify).toHaveBeenCalledWith(
        token,
        process.env.JWT_SECRET || 'fallback-secret',
      );
      expect(result).toEqual(decodedPayload);
    });

    it('should throw error for invalid token', () => {
      const token = 'invalid.jwt.token';
      const error = new Error('Invalid token');

      mockedJwt.verify.mockImplementation(() => {
        throw error;
      });

      expect(() => authService.verifyToken(token)).toThrow('Invalid token');
    });
  });
});
