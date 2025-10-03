import { z } from 'zod';
import { GoogleAIService } from './google-ai';

const ImageGenerationResult = z.object({
  imageUrl: z.string().optional(),
  imageData: z.string().optional(),
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
    uploadedImageData?: string;
    uploadedImageType?: string;
    negativePrompt?: string;
    imageType?: string;
  }): Promise<{ success: boolean; data?: ImageGenerationResult; error?: string }> {
    console.log('🎨 ImageGenService: Starting image generation', {
      prompt: params.prompt,
      style: params.style,
      quality: params.quality,
      aspectRatio: params.aspectRatio,
      type: params.type,
      hasUploadedImage: !!params.uploadedImageData
    });

    try {
      console.log('🎨 ImageGenService: Calling Google AI service');
      // Use Google AI Gemini 2.5 Flash for image generation
      const result = await this.googleAIService.generateImage({
        prompt: params.prompt,
        style: params.style,
        quality: params.quality,
        aspectRatio: params.aspectRatio,
        uploadedImageData: params.uploadedImageData,
        uploadedImageType: params.uploadedImageType,
        negativePrompt: params.negativePrompt,
        imageType: params.imageType,
      });

      if (!result.success || !result.data) {
        console.error('❌ ImageGenService: Google AI generation failed', { 
          error: result.error,
          prompt: params.prompt 
        });
        throw new Error(result.error || 'Failed to generate image');
      }

      console.log('🎨 ImageGenService: Processing successful result', {
        provider: result.data.provider,
        processingTime: result.data.processingTime
      });

      const imageResult: ImageGenerationResult = {
        imageUrl: result.data.imageUrl,
        imageData: result.data.imageData,
        prompt: result.data.prompt,
        style: result.data.style,
        quality: result.data.quality,
        aspectRatio: result.data.aspectRatio,
        processingTime: result.data.processingTime,
        provider: result.data.provider,
      };

      console.log('✅ ImageGenService: Image generation completed successfully', {
        imageUrl: imageResult.imageUrl,
        processingTime: imageResult.processingTime,
        provider: imageResult.provider
      });

      return { success: true, data: imageResult };
    } catch (error) {
      console.error('❌ ImageGenService: Image generation failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        prompt: params.prompt,
        style: params.style
      });
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
    console.log('🎬 ImageGenService: Starting video generation', {
      prompt: params.prompt,
      style: params.style,
      quality: params.quality,
      aspectRatio: params.aspectRatio,
      duration: params.duration,
      hasUploadedImage: !!params.uploadedImage
    });

    try {
      console.log('🎬 ImageGenService: Calling Google AI service for video');
      // Use Google AI Veo 3 for video generation
      const result = await this.googleAIService.generateVideo({
        prompt: params.prompt,
        style: params.style,
        quality: params.quality,
        aspectRatio: params.aspectRatio,
        duration: params.duration,
      });

      if (!result.success || !result.data) {
        console.error('❌ ImageGenService: Google AI video generation failed', { 
          error: result.error,
          prompt: params.prompt 
        });
        throw new Error(result.error || 'Failed to generate video');
      }

      console.log('🎬 ImageGenService: Processing successful video result', {
        provider: result.data.provider,
        processingTime: result.data.processingTime,
        duration: result.data.duration
      });

      const videoResult = {
        videoUrl: result.data.url,
        prompt: result.data.prompt,
        style: result.data.style,
        quality: result.data.quality,
        aspectRatio: result.data.aspectRatio,
        duration: result.data.duration,
        processingTime: result.data.processingTime,
        provider: result.data.provider,
      };

      console.log('✅ ImageGenService: Video generation completed successfully', {
        videoUrl: videoResult.videoUrl,
        processingTime: videoResult.processingTime,
        provider: videoResult.provider
      });

      return { 
        success: true, 
        data: videoResult
      };
    } catch (error) {
      console.error('❌ ImageGenService: Video generation failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        prompt: params.prompt,
        style: params.style,
        duration: params.duration
      });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate video',
      };
    }
  }
}
