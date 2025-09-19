import mongoose, { Schema, Document } from 'mongoose';
import { FileMetadata } from '../types/express/index';

interface FileDocument extends FileMetadata, Document {}

const FileSchema = new Schema<FileDocument>({
  filename: {
    type: String,
    required: true,
    trim: true
  },
  originalName: {
    type: String,
    required: true,
    trim: true
  },
  mimetype: {
    type: String,
    required: true,
    enum: ['image/png', 'image/jpeg', 'image/jpg', 'application/pdf']
  },
  size: {
    type: Number,
    required: true,
    max: 5 * 1024 * 1024 // 5MB
  },
  url: {
    type: String,
    required: true
  },
  storageType: {
    type: String,
    required: true,
    enum: ['s3', 'cloudinary', 'local']
  },
  uploadedBy: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

// Index for efficient queries
FileSchema.index({ createdAt: -1 });
FileSchema.index({ uploadedBy: 1 });
FileSchema.index({ storageType: 1 });

export const FileModel = mongoose.model<FileDocument>('File', FileSchema);