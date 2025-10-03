import { RendersDAL } from '@/lib/dal/renders';
import { StorageService } from './storage';
import { ThumbnailSize, ThumbnailGrid } from '@/lib/types/render-chain';

export class ThumbnailService {
  // Thumbnail dimensions
  private static readonly SIZES = {
    small: { width: 150, height: 150 },
    medium: { width: 300, height: 300 },
    large: { width: 600, height: 600 },
  };

  /**
   * Generate thumbnail for a render
   * Note: This is a placeholder. In production, you'd use an image processing library
   * like Sharp or a service like Cloudinary
   */
  static async generateThumbnail(
    renderId: string,
    size: ThumbnailSize = 'medium'
  ): Promise<string> {
    console.log('🖼️ Generating thumbnail:', { renderId, size });
    
    const render = await RendersDAL.getById(renderId);
    
    if (!render) {
      throw new Error('Render not found');
    }

    if (!render.outputUrl) {
      throw new Error('Render has no output URL');
    }

    // For now, return a thumbnail URL pattern
    // In production, you would:
    // 1. Fetch the original image
    // 2. Resize it using Sharp or similar
    // 3. Upload to storage with a thumbnail key
    // 4. Return the thumbnail URL
    
    const thumbnailKey = `thumbnails/${renderId}-${size}.jpg`;
    
    // Placeholder: In a real implementation, process and upload the thumbnail
    // const thumbnailUrl = await this.processAndUploadThumbnail(render.outputUrl, thumbnailKey, size);
    
    // For now, we'll construct a URL pattern that could be used with CDN transforms
    const thumbnailUrl = `${render.outputUrl}?w=${this.SIZES[size].width}&h=${this.SIZES[size].height}`;
    
    console.log('✅ Thumbnail generated:', thumbnailUrl);
    
    return thumbnailUrl;
  }

  /**
   * Generate thumbnails for all renders in a chain
   */
  static async generateChainThumbnails(chainId: string): Promise<ThumbnailGrid> {
    console.log('🖼️ Generating thumbnails for chain:', chainId);
    
    const renders = await RendersDAL.getByChainId(chainId);
    const thumbnails = [];

    for (const render of renders) {
      if (render.status === 'completed' && render.outputUrl) {
        try {
          const url = await this.generateThumbnail(render.id, 'small');
          thumbnails.push({
            renderId: render.id,
            url,
            position: render.chainPosition || 0,
          });
        } catch (error) {
          console.error(`Failed to generate thumbnail for render ${render.id}:`, error);
        }
      }
    }

    // Sort by position
    thumbnails.sort((a, b) => a.position - b.position);

    console.log(`✅ Generated ${thumbnails.length} thumbnails for chain`);

    return {
      chainId,
      thumbnails,
    };
  }

  /**
   * Update thumbnail cache
   * In production, this would regenerate and cache thumbnails
   */
  static async updateThumbnailCache(renderId: string): Promise<void> {
    console.log('🔄 Updating thumbnail cache:', renderId);
    
    const render = await RendersDAL.getById(renderId);
    
    if (!render) {
      throw new Error('Render not found');
    }

    // Generate all sizes
    const sizes: ThumbnailSize[] = ['small', 'medium', 'large'];
    
    for (const size of sizes) {
      try {
        const thumbnailUrl = await this.generateThumbnail(renderId, size);
        console.log(`✅ Cached ${size} thumbnail:`, thumbnailUrl);
      } catch (error) {
        console.error(`Failed to cache ${size} thumbnail:`, error);
      }
    }
  }

  /**
   * Get thumbnail URL for a render
   */
  static async getThumbnailUrl(
    renderId: string,
    size: ThumbnailSize = 'medium'
  ): Promise<string> {
    const render = await RendersDAL.getById(renderId);
    
    if (!render) {
      throw new Error('Render not found');
    }

    // Check if thumbnail exists in render record
    if (render.thumbnailUrl) {
      return this.getThumbnailUrlWithSize(render.thumbnailUrl, size);
    }

    // Generate if doesn't exist
    return await this.generateThumbnail(renderId, size);
  }

  /**
   * Helper: Modify thumbnail URL for specific size
   */
  private static getThumbnailUrlWithSize(baseUrl: string, size: ThumbnailSize): string {
    const { width, height } = this.SIZES[size];
    
    // If using a CDN with transform support, modify the URL
    if (baseUrl.includes('?')) {
      return `${baseUrl}&w=${width}&h=${height}`;
    }
    
    return `${baseUrl}?w=${width}&h=${height}`;
  }

  /**
   * Process and upload thumbnail (placeholder for actual implementation)
   */
  private static async processAndUploadThumbnail(
    sourceUrl: string,
    thumbnailKey: string,
    size: ThumbnailSize
  ): Promise<string> {
    // In production, this would:
    // 1. Fetch the source image
    // 2. Use Sharp or similar to resize
    // 3. Upload to Supabase Storage
    // 4. Return the public URL
    
    const { width, height } = this.SIZES[size];
    
    console.log('Processing thumbnail:', { sourceUrl, thumbnailKey, width, height });
    
    // Placeholder implementation
    return `${sourceUrl}?thumbnail=${size}`;
  }

  /**
   * Bulk generate thumbnails for multiple renders
   */
  static async bulkGenerateThumbnails(
    renderIds: string[],
    size: ThumbnailSize = 'medium'
  ): Promise<Map<string, string>> {
    console.log(`🖼️ Bulk generating ${renderIds.length} thumbnails`);
    
    const results = new Map<string, string>();

    for (const renderId of renderIds) {
      try {
        const url = await this.generateThumbnail(renderId, size);
        results.set(renderId, url);
      } catch (error) {
        console.error(`Failed to generate thumbnail for ${renderId}:`, error);
      }
    }

    console.log(`✅ Generated ${results.size} thumbnails`);
    
    return results;
  }

  /**
   * Delete thumbnails for a render
   */
  static async deleteThumbnails(renderId: string): Promise<void> {
    console.log('🗑️ Deleting thumbnails:', renderId);
    
    // In production, delete all size variants from storage
    const sizes: ThumbnailSize[] = ['small', 'medium', 'large'];
    
    for (const size of sizes) {
      const thumbnailKey = `thumbnails/${renderId}-${size}.jpg`;
      try {
        // await StorageService.deleteFile(thumbnailKey);
        console.log(`Deleted thumbnail: ${thumbnailKey}`);
      } catch (error) {
        console.error(`Failed to delete thumbnail ${thumbnailKey}:`, error);
      }
    }
    
    console.log('✅ Thumbnails deleted');
  }
}

