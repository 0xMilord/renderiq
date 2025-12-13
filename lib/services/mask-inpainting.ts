import { logger } from '@/lib/utils/logger';
import { RenderPipeline } from './render-pipeline';
import { ImageModelId } from '@/lib/config/models';

/**
 * Mask Inpainting Service
 * Handles mask-based inpainting operations
 * Integrates with the 7-stage RenderPipeline
 */
export interface InpaintingRequest {
  renderId: string;
  imageData: string; // Base64 source image
  maskData: string; // Base64 PNG mask (white = replace, black = keep)
  prompt: string;
  quality: 'standard' | 'high' | 'ultra';
  chainId?: string;
  contextData?: any;
  toolContext?: {
    toolId?: string;
    toolName?: string;
    toolSettings?: Record<string, string>;
  };
}

export interface InpaintingResult {
  success: boolean;
  imageUrl?: string;
  imageData?: string; // Base64
  renderId?: string;
  error?: string;
}

export class MaskInpaintingService {
  /**
   * Process mask and generate inpainted image
   * Validates mask, converts to proper format, and calls RenderPipeline
   */
  static async generateInpainted(request: InpaintingRequest): Promise<InpaintingResult> {
    try {
      logger.log('🎨 MaskInpaintingService: Starting inpainting', {
        renderId: request.renderId,
        quality: request.quality,
      });

      // 1. Validate mask dimensions match image
      const validationResult = await this.validateMask(request.imageData, request.maskData);
      if (!validationResult.valid) {
        return {
          success: false,
          error: validationResult.error || 'Mask validation failed',
        };
      }

      // 2. Call RenderPipeline with mask data
      const pipelineResult = await RenderPipeline.generateRender({
        prompt: request.prompt,
        referenceImageData: request.imageData,
        referenceImageType: 'image/png',
        maskData: request.maskData,
        maskType: 'inpaint',
        inpaintingPrompt: request.prompt,
        quality: request.quality,
        aspectRatio: validationResult.aspectRatio || '16:9',
        chainId: request.chainId,
        toolContext: request.toolContext,
        contextData: request.contextData,
      });

      if (pipelineResult.success && pipelineResult.imageUrl) {
        logger.log('✅ MaskInpaintingService: Inpainting successful', {
          renderId: request.renderId,
          imageUrl: pipelineResult.imageUrl.substring(0, 50) + '...',
        });

        return {
          success: true,
          imageUrl: pipelineResult.imageUrl,
          imageData: pipelineResult.imageData,
        };
      }

      return {
        success: false,
        error: pipelineResult.error || 'Inpainting failed',
      };
    } catch (error) {
      logger.error('❌ MaskInpaintingService: Inpainting error', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Validate mask dimensions match image
   */
  private static async validateMask(
    imageData: string,
    maskData: string
  ): Promise<{ valid: boolean; error?: string; aspectRatio?: string }> {
    try {
      // Decode base64 images to get dimensions
      const imageDims = await this.getImageDimensions(imageData);
      const maskDims = await this.getImageDimensions(maskData);

      if (!imageDims || !maskDims) {
        return {
          valid: false,
          error: 'Failed to read image or mask dimensions',
        };
      }

      // Check if dimensions match (allow small tolerance)
      const tolerance = 2; // 2 pixels tolerance
      if (
        Math.abs(imageDims.width - maskDims.width) > tolerance ||
        Math.abs(imageDims.height - maskDims.height) > tolerance
      ) {
        return {
          valid: false,
          error: `Mask dimensions (${maskDims.width}x${maskDims.height}) don't match image dimensions (${imageDims.width}x${imageDims.height})`,
        };
      }

      // Calculate aspect ratio
      const aspectRatio = this.calculateAspectRatio(imageDims.width, imageDims.height);

      return {
        valid: true,
        aspectRatio,
      };
    } catch (error) {
      logger.error('❌ MaskInpaintingService: Mask validation error', error);
      return {
        valid: false,
        error: error instanceof Error ? error.message : 'Validation failed',
      };
    }
  }

  /**
   * Get image dimensions from base64 data
   * Works in both browser and Node.js (server-side) environments
   */
  private static async getImageDimensions(base64Data: string): Promise<{ width: number; height: number } | null> {
    // Browser environment: use Image API
    if (typeof Image !== 'undefined') {
      return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
          resolve({
            width: img.naturalWidth,
            height: img.naturalHeight,
          });
        };
        img.onerror = () => {
          resolve(null);
        };
        // Handle data URL format
        img.src = base64Data.startsWith('data:') ? base64Data : `data:image/png;base64,${base64Data}`;
      });
    }

    // Node.js/server environment: use sharp or buffer parsing
    // For now, we'll use a simple approach with buffer
    try {
      // Extract base64 data if it's a data URL
      const base64String = base64Data.startsWith('data:')
        ? base64Data.split(',')[1]
        : base64Data;

      const buffer = Buffer.from(base64String, 'base64');
      
      // Simple PNG dimension parsing (PNG signature + IHDR chunk)
      // PNG format: 8-byte signature + IHDR chunk (13 bytes) contains width (4 bytes) and height (4 bytes)
      if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) {
        const width = buffer.readUInt32BE(16);
        const height = buffer.readUInt32BE(20);
        return { width, height };
      }

      // Fallback: try to use sharp if available (better for JPEG, etc.)
      try {
        const sharp = await import('sharp');
        const metadata = await sharp(buffer).metadata();
        if (metadata.width && metadata.height) {
          return { width: metadata.width, height: metadata.height };
        }
      } catch {
        // sharp not available or failed, continue with null
      }

      return null;
    } catch (error) {
      logger.error('❌ MaskInpaintingService: Failed to get image dimensions', error);
      return null;
    }
  }

  /**
   * Calculate aspect ratio string from dimensions
   */
  private static calculateAspectRatio(width: number, height: number): string {
    const ratio = width / height;
    
    // Common ratios
    if (Math.abs(ratio - 16 / 9) < 0.1) return '16:9';
    if (Math.abs(ratio - 9 / 16) < 0.1) return '9:16';
    if (Math.abs(ratio - 1) < 0.1) return '1:1';
    if (Math.abs(ratio - 4 / 3) < 0.1) return '4:3';
    if (Math.abs(ratio - 3 / 4) < 0.1) return '3:4';
    
    // Calculate GCD for custom ratio
    const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
    const divisor = gcd(width, height);
    return `${width / divisor}:${height / divisor}`;
  }

  /**
   * Compress mask if too large (for API efficiency)
   * NOTE: This is a client-side only utility. Server-side compression
   * should be done before sending to API, or handled by the API service.
   */
  static async compressMask(maskData: string, maxSize: number = 4096): Promise<string> {
    // Check if we're in browser environment
    if (typeof document === 'undefined') {
      logger.warn('⚠️ MaskInpaintingService: compressMask called server-side, returning original');
      return maskData; // Server-side: return as-is
    }

    try {
      const img = await this.getImageDimensions(maskData);
      if (!img) return maskData;

      // If image is within size limit, return as-is
      if (img.width <= maxSize && img.height <= maxSize) {
        return maskData;
      }

      // Compress mask (resize to maxSize while maintaining aspect ratio)
      const scale = Math.min(maxSize / img.width, maxSize / img.height);
      const newWidth = Math.round(img.width * scale);
      const newHeight = Math.round(img.height * scale);

      // Create canvas to resize (client-side only)
      const canvas = document.createElement('canvas');
      canvas.width = newWidth;
      canvas.height = newHeight;
      const ctx = canvas.getContext('2d');

      if (!ctx) return maskData;

      const image = new Image();
      return new Promise((resolve) => {
        image.onload = () => {
          ctx.drawImage(image, 0, 0, newWidth, newHeight);
          const compressed = canvas.toDataURL('image/png');
          logger.log('✅ MaskInpaintingService: Compressed mask', {
            original: `${img.width}x${img.height}`,
            compressed: `${newWidth}x${newHeight}`,
          });
          resolve(compressed);
        };
        image.onerror = () => resolve(maskData);
        image.src = maskData.startsWith('data:') ? maskData : `data:image/png;base64,${maskData}`;
      });
    } catch (error) {
      logger.error('❌ MaskInpaintingService: Mask compression error', error);
      return maskData; // Return original on error
    }
  }
}

