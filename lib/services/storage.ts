import { createClient } from '@supabase/supabase-js';
import { nanoid } from 'nanoid';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

export class StorageService {
  static async uploadFile(
    file: File | Buffer,
    bucket: string,
    folder?: string,
    fileName?: string
  ): Promise<{ url: string; key: string }> {
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

      const filePath = folder ? `${folder}/${finalFileName}` : finalFileName;

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

      return {
        url: publicUrl,
        key: data.path,
      };
    } catch (error) {
      throw new Error(`Storage upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static async uploadFromUrl(
    imageUrl: string,
    bucket: string,
    folder?: string,
    fileName?: string
  ): Promise<{ url: string; key: string }> {
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
      const filePath = folder ? `${folder}/${finalFileName}` : finalFileName;

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

      return {
        url: publicUrl,
        key: data.path,
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
}
