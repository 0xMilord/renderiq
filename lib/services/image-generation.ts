import { z } from 'zod';
import { GoogleAIService } from './google-ai';
import { WatermarkService } from './watermark';
import { RendersDAL } from '@/lib/dal/renders';

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
    seed?: number;
    referenceRenderId?: string;
    versionContext?: {
      userIntent: string;
      mentionedVersions: Array<{
        renderId?: string;
        context?: {
          prompt: string;
          settings: any;
          imageData?: string;
          metadata?: any;
        };
      }>;
      contextualPrompt?: string;
    };
  }): Promise<{ success: boolean; data?: ImageGenerationResult; error?: string }> {
    console.log('🎨 ImageGenService: Starting image generation', {
      prompt: params.prompt,
      style: params.style,
      quality: params.quality,
      aspectRatio: params.aspectRatio,
      type: params.type,
      hasUploadedImage: !!params.uploadedImageData,
      hasReferenceRender: !!params.referenceRenderId
    });

    // Fetch reference render image if provided
    // Handle version context and reference images
    let finalPrompt = params.prompt;
    let referenceImageData: string | undefined;
    let referenceImageType: string | undefined;
    
    // Use version context if available
    if (params.versionContext) {
      console.log('🔍 Using version context for generation');
      
      // Use the contextual prompt if available, otherwise use user intent
      if (params.versionContext.contextualPrompt) {
        finalPrompt = params.versionContext.contextualPrompt;
        console.log('📝 Using contextual prompt:', finalPrompt.substring(0, 100) + '...');
      } else {
        finalPrompt = params.versionContext.userIntent;
        console.log('📝 Using user intent:', finalPrompt);
      }

      // Get reference image from the most recent mentioned version
      const mentionedVersionWithImage = params.versionContext.mentionedVersions
        .find(v => v.context?.imageData);
      
      if (mentionedVersionWithImage?.context?.imageData) {
        referenceImageData = mentionedVersionWithImage.context.imageData;
        referenceImageType = 'image/png';
        console.log('✅ Using reference image from version context');
      }
    }
    
    // Fallback to referenceRenderId if no version context
    if (!referenceImageData && params.referenceRenderId) {
      try {
        console.log('🔍 Fetching reference render:', params.referenceRenderId);
        const referenceRender = await RendersDAL.getById(params.referenceRenderId);
        
        if (referenceRender && referenceRender.outputUrl) {
          console.log('📸 Found reference render image, downloading...');
          // Download the reference image
          const response = await fetch(referenceRender.outputUrl);
          if (response.ok) {
            const arrayBuffer = await response.arrayBuffer();
            const base64 = Buffer.from(arrayBuffer).toString('base64');
            referenceImageData = base64;
            referenceImageType = 'image/png'; // Assume PNG for now
            console.log('✅ Reference image loaded successfully');
          } else {
            console.log('⚠️ Failed to download reference image');
          }
        } else {
          console.log('⚠️ Reference render not found or has no output URL');
        }
      } catch (error) {
        console.log('❌ Error fetching reference render:', error);
      }
    }

    try {
      console.log('🎨 ImageGenService: Calling Google AI service');
      
      // Determine what image data will be used
      const finalImageData = params.uploadedImageData || referenceImageData;
      const finalImageType = params.uploadedImageType || referenceImageType;
      
      console.log('🎨 ImageGenService: Image data summary', {
        hasOriginalUpload: !!params.uploadedImageData,
        hasReferenceImage: !!referenceImageData,
        willUseImageData: !!finalImageData,
        imageType: finalImageType
      });
      
      // Use Google AI Gemini 2.5 Flash for image generation
      const result = await this.googleAIService.generateImage({
        prompt: finalPrompt,
        style: params.style,
        quality: params.quality,
        aspectRatio: params.aspectRatio,
        uploadedImageData: finalImageData,
        uploadedImageType: finalImageType,
        negativePrompt: params.negativePrompt,
        imageType: params.imageType,
        seed: params.seed,
        referenceRender: params.referenceRenderId ? {
          id: params.referenceRenderId,
          prompt: params.prompt,
          settings: params.settings || {},
          outputUrl: '', // Will be fetched if needed
          type: params.type || 'image',
          createdAt: new Date(),
          chainPosition: params.chainPosition,
          imageData: referenceImageData
        } : undefined,
        chainContext: undefined, // TODO: Implement chain context if needed
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

      // Process image with watermark if we have base64 data
      let processedImageData = result.data.imageData;
      if (result.data.imageData) {
        console.log('🎨 ImageGenService: Processing image with watermark');
        processedImageData = await WatermarkService.processImage(result.data.imageData, {
          text: 'arqihive',
          position: 'bottom-right',
          opacity: 0.7,
        });
      }

      const imageResult: ImageGenerationResult = {
        imageUrl: result.data.imageUrl,
        imageData: processedImageData,
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
