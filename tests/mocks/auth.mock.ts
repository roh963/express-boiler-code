export const mockUser = {
  _id: 'user123',
  email: 'test@example.com',
  name: 'Test User',
  password: 'hashedPassword123',
  createdAt: new Date(),
  updatedAt: new Date(),
};

export const mockAuthToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';

export const mockAuthService = {
  hashPassword: jest.fn(),
  comparePassword: jest.fn(),
  generateToken: jest.fn(),
  verifyToken: jest.fn(),
};

export const createMockUser = (overrides = {}) => ({
  ...mockUser,
  ...overrides,
});
