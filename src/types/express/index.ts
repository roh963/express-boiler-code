import { IUser } from '../../models/user.model';

export type UserPayload = {
  _id: string;
  role: string;
  email: string;
};

declare module 'express' {
  interface Request {
    user?: UserPayload | IUser;
  }
}


export interface FileMetadata {
  filename: string;
  originalName: string;
  mimetype: string;
  size: number;
  url: string;
  storageType: 'local';
  uploadedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UploadResponse {
  success: boolean;
  message: string;
  data?: {
    file: FileMetadata;
  };
  error?: string;
}

export interface FeedbackDocument {
  _id?: string;
  title: string;
  content: string;
  rating: number;
  userId?: string;
  attachments?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface EmailJobData {
  feedbackId: string;
  userEmail?: string;
  feedbackTitle: string;
  feedbackContent: string;
}

export interface SendOTPRequest {
  email: string;
}

export interface VerifyOTPRequest {
  email: string;
  otp: string;
}

export interface SendOTPResponse {
  success: boolean;
  message: string;
}

export interface VerifyOTPResponse {
  success: boolean;
  message: string;
}
