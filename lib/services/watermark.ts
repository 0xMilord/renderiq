/**
 * Watermark Service
 * Handles adding custom watermarks to generated images and removing AI watermarks
 */

import sharp from 'sharp';
import { logger } from '@/lib/utils/logger';
import { readFileSync } from 'fs';
import { join } from 'path';

export interface WatermarkOptions {
  text?: string;
  opacity?: number;
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left' | 'center';
  fontSize?: number;
  color?: string;
  padding?: number;
  useLogo?: boolean; // Use logo SVG instead of text
}

// Check if we're in a browser environment
const isBrowser = typeof window !== 'undefined' && typeof document !== 'undefined';

// Helper function to convert base64 to ImageData (browser only)
function base64ToImageData(base64: string): Promise<ImageData> {
  if (!isBrowser) {
    throw new Error('Canvas operations require browser environment');
  }
  
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }
      
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      resolve(imageData);
    };
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = `data:image/png;base64,${base64}`;
  });
}

// Helper function to convert ImageData to base64 (browser only)
function imageDataToBase64(imageData: ImageData): string {
  if (!isBrowser) {
    throw new Error('Canvas operations require browser environment');
  }
  
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get canvas context');
  
  canvas.width = imageData.width;
  canvas.height = imageData.height;
  ctx.putImageData(imageData, 0, 0);
  return canvas.toDataURL('image/png').split(',')[1];
}

export class WatermarkService {
  private static readonly DEFAULT_OPTIONS: Required<WatermarkOptions> = {
    text: 'Renderiq',
    opacity: 0.5,
    position: 'bottom-right',
    fontSize: 24,
    color: '#ffffff',
    padding: 20,
    useLogo: true, // Default to using logo
  };

  /**
   * Add watermark to base64 image data
   * Uses Canvas API to overlay custom watermark (browser only)
   */
  static async addWatermark(
    base64Data: string,
    options: WatermarkOptions = {}
  ): Promise<string> {
    const config = { ...this.DEFAULT_OPTIONS, ...options };
    
    logger.log('🎨 Adding watermark:', {
      text: config.text,
      position: config.position,
      opacity: config.opacity
    });

    if (!isBrowser) {
      // Server-side: Use Sharp for watermark addition
      try {
        logger.log('🔧 Using Sharp for server-side watermark addition');
        
        // Convert base64 to buffer
        const imageBuffer = Buffer.from(base64Data, 'base64');
        
        // Get image metadata
        const metadata = await sharp(imageBuffer).metadata();
        const { width, height } = metadata;
        
        if (!width || !height) {
          throw new Error('Could not get image dimensions');
        }
        
        let watermarkSvg: string;
        
        // Use logo SVG if requested, otherwise use text
        if (config.useLogo !== false) {
          try {
            // Read logo SVG file
            const logoPath = join(process.cwd(), 'public', 'logo-light.svg');
            let logoSvg = readFileSync(logoPath, 'utf-8');
            
            // Calculate watermark size (10% of image width, max 200px, min 80px)
            const watermarkSize = Math.max(80, Math.min(200, Math.floor(width * 0.1)));
            const padding = Math.floor(Math.min(width, height) * 0.02);
            
            // Calculate position
            let x: number, y: number;
            switch (config.position) {
              case 'bottom-right':
                x = width - padding - watermarkSize;
                y = height - padding - watermarkSize;
                break;
              case 'bottom-left':
                x = padding;
                y = height - padding - watermarkSize;
                break;
              case 'top-right':
                x = width - padding - watermarkSize;
                y = padding;
                break;
              case 'top-left':
                x = padding;
                y = padding;
                break;
              case 'center':
              default:
                x = width / 2 - watermarkSize / 2;
                y = height / 2 - watermarkSize / 2;
                break;
            }
            
            // Extract SVG content (remove outer svg tags)
            let logoSvgContent = logoSvg
              .replace(/<svg[^>]*>/, '')
              .replace(/<\/svg>/, '')
              .trim();
            
            // Modify SVG paths to be white
            // Replace all fill attributes with white
            logoSvgContent = logoSvgContent
              .replace(/fill="[^"]*"/g, 'fill="white"')
              .replace(/fill='[^']*'/g, "fill='white'")
              .replace(/fill="#[^"]*"/g, 'fill="white"')
              .replace(/fill='#[^']*'/g, "fill='white'")
              .replace(/fill={[^}]*}/g, 'fill="white"');
            
            // Create SVG container with watermark
            watermarkSvg = `
              <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
                <g opacity="${config.opacity}">
                  <svg x="${x}" y="${y}" width="${watermarkSize}" height="${watermarkSize}" viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
                    ${logoSvgContent}
                  </svg>
                </g>
              </svg>
            `;
            
            logger.log('✅ Using logo SVG for watermark');
          } catch (logoError) {
            logger.error('❌ Error loading logo, falling back to text:', logoError);
            // Fall back to text watermark
            config.useLogo = false;
          }
        }
        
        // If logo failed or useLogo is false, create text watermark
        if (!watermarkSvg) {
          const fontSize = Math.max(24, Math.floor(Math.min(width, height) * 0.03));
          const padding = Math.floor(Math.min(width, height) * 0.02);
          
          // Calculate position
          let x: number, y: number;
          switch (config.position) {
            case 'bottom-right':
              x = width - padding - (fontSize * config.text.length) / 2;
              y = height - padding - fontSize;
              break;
            case 'bottom-left':
              x = padding;
              y = height - padding - fontSize;
              break;
            case 'top-right':
              x = width - padding - (fontSize * config.text.length) / 2;
              y = padding + fontSize;
              break;
            case 'top-left':
              x = padding;
              y = padding + fontSize;
              break;
            case 'center':
            default:
              x = width / 2 - (fontSize * config.text.length) / 4;
              y = height / 2;
              break;
          }
          
          // Create SVG watermark with text
          watermarkSvg = `
            <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
              <text x="${x}" y="${y}" 
                    font-family="Arial, sans-serif" 
                    font-size="${fontSize}" 
                    fill="${config.color}" 
                    opacity="${config.opacity}"
                    text-anchor="start">
                ${config.text}
              </text>
            </svg>
          `;
        }
        
        // Apply watermark using Sharp
        const watermarkedImage = await sharp(imageBuffer)
          .composite([
            {
              input: Buffer.from(watermarkSvg),
              top: 0,
              left: 0
            }
          ])
          .png()
          .toBuffer();
        
        // Convert back to base64
        const result = watermarkedImage.toString('base64');
        logger.log('✅ Custom watermark added using Sharp');
        
        return result;
      } catch (error) {
        logger.error('❌ Error adding watermark with Sharp:', error);
        // Return original data if watermarking fails
        return base64Data;
      }
    }

    try {
      // Create image from base64
      const img = new Image();
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = `data:image/png;base64,${base64Data}`;
      });

      // Create canvas
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Could not get canvas context');

      canvas.width = img.width;
      canvas.height = img.height;

      // Draw original image
      ctx.drawImage(img, 0, 0);

      // Add watermark
      ctx.save();
      ctx.globalAlpha = config.opacity;
      ctx.fillStyle = config.color;
      ctx.font = `${config.fontSize}px Arial, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      // Calculate position
      let x: number, y: number;
      const padding = config.padding;

      switch (config.position) {
        case 'bottom-right':
          x = canvas.width - padding - (config.fontSize * config.text.length) / 4;
          y = canvas.height - padding - config.fontSize / 2;
          break;
        case 'bottom-left':
          x = padding + (config.fontSize * config.text.length) / 4;
          y = canvas.height - padding - config.fontSize / 2;
          break;
        case 'top-right':
          x = canvas.width - padding - (config.fontSize * config.text.length) / 4;
          y = padding + config.fontSize / 2;
          break;
        case 'top-left':
          x = padding + (config.fontSize * config.text.length) / 4;
          y = padding + config.fontSize / 2;
          break;
        case 'center':
        default:
          x = canvas.width / 2;
          y = canvas.height / 2;
          break;
      }

      // Add text shadow for better visibility
      ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
      ctx.shadowBlur = 2;
      ctx.shadowOffsetX = 1;
      ctx.shadowOffsetY = 1;

      // Draw watermark text
      ctx.fillText(config.text, x, y);
      ctx.restore();

      // Convert back to base64
      const result = canvas.toDataURL('image/png').split(',')[1];
      logger.log('✅ Custom watermark added successfully');
      
      return result;
    } catch (error) {
      logger.error('❌ Error adding watermark:', error);
      // Return original data if watermarking fails
      return base64Data;
    }
  }

  /**
   * Remove Gemini AI watermark from image data
   * Note: No longer crops images - just returns original image
   * Cropping was removed as per requirements
   */
  static async removeGeminiWatermark(base64Data: string): Promise<string> {
    logger.log('🧹 Processing image (no cropping applied)');
    
    // Simply return the original image without cropping
    // The AI provider watermark removal is handled by the provider itself
    return base64Data;
  }

  /**
   * Process image with both watermark removal and custom watermark addition
   */
  static async processImage(
    base64Data: string,
    watermarkOptions: WatermarkOptions = {}
  ): Promise<string> {
    logger.log('🔄 Processing image: removing Gemini watermark and adding custom watermark');
    
    // Step 1: Remove Gemini watermark
    let processedData = await this.removeGeminiWatermark(base64Data);
    
    // Step 2: Add custom watermark
    processedData = await this.addWatermark(processedData, watermarkOptions);
    
    return processedData;
  }
}
