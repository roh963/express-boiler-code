// src/routes/feedback.routes.ts
import { Router } from 'express';
import * as feedbackController from '../controllers/feedback.controller';
import {
  validateResource,
  CreateFeedbackSchema,
  UpdateFeedbackSchema,
} from '../validators/feedbackValidator';
import { cacheMiddleware } from '../middleware/cache.middleware';

const router = Router();

// GET /api/feedback?page=1&limit=10
router.get('/',cacheMiddleware(15), feedbackController.listFeedback);

// GET /api/feedback/:id
router.get('/:id', feedbackController.getFeedback);

// POST /api/feedback
router.post('/', validateResource(CreateFeedbackSchema), feedbackController.createFeedback);

// PUT /api/feedback/:id
router.put('/:id', validateResource(UpdateFeedbackSchema), feedbackController.updateFeedback);

// DELETE /api/feedback/:id
router.delete('/:id', feedbackController.deleteFeedback);

export default router;
