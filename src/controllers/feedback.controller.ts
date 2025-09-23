// src/controllers/feedback.controller.ts
import { Request, Response } from 'express';
import * as feedbackService from '../services/feedback.service';
import { asyncHandler } from '../utils/asyncHandler';
import { emailQueue } from '../utils/queue.config';
import { Socket } from 'socket.io';
import { io } from '../realtime/socket';


// List all feedback with pagination
export const listFeedback = asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string, 10) || 1;
  const limit = parseInt(req.query.limit as string, 10) || 10;
  const result = await feedbackService.listFeedback(page, limit);
  res.status(200).json({
    success: true,
    feedback: result.data,
    meta: result.meta,
  });
});

// Get single feedback by id
export const getFeedback = asyncHandler(async (req: Request, res: Response) => {
  const feedback = await feedbackService.getFeedback(req.params.id);
  if (!feedback) {
    return res.status(404).json({
      success: false,
      errors: [{ field: 'id', message: 'Feedback not found' }],
    });
  }
  res.status(200).json({
    success: true,
    feedback,
  });
});

// Create feedback
export const createFeedback = asyncHandler(async (req: Request, res: Response) => {
  const { name, email, message } = req.body;
  const feedback = await feedbackService.createFeedback({ name, email, message });

  // Emit minimal safe data
  const safeFeedback = { id: feedback._id, name, message }; // Avoid leaking sensitive fields
//  io.of('/realtime').to("admins").emit('new-feedback', safeFeedback);

  try {
    io.of('/realtime').to('admins').emit('new-feedback', {
  id: feedback._id,
  name: feedback.name,
  message: feedback.message,
  email: feedback.email,
  createdAt: feedback.createdAt,
});
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Error emitting new-feedback:', err);
  }

  await emailQueue.add('sendEmail', {
    feedbackId: feedback._id,
    userEmail: feedback.email,
    feedbackTitle: `Feedback from ${feedback.name}`,
    feedbackContent: feedback.message,
  });
  console.log(`Job enqueued for feedback ID: ${feedback._id}`);
   
  res.status(201).json({
    success: true,
    feedback: safeFeedback, // Return safe data in response too
    message: 'Feedback created',
  });
});

// Update feedback
export const updateFeedback = asyncHandler(async (req: Request, res: Response) => {
  const { name, email, message } = req.body;
  const updated = await feedbackService.updateFeedback(req.params.id, { name, email, message });
  if (!updated) {
    return res.status(404).json({
      success: false,
      errors: [{ field: 'id', message: 'Feedback not found' }],
    });
  }
  res.status(200).json({
    success: true,
    feedback: updated,
    message: 'Feedback updated',
  });
});

// Delete feedback
export const deleteFeedback = asyncHandler(async (req: Request, res: Response) => {
  const deleted = await feedbackService.deleteFeedback(req.params.id);
  if (!deleted) {
    return res.status(404).json({
      success: false,
      errors: [{ field: 'id', message: 'Feedback not found' }],
    });
  }
  res.status(204).send();
});
