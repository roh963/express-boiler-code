import { Router, Request, Response } from 'express';
import { memoryUpload, diskUpload } from '../utils/multer.config';

import { getuploadbyidController, getuploadController, localUploadController, uploadController } from '../controllers/upload.controller';

const router = Router();

// S3 Upload Route
router.post('/s3', memoryUpload.single('file'),uploadController);



// Local Storage Upload Route
router.post('/local', diskUpload.single('file'), localUploadController);

// Get all files
router.get('/', getuploadController);

// Get file by ID
router.get('/:id', getuploadbyidController);

export { router as uploadRoutes };