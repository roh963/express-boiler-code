import { Feedback, IFeedback } from '../models/feedback.model';

export async function listFeedback(page: number, limit: number) {
  const skip = (page - 1) * limit;
  const [data, total] = await Promise.all([
    Feedback.find().sort({ createdAt: -1 }).skip(skip).limit(limit),
    Feedback.countDocuments(),
  ]);
  return { data, meta: { page, limit, total } };
}

export async function getFeedback(id: string) {
  return Feedback.findById(id);
}

export async function createFeedback(input: { name: string; email: string; message: string }) {
  const feedback = new Feedback(input);
  return feedback.save();
}

export async function updateFeedback(id: string, input: { name?: string; email?: string; message?: string }) {
  const feedback = await Feedback.findById(id);
  if (!feedback) return null;
  if (input.name !== undefined) feedback.name = input.name;
  if (input.email !== undefined) feedback.email = input.email;
  if (input.message !== undefined) feedback.message = input.message;
  await feedback.save();
  return feedback;
}

export async function deleteFeedback(id: string) {
  const feedback = await Feedback.findById(id);
  if (!feedback) return null;
  await feedback.deleteOne();
  return true;
}
