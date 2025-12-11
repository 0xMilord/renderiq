/**
 * Resumable Upload Service
 * Handles GCS resumable uploads for large files
 */

import { Storage } from '@google-cloud/storage';
import { nanoid } from 'nanoid';
import { logger } from '@/lib/utils/logger';
import { GCSStorageService } from './gcs-storage';
import { db } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { resumableUploads } from '@/lib/db/schema';
import * as path from 'path';
import * as fs from 'fs';

// Get storage client (reuse GCS storage initialization logic)
function getStorageClient(): Storage {
  const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID || 'inheritage-viewer-sdk-v1';
  
  // Check for JSON credentials in environment variable first (Vercel-safe)
  const credentialsJson = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
  if (credentialsJson) {
    try {
      const credentials = JSON.parse(credentialsJson);
      return new Storage({ projectId, credentials });
    } catch (error) {
      logger.error('❌ GCS: Failed to parse credentials JSON:', error);
    }
  }
  
  // Fall back to file-based credentials
  let keyFilename = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  
  if (!keyFilename || !fs.existsSync(keyFilename)) {
    const rootKeyPath = path.resolve(process.cwd(), 'service-account-key.json');
    if (fs.existsSync(rootKeyPath)) {
      keyFilename = rootKeyPath;
    }
  }
  
  if (keyFilename && fs.existsSync(keyFilename)) {
    return new Storage({ projectId, keyFilename });
  }
  
  // Use Application Default Credentials
  return new Storage({ projectId });
}

// Use the same bucket configuration as GCSStorageService
const UPLOADS_BUCKET = process.env.GOOGLE_CLOUD_STORAGE_BUCKET_UPLOADS || 'renderiq-uploads';

export interface ResumableUploadInit {
  sessionId: string;
  uploadUrl: string;
  expiresAt: Date;
  bucket: string;
  filePath: string;
  totalSize?: number;
}

export interface ResumableUploadSession {
  id: string;
  userId: string;
  bucket: string;
  filePath: string;
  totalSize: number;
  uploadedBytes: number;
  uploadUrl: string;
  expiresAt: Date;
  createdAt: Date;
  status: 'initialized' | 'uploading' | 'completed' | 'failed';
}

/**
 * Initialize a resumable upload session
 */
export async function initResumableUpload(
  userId: string,
  fileName: string,
  contentType: string,
  totalSize: number,
  bucket: string = 'uploads',
  projectSlug?: string
): Promise<ResumableUploadInit> {
  try {
    // Generate unique file path
    const fileExt = fileName.split('.').pop() || 'bin';
    const finalFileName = `${nanoid()}.${fileExt}`;
    
    const filePath = bucket === 'receipts'
      ? `receipts/${userId}/${finalFileName}`
      : projectSlug
        ? `projects/${projectSlug}/${userId}/${finalFileName}`
        : bucket === 'uploads'
          ? `uploads/${userId}/${finalFileName}`
          : `renders/${userId}/${finalFileName}`;

    // Get GCS bucket
    const gcsBucket = getGCSBucket(bucket);
    const gcsFile = gcsBucket.file(filePath);

    // Create resumable upload session
    // GCS resumable uploads support up to 5TB files
    const [uploadUrl] = await gcsFile.createResumableUpload({
      metadata: {
        contentType,
        cacheControl: contentType.startsWith('image/')
          ? 'public, max-age=31536000, immutable'
          : 'public, max-age=3600',
      },
    });

    // Generate session ID
    const sessionId = nanoid();

    // Expires in 24 hours
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    // Store session in database
    await db.insert(resumableUploads).values({
      id: sessionId,
      userId,
      bucket,
      filePath,
      totalSize,
      uploadedBytes: 0,
      uploadUrl,
      expiresAt,
      status: 'initialized',
    });

    logger.log('✅ Resumable Upload: Session initialized', {
      sessionId,
      userId,
      filePath,
      totalSize,
    });

    return {
      sessionId,
      uploadUrl,
      expiresAt,
      bucket,
      filePath,
      totalSize,
    };
  } catch (error) {
    logger.error('❌ Resumable Upload: Init failed:', error);
    throw new Error(`Failed to initialize resumable upload: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get resumable upload session by ID
 */
export async function getResumableUploadSession(sessionId: string): Promise<ResumableUploadSession | null> {
  try {
    const [session] = await db
      .select()
      .from(resumableUploads)
      .where(eq(resumableUploads.id, sessionId))
      .limit(1);

    if (!session) {
      return null;
    }

    return {
      id: session.id,
      userId: session.userId,
      bucket: session.bucket,
      filePath: session.filePath,
      totalSize: session.totalSize,
      uploadedBytes: session.uploadedBytes,
      uploadUrl: session.uploadUrl,
      expiresAt: session.expiresAt,
      createdAt: session.createdAt,
      status: session.status as 'initialized' | 'uploading' | 'completed' | 'failed',
    };
  } catch (error) {
    logger.error('❌ Resumable Upload: Get session failed:', error);
    return null;
  }
}

/**
 * Update resumable upload progress
 */
export async function updateResumableUploadProgress(
  sessionId: string,
  uploadedBytes: number,
  status?: 'uploading' | 'completed' | 'failed'
): Promise<void> {
  try {
    await db
      .update(resumableUploads)
      .set({
        uploadedBytes,
        status: status || 'uploading',
        updatedAt: new Date(),
      })
      .where(eq(resumableUploads.id, sessionId));
  } catch (error) {
    logger.error('❌ Resumable Upload: Update progress failed:', error);
    throw error;
  }
}

/**
 * Finalize resumable upload and get final URL
 */
export async function finalizeResumableUpload(
  sessionId: string
): Promise<{ url: string; key: string }> {
  try {
    const session = await getResumableUploadSession(sessionId);

    if (!session) {
      throw new Error('Upload session not found');
    }

    if (session.status === 'completed') {
      // Already finalized, return existing URL
      const gcsBucket = getGCSBucket(session.bucket);
      const gcsFile = gcsBucket.file(session.filePath);
      
      // Check if file exists
      const [exists] = await gcsFile.exists();
      if (!exists) {
        throw new Error('Uploaded file not found');
      }

      const publicUrl = session.bucket === 'receipts'
        ? await GCSStorageService.getSignedUrl(session.bucket, session.filePath, 604800)
        : await GCSStorageService.getPublicUrlForFile(session.bucket, session.filePath);

      return {
        url: publicUrl,
        key: session.filePath,
      };
    }

    // Mark as completed
    await updateResumableUploadProgress(sessionId, session.totalSize, 'completed');

    // Get final URL
    const gcsBucket = getGCSBucket(session.bucket);
    const gcsFile = gcsBucket.file(session.filePath);
    
    // Verify file exists and get metadata
    const [exists] = await gcsFile.exists();
    if (!exists) {
      throw new Error('Uploaded file not found. Upload may not be complete.');
    }

    const publicUrl = session.bucket === 'receipts'
      ? await GCSStorageService.getSignedUrl(session.bucket, session.filePath, 604800)
      : await GCSStorageService.getPublicUrlForFile(session.bucket, session.filePath);

    logger.log('✅ Resumable Upload: Finalized', {
      sessionId,
      filePath: session.filePath,
      totalSize: session.totalSize,
    });

    return {
      url: publicUrl,
      key: session.filePath,
    };
  } catch (error) {
    logger.error('❌ Resumable Upload: Finalize failed:', error);
    
    // Mark as failed
    try {
      await updateResumableUploadProgress(sessionId, 0, 'failed');
    } catch {
      // Ignore update errors
    }

    throw new Error(`Failed to finalize upload: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get GCS bucket (helper function)
 */
function getGCSBucket(bucketName: string) {
  const storage = getStorageClient();
  
  if (bucketName === 'renders') {
    return storage.bucket(process.env.GOOGLE_CLOUD_STORAGE_BUCKET_RENDERS || 'renderiq-renders');
  } else if (bucketName === 'receipts') {
    return storage.bucket(process.env.GOOGLE_CLOUD_STORAGE_BUCKET_RECEIPTS || 'renderiq-receipts');
  } else {
    return storage.bucket(UPLOADS_BUCKET);
  }
}

