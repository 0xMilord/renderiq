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

// Helper function to get service account credentials
// Supports both JSON env var (Vercel) and file path (local dev)
function getStorageConfig() {
  const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID || 'inheritage-viewer-sdk-v1';
  
  // ✅ VERCEL/Production: Check for JSON credentials in environment variable first
  // This is the preferred method for production deployments
  const credentialsJson = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
  if (credentialsJson) {
    try {
      const credentials = JSON.parse(credentialsJson);
      logger.log('✅ GCS: Using credentials from GOOGLE_APPLICATION_CREDENTIALS_JSON env var (Vercel-safe)');
      return {
        projectId,
        credentials,
      };
    } catch (error) {
      logger.error('❌ GCS: Failed to parse GOOGLE_APPLICATION_CREDENTIALS_JSON:', error);
      // Fall through to file-based method
    }
  }
  
  // ✅ Local Development: Fall back to file-based credentials
  let keyFilename = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  
  // If not set or path is invalid/not a file, try to find service-account-key.json in project root
  if (!isValidKeyFile(keyFilename)) {
    const rootKeyPath = path.resolve(process.cwd(), 'service-account-key.json');
    if (isValidKeyFile(rootKeyPath)) {
      keyFilename = rootKeyPath;
      logger.log('✅ GCS: Using service account key from project root');
    }
  } else {
    keyFilename = path.resolve(keyFilename);
    logger.log('✅ GCS: Using service account key from GOOGLE_APPLICATION_CREDENTIALS path');
  }
  
  // Return config with keyFilename if we have one
  if (keyFilename && isValidKeyFile(keyFilename)) {
    return {
      projectId,
      keyFilename,
    };
  }
  
  // No credentials found - Storage client will try Application Default Credentials (ADC)
  logger.warn('⚠️ GCS: No explicit credentials found, will use Application Default Credentials if available');
  return {
    projectId,
  };
}

// Initialize Google Cloud Storage client
// ✅ FIXED: Lazy initialization to handle missing credentials gracefully
let storage: Storage | null = null;

function getStorageClient(): Storage {
  if (!storage) {
    const storageConfig = getStorageConfig();
    try {
      storage = new Storage(storageConfig);
      logger.log('✅ GCS: Storage client initialized successfully');
    } catch (error) {
      logger.error('❌ GCS: Failed to initialize storage client:', error);
      // Try with minimal config (ADC)
      storage = new Storage({ projectId: storageConfig.projectId });
      logger.warn('⚠️ GCS: Using minimal config, relying on Application Default Credentials');
    }
  }
  return storage;
}

// Bucket names from environment
const RENDERS_BUCKET = process.env.GOOGLE_CLOUD_STORAGE_BUCKET_RENDERS || 'renderiq-renders';
const UPLOADS_BUCKET = process.env.GOOGLE_CLOUD_STORAGE_BUCKET_UPLOADS || 'renderiq-uploads';
const RECEIPTS_BUCKET = process.env.GOOGLE_CLOUD_STORAGE_BUCKET_RECEIPTS || 'renderiq-receipts';

// CDN domain (optional, falls back to storage.googleapis.com)
// Note: CDN is NOT used for receipts bucket (private, uses signed URLs)
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
    let bucket: string;
    if (bucketName === 'renders') {
      bucket = RENDERS_BUCKET;
    } else if (bucketName === 'receipts') {
      bucket = RECEIPTS_BUCKET;
    } else {
      bucket = UPLOADS_BUCKET;
    }
    return getStorageClient().bucket(bucket);
  }

  /**
   * Generate public URL for a file
   * Uses CDN domain if configured, otherwise uses storage.googleapis.com
   * CDN is configured for both renders and uploads buckets
   */
      private static getPublicUrl(bucketName: string, filePath: string): string {
    // Receipts bucket is private - should use signed URLs, not public URLs
    // This method should not be called for receipts, but we handle it gracefully
    if (bucketName === 'receipts') {
      // For receipts, return the storage URL (will need signed URL for access)
      return `https://storage.googleapis.com/${RECEIPTS_BUCKET}/${filePath}`;
    }
    
    const bucket = bucketName === 'renders' ? RENDERS_BUCKET : UPLOADS_BUCKET;
    
    // Use CDN with simplified paths: /uploads/* and /renders/*
    // URL rewrite in load balancer strips the prefix, so backend bucket receives just the filePath
    // Note: CDN is NOT used for receipts (private bucket)
    if (CDN_DOMAIN) {
      const pathPrefix = bucketName === 'renders' ? 'renders' : 'uploads';
      return `https://${CDN_DOMAIN}/${pathPrefix}/${filePath}`;
    }
    
    // Use standard GCS public URL when CDN not configured
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
      // Receipts bucket has different structure: receipts/{userId}/{fileName}
      const filePath = bucket === 'receipts'
        ? `receipts/${userId}/${finalFileName}`
        : projectSlug
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
      // Receipts bucket is private, so no cache headers needed (uses signed URLs)
      const isImage = contentType?.startsWith('image/');
      const isReceipt = bucket === 'receipts';
      const cacheControl = isReceipt
        ? 'private, no-cache, no-store, must-revalidate' // Private receipts - no caching
        : isImage 
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
      // if the bucket has public IAM permissions. Receipts bucket is private.
      // For receipts, we store the file path and generate signed URLs on-demand
      // (GCS max signed URL expiration is 7 days, so we can't use 1 year)

      // For receipts bucket, generate signed URL on-demand (max 7 days expiration)
      // GCS max signed URL expiration is 7 days (604800 seconds)
      let publicUrl: string;
      if (bucket === 'receipts') {
        // Generate signed URL with max 7 days expiration for receipts
        publicUrl = await this.getSignedUrl(bucket, filePath, 604800); // 7 days (max allowed)
      } else {
        publicUrl = this.getPublicUrl(bucket, filePath);
      }

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
   * For receipts bucket, returns signed URL (private bucket, no CDN)
   * GCS max signed URL expiration is 7 days (604800 seconds)
   */
  static async getPublicUrlForFile(bucket: string, key: string): Promise<string> {
    // Receipts bucket is private - use signed URL (no CDN)
    // Generate signed URL on-demand with max 7 days expiration
    if (bucket === 'receipts') {
      // GCS max signed URL expiration is 7 days (604800 seconds)
      return await this.getSignedUrl(bucket, key, 604800); // 7 days (max allowed)
    }
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

