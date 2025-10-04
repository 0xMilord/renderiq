/**
 * Watermark Service
 * Handles adding custom watermarks to generated images and removing AI watermarks
 */

import sharp from 'sharp';

export interface WatermarkOptions {
  text?: string;
  opacity?: number;
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left' | 'center';
  fontSize?: number;
  color?: string;
  padding?: number;
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
    text: 'arqihive',
    opacity: 0.7,
    position: 'bottom-right',
    fontSize: 24,
    color: '#ffffff',
    padding: 20,
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
    
    console.log('🎨 Adding watermark:', {
      text: config.text,
      position: config.position,
      opacity: config.opacity
    });

    if (!isBrowser) {
      // Server-side: Use Sharp for watermark addition
      try {
        console.log('🔧 Using Sharp for server-side watermark addition');
        
        // Convert base64 to buffer
        const imageBuffer = Buffer.from(base64Data, 'base64');
        
        // Get image metadata
        const metadata = await sharp(imageBuffer).metadata();
        const { width, height } = metadata;
        
        if (!width || !height) {
          throw new Error('Could not get image dimensions');
        }
        
        // Create watermark text as SVG
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
        
        // Create SVG watermark
        const svgWatermark = `
          <svg width="${width}" height="${height}">
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
        
        // Apply watermark using Sharp
        const watermarkedImage = await sharp(imageBuffer)
          .composite([
            {
              input: Buffer.from(svgWatermark),
              top: 0,
              left: 0
            }
          ])
          .png()
          .toBuffer();
        
        // Convert back to base64
        const result = watermarkedImage.toString('base64');
        console.log('✅ Custom watermark added using Sharp');
        
        return result;
      } catch (error) {
        console.error('❌ Error adding watermark with Sharp:', error);
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
      console.log('✅ Custom watermark added successfully');
      
      return result;
    } catch (error) {
      console.error('❌ Error adding watermark:', error);
      // Return original data if watermarking fails
      return base64Data;
    }
  }

  /**
   * Remove Gemini AI watermark from image data
   * For server-side: Uses Sharp for cropping and processing
   * For browser: Advanced pixel processing
   */
  static async removeGeminiWatermark(base64Data: string): Promise<string> {
    console.log('🧹 Removing Gemini watermark');
    
    if (!isBrowser) {
      // Server-side: Use Sharp for watermark removal
      try {
        console.log('🔧 Using Sharp for server-side watermark removal');
        
        // Convert base64 to buffer
        const imageBuffer = Buffer.from(base64Data, 'base64');
        
        // Get image metadata
        const metadata = await sharp(imageBuffer).metadata();
        const { width, height } = metadata;
        
        if (!width || !height) {
          throw new Error('Could not get image dimensions');
        }
        
        // Crop out the bottom-right corner where Gemini watermarks typically appear
        // Remove bottom 8% and right 8% of the image
        const cropBottom = Math.floor(height * 0.08);
        const cropRight = Math.floor(width * 0.08);
        
        // Crop the image to remove watermark areas
        const croppedImage = await sharp(imageBuffer)
          .extract({
            left: 0,
            top: 0,
            width: width - cropRight,
            height: height - cropBottom
          })
          .png()
          .toBuffer();
        
        // Convert back to base64
        const result = croppedImage.toString('base64');
        console.log('✅ Gemini watermark removed using Sharp');
        
        return result;
      } catch (error) {
        console.error('❌ Error removing Gemini watermark with Sharp:', error);
        // Return original data if processing fails
        return base64Data;
      }
    }
    
    try {
      // Browser-side: Use Canvas API for advanced processing
      const imageData = await base64ToImageData(base64Data);
      const { data, width, height } = imageData;
      
      // Create a copy of the image data
      const newData = new Uint8ClampedArray(data);
      
      // Gemini watermarks are typically in the bottom-right corner
      // We'll process the bottom 10% and right 10% where watermarks usually appear
      const cropBottom = Math.floor(height * 0.1);
      const cropRight = Math.floor(width * 0.1);
      
      // Process the image to remove watermark areas
      for (let y = height - cropBottom; y < height; y++) {
        for (let x = width - cropRight; x < width; x++) {
          const index = (y * width + x) * 4;
          
          // Check if this pixel is likely part of a watermark
          // Watermarks are usually semi-transparent white/gray text
          const r = data[index];
          const g = data[index + 1];
          const b = data[index + 2];
          const a = data[index + 3];
          
          // Detect watermark-like pixels (high brightness, low alpha)
          const brightness = (r + g + b) / 3;
          const isWatermark = brightness > 200 && a < 200;
          
          if (isWatermark) {
            // Replace with surrounding pixels or make transparent
            // For now, we'll make it transparent
            newData[index + 3] = 0; // Set alpha to 0
          }
        }
      }
      
      // Create new ImageData with processed data
      const processedImageData = new ImageData(newData, width, height);
      
      // Convert back to base64
      const result = imageDataToBase64(processedImageData);
      console.log('✅ Gemini watermark removal completed');
      
      return result;
    } catch (error) {
      console.error('❌ Error removing Gemini watermark:', error);
      // Return original data if processing fails
      return base64Data;
    }
  }

  /**
   * Process image with both watermark removal and custom watermark addition
   */
  static async processImage(
    base64Data: string,
    watermarkOptions: WatermarkOptions = {}
  ): Promise<string> {
    console.log('🔄 Processing image: removing Gemini watermark and adding custom watermark');
    
    // Step 1: Remove Gemini watermark
    let processedData = await this.removeGeminiWatermark(base64Data);
    
    // Step 2: Add custom watermark
    processedData = await this.addWatermark(processedData, watermarkOptions);
    
    return processedData;
  }
}
