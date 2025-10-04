import { GoogleGenerativeAI } from '@google/generative-ai';
import { VertexAI } from '@google-cloud/vertexai';
import { Render } from '@/lib/db/schema';
import { ChainContext } from '@/lib/types/render-chain';
import { ContextPromptService } from './context-prompt';

export interface GoogleAIImageRequest {
  prompt: string;
  style: string;
  quality: 'standard' | 'high' | 'ultra';
  aspectRatio: string;
  uploadedImageData?: string;
  uploadedImageType?: string;
  negativePrompt?: string;
  imageType?: string;
  seed?: number;
  // Context awareness fields
  referenceRender?: Render;
  chainContext?: ChainContext;
}

export interface GoogleAIImageResponse {
  success: boolean;
  data?: {
    imageUrl: string;
    imageData: string;
    id: string;
    prompt: string;
    style: string;
    quality: string;
    aspectRatio: string;
    processingTime: number;
    provider: string;
  };
  error?: string;
}

export interface GoogleAIVideoRequest {
  prompt: string;
  style: string;
  quality: 'standard' | 'high' | 'ultra';
  duration: number;
  aspectRatio: string;
}

export interface GoogleAIVideoResponse {
  success: boolean;
  data?: {
    url: string;
    id: string;
    prompt: string;
    style: string;
    quality: string;
    duration: number;
    aspectRatio: string;
    processingTime: number;
    provider: string;
  };
  error?: string;
}

export class GoogleAIService {
  private static instance: GoogleAIService;
  private genAI: GoogleGenerativeAI;
  private vertexAI: VertexAI | null = null;

  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY!);
    
    // Only initialize Vertex AI if project ID is available
    if (process.env.GOOGLE_CLOUD_PROJECT_ID) {
      this.vertexAI = new VertexAI({
        project: process.env.GOOGLE_CLOUD_PROJECT_ID,
        location: process.env.GOOGLE_CLOUD_LOCATION || 'us-central1',
      });
    } else {
      console.log('⚠️ GoogleAIService: GOOGLE_CLOUD_PROJECT_ID not set, Vertex AI disabled. Seed support will not be available.');
    }
  }

  static getInstance(): GoogleAIService {
    if (!GoogleAIService.instance) {
      GoogleAIService.instance = new GoogleAIService();
    }
    return GoogleAIService.instance;
  }

  async generateImage(request: GoogleAIImageRequest): Promise<GoogleAIImageResponse> {
    console.log('🎨 GoogleAI: Starting image generation', { 
      prompt: request.prompt, 
      style: request.style, 
      aspectRatio: request.aspectRatio,
      quality: request.quality,
      hasUploadedImage: !!request.uploadedImageData,
      hasSeed: !!request.seed
    });
    
    try {
      const startTime = Date.now();
      
      // Build context-aware prompt with quality enhancement
      const enhancedPrompt = await this.buildContextAwareImagePrompt(
        request.prompt,
        request.style,
        request.negativePrompt,
        request.imageType,
        request.referenceRender,
        request.chainContext
      );

      // Add quality-specific enhancements
      const qualityEnhancedPrompt = this.enhancePromptForQuality(enhancedPrompt, request.quality);
      
      console.log('🎨 GoogleAI: Context-aware prompt created', { 
        enhancedPrompt: qualityEnhancedPrompt,
        hasReferenceRender: !!request.referenceRender,
        hasChainContext: !!request.chainContext
      });
      
      let imageData: string;
      let provider: string;
      
      // Use Vertex AI if seed is provided for deterministic generation
      if (request.seed !== undefined && this.vertexAI) {
        console.log('🎨 GoogleAI: Using Vertex AI for seeded generation', { seed: request.seed });
        
        const model = this.vertexAI.getGenerativeModel({
          model: 'gemini-2.5-flash-image',
        });
        
        const generationConfig = {
          seed: request.seed,
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 8192,
        };
        
        // Prepare content for Vertex AI
        let content;
        if (request.uploadedImageData && request.uploadedImageType) {
          console.log('🎨 GoogleAI: Using uploaded image data for multimodal generation with Vertex AI');
          content = [
            {
              text: qualityEnhancedPrompt
            },
            {
              inlineData: {
                mimeType: request.uploadedImageType,
                data: request.uploadedImageData
              }
            }
          ];
        } else {
          content = enhancedPrompt;
        }
        
        const result = await model.generateContent({
          contents: [{ role: 'user', parts: content }],
          generationConfig,
        });
        
        const response = await result.response;
        const parts = response.candidates?.[0]?.content?.parts || [];
        
        for (const part of parts) {
          if (part.inlineData?.data) {
            imageData = part.inlineData.data;
            break;
          }
        }
        
        if (!imageData) {
          throw new Error('No image data received from Vertex AI');
        }
        
        provider = 'vertex-ai-gemini-2.5-flash-image';
      } else if (request.seed !== undefined && !this.vertexAI) {
        console.log('⚠️ GoogleAI: Seed provided but Vertex AI not available, falling back to standard Gemini API (seed will be ignored)');
        
        // Fall back to standard Gemini API but warn that seed is ignored
        const model = this.genAI.getGenerativeModel({ 
          model: 'gemini-2.5-flash-image' 
        });

        // Configure aspect ratio based on request
        const aspectRatioConfig = this.getAspectRatioConfig(request.aspectRatio);
        
        console.log('🎨 GoogleAI: Generating with aspect ratio', { aspectRatioConfig });
        
        // Prepare content for Gemini API
        let content;
        
        if (request.uploadedImageData && request.uploadedImageType) {
          console.log('🎨 GoogleAI: Using uploaded image data for multimodal generation');
          
          // Create multimodal content with image and text
          content = [
            {
              text: qualityEnhancedPrompt
            },
            {
              inlineData: {
                mimeType: request.uploadedImageType,
                data: request.uploadedImageData
              }
            }
          ];
        } else {
          // Text-only generation
          content = qualityEnhancedPrompt;
        }
        
        // Use the correct configuration format for Gemini 2.5 Flash Image
        const result = await model.generateContent(content);
        
        console.log('🎨 GoogleAI: Received response from Gemini');
        const response = await result.response;
        
        // Extract image data from response - check all parts for image data
        const parts = response.candidates?.[0]?.content?.parts || [];
        
        console.log('🎨 GoogleAI: Processing response parts', { partCount: parts.length });
        
        for (const part of parts) {
          if (part.inlineData?.data) {
            imageData = part.inlineData.data;
            console.log('🎨 GoogleAI: Found image data in part');
            break;
          }
        }
        
        if (!imageData) {
          console.error('❌ GoogleAI: No image data in response', { 
            response: response,
            parts: parts.map(p => ({ hasInlineData: !!p.inlineData, hasText: !!p.text }))
          });
          throw new Error('No image data received from Gemini');
        }
        
        provider = 'gemini-2.5-flash-image';
      } else {
        // Choose model based on quality setting
        const modelName = request.quality === 'high' || request.quality === 'ultra' 
          ? 'gemini-2.5-flash-image' // Enhanced model for high quality
          : 'gemini-2.5-flash-image'; // Standard model for standard quality
        
        console.log('🎨 GoogleAI: Using Gemini API for generation', { 
          model: modelName, 
          quality: request.quality,
          enhanced: request.quality === 'high' || request.quality === 'ultra'
        });
        
        // Use Gemini 2.5 Flash Image for image generation
        const model = this.genAI.getGenerativeModel({ 
          model: modelName 
        });

        // Configure aspect ratio based on request
        const aspectRatioConfig = this.getAspectRatioConfig(request.aspectRatio);
        
        console.log('🎨 GoogleAI: Generating with aspect ratio', { aspectRatioConfig });
        
        // Prepare content for Gemini API
        let content;
        
        if (request.uploadedImageData && request.uploadedImageType) {
          console.log('🎨 GoogleAI: Using uploaded image data for multimodal generation');
          
          // Create multimodal content with image and text
          content = [
            {
              text: qualityEnhancedPrompt
            },
            {
              inlineData: {
                mimeType: request.uploadedImageType,
                data: request.uploadedImageData
              }
            }
          ];
        } else {
          // Text-only generation
          content = qualityEnhancedPrompt;
        }
        
        // Use the correct configuration format for Gemini 2.5 Flash Image
        const result = await model.generateContent(content);
        
        console.log('🎨 GoogleAI: Received response from Gemini');
        const response = await result.response;
        
        // Extract image data from response - check all parts for image data
        const parts = response.candidates?.[0]?.content?.parts || [];
        
        console.log('🎨 GoogleAI: Processing response parts', { partCount: parts.length });
        
        for (const part of parts) {
          if (part.inlineData?.data) {
            imageData = part.inlineData.data;
            console.log('🎨 GoogleAI: Found image data in part');
            break;
          }
        }
        
        if (!imageData) {
          console.error('❌ GoogleAI: No image data in response', { 
            response: response,
            parts: parts.map(p => ({ hasInlineData: !!p.inlineData, hasText: !!p.text }))
          });
          throw new Error('No image data received from Gemini');
        }
        
        provider = 'gemini-2.5-flash-image';
      }

      console.log('🎨 GoogleAI: Image data received, preparing for storage');
      
      // Return base64 data for server-side processing
      const processingTime = (Date.now() - startTime) / 1000;
      console.log('✅ GoogleAI: Image generation completed successfully', { 
        id: `generated_${Date.now()}`,
        processingTime: `${processingTime}s`,
        aspectRatio: request.aspectRatio,
        provider,
        seed: request.seed
      });

      return {
        success: true,
        data: {
          imageData: imageData, // base64 string
          imageUrl: `data:image/png;base64,${imageData}`, // data URL for immediate display
          id: `generated_${Date.now()}`,
          prompt: request.prompt,
          style: request.style,
          quality: request.quality,
          aspectRatio: request.aspectRatio,
          processingTime,
          provider,
        },
      };
    } catch (error) {
      console.error('❌ GoogleAI: Image generation failed', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        prompt: request.prompt,
        style: request.style,
        seed: request.seed
      });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate image',
      };
    }
  }

  async generateVideo(request: GoogleAIVideoRequest): Promise<GoogleAIVideoResponse> {
    console.log('🎬 GoogleAI: Starting video generation', { 
      prompt: request.prompt, 
      style: request.style, 
      duration: request.duration,
      aspectRatio: request.aspectRatio
    });
    
    try {
      const startTime = Date.now();
      
      // Enhanced prompt for architectural video
      const enhancedPrompt = this.buildVideoPrompt(request.prompt, request.style, request.duration);
      
      console.log('🎬 GoogleAI: Enhanced video prompt created', { enhancedPrompt });
      
      // Use Veo 3 for video generation
      const model = this.genAI.getGenerativeModel({ 
        model: 'veo-3' 
      });

      console.log('🎬 GoogleAI: Generating video with Veo 3');
      const result = await model.generateContent(enhancedPrompt);
      const response = await result.response;
      
      console.log('🎬 GoogleAI: Processing video response');
      
      // Extract video data from response
      const videoData = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      
      if (!videoData) {
        console.error('❌ GoogleAI: No video data in response', { response });
        throw new Error('No video data received from Veo 3');
      }

      console.log('🎬 GoogleAI: Video data received, creating blob URL');

      // Convert base64 to blob URL for display
      const videoBlob = new Blob([Buffer.from(videoData, 'base64')], { type: 'video/mp4' });
      const videoUrl = URL.createObjectURL(videoBlob);

      const processingTime = (Date.now() - startTime) / 1000;
      console.log('✅ GoogleAI: Video generation completed successfully', { 
        id: `veo_${Date.now()}`,
        processingTime: `${processingTime}s`,
        duration: request.duration
      });

      return {
        success: true,
        data: {
          url: videoUrl,
          id: `veo_${Date.now()}`,
          prompt: request.prompt,
          style: request.style,
          quality: request.quality,
          duration: request.duration,
          aspectRatio: request.aspectRatio,
          processingTime,
          provider: 'veo-3',
        },
      };
    } catch (error) {
      console.error('❌ GoogleAI: Video generation failed', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        prompt: request.prompt,
        style: request.style,
        duration: request.duration
      });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate video with Veo 3',
      };
    }
  }


  /**
   * Build context-aware image prompt with reference and chain context
   */
  private async buildContextAwareImagePrompt(
    userPrompt: string,
    style: string,
    negativePrompt?: string,
    imageType?: string,
    referenceRender?: Render,
    chainContext?: ChainContext
  ): Promise<string> {
    // Use ContextPromptService to build enhanced prompt
    const contextPrompt = await ContextPromptService.buildContextAwarePrompt(
      userPrompt,
      referenceRender,
      chainContext,
      style,
      imageType
    );

    // Build the architectural prompt with context
    return this.buildImagePrompt(
      contextPrompt.enhancedPrompt,
      style,
      negativePrompt,
      imageType
    );
  }

  /**
   * Enhance prompt based on quality setting
   */
  private enhancePromptForQuality(prompt: string, quality: 'standard' | 'high' | 'ultra'): string {
    if (quality === 'standard') {
      return prompt;
    }

    const qualityEnhancements = {
      high: '\n\nEnhanced quality requirements: Maximum detail, professional architectural visualization, photorealistic rendering, high resolution, sharp focus, accurate lighting and materials.',
      ultra: '\n\nUltra quality requirements: Exceptional detail, studio-quality architectural visualization, ultra-photorealistic rendering, maximum resolution, perfect focus, cinematic lighting and materials, professional architectural photography quality.'
    };

    return prompt + qualityEnhancements[quality];
  }

  private buildImagePrompt(userPrompt: string, style: string, negativePrompt?: string, imageType?: string): string {
    const basePrompt = `Create a photorealistic architectural image of: ${userPrompt}`;

    const styleModifiers = {
      modern: 'in a modern architectural style with clean lines, glass, and steel elements',
      contemporary: 'in a contemporary style with innovative materials and sustainable design',
      traditional: 'in a traditional architectural style with classic proportions and materials',
      minimalist: 'in a minimalist style with simple forms and clean aesthetics',
      industrial: 'in an industrial style with exposed materials and utilitarian design',
      mediterranean: 'in a Mediterranean style with stucco walls and terracotta roofs',
      colonial: 'in a colonial style with symmetrical design and classical elements',
      victorian: 'in a Victorian style with ornate details and decorative elements',
      realistic: 'in a photorealistic style with accurate lighting and materials',
      cgi: 'as a high-quality 3D render with professional lighting',
      night: 'at night with dramatic lighting and atmosphere',
      sketch: 'as an architectural sketch with clean lines and proportions',
      watercolor: 'in a watercolor painting style with soft colors and textures',
      illustration: 'as a detailed architectural illustration',
    };

    const styleModifier = styleModifiers[style as keyof typeof styleModifiers] || styleModifiers.realistic;

    // Add image type modifier
    let imageTypeModifier = '';
    if (imageType) {
      const imageTypeModifiers = {
        '3d-mass': 'as a 3D massing model with clean geometric forms',
        'photo': 'as a realistic photograph with natural lighting',
        'drawing': 'as an architectural drawing with technical precision',
        'wireframe': 'as a wireframe model showing structural elements',
        'construction': 'as a construction documentation image',
      };
      imageTypeModifier = imageTypeModifiers[imageType as keyof typeof imageTypeModifiers] || '';
    }

    // Build the final prompt
    let finalPrompt = `${basePrompt}, ${styleModifier}`;
    if (imageTypeModifier) {
      finalPrompt += `, ${imageTypeModifier}`;
    }
    finalPrompt += '. Professional architectural visualization, high quality, detailed, realistic lighting and materials, suitable for architectural presentation.';

    // Add negative prompt if provided
    if (negativePrompt && negativePrompt.trim()) {
      finalPrompt += ` Avoid: ${negativePrompt.trim()}.`;
    }

    return finalPrompt;
  }

  private buildVideoPrompt(userPrompt: string, style: string, duration: number): string {
    const basePrompt = `Create a ${duration}-second architectural video of: ${userPrompt}`;

    const styleModifiers = {
      modern: 'in a modern architectural style with clean lines, glass, and steel elements',
      contemporary: 'in a contemporary style with innovative materials and sustainable design',
      traditional: 'in a traditional architectural style with classic proportions and materials',
      minimalist: 'in a minimalist style with simple forms and clean aesthetics',
      industrial: 'in an industrial style with exposed materials and utilitarian design',
      mediterranean: 'in a Mediterranean style with stucco walls and terracotta roofs',
      colonial: 'in a colonial style with symmetrical design and classical elements',
      victorian: 'in a Victorian style with ornate details and decorative elements',
      realistic: 'in a photorealistic style with accurate lighting and materials',
      cgi: 'as a high-quality 3D render with professional lighting',
      night: 'at night with dramatic lighting and atmosphere',
      sketch: 'as an architectural sketch with clean lines and proportions',
      watercolor: 'in a watercolor painting style with soft colors and textures',
      illustration: 'as a detailed architectural illustration',
    };

    const styleModifier = styleModifiers[style as keyof typeof styleModifiers] || styleModifiers.realistic;

    return `${basePrompt}, ${styleModifier}. Professional architectural video, smooth camera movement, high quality, detailed, realistic lighting and materials, suitable for architectural presentation.`;
  }

  private getAspectRatioConfig(aspectRatio: string): string {
    const aspectRatioMap: Record<string, string> = {
      '1:1': '1:1',
      '2:3': '2:3',
      '3:2': '3:2',
      '3:4': '3:4',
      '4:3': '4:3',
      '4:5': '4:5',
      '5:4': '5:4',
      '9:16': '9:16',
      '16:9': '16:9',
      '21:9': '21:9',
    };
    return aspectRatioMap[aspectRatio] || '16:9';
  }

  async getStatus(): Promise<{ status: string; progress?: number; result?: unknown }> {
    // Google AI doesn't provide job status tracking like some other services
    // This is a placeholder for consistency with the interface
    return {
      status: 'completed',
      progress: 100,
    };
  }
}
