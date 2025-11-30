import { generateText, generateObject, streamText, experimental_generateImage as generateImage } from 'ai';
import { google } from '@ai-sdk/google';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { z } from 'zod';

// Enhanced prompt schema for structured output
const PromptEnhancementSchema = z.object({
  enhancedPrompt: z.string().describe('The enhanced, detailed prompt for better image generation'),
  clarity: z.number().min(0).max(100).describe('Clarity score of the original prompt'),
  conflicts: z.array(z.string()).describe('List of potential conflicts or issues'),
  suggestions: z.array(z.string()).describe('List of improvement suggestions'),
  architecturalDetails: z.array(z.string()).describe('Specific architectural elements added'),
  visualElements: z.array(z.string()).describe('Visual and atmospheric elements added'),
});

// Image generation request schema
const ImageGenerationSchema = z.object({
  prompt: z.string(),
  style: z.string(),
  quality: z.enum(['standard', 'high', 'ultra']),
  aspectRatio: z.string(),
  negativePrompt: z.string().optional(),
  seed: z.number().optional(),
});

// Video generation request schema
const VideoGenerationSchema = z.object({
  prompt: z.string(),
  duration: z.number().optional(),
  style: z.string().optional(),
  aspectRatio: z.string().optional(),
});

export interface PromptEnhancementResult {
  enhancedPrompt: string;
  clarity: number;
  conflicts: string[];
  suggestions: string[];
  architecturalDetails: string[];
  visualElements: string[];
  processingTime: number;
  provider: string;
}

export interface ImageGenerationResult {
  imageUrl: string;
  processingTime: number;
  provider: string;
  metadata: {
    prompt: string;
    style: string;
    quality: string;
    aspectRatio: string;
    seed?: number;
  };
}

export interface VideoGenerationResult {
  videoUrl: string;
  processingTime: number;
  provider: string;
  metadata: {
    prompt: string;
    duration?: number;
    style?: string;
    aspectRatio?: string;
  };
}

/**
 * Vercel AI SDK Service - Unified AI operations using Vercel AI SDK
 * Replaces all manual Google AI implementations with standardized SDK
 */
export class AISDKService {
  private static instance: AISDKService;

  private constructor() {
    console.log('✅ AISDKService initialized with Vercel AI SDK');
  }

  static getInstance(): AISDKService {
    if (!AISDKService.instance) {
      AISDKService.instance = new AISDKService();
    }
    return AISDKService.instance;
  }

  /**
   * Enhance prompts using Vercel AI SDK with structured output
   */
  async enhancePrompt(originalPrompt: string): Promise<PromptEnhancementResult> {
    console.log('🔍 AISDKService: Starting prompt enhancement', {
      originalPrompt: originalPrompt.substring(0, 100) + '...'
    });

    const startTime = Date.now();

    try {
      const result = await generateObject({
        model: google('gemini-2.0-flash-exp'), // Latest experimental model
        schema: PromptEnhancementSchema,
        temperature: 0.8, // Higher creativity for better prompts
        maxTokens: 2000, // More detailed responses
        prompt: `You are an expert AI prompt engineer specializing in architectural and design image generation. Your task is to enhance the user's prompt to create a more detailed, specific, and visually compelling description that will generate better images.

Guidelines:
1. Keep the core intent and style of the original prompt
2. Add specific architectural details, materials, lighting, and composition elements
3. Include technical specifications when relevant (dimensions, proportions, etc.)
4. Enhance visual descriptions with colors, textures, and atmospheric details
5. Make it 2x more detailed and meaningful while staying true to the original vision
6. Focus on architectural and design elements
7. Keep the enhanced prompt under 200 words
8. Provide a clarity score (0-100) for the original prompt
9. Identify any potential conflicts or issues
10. Suggest improvements
11. List specific architectural details added
12. List visual elements added

Original prompt: "${originalPrompt}"`,
        temperature: 0.7,
        maxTokens: 1000,
      });

      const processingTime = Date.now() - startTime;

      console.log('🔍 AISDKService: Enhancement successful', {
        processingTime,
        clarity: result.object.clarity,
        conflictsResolved: result.object.conflicts.length,
        suggestions: result.object.suggestions.length
      });

      return {
        ...result.object,
        processingTime,
        provider: 'vercel-ai-sdk-google'
      };

    } catch (error) {
      console.error('❌ AISDKService: Prompt enhancement failed', error);
      throw new Error(`Prompt enhancement failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate images using Vercel AI SDK
   */
  async generateImage(request: {
    prompt: string;
    aspectRatio: string;
    uploadedImageData?: string;
    uploadedImageType?: string;
    negativePrompt?: string;
    seed?: number;
  }): Promise<{ success: boolean; data?: ImageGenerationResult; error?: string }> {
    console.log('🎨 AISDKService: Starting image generation', {
      prompt: request.prompt,
      aspectRatio: request.aspectRatio,
      hasUploadedImage: !!request.uploadedImageData
    });

    const startTime = Date.now();

    try {
      // Enhanced prompt following Vercel AI SDK and Google Imagen guidelines
      const enhancedPrompt = `Professional architectural visualization: ${request.prompt}

Subject: Architectural design with detailed materials and textures
Action: Static architectural composition with optimal lighting
Style: Realistic architectural rendering, professional quality
Camera: Wide shot composition with ${request.aspectRatio} aspect ratio
Ambiance: Natural lighting with architectural accuracy
Composition: Clean architectural lines and professional presentation
Focus: High-resolution architectural details and material textures

Technical specifications:
- Professional architectural accuracy
- Detailed material textures and finishes
- Optimal lighting and shadow placement
- Clean composition and professional presentation
- High-resolution architectural visualization
- Realistic architectural rendering quality
${request.negativePrompt ? `\nNegative elements: ${request.negativePrompt}` : ''}`;

      // Use Vercel AI SDK with Google Imagen (this is the correct way)
      console.log('🎨 AISDKService: Calling Google Imagen via Vercel AI SDK...', {
        promptLength: enhancedPrompt.length,
        aspectRatio: request.aspectRatio
      });

      // Try imagen-4.0-generate-001 first, fallback to gemini-3-pro-image-preview if needed
      let result;
      let modelUsed = 'imagen-4.0-generate-001';
      try {
        result = await generateImage({
          model: google.image('imagen-4.0-generate-001'),
          prompt: enhancedPrompt,
          aspectRatio: request.aspectRatio,
          seed: request.seed,
        });
      } catch (error: any) {
        // If imagen-4.0 fails, try the newer gemini model
        if (error?.statusCode === 404 || error?.message?.includes('not found')) {
          console.log('⚠️ AISDKService: imagen-4.0-generate-001 not found, trying gemini-3-pro-image-preview...');
          modelUsed = 'gemini-3-pro-image-preview';
          result = await generateImage({
            model: google.image('gemini-3-pro-image-preview'),
            prompt: enhancedPrompt,
            aspectRatio: request.aspectRatio,
            seed: request.seed,
          });
        } else {
          throw error;
        }
      }

      const processingTime = Date.now() - startTime;

      console.log('🎨 AISDKService: Image generation response received', {
        processingTime,
        provider: modelUsed,
        resultType: typeof result,
        hasImage: !!result.image,
        imageType: typeof result.image,
        imageKeys: result.image && typeof result.image === 'object' ? Object.keys(result.image) : []
      });

      // Extract image URL from result - Vercel AI SDK returns result.image
      let imageUrl: string;
      
      if (!result || !result.image) {
        console.error('❌ AISDKService: No image in result', result);
        throw new Error('No image data returned from generation');
      }

      // Handle different response formats from Vercel AI SDK
      if (typeof result.image === 'string') {
        // Direct string (could be base64 or URL)
        imageUrl = result.image.startsWith('data:') || result.image.startsWith('http') 
          ? result.image 
          : `data:image/png;base64,${result.image}`;
      } else if (result.image && typeof result.image === 'object') {
        // Object with properties
        if ('base64' in result.image && result.image.base64) {
          imageUrl = `data:image/png;base64,${result.image.base64}`;
        } else if ('url' in result.image && result.image.url) {
          imageUrl = result.image.url;
        } else if ('data' in result.image && result.image.data) {
          const data = result.image.data;
          imageUrl = typeof data === 'string' 
            ? (data.startsWith('data:') ? data : `data:image/png;base64,${data}`)
            : `data:image/png;base64,${data}`;
        } else {
          // Last resort: try to stringify
          console.warn('⚠️ AISDKService: Unexpected image format, attempting extraction...', result.image);
          const imageValue = (result.image as any).image || (result.image as any).content || JSON.stringify(result.image);
          imageUrl = typeof imageValue === 'string' 
            ? (imageValue.startsWith('data:') || imageValue.startsWith('http') ? imageValue : `data:image/png;base64,${imageValue}`)
            : `data:image/png;base64,${imageValue}`;
        }
      } else {
        throw new Error('Unexpected image format in result');
      }

      console.log('✅ AISDKService: Image URL prepared successfully', {
        urlLength: imageUrl.length,
        urlPreview: imageUrl.substring(0, 50)
      });

      return {
        success: true,
        data: {
          imageUrl: imageUrl,
          processingTime,
          provider: modelUsed,
          metadata: {
            prompt: enhancedPrompt,
            style: 'realistic',
            quality: 'ultra',
            aspectRatio: request.aspectRatio,
            seed: request.seed
          }
        }
      };

    } catch (error) {
      console.error('❌ AISDKService: Image generation failed', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Image generation failed'
      };
    }
  }

  /**
   * Generate videos using Google Veo 3.1 API
   */
  async generateVideo(request: {
    prompt: string;
    duration: number;
    aspectRatio: '16:9' | '9:16' | '1:1';
    uploadedImageData?: string;
  }): Promise<{ success: boolean; data?: VideoGenerationResult; error?: string }> {
    console.log('🎬 AISDKService: Starting video generation with Veo 3.1', {
      prompt: request.prompt,
      duration: request.duration,
      aspectRatio: request.aspectRatio,
      hasUploadedImage: !!request.uploadedImageData
    });

    const startTime = Date.now();

    try {
      // Enhanced prompt following Google Veo 3.1 guidelines
      const enhancedPrompt = `Architectural video visualization: ${request.prompt}

Subject: Architectural design and built environment
Action: Smooth architectural motion and cinematic transitions
Style: Professional architectural cinematography, realistic rendering
Camera: Cinematic wide shot with ${request.aspectRatio} aspect ratio, smooth camera movement
Composition: Professional architectural framing and composition
Ambiance: Natural architectural lighting with professional quality
Duration: ${request.duration} seconds of architectural content
Focus: Architectural accuracy and professional presentation

Technical specifications:
- Professional architectural cinematography
- Smooth architectural motion and transitions
- Consistent visual architectural style
- High-quality architectural rendering
- Professional architectural accuracy
- Engaging architectural content flow
${request.uploadedImageData ? '\nReference: Use uploaded architectural image as starting frame' : ''}`;

      // Initialize Google GenAI client
      const ai = new GoogleGenAI({
        apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GOOGLE_AI_API_KEY
      });

      // Start video generation with Veo 3.1
      let operation = await ai.models.generateVideos({
        model: "veo-3.1-generate-preview", // Latest Veo 3.1 model
        prompt: enhancedPrompt,
        config: {
          aspectRatio: request.aspectRatio,
          durationSeconds: request.duration.toString(),
          resolution: request.duration === 8 ? "1080p" : "720p", // 1080p only for 8s duration
          personGeneration: "allow_adult" // For architectural content
        }
      });

      console.log('🎬 AISDKService: Video generation started, polling for completion...');

      // Poll the operation status until the video is ready
      while (!operation.done) {
        console.log("Waiting for video generation to complete...");
        await new Promise((resolve) => setTimeout(resolve, 10000)); // Wait 10 seconds
        operation = await ai.operations.getVideosOperation({
          operation: operation,
        });
      }

      const processingTime = Date.now() - startTime;

      // Download the generated video
      const generatedVideo = operation.response.generatedVideos[0];
      const videoFile = await ai.files.download({
        file: generatedVideo.video,
      });

      console.log('🎬 AISDKService: Video generation successful', {
        processingTime,
        provider: 'veo-3.1-generate-preview'
      });

      return {
        success: true,
        data: {
          videoUrl: videoFile, // The actual video file data
          processingTime,
          provider: 'veo-3.1-generate-preview',
          metadata: {
            prompt: enhancedPrompt,
            duration: request.duration,
            style: 'cinematic',
            aspectRatio: request.aspectRatio
          }
        }
      };

    } catch (error) {
      console.error('❌ AISDKService: Video generation failed', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Video generation failed'
      };
    }
  }

  /**
   * Stream text generation for real-time responses
   */
  async *streamTextGeneration(prompt: string) {
    console.log('📝 AISDKService: Starting text streaming', {
      prompt: prompt.substring(0, 100) + '...'
    });

    try {
      const result = await streamText({
        model: google('gemini-2.0-flash'),
        prompt,
        temperature: 0.7,
        maxTokens: 1000,
      });

      for await (const delta of result.textStream) {
        yield delta;
      }

    } catch (error) {
      console.error('❌ AISDKService: Text streaming failed', error);
      throw new Error(`Text streaming failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate structured data using Vercel AI SDK
   */
  async generateStructuredData<T>(schema: z.ZodSchema<T>, prompt: string): Promise<T> {
    console.log('📊 AISDKService: Starting structured data generation', {
      prompt: prompt.substring(0, 100) + '...'
    });

    try {
      const result = await generateObject({
        model: google('gemini-2.0-flash'),
        schema,
        prompt,
        temperature: 0.7,
        maxTokens: 1000,
      });

      console.log('📊 AISDKService: Structured data generation successful');
      return result.object;

    } catch (error) {
      console.error('❌ AISDKService: Structured data generation failed', error);
      throw new Error(`Structured data generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
