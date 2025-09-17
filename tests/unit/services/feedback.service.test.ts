// tests/unit/services/feedback.service.test.ts
import { Feedback } from '../../../src/models/feedback.model';
import {
  createFeedback,
  listFeedback,
  getFeedback,
  updateFeedback,
  deleteFeedback,
} from '../../../src/services/feedback.service';
import mongoose from 'mongoose';

// Mock the Feedback model
jest.mock('../../../src/models/feedback.model');

describe('Feedback Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createFeedback', () => {
    it('should create feedback with valid input', async () => {
      const input = {
        name: 'John Doe',
        email: 'john@example.com',
        message: 'This service is great!',
      };
      const mockFeedback = {
        ...input,
        _id: new mongoose.Types.ObjectId(),
        save: jest.fn().mockResolvedValue(input),
      };
      (Feedback as any).mockImplementation(() => mockFeedback);

      const result = await createFeedback(input);
      expect(result).toEqual(input);
      expect(mockFeedback.save).toHaveBeenCalled();
    });

    it('should throw error for missing name', async () => {
      const input = {
        name: '',
        email: 'john@example.com',
        message: 'This service is great!',
      };
      await expect(createFeedback(input)).rejects.toMatchObject({
        statusCode: 400,
        message: 'Invalid input: expected string, received undefined',
        errors: [{ field: 'name', message: 'Invalid input: expected string, received undefined' }],
      });
    });

    it('should throw error for invalid email', async () => {
      const input = {
        name: 'John Doe',
        email: 'invalid-email',
        message: 'This service is great!',
      };
      await expect(createFeedback(input)).rejects.toMatchObject({
        statusCode: 400,
        message: 'Invalid email format',
        errors: [{ field: 'email', message: 'Invalid email format' }],
      });
    });

    it('should throw error for short message', async () => {
      const input = {
        name: 'John Doe',
        email: 'john@example.com',
        message: 'Short',
      };
      await expect(createFeedback(input)).rejects.toMatchObject({
        statusCode: 400,
        message: 'Message must be at least 10 characters',
        errors: [{ field: 'message', message: 'Message must be at least 10 characters' }],
      });
    });
  });

  describe('listFeedback', () => {
    it('should list feedback with pagination', async () => {
      const mockFeedback = [
        { name: 'Alice', email: 'alice@example.com', message: 'Great service!' },
        { name: 'Bob', email: 'bob@example.com', message: 'Awesome!' },
      ];
      (Feedback.find as jest.Mock).mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue(mockFeedback),
      });
      (Feedback.countDocuments as jest.Mock).mockResolvedValue(2);

      const result = await listFeedback(1, 10);
      expect(result).toEqual({
        data: mockFeedback,
        meta: { page: 1, limit: 10, total: 2 },
      });
      expect(Feedback.find).toHaveBeenCalled();
      expect(Feedback.countDocuments).toHaveBeenCalled();
    });
  });

  describe('getFeedback', () => {
    it('should get feedback by ID', async () => {
      const mockFeedback = {
        name: 'John Doe',
        email: 'john@example.com',
        message: 'Great service!',
      };
      (Feedback.findById as jest.Mock).mockResolvedValue(mockFeedback);

      const result = await getFeedback('123');
      expect(result).toEqual(mockFeedback);
      expect(Feedback.findById).toHaveBeenCalledWith('123');
    });

    it('should return null for non-existent ID', async () => {
      (Feedback.findById as jest.Mock).mockResolvedValue(null);

      const result = await getFeedback('123');
      expect(result).toBeNull();
      expect(Feedback.findById).toHaveBeenCalledWith('123');
    });
  });

  describe('updateFeedback', () => {
    it('should update feedback', async () => {
      const mockFeedback = {
        _id: '123',
        name: 'John Doe',
        email: 'john@example.com',
        message: 'Great service!',
        save: jest.fn().mockResolvedValue({
          _id: '123',
          name: 'Jane Doe',
          email: 'john@example.com',
          message: 'Great service!',
        }),
      };
      (Feedback.findById as jest.Mock).mockResolvedValue(mockFeedback);

      const result = await updateFeedback('123', { name: 'Jane Doe' });
      expect(result).toEqual({
        name: 'Jane Doe',
        email: 'john@example.com',
        message: 'Great service!',
      });
      expect(mockFeedback.save).toHaveBeenCalled();
    });

    it('should return null for non-existent ID', async () => {
      (Feedback.findById as jest.Mock).mockResolvedValue(null);

      const result = await updateFeedback('123', { name: 'Jane Doe' });
      expect(result).toBeNull();
    });
  });

  describe('deleteFeedback', () => {
    it('should delete feedback', async () => {
      const mockFeedback = { _id: '123', deleteOne: jest.fn().mockResolvedValue(true) };
      (Feedback.findById as jest.Mock).mockResolvedValue(mockFeedback);

      const result = await deleteFeedback('123');
      expect(result).toBe(true);
      expect(mockFeedback.deleteOne).toHaveBeenCalled();
    });

    it('should return null for non-existent ID', async () => {
      (Feedback.findById as jest.Mock).mockResolvedValue(null);

      const result = await deleteFeedback('123');
      expect(result).toBeNull();
    });
  });
});
