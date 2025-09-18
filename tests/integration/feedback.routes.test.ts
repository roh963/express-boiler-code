import request from 'supertest';
import { Types, Document } from 'mongoose';
import app from '../../src/app';
import { Feedback } from '../../src/models/feedback.model';

// Define the Feedback interface to type the document
interface FeedbackDocument extends Document {
  _id: Types.ObjectId;
  name: string;
  email: string;
  message: string;
}

describe('Feedback Routes', () => {
  beforeEach(async () => {
    await Feedback.deleteMany({});
  });

  describe('POST /api/feedback', () => {
    it('should create feedback with valid payload', async () => {
      const feedbackData = {
        name: 'John Doe',
        email: 'john@example.com',
        message: 'This service was excellent and very fast',
      };

      const response = await request(app).post('/api/feedback').send(feedbackData).expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.feedback).toHaveProperty('name', feedbackData.name);
      expect(response.body.feedback).toHaveProperty('email', feedbackData.email);
      expect(response.body.feedback).toHaveProperty('message', feedbackData.message);

      // Verify in database
      const feedback = (await Feedback.findOne({
        email: feedbackData.email,
      })) as FeedbackDocument | null;
      expect(feedback).toBeTruthy();
    });

    it('should return 400 for invalid payload - missing name', async () => {
      const feedbackData = {
        email: 'john@example.com',
        message: 'This service was excellent and very fast',
      };

      const response = await request(app).post('/api/feedback').send(feedbackData).expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.errors[0]).toHaveProperty(
        'message',
        'Invalid input: expected string, received undefined',
      );
    });

    it('should return 400 for invalid email', async () => {
      const feedbackData = {
        name: 'John Doe',
        email: 'invalid-email',
        message: 'This service was excellent and very fast',
      };

      const response = await request(app).post('/api/feedback').send(feedbackData).expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.errors[0]).toHaveProperty('message', 'Invalid email format');
    });

    it('should return 400 for short message', async () => {
      const feedbackData = {
        name: 'John Doe',
        email: 'john@example.com',
        message: 'Too short',
      };

      const response = await request(app).post('/api/feedback').send(feedbackData).expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.errors[0]).toHaveProperty(
        'message',
        'Message must be at least 10 characters',
      );
    });
  });

  describe('GET /api/feedback', () => {
    beforeEach(async () => {
      await Feedback.deleteMany({});
      await Feedback.create([
        {
          name: 'Alice',
          email: 'alice@example.com',
          message: 'Alice feedback message is long enough',
        },
        {
          name: 'Bob',
          email: 'bob@example.com',
          message: 'Bob feedback message is also long enough',
        },
      ]);
    });

    it('should get all feedback', async () => {
      const response = await request(app).get('/api/feedback').expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.feedback).toHaveLength(2);
      expect(response.body.feedback[0]).toHaveProperty('name', 'Alice');
      expect(response.body.feedback[1]).toHaveProperty('name', 'Bob');
    });
  });

  describe('GET /api/feedback/:id', () => {
    let feedbackId: string;

    beforeEach(async () => {
      const feedback = (await Feedback.create({
        name: 'John Doe',
        email: 'john@example.com',
        message: 'This service was excellent and very fast',
      })) as FeedbackDocument;
      feedbackId = feedback._id.toString();
    });

    it('should get feedback by ID', async () => {
      const response = await request(app).get(`/api/feedback/${feedbackId}`).expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.feedback).toHaveProperty('name', 'John Doe');
      expect(response.body.feedback).toHaveProperty('email', 'john@example.com');
      expect(response.body.feedback).toHaveProperty(
        'message',
        'This service was excellent and very fast',
      );
    });

    it('should return 404 for non-existent feedback ID', async () => {
      const nonExistentId = new Types.ObjectId().toString();
      const response = await request(app).get(`/api/feedback/${nonExistentId}`).expect(404);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.errors[0]).toHaveProperty('message', 'Feedback not found');
    });
  });

  describe('PUT /api/feedback/:id', () => {
    let feedbackId: string;

    beforeEach(async () => {
      const feedback = (await Feedback.create({
        name: 'John Doe',
        email: 'john@example.com',
        message: 'This service was excellent and very fast',
      })) as FeedbackDocument;
      feedbackId = feedback._id.toString();
    });

    it('should update feedback with valid payload', async () => {
      const updateData = {
        name: 'Jane Doe',
        email: 'jane@example.com',
        message: 'Updated feedback message is long enough',
      };

      const response = await request(app)
        .put(`/api/feedback/${feedbackId}`)
        .send(updateData)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.feedback).toHaveProperty('name', updateData.name);
      expect(response.body.feedback).toHaveProperty('email', updateData.email);
      expect(response.body.feedback).toHaveProperty('message', updateData.message);
      expect(response.body).toHaveProperty('message', 'Feedback updated');

      // Verify in database
      const feedback = (await Feedback.findById(feedbackId)) as FeedbackDocument | null;
      expect(feedback).toHaveProperty('name', updateData.name);
    });

    it('should return 404 for non-existent feedback ID', async () => {
      const nonExistentId = new Types.ObjectId().toString();
      const updateData = {
        name: 'Jane Doe',
        email: 'jane@example.com',
        message: 'Updated feedback message is long enough',
      };

      const response = await request(app)
        .put(`/api/feedback/${nonExistentId}`)
        .send(updateData)
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.errors[0]).toHaveProperty('message', 'Feedback not found');
    });
  });

  describe('DELETE /api/feedback/:id', () => {
    let feedbackId: string;

    beforeEach(async () => {
      const feedback = (await Feedback.create({
        name: 'John Doe',
        email: 'john@example.com',
        message: 'This service was excellent and very fast',
      })) as FeedbackDocument;
      feedbackId = feedback._id.toString();
    });

    it('should delete feedback by ID', async () => {
      await request(app).delete(`/api/feedback/${feedbackId}`).expect(204);

      // Verify in database
      const feedback = await Feedback.findById(feedbackId);
      expect(feedback).toBeNull();
    });

    it('should return 404 for non-existent feedback ID', async () => {
      const nonExistentId = new Types.ObjectId().toString();
      const response = await request(app).delete(`/api/feedback/${nonExistentId}`).expect(404);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.errors[0]).toHaveProperty('message', 'Feedback not found');
    });
  });
});
