import request from 'supertest';
import app from '../../src/app';
import User from '../../src/models/user.model';
import RefreshToken from '../../src/models/RefreshToken';
import jwt from 'jsonwebtoken';
import { signRefreshToken } from '../../src/services/auth.service';

describe('Auth Routes', () => {
  describe('POST /auth/register', () => {
    beforeEach(async () => {
      await User.deleteMany({}); // Clear database
    });

    it('should register a new user successfully', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'testPassword123',
        name: 'Test User',
      };

      const response = await request(app).post('/auth/register').send(userData).expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('email', userData.email);
      expect(response.body.data).toHaveProperty('name', userData.name);
      expect(response.body.data).not.toHaveProperty('passwordHash');

      // Verify user was created in database
      const user = await User.findOne({ email: userData.email });
      expect(user).toBeTruthy();
      expect(user?.name).toBe(userData.name);
    });

    it('should return 400 for duplicate email', async () => {
      const userData = {
        email: 'duplicate@example.com',
        password: 'testPassword123',
        name: 'Test User',
      };

      // Create user first
      await request(app).post('/auth/register').send(userData).expect(201);

      // Try to create same user again
      const response = await request(app).post('/auth/register').send(userData).expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message', 'Email already registered');
    });

    it('should return 400 for invalid email', async () => {
      const userData = {
        email: 'invalid-email',
        password: 'testPassword123',
        name: 'Test User',
      };

      const response = await request(app).post('/auth/register').send(userData).expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.errors[0]).toHaveProperty('message', 'Invalid email address');
    });

    it('should return 400 for weak password', async () => {
      const userData = {
        email: 'test@example.com',
        password: '123', // Too weak
        name: 'Test User',
      };

      const response = await request(app).post('/auth/register').send(userData).expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.errors[0]).toHaveProperty(
        'message',
        'Password must be at least 6 characters',
      );
    });
  });

  describe('POST /auth/login', () => {
    beforeEach(async () => {
      await User.deleteMany({}); // Clear database
      // Create a test user before each login test
      await request(app)
        .post('/auth/register')
        .send({
          email: 'login@example.com',
          password: 'testPassword123',
          name: 'Login User',
        })
        .expect(201);
    });

    it('should login successfully with correct credentials', async () => {
      const loginData = {
        email: 'login@example.com',
        password: 'testPassword123',
      };

      const response = await request(app).post('/auth/login').send(loginData).expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('accessToken');
      expect(response.body.data).toHaveProperty('refreshToken');
      expect(response.body.data.user).toHaveProperty('email', loginData.email);
      expect(response.body.data.user).not.toHaveProperty('passwordHash');
    });

    it('should return 401 for incorrect password', async () => {
      const loginData = {
        email: 'login@example.com',
        password: 'wrongPassword',
      };

      const response = await request(app).post('/auth/login').send(loginData).expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message', 'Invalid email or password');
    });

    it('should return 401 for non-existent user', async () => {
      const loginData = {
        email: 'nonexistent@example.com',
        password: 'testPassword123',
      };

      const response = await request(app).post('/auth/login').send(loginData).expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message', 'Invalid email or password');
    });

    it('should return 400 for missing email', async () => {
      const loginData = {
        password: 'testPassword123',
      };

      const response = await request(app).post('/auth/login').send(loginData).expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.errors[0]).toHaveProperty(
        'message',
        'Invalid input: expected string, received undefined',
      );
    });
  });

  describe('POST /auth/refresh', () => {
    let user: any;
    let refreshToken: string;

    beforeEach(async () => {
      await User.deleteMany({});
      await RefreshToken.deleteMany({});

      // Create a test user and generate a refresh token
      const userData = {
        email: 'refresh@example.com',
        password: 'testPassword123',
        name: 'Refresh User',
      };
      await request(app).post('/auth/register').send(userData).expect(201);
      user = await User.findOne({ email: userData.email });

      // Generate and store a refresh token
      refreshToken = signRefreshToken({ _id: user._id, email: user.email, role: user.role });
      await RefreshToken.create({
        user: user._id,
        token: refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      });
    });

    it('should refresh token successfully with valid refresh token', async () => {
      const response = await request(app).post('/auth/refresh').send({ refreshToken }).expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('message', 'Token refreshed');
    });

    it('should return 400 for missing refresh token', async () => {
      const response = await request(app).post('/auth/refresh').send({}).expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.errors[0]).toHaveProperty('message', 'Refresh token required');
    });

    it('should return 401 for invalid refresh token', async () => {
      const response = await request(app)
        .post('/auth/refresh')
        .send({ refreshToken: 'invalid-token' })
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.errors[0]).toHaveProperty('message', 'Invalid refresh token');
    });

    it('should return 401 for expired refresh token', async () => {
      // Mock an expired token
      const expiredToken = jwt.sign(
        { _id: user._id, email: user.email, role: user.role },
        process.env.JWT_REFRESH_SECRET || 'fallback-secret',
        { expiresIn: '0s' }, // Expired immediately
      );
      await RefreshToken.create({
        user: user._id,
        token: expiredToken,
        expiresAt: new Date(Date.now() - 1000), // Already expired
      });

      const response = await request(app)
        .post('/auth/refresh')
        .send({ refreshToken: expiredToken })
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.errors[0]).toHaveProperty('message', 'Expired or invalid refresh token');
      // Verify token was deleted
      const tokenInDb = await RefreshToken.findOne({ token: expiredToken });
      expect(tokenInDb).toBeNull();
    });
  });

  describe('POST /auth/logout', () => {
    let user: any;
    let refreshToken: string;

    beforeEach(async () => {
      await User.deleteMany({});
      await RefreshToken.deleteMany({});

      // Create a test user and generate a refresh token
      const userData = {
        email: 'logout@example.com',
        password: 'testPassword123',
        name: 'Logout User',
      };
      await request(app).post('/auth/register').send(userData).expect(201);
      user = await User.findOne({ email: userData.email });

      // Generate and store a refresh token
      refreshToken = signRefreshToken({ _id: user._id, email: user.email, role: user.role });
      await RefreshToken.create({
        user: user._id,
        token: refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      });
    });

    it('should logout successfully with valid refresh token', async () => {
      const response = await request(app).post('/auth/logout').send({ refreshToken }).expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message', 'Logged out successfully');
      // Verify token was deleted
      const tokenInDb = await RefreshToken.findOne({ token: refreshToken });
      expect(tokenInDb).toBeNull();
    });

    it('should return 400 for missing refresh token', async () => {
      const response = await request(app).post('/auth/logout').send({}).expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.errors[0]).toHaveProperty('message', 'Refresh token required');
    });

    it('should return 200 even if refresh token does not exist', async () => {
      const response = await request(app)
        .post('/auth/logout')
        .send({ refreshToken: 'non-existent-token' })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message', 'Logged out successfully');
    });
  });
});
