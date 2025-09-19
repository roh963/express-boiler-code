import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import crypto from 'crypto';

class S3Service {
  private s3Client: S3Client;
  private bucketName: string;

  constructor() {
    if (!process.env.AWS_REGION || !process.env.AWS_ACCESS_KEY || !process.env.AWS_SECRET_KEY) {
      throw new Error('AWS credentials not configured');
    }

    this.s3Client = new S3Client({
      region: process.env.AWS_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY,
        secretAccessKey: process.env.AWS_SECRET_KEY
      }
    });

    this.bucketName = process.env.AWS_S3_BUCKET || '';
    if (!this.bucketName) {
      throw new Error('AWS S3 bucket name not configured');
    }
  }

  public generateFileName(originalName: string, mimetype: string): string {
    const timestamp = Date.now();
    const randomString = crypto.randomBytes(16).toString('hex');
    const extension = this.getFileExtension(mimetype);
    return `uploads/${timestamp}-${randomString}${extension}`;
  }

  private getFileExtension(mimetype: string): string {
    const extensions: Record<string, string> = {
      'image/jpeg': '.jpg',
      'image/jpg': '.jpg',
      'image/png': '.png',
      'application/pdf': '.pdf'
    };
    return extensions[mimetype] || '';
  }

  // **NEW METHOD**: Direct upload to S3
  public async uploadFile(fileName: string, fileBuffer: Buffer, mimetype: string): Promise<void> {
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: fileName,
      Body: fileBuffer,
      ContentType: mimetype,
      // Optional: Make file publicly accessible
      // ACL: 'public-read'
    });

    try {
      await this.s3Client.send(command);
      console.log(`File uploaded successfully: ${fileName}`);
    } catch (error) {
      console.error('Error uploading file to S3:', error);
      throw new Error(`Failed to upload file to S3: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Keep existing methods for presigned URLs (useful for client-side uploads)
  public async getPresignedUploadUrl(fileName: string, mimetype: string): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: fileName,
      ContentType: mimetype
    });

    return getSignedUrl(this.s3Client, command, { expiresIn: 900 }); // 15 minutes
  }

  public async getPresignedDownloadUrl(fileName: string): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: fileName
    });

    return getSignedUrl(this.s3Client, command, { expiresIn: 3600 }); // 1 hour
  }

  public getPublicUrl(fileName: string): string {
    return `https://${this.bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileName}`;
  }

  // **NEW METHOD**: Check if file exists in S3
  public async fileExists(fileName: string): Promise<boolean> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: fileName
      });
      
      await this.s3Client.send(command);
      return true;
    } catch (error: any) {
      if (error.name === 'NoSuchKey') {
        return false;
      }
      throw error;
    }
  }
}

export const s3Service = new S3Service();