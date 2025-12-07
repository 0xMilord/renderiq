import { createClient } from '@supabase/supabase-js';
import { nanoid } from 'nanoid';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { fileStorage } from '@/lib/db/schema';
import { logger } from '@/lib/utils/logger';
import { GCSStorageService } from './gcs-storage';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

// Storage provider configuration
const STORAGE_PROVIDER = (process.env.STORAGE_PROVIDER || 'supabase') as 'supabase' | 'gcs' | 'dual-write';
const USE_GCS = STORAGE_PROVIDER === 'gcs' || STORAGE_PROVIDER === 'dual-write';
const USE_SUPABASE = STORAGE_PROVIDER === 'supabase' || STORAGE_PROVIDER === 'dual-write';

export class StorageService {
  /**
   * Upload file to storage (supports Supabase, GCS, or dual-write)
   */
  static async uploadFile(
    file: File | Buffer,
    bucket: string,
    userId: string,
    fileName?: string,
    projectSlug?: string
  ): Promise<{ url: string; key: string; id: string }> {
    try {
      let finalFileName: string;
      let fileBuffer: Buffer;
      let contentType: string;

      if (file instanceof File) {
        const fileExt = file.name.split('.').pop();
        finalFileName = fileName || `${nanoid()}.${fileExt}`;
        fileBuffer = Buffer.from(await file.arrayBuffer());
        contentType = file.type;
      } else {
        finalFileName = fileName || `${nanoid()}.png`;
        fileBuffer = file;
        contentType = 'image/png';
      }

      // Create organized file path (same structure for both providers)
      const filePath = projectSlug 
        ? `projects/${projectSlug}/${userId}/${finalFileName}`
        : bucket === 'uploads' 
          ? `uploads/${userId}/${finalFileName}`
          : `renders/${userId}/${finalFileName}`;

      let publicUrl: string;
      let storageKey: string;

      // Dual-write mode: Upload to both Supabase and GCS
      if (STORAGE_PROVIDER === 'dual-write') {
        logger.log('🔄 Storage: Dual-write mode - uploading to both Supabase and GCS');
        
        const [supabaseResult, gcsResult] = await Promise.allSettled([
          USE_SUPABASE ? this.uploadToSupabase(bucket, filePath, fileBuffer, contentType) : Promise.resolve(null),
          USE_GCS ? GCSStorageService.uploadFile(file, bucket, userId, finalFileName, projectSlug, contentType) : Promise.resolve(null),
        ]);

        // Use GCS result if available, otherwise fall back to Supabase
        if (gcsResult.status === 'fulfilled' && gcsResult.value) {
          publicUrl = gcsResult.value.publicUrl;
          storageKey = gcsResult.value.key;
          logger.log('✅ Storage: GCS upload successful (primary)');
        } else if (supabaseResult.status === 'fulfilled' && supabaseResult.value) {
          publicUrl = supabaseResult.value.publicUrl;
          storageKey = supabaseResult.value.key;
          logger.log('✅ Storage: Supabase upload successful (fallback)');
        } else {
          throw new Error('Both storage providers failed');
        }

        // Log any failures (non-blocking)
        if (supabaseResult.status === 'rejected') {
          logger.warn('⚠️ Storage: Supabase upload failed (non-blocking):', supabaseResult.reason);
        }
        if (gcsResult.status === 'rejected') {
          logger.warn('⚠️ Storage: GCS upload failed (non-blocking):', gcsResult.reason);
        }
      }
      // GCS-only mode
      else if (STORAGE_PROVIDER === 'gcs') {
        const result = await GCSStorageService.uploadFile(file, bucket, userId, finalFileName, projectSlug, contentType);
        publicUrl = result.publicUrl;
        storageKey = result.key;
      }
      // Supabase-only mode (default)
      else {
        const result = await this.uploadToSupabase(bucket, filePath, fileBuffer, contentType);
        publicUrl = result.publicUrl;
        storageKey = result.key;
      }

      // Create file storage record
      const fileRecord = await db.insert(fileStorage).values({
        userId,
        fileName: finalFileName,
        originalName: file instanceof File ? file.name : 'generated.png',
        mimeType: contentType,
        size: fileBuffer.length,
        url: publicUrl,
        key: storageKey,
        bucket,
        isPublic: true,
        metadata: {
          provider: STORAGE_PROVIDER,
          uploadedAt: new Date().toISOString(),
        },
      }).returning({ id: fileStorage.id });

      return {
        url: publicUrl,
        key: storageKey,
        id: fileRecord[0].id,
      };
    } catch (error) {
      logger.error('❌ Storage: Upload failed:', error);
      throw new Error(`Storage upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Helper method to upload to Supabase (extracted for dual-write support)
   */
  private static async uploadToSupabase(
    bucket: string,
    filePath: string,
    fileBuffer: Buffer,
    contentType: string
  ): Promise<{ publicUrl: string; key: string }> {
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, fileBuffer, {
        cacheControl: '3600',
        upsert: false,
        contentType,
      });

    if (error) {
      throw new Error(`Supabase upload failed: ${error.message}`);
    }

    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);

    return {
      publicUrl,
      key: data.path,
    };
  }

  static async uploadFromUrl(
    imageUrl: string,
    bucket: string,
    userId: string,
    fileName?: string,
    projectSlug?: string
  ): Promise<{ url: string; key: string; id: string }> {
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

      // Use the main uploadFile method which handles provider selection
      return await this.uploadFile(
        buffer,
        bucket,
        userId,
        finalFileName,
        projectSlug
      );
    } catch (error) {
      logger.error('❌ Storage: Upload from URL failed:', error);
      throw new Error(`Storage upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static async deleteFile(bucket: string, key: string): Promise<void> {
    try {
      if (STORAGE_PROVIDER === 'dual-write') {
        // Delete from both providers
        const [supabaseResult, gcsResult] = await Promise.allSettled([
          USE_SUPABASE ? supabase.storage.from(bucket).remove([key]) : Promise.resolve(null),
          USE_GCS ? GCSStorageService.deleteFile(bucket, key) : Promise.resolve(null),
        ]);

        // Log failures but don't throw if at least one succeeds
        if (supabaseResult.status === 'rejected') {
          logger.warn('⚠️ Storage: Supabase delete failed:', supabaseResult.reason);
        }
        if (gcsResult.status === 'rejected') {
          logger.warn('⚠️ Storage: GCS delete failed:', gcsResult.reason);
        }

        // If both failed, throw error
        if (supabaseResult.status === 'rejected' && gcsResult.status === 'rejected') {
          throw new Error('Both storage providers failed to delete file');
        }
      } else if (STORAGE_PROVIDER === 'gcs') {
        await GCSStorageService.deleteFile(bucket, key);
      } else {
        const { error } = await supabase.storage.from(bucket).remove([key]);
        if (error) {
          throw new Error(`Delete failed: ${error.message}`);
        }
      }
    } catch (error) {
      logger.error('❌ Storage: Delete failed:', error);
      throw new Error(`Storage delete failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static async getSignedUrl(bucket: string, key: string, expiresIn = 3600): Promise<string> {
    try {
      if (STORAGE_PROVIDER === 'gcs') {
        return await GCSStorageService.getSignedUrl(bucket, key, expiresIn);
      } else {
        const { data, error } = await supabase.storage
          .from(bucket)
          .createSignedUrl(key, expiresIn);

        if (error) {
          throw new Error(`Signed URL failed: ${error.message}`);
        }

        return data.signedUrl;
      }
    } catch (error) {
      logger.error('❌ Storage: Signed URL generation failed:', error);
      throw new Error(`Signed URL generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static async getFileUrl(fileId: string): Promise<string> {
    try {
      // Query the file storage table to get the file info
      const fileRecord = await db.select().from(fileStorage).where(eq(fileStorage.id, fileId)).limit(1);
      
      if (fileRecord.length === 0) {
        throw new Error('File not found');
      }
      
      const file = fileRecord[0];
      
      // If URL is already stored and it's a GCS URL, return it directly
      // Otherwise, generate URL based on current provider
      if (file.url && (file.url.includes('storage.googleapis.com') || file.url.includes(process.env.GCS_CDN_DOMAIN || ''))) {
        return file.url;
      }

      // Generate URL based on current provider
      if (STORAGE_PROVIDER === 'gcs') {
        return GCSStorageService.getPublicUrlForFile(file.bucket, file.key);
      } else {
        const { data: { publicUrl } } = supabase.storage
          .from(file.bucket)
          .getPublicUrl(file.key);
        return publicUrl;
      }
    } catch (error) {
      logger.error('❌ Storage: Get file URL failed:', error);
      throw new Error(`Get file URL failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static async updateFileProjectSlug(fileId: string, projectSlug: string): Promise<void> {
    try {
      logger.log('🔄 Updating file project slug:', { fileId, projectSlug });
      
      // Get the current file record
      const fileRecord = await db.select().from(fileStorage).where(eq(fileStorage.id, fileId)).limit(1);
      
      if (fileRecord.length === 0) {
        throw new Error('File not found');
      }
      
      const file = fileRecord[0];
      
      // Update the metadata to include project slug
      const updatedMetadata = {
        ...file.metadata,
        projectSlug
      };
      
      await db.update(fileStorage)
        .set({ 
          metadata: updatedMetadata,
          updatedAt: new Date()
        })
        .where(eq(fileStorage.id, fileId));
        
      logger.log('✅ File project slug updated successfully');
    } catch (error) {
      logger.error('❌ Failed to update file project slug:', error);
      throw new Error(`Update file project slug failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
