import { createClient } from '@supabase/supabase-js';
import { nanoid } from 'nanoid';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { fileStorage } from '@/lib/db/schema';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

export class StorageService {
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

      if (file instanceof File) {
        const fileExt = file.name.split('.').pop();
        finalFileName = fileName || `${nanoid()}.${fileExt}`;
        fileBuffer = Buffer.from(await file.arrayBuffer());
      } else {
        finalFileName = fileName || `${nanoid()}.png`;
        fileBuffer = file;
      }

      // Create organized file path
      const filePath = projectSlug 
        ? `projects/${projectSlug}/${userId}/${finalFileName}`
        : bucket === 'uploads' 
          ? `uploads/${userId}/${finalFileName}`
          : `renders/${userId}/${finalFileName}`;

      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(filePath, fileBuffer, {
          cacheControl: '3600',
          upsert: false,
          contentType: file instanceof File ? file.type : 'image/png',
        });

      if (error) {
        throw new Error(`Upload failed: ${error.message}`);
      }

      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

      // Create file storage record
      const fileRecord = await db.insert(fileStorage).values({
        userId,
        fileName: finalFileName,
        originalName: file instanceof File ? file.name : 'generated.png',
        mimeType: file instanceof File ? file.type : 'image/png',
        size: fileBuffer.length,
        url: publicUrl,
        key: data.path,
        bucket,
        isPublic: true,
      }).returning({ id: fileStorage.id });

      return {
        url: publicUrl,
        key: data.path,
        id: fileRecord[0].id,
      };
    } catch (error) {
      throw new Error(`Storage upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static async uploadFromUrl(
    imageUrl: string,
    bucket: string,
    userId: string,
    fileName?: string,
    projectSlug?: string
  ): Promise<{ url: string; key: string; id: string }> {
    try {
      // Handle blob URLs by converting to buffer
      let buffer: Buffer;
      
      if (imageUrl.startsWith('blob:')) {
        // For blob URLs, we need to handle this differently
        // This should not happen in server-side code
        throw new Error('Blob URLs cannot be processed on server side');
      } else {
        // Fetch from regular URL
        const response = await fetch(imageUrl);
        if (!response.ok) {
          throw new Error(`Failed to fetch image: ${response.statusText}`);
        }
        buffer = Buffer.from(await response.arrayBuffer());
      }

      const finalFileName = fileName || `${nanoid()}.png`;
      const filePath = projectSlug 
        ? `projects/${projectSlug}/${userId}/${finalFileName}`
        : bucket === 'uploads' 
          ? `uploads/${userId}/${finalFileName}`
          : `renders/${userId}/${finalFileName}`;

      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(filePath, buffer, {
          cacheControl: '3600',
          upsert: false,
          contentType: 'image/png',
        });

      if (error) {
        throw new Error(`Upload failed: ${error.message}`);
      }

      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

      // Create file storage record
      const fileRecord = await db.insert(fileStorage).values({
        userId,
        fileName: finalFileName,
        originalName: finalFileName,
        mimeType: 'image/svg+xml',
        size: buffer.length,
        url: publicUrl,
        key: data.path,
        bucket,
        isPublic: true,
      }).returning({ id: fileStorage.id });

      return {
        url: publicUrl,
        key: data.path,
        id: fileRecord[0].id,
      };
    } catch (error) {
      throw new Error(`Storage upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static async deleteFile(bucket: string, key: string): Promise<void> {
    try {
      const { error } = await supabase.storage
        .from(bucket)
        .remove([key]);

      if (error) {
        throw new Error(`Delete failed: ${error.message}`);
      }
    } catch (error) {
      throw new Error(`Storage delete failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static async getSignedUrl(bucket: string, key: string, expiresIn = 3600): Promise<string> {
    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .createSignedUrl(key, expiresIn);

      if (error) {
        throw new Error(`Signed URL failed: ${error.message}`);
      }

      return data.signedUrl;
    } catch (error) {
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
      
      // Get the public URL from Supabase storage
      const { data: { publicUrl } } = supabase.storage
        .from(file.bucket)
        .getPublicUrl(file.key);
      
      return publicUrl;
    } catch (error) {
      throw new Error(`Get file URL failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static async updateFileProjectSlug(fileId: string, projectSlug: string): Promise<void> {
    try {
      console.log('🔄 Updating file project slug:', { fileId, projectSlug });
      
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
        
      console.log('✅ File project slug updated successfully');
    } catch (error) {
      console.error('❌ Failed to update file project slug:', error);
      throw new Error(`Update file project slug failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
