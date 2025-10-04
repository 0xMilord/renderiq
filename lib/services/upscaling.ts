import { GoogleAIService } from './google-ai';

export interface UpscalingRequest {
  imageUrl: string;
  scale: 2 | 4 | 10;
  quality: 'standard' | 'high' | 'ultra';
}

export interface UpscalingResult {
  imageUrl: string;
  originalUrl: string;
  scale: number;
  processingTime: number;
  provider: string;
}

export class UpscalingService {
  private static instance: UpscalingService;
  private googleAIService: GoogleAIService;

  private constructor() {
    this.googleAIService = GoogleAIService.getInstance();
  }

  static getInstance(): UpscalingService {
    if (!UpscalingService.instance) {
      UpscalingService.instance = new UpscalingService();
    }
    return UpscalingService.instance;
  }

  async upscaleImage(request: UpscalingRequest): Promise<{ success: boolean; data?: UpscalingResult; error?: string }> {
    console.log('🔍 UpscalingService: Starting image upscaling', {
      scale: request.scale,
      quality: request.quality,
      hasImageUrl: !!request.imageUrl
    });

    try {
      const startTime = Date.now();

      // Convert image URL to base64
      const imageBase64 = await this.convertImageToBase64(request.imageUrl);
      
      // Build upscaling prompt
      const upscalingPrompt = this.buildUpscalingPrompt(request.scale, request.quality);

      // Use Google AI for upscaling
      const result = await this.googleAIService.generateImage({
        prompt: upscalingPrompt,
        style: 'realistic',
        quality: request.quality,
        aspectRatio: '16:9', // Maintain original aspect ratio
        uploadedImageData: imageBase64,
        uploadedImageType: 'image/jpeg',
        negativePrompt: 'blurry, low quality, pixelated, artifacts',
        imageType: 'upscaled'
      });

      if (!result.success || !result.data) {
        console.error('❌ UpscalingService: Google AI upscaling failed', result.error);
        throw new Error(result.error || 'Failed to upscale image');
      }

      const processingTime = Math.round((Date.now() - startTime) / 1000);

      const upscalingResult: UpscalingResult = {
        imageUrl: result.data.imageUrl,
        originalUrl: request.imageUrl,
        scale: request.scale,
        processingTime,
        provider: result.data.provider || 'gemini-2.5-flash-image'
      };

      console.log('✅ UpscalingService: Upscaling completed', {
        scale: request.scale,
        processingTime
      });

      return {
        success: true,
        data: upscalingResult
      };
    } catch (error) {
      console.error('❌ UpscalingService: Upscaling failed', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Upscaling failed'
      };
    }
  }

  private buildUpscalingPrompt(scale: number, quality: string): string {
    const qualityDescriptions = {
      standard: 'good quality',
      high: 'high quality, detailed',
      ultra: 'ultra high quality, extremely detailed, professional'
    };

    return `Upscale this image by ${scale}x while maintaining perfect quality and detail. 
    Enhance the image to ${qualityDescriptions[quality]} resolution without any artifacts, 
    blurriness, or pixelation. Preserve all original details and improve sharpness and clarity. 
    The output should be a crisp, professional-quality image that looks natural and realistic.`;
  }

  private async convertImageToBase64(imageUrl: string): Promise<string> {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          const base64 = result.split(',')[1];
          resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error('❌ UpscalingService: Failed to convert image to base64', error);
      throw new Error('Failed to process image for upscaling');
    }
  }
}