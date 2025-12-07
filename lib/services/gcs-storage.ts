import { Storage } from '@google-cloud/storage';
import { nanoid } from 'nanoid';
import { logger } from '@/lib/utils/logger';
import * as fs from 'fs';
import * as path from 'path';

// Helper function to check if a path is a valid file
function isValidKeyFile(filePath: string | undefined): boolean {
  if (!filePath) return false;
  try {
    const resolvedPath = path.resolve(filePath);
    return fs.existsSync(resolvedPath) && fs.statSync(resolvedPath).isFile();
  } catch {
    return false;
  }
}

// Helper function to get service account key path
function getServiceAccountKeyPath(): string | undefined {
  let keyFilename = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  
  // If not set or path is invalid/not a file, try to find service-account-key.json in project root
  if (!isValidKeyFile(keyFilename)) {
    const rootKeyPath = path.resolve(process.cwd(), 'service-account-key.json');
    if (isValidKeyFile(rootKeyPath)) {
      return rootKeyPath;
    }
    return undefined;
  }
  
  return path.resolve(keyFilename);
}

// Initialize Google Cloud Storage client
const storage = new Storage({
  projectId: process.env.GOOGLE_CLOUD_PROJECT_ID || 'inheritage-viewer-sdk-v1',
  keyFilename: getServiceAccountKeyPath(),
});

// Bucket names from environment
const RENDERS_BUCKET = process.env.GOOGLE_CLOUD_STORAGE_BUCKET_RENDERS || 'renderiq-renders';
const UPLOADS_BUCKET = process.env.GOOGLE_CLOUD_STORAGE_BUCKET_UPLOADS || 'renderiq-uploads';

// CDN domain (optional, falls back to storage.googleapis.com)
const CDN_DOMAIN = process.env.GCS_CDN_DOMAIN;

export interface UploadResult {
  url: string;
  key: string;
  publicUrl: string;
}

export class GCSStorageService {
  /**
   * Get the appropriate bucket based on bucket name
   */
  private static getBucket(bucketName: string) {
    const bucket = bucketName === 'renders' ? RENDERS_BUCKET : UPLOADS_BUCKET;
    return storage.bucket(bucket);
  }

  /**
   * Generate public URL for a file
   * Uses CDN domain if configured, otherwise uses storage.googleapis.com
   */
  private static getPublicUrl(bucketName: string, filePath: string): string {
    const bucket = bucketName === 'renders' ? RENDERS_BUCKET : UPLOADS_BUCKET;
    
    if (CDN_DOMAIN) {
      // Use custom CDN domain
      return `https://${CDN_DOMAIN}/${bucket}/${filePath}`;
    }
    
    // Use standard GCS public URL
    return `https://storage.googleapis.com/${bucket}/${filePath}`;
  }

  /**
   * Upload a file to Google Cloud Storage
   */
  static async uploadFile(
    file: File | Buffer,
    bucket: string,
    userId: string,
    fileName?: string,
    projectSlug?: string,
    contentType?: string
  ): Promise<UploadResult> {
    try {
      let finalFileName: string;
      let fileBuffer: Buffer;

      if (file instanceof File) {
        const fileExt = file.name.split('.').pop();
        finalFileName = fileName || `${nanoid()}.${fileExt}`;
        fileBuffer = Buffer.from(await file.arrayBuffer());
        contentType = contentType || file.type;
      } else {
        finalFileName = fileName || `${nanoid()}.png`;
        fileBuffer = file;
        contentType = contentType || 'image/png';
      }

      // Create organized file path (same structure as Supabase)
      const filePath = projectSlug
        ? `projects/${projectSlug}/${userId}/${finalFileName}`
        : bucket === 'uploads'
          ? `uploads/${userId}/${finalFileName}`
          : `renders/${userId}/${finalFileName}`;

      const gcsBucket = this.getBucket(bucket);
      const gcsFile = gcsBucket.file(filePath);

      // Upload file with metadata
      // Note: With uniform bucket-level access enabled, we can't use legacy ACLs
      // The bucket's IAM policy controls public access, not per-file ACLs
      // Extended cache headers for better CDN performance (1 year for images, 1 hour for dynamic content)
      const isImage = contentType?.startsWith('image/');
      const cacheControl = isImage 
        ? 'public, max-age=31536000, immutable' // 1 year for images (they don't change)
        : 'public, max-age=3600'; // 1 hour for other content
      
      await gcsFile.save(fileBuffer, {
        metadata: {
          contentType,
          cacheControl,
        },
        // Don't use 'public' option - uniform bucket-level access handles this via IAM
      });

      // Note: With uniform bucket-level access, files are automatically public
      // if the bucket has public IAM permissions. No need to call makePublic().

      const publicUrl = this.getPublicUrl(bucket, filePath);

      logger.log('✅ GCS: File uploaded successfully:', { bucket, filePath, publicUrl });

      return {
        url: publicUrl,
        key: filePath,
        publicUrl,
      };
    } catch (error) {
      logger.error('❌ GCS: Upload failed:', error);
      throw new Error(`GCS upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Upload file from URL
   */
  static async uploadFromUrl(
    imageUrl: string,
    bucket: string,
    userId: string,
    fileName?: string,
    projectSlug?: string
  ): Promise<UploadResult> {
    try {
      if (imageUrl.startsWith('blob:')) {
        throw new Error('Blob URLs cannot be processed on server side');
      }

      // Fetch from URL
      const response = await fetch(imageUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.statusText}`);
      }

      const buffer = Buffer.from(await response.arrayBuffer());
      const contentType = response.headers.get('content-type') || 'image/png';
      const finalFileName = fileName || `${nanoid()}.png`;

      return await this.uploadFile(
        buffer,
        bucket,
        userId,
        finalFileName,
        projectSlug,
        contentType
      );
    } catch (error) {
      logger.error('❌ GCS: Upload from URL failed:', error);
      throw new Error(`GCS upload from URL failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Delete a file from Google Cloud Storage
   */
  static async deleteFile(bucket: string, key: string): Promise<void> {
    try {
      const gcsBucket = this.getBucket(bucket);
      const gcsFile = gcsBucket.file(key);
      
      await gcsFile.delete();
      
      logger.log('✅ GCS: File deleted successfully:', { bucket, key });
    } catch (error) {
      logger.error('❌ GCS: Delete failed:', error);
      throw new Error(`GCS delete failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate a signed URL for private file access
   */
  static async getSignedUrl(
    bucket: string,
    key: string,
    expiresIn = 3600
  ): Promise<string> {
    try {
      const gcsBucket = this.getBucket(bucket);
      const gcsFile = gcsBucket.file(key);

      const [signedUrl] = await gcsFile.getSignedUrl({
        version: 'v4',
        action: 'read',
        expires: Date.now() + expiresIn * 1000,
      });

      return signedUrl;
    } catch (error) {
      logger.error('❌ GCS: Signed URL generation failed:', error);
      throw new Error(`GCS signed URL failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get public URL for a file
   */
  static getPublicUrlForFile(bucket: string, key: string): string {
    return this.getPublicUrl(bucket, key);
  }

  /**
   * Check if a file exists
   */
  static async fileExists(bucket: string, key: string): Promise<boolean> {
    try {
      const gcsBucket = this.getBucket(bucket);
      const gcsFile = gcsBucket.file(key);
      const [exists] = await gcsFile.exists();
      return exists;
    } catch (error) {
      logger.error('❌ GCS: File exists check failed:', error);
      return false;
    }
  }

  /**
   * Copy file from one location to another (useful for migration)
   */
  static async copyFile(
    sourceBucket: string,
    sourceKey: string,
    destBucket: string,
    destKey: string
  ): Promise<void> {
    try {
      const sourceGcsBucket = this.getBucket(sourceBucket);
      const destGcsBucket = this.getBucket(destBucket);
      const sourceFile = sourceGcsBucket.file(sourceKey);
      const destFile = destGcsBucket.file(destKey);

      await sourceFile.copy(destFile);
      
      logger.log('✅ GCS: File copied successfully:', { sourceKey, destKey });
    } catch (error) {
      logger.error('❌ GCS: Copy failed:', error);
      throw new Error(`GCS copy failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

