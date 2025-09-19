import { Request, Response } from 'express';
import { s3Service } from '../services/s3.service';
import { FileModel } from '../models/file.model';
import { UploadResponse } from '../types/express/index'
import { asyncHandler } from '../utils/asyncHandler';


 
// S3 Upload conroller
// export const uploadController = asyncHandler(async (req: Request, res: Response): Promise<void> => {
//   try {
//     if (!req.file) {
//       res.status(400).json({
//         success: false,
//         message: 'No file uploaded',
//         error: 'File is required'
//       } as UploadResponse);
//       return;
//     }

//     // Generate unique filename
//     const fileName = s3Service.generateFileName(req.file.originalname, req.file.mimetype);
    
//     // Get presigned URL for upload
//     const presignedUrl = await s3Service.getPresignedUploadUrl(fileName, req.file.mimetype);

//     // Presigned URL for secure download (GET)
//     const presignedDownloadUrl = await s3Service.getPresignedDownloadUrl(fileName);
    
//     // Get public URL
//     const publicUrl = s3Service.getPublicUrl(fileName);

//     // Save metadata to database
//     const fileDoc = new FileModel({
//       filename: fileName,
//       originalName: req.file.originalname,
//       mimetype: req.file.mimetype,
//       size: req.file.size,
//       url: publicUrl,
//       storageType: 's3',
//       uploadedBy: req.body.userId || null
//     });

//     await fileDoc.save();

//     res.status(201).json({
//       success: true,
//       message: 'File uploaded successfully to S3',
//       data: {
//         file: fileDoc.toObject(),
//         presignedUrl: presignedUrl,
//         downloadUrl: presignedDownloadUrl
//       }
//     } as UploadResponse);

//   } catch (error) {
//     console.error('S3 upload error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Failed to upload file to S3',
//       error: error instanceof Error ? error.message : 'Unknown error'
//     } as UploadResponse);
//   }
// });
export const uploadController = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({
        success: false,
        message: 'No file uploaded',
        error: 'File is required'
      } as UploadResponse);
      return;
    }

    // Generate unique filename
    const fileName = s3Service.generateFileName(req.file.originalname, req.file.mimetype);
    
    // **IMPORTANT**: Actually upload the file to S3
    await s3Service.uploadFile(fileName, req.file.buffer, req.file.mimetype);
    
    // Get public URL
    const publicUrl = s3Service.getPublicUrl(fileName);
    
    // Generate presigned download URL for secure access
    const presignedDownloadUrl = await s3Service.getPresignedDownloadUrl(fileName);

    // Save metadata to database
    const fileDoc = new FileModel({
      filename: fileName,
      originalName: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      url: publicUrl,
      storageType: 's3',
      uploadedBy: req.body.userId || null
    });

    await fileDoc.save();

    res.status(201).json({
      success: true,
      message: 'File uploaded successfully to S3',
      data: {
        file: fileDoc.toObject(),
        uploadUrl: publicUrl, // This is now the actual file URL
        downloadUrl: presignedDownloadUrl
      }
    } as UploadResponse);

  } catch (error) {
    console.error('S3 upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload file to S3',
      error: error instanceof Error ? error.message : 'Unknown error'
    } as UploadResponse);
  }
});


// Local Storage Upload conroller
export const localUploadController = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({
        success: false,
        message: 'No file uploaded',
        error: 'File is required'
      } as UploadResponse);
      return;
    }

    // Create file URL for local storage
    const fileUrl = `/uploads/${req.file.filename}`;

    // Save metadata to database
    const fileDoc = new FileModel({
      filename: req.file.filename,
      originalName: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      url: fileUrl,
      storageType: 'local',
      uploadedBy: req.body.userId || null
    });

    await fileDoc.save();

    res.status(201).json({
      success: true,
      message: 'File uploaded successfully to local storage',
      data: {
        file: fileDoc.toObject()
      }
    } as UploadResponse);

  } catch (error) {
    console.error('Local upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload file locally',
      error: error instanceof Error ? error.message : 'Unknown error'
    } as UploadResponse);
  }
})


//all files controller

export const getuploadController = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const files = await FileModel.find()
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip)
      .lean();

    const total = await FileModel.countDocuments();

    res.json({
      success: true,
      data: {
        files,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get files error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch files',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
})


// Get file by ID controller

export const getuploadbyidController = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  try {
    const file = await FileModel.findById(req.params.id);

    if (!file) {
      res.status(404).json({
        success: false,
        message: 'File not found'
      });
      return;
    }

    // Generate presigned URL for S3 files
     let accessUrl = await s3Service.getPresignedDownloadUrl(file.filename);
    

    res.json({
      success: true,
      data: {
        file: file.toObject(),
        accessUrl
      }
    });
  } catch (error) {
    console.error('Get file error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch file',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
})

