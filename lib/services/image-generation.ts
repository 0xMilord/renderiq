import { z } from 'zod';
import { GoogleAIService } from './google-ai';

const ImageGenerationResult = z.object({
  imageUrl: z.string().url(),
  prompt: z.string(),
  style: z.string(),
  quality: z.string(),
  aspectRatio: z.string(),
  processingTime: z.number(),
  provider: z.string(),
});

export type ImageGenerationResult = z.infer<typeof ImageGenerationResult>;

export class ImageGenerationService {
  private static instance: ImageGenerationService;
  private googleAIService: GoogleAIService;

  constructor() {
    this.googleAIService = GoogleAIService.getInstance();
  }

  static getInstance(): ImageGenerationService {
    if (!ImageGenerationService.instance) {
      ImageGenerationService.instance = new ImageGenerationService();
    }
    return ImageGenerationService.instance;
  }

  async generateImage(params: {
    prompt: string;
    style: string;
    quality: 'standard' | 'high' | 'ultra';
    aspectRatio: string;
    type: 'image' | 'video';
    uploadedImage?: File;
  }): Promise<{ success: boolean; data?: ImageGenerationResult; error?: string }> {
    try {
      // Use Google AI Gemini 2.5 Flash for image generation
      const result = await this.googleAIService.generateImage({
        prompt: params.prompt,
        style: params.style,
        quality: params.quality,
        aspectRatio: params.aspectRatio,
        uploadedImage: params.uploadedImage,
      });

      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to generate image');
      }

      const imageResult: ImageGenerationResult = {
        imageUrl: result.data.url,
        prompt: result.data.prompt,
        style: result.data.style,
        quality: result.data.quality,
        aspectRatio: result.data.aspectRatio,
        processingTime: result.data.processingTime,
        provider: result.data.provider,
      };

      return { success: true, data: imageResult };
    } catch (error) {
      console.error('Image generation error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate image',
      };
    }
  }


  async generateVideo(params: {
    prompt: string;
    style: string;
    quality: 'standard' | 'high' | 'ultra';
    aspectRatio: string;
    duration: number;
    uploadedImage?: File;
  }): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      // Use Google AI Veo 3 for video generation
      const result = await this.googleAIService.generateVideo({
        prompt: params.prompt,
        style: params.style,
        quality: params.quality,
        aspectRatio: params.aspectRatio,
        duration: params.duration,
      });

      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to generate video');
      }

      return { 
        success: true, 
        data: {
          videoUrl: result.data.url,
          prompt: result.data.prompt,
          style: result.data.style,
          quality: result.data.quality,
          aspectRatio: result.data.aspectRatio,
          duration: result.data.duration,
          processingTime: result.data.processingTime,
          provider: result.data.provider,
        }
      };
    } catch (error) {
      console.error('Video generation error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate video',
      };
    }
  }
}
