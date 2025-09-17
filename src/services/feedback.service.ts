// src/services/feedback.service.ts
import { Feedback } from '../models/feedback.model';
import { ApiError } from '../utils/ApiError';

interface FeedbackInput {
  name: string;
  email: string;
  message: string;
}

export async function listFeedback(page: number, limit: number) {
  const skip = (page - 1) * limit;
  const [data, total] = await Promise.all([
    Feedback.find().skip(skip).limit(limit), // No sorting
    Feedback.countDocuments(),
  ]);
  return { data, meta: { page, limit, total } };
}

export async function getFeedback(id: string) {
  return Feedback.findById(id);
}

export async function createFeedback(input: FeedbackInput) {
  const { name, email, message } = input;

  // Validate inputs
  if (!name) {
    throw new ApiError(400, 'Invalid input: expected string, received undefined', [
      { field: 'name', message: 'Invalid input: expected string, received undefined' },
    ]);
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new ApiError(400, 'Invalid email format', [
      { field: 'email', message: 'Invalid email format' },
    ]);
  }
  if (!message || message.length < 10) {
    throw new ApiError(400, 'Message must be at least 10 characters', [
      { field: 'message', message: 'Message must be at least 10 characters' },
    ]);
  }

  const feedback = new Feedback(input);
  return feedback.save();
}

export async function updateFeedback(
  id: string,
  input: { name?: string; email?: string; message?: string },
) {
  const feedback = await Feedback.findById(id);
  if (!feedback) return null;
  if (input.name !== undefined) feedback.name = input.name;
  if (input.email !== undefined) feedback.email = input.email;
  if (input.message !== undefined) feedback.message = input.message;
  await feedback.save();
  return {
    name: feedback.name,
    email: feedback.email,
    message: feedback.message,
  };
}

export async function deleteFeedback(id: string) {
  const feedback = await Feedback.findById(id);
  if (!feedback) return null;
  await feedback.deleteOne();
  return true;
}
