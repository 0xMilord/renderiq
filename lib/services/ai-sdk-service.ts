import { GoogleGenAI } from '@google/genai';
import { z } from 'zod';
import { logger } from '@/lib/utils/logger';

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
  imageData?: string; // Base64 string without data: prefix
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
 * Google Generative AI Service - Unified AI operations using Google Generative AI SDK
 */
export class AISDKService {
  private static instance: AISDKService;
  private genAI: GoogleGenAI;

  private constructor() {
    // The new @google/genai SDK can read from GEMINI_API_KEY automatically
    // But we'll also check our custom env vars for compatibility
    const apiKey = process.env.GEMINI_API_KEY || 
                   process.env.GOOGLE_GENERATIVE_AI_API_KEY || 
                   process.env.GOOGLE_AI_API_KEY;
    
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY, GOOGLE_GENERATIVE_AI_API_KEY, or GOOGLE_AI_API_KEY environment variable is required');
    }
    
    // Use the new @google/genai SDK for all operations
    // According to docs: new GoogleGenAI({}) reads from GEMINI_API_KEY automatically
    // But we'll pass it explicitly to ensure it works
    this.genAI = new GoogleGenAI({ apiKey });
    logger.log('✅ AISDKService initialized with Google Generative AI SDK (@google/genai)', {
      apiKeyPresent: !!apiKey,
      apiKeyPrefix: apiKey.substring(0, 10) + '...'
    });
  }

  static getInstance(): AISDKService {
    if (!AISDKService.instance) {
      AISDKService.instance = new AISDKService();
    }
    return AISDKService.instance;
  }

  /**
   * Enhance prompts using Google Generative AI with structured output
   */
  async enhancePrompt(originalPrompt: string): Promise<PromptEnhancementResult> {
    logger.log('🔍 AISDKService: Starting prompt enhancement', {
      originalPrompt: originalPrompt.substring(0, 100) + '...'
    });

    const startTime = Date.now();

    try {
      const prompt = `You are an AI prompt assistant. Enhance the user's prompt to be more detailed and visually compelling while keeping the core intent.

General guidelines:
- Keep the original intent and style
- Add relevant visual details when helpful
- Keep it clear and concise (under 200 words)
- Provide a clarity score (0-100)
- Note any potential issues or improvements

Return your response as a JSON object:
{
  "enhancedPrompt": "the enhanced prompt text",
  "clarity": 85,
  "conflicts": ["list of conflicts"],
  "suggestions": ["list of suggestions"],
  "architecturalDetails": ["list of details"],
  "visualElements": ["list of elements"]
}

Original prompt: "${originalPrompt}"`;

      // Use the new @google/genai SDK API
      const response = await this.genAI.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          temperature: 0.8,
          maxOutputTokens: 2000,
          responseMimeType: 'application/json',
        },
      });

      const responseText = response.text;
      let parsedResult;
      try {
        parsedResult = JSON.parse(responseText);
      } catch (parseError) {
        // Try to extract JSON from markdown code blocks if present
        const jsonMatch = responseText.match(/```json\s*([\s\S]*?)\s*```/) || responseText.match(/```\s*([\s\S]*?)\s*```/);
        if (jsonMatch) {
          parsedResult = JSON.parse(jsonMatch[1]);
        } else {
          throw new Error('Failed to parse JSON response');
        }
      }

      // Validate and parse with zod schema
      const validatedResult = PromptEnhancementSchema.parse(parsedResult);

      const processingTime = Date.now() - startTime;

      logger.log('🔍 AISDKService: Enhancement successful', {
        processingTime,
        clarity: validatedResult.clarity,
        conflictsResolved: validatedResult.conflicts.length,
        suggestions: validatedResult.suggestions.length
      });

      return {
        ...validatedResult,
        processingTime,
        provider: 'google-generative-ai'
      };

    } catch (error) {
      logger.error('❌ AISDKService: Prompt enhancement failed', error);
      throw new Error(`Prompt enhancement failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate images using Google Gemini Native Image Generation (Nano Banana)
   */
  async generateImage(request: {
    prompt: string;
    aspectRatio: string;
    uploadedImageData?: string;
    uploadedImageType?: string;
    negativePrompt?: string;
    seed?: number;
    environment?: string;
    effect?: string;
    styleTransferImageData?: string;
    styleTransferImageType?: string;
    temperature?: number;
    mediaResolution?: 'LOW' | 'MEDIUM' | 'HIGH' | 'UNSPECIFIED';
  }): Promise<{ success: boolean; data?: ImageGenerationResult; error?: string }> {
    logger.log('🎨 AISDKService: Starting image generation with Gemini Native Image', {
      prompt: request.prompt.substring(0, 100),
      aspectRatio: request.aspectRatio,
      hasUploadedImage: !!request.uploadedImageData,
      hasStyleTransfer: !!request.styleTransferImageData,
      environment: request.environment,
      effect: request.effect
    });

    const startTime = Date.now();

    try {
      // Build clean, structured prompt following best practices
      // Start with user's original prompt - it's the primary input
      let enhancedPrompt = request.prompt.trim();
      
      // Only add settings if they're not already mentioned in the prompt
      // This avoids redundancy and token waste
      const promptLower = enhancedPrompt.toLowerCase();
      
      // Add environment if provided and not already mentioned
      // Follow best practice: only add if not redundant
      if (request.environment && request.environment !== 'none') {
        // Check if environment/weather is already mentioned in prompt
        const envKeywords = ['rainy', 'sunny', 'overcast', 'sunset', 'sunrise', 'night', 'day', 'dusk', 'dawn', 'weather', 'environment'];
        const envValue = request.environment.toLowerCase();
        const isEnvMentioned = envKeywords.some(keyword => 
          promptLower.includes(keyword) && (promptLower.includes(envValue) || promptLower.includes('environment') || promptLower.includes('weather'))
        );
        
        if (!isEnvMentioned) {
          enhancedPrompt += `, ${request.environment} environment`;
        }
      }
      
      // Add effect/style if provided and not already mentioned
      // Follow best practice: avoid redundancy
      if (request.effect && request.effect !== 'none') {
        // Check if style/effect is already mentioned in prompt
        const styleKeywords = ['photoreal', 'realistic', 'illustration', 'wireframe', 'sketch', 'painting', 'digital art', 'style', 'effect'];
        const effectValue = request.effect.toLowerCase();
        const isStyleMentioned = styleKeywords.some(keyword => 
          promptLower.includes(keyword) && (promptLower.includes(effectValue) || promptLower.includes('style'))
        );
        
        if (!isStyleMentioned) {
          enhancedPrompt += `, ${request.effect} style`;
        }
      }
      
      // Build contents array with text and images
      // For Gemini 3, we can set per-part media resolution, but for now we'll use global
      type ContentPart = { text: string } | { inlineData: { mimeType: string; data: string } };
      const contents: ContentPart[] = [];
      
      // Add text prompt
      contents.push({ text: enhancedPrompt });
      
      // Add uploaded image (main image being edited) if provided
      if (request.uploadedImageData && request.uploadedImageType) {
        contents.push({
          inlineData: {
            mimeType: request.uploadedImageType,
            data: request.uploadedImageData
          }
        });
      }
      
      // Add style transfer image if provided
      if (request.styleTransferImageData && request.styleTransferImageType) {
        contents.push({
          inlineData: {
            mimeType: request.styleTransferImageType,
            data: request.styleTransferImageData
          }
        });
      }

      // Use Gemini 3 Pro Image Preview (Nano Banana Pro) for professional asset production
      // This model supports up to 4K resolution and advanced features
      const modelName = 'gemini-3-pro-image-preview';
      
      // Map aspect ratio to valid format
      const validAspectRatios = ['1:1', '2:3', '3:2', '3:4', '4:3', '4:5', '5:4', '9:16', '16:9', '21:9'];
      const aspectRatio = validAspectRatios.includes(request.aspectRatio) 
        ? request.aspectRatio 
        : '16:9';

      // For Gemini 3 Pro Image, determine image size based on mediaResolution request
      // Map mediaResolution to imageSize: HIGH -> 4K (for upscaling), MEDIUM -> 2K, LOW -> 1K
      // Note: mediaResolution parameter is NOT for image generation models
      // It's only for multimodal models processing input media
      // For image generation, we use imageSize in imageConfig instead
      let imageSize: '1K' | '2K' | '4K' = '1K'; // Default to 1K
      if (request.mediaResolution === 'HIGH') {
        imageSize = '4K'; // Use 4K for high quality requests (upscaling, maximum detail)
      } else if (request.mediaResolution === 'MEDIUM') {
        imageSize = '2K'; // Use 2K for medium quality
      } else {
        imageSize = '1K'; // Default to 1K for LOW or UNSPECIFIED
      }

      logger.log('🎨 AISDKService: Calling Gemini Native Image Generation...', {
        model: modelName,
        aspectRatio,
        imageSize,
        contentsCount: contents.length,
        note: 'Using Gemini 3 Pro Image Preview (Nano Banana Pro)'
      });

      // Generate image using Gemini Native Image Generation
      // For image generation models, use imageConfig with aspectRatio and imageSize
      // DO NOT use mediaResolution - it's only for multimodal models processing input media
      const config: {
        responseModalities: string[];
        imageConfig: { aspectRatio: string; imageSize?: string };
      } = {
        responseModalities: ['IMAGE'], // Only return image, no text
        imageConfig: {
          aspectRatio: aspectRatio,
          imageSize: imageSize // Gemini 3 Pro supports 1K, 2K, 4K
        }
      };

      const response = await this.genAI.models.generateContent({
        model: modelName,
        contents: contents,
        config: config
      });

      logger.log('🎨 AISDKService: Response received', {
        hasResponse: !!response,
        responseKeys: response ? Object.keys(response) : [],
        candidates: response?.candidates?.length || 0
      });

      // Extract image from response - check new SDK response structure
      // The new SDK might return data differently
      let imageData: string | null = null;
      let mimeType: string = 'image/png';

      // Try different response structures
      if (response.candidates && response.candidates.length > 0) {
        const candidate = response.candidates[0];
        if (candidate.content?.parts) {
          for (const part of candidate.content.parts) {
            if (part.inlineData && part.inlineData.mimeType?.startsWith('image/')) {
              imageData = part.inlineData.data;
              mimeType = part.inlineData.mimeType;
              break;
            }
          }
        }
      }

      // Alternative: check if response has direct image data
      const responseAny = response as { imageData?: string; parts?: Array<{ inlineData?: { mimeType?: string; data?: string } }> };
      if (!imageData && responseAny.imageData) {
        imageData = responseAny.imageData;
      }

      // Alternative: check if response has parts at root level
      if (!imageData && responseAny.parts) {
        for (const part of responseAny.parts) {
          if (part.inlineData && part.inlineData.mimeType?.startsWith('image/')) {
            imageData = part.inlineData.data || null;
            if (part.inlineData.mimeType) {
              mimeType = part.inlineData.mimeType;
            }
            break;
          }
        }
      }

      if (!imageData) {
        logger.error('❌ AISDKService: No image data in response', {
          responseStructure: JSON.stringify(response, null, 2).substring(0, 500)
        });
        return {
          success: false,
          error: 'No image data returned from generation service. Response structure may have changed.'
        };
      }

      // Mime type already extracted above
      
      // Return base64 data (without data: prefix) for storage upload
      // The API route will handle uploading to storage
      const processingTime = Math.round((Date.now() - startTime) / 1000);

      logger.log('✅ AISDKService: Image generation successful', {
        processingTime,
        aspectRatio,
        imageDataLength: imageData.length
      });

      return {
        success: true,
        data: {
          imageData: imageData, // Base64 string without data: prefix
          imageUrl: `data:${mimeType};base64,${imageData}`, // Data URL for immediate display
          processingTime,
          provider: 'google-gemini-native-image',
          metadata: {
            prompt: enhancedPrompt,
            style: request.effect || 'realistic',
            quality: 'standard',
            aspectRatio: aspectRatio,
            seed: request.seed
          }
        }
      };

    } catch (error) {
      logger.error('❌ AISDKService: Image generation failed', error);
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
    logger.log('🎬 AISDKService: Starting video generation', {
      prompt: request.prompt,
      duration: request.duration,
      aspectRatio: request.aspectRatio,
      hasUploadedImage: !!request.uploadedImageData
    });

    const startTime = Date.now();

    try {
      // Build clean, structured prompt following best practices
      // Start with user's original prompt - it's the primary input
      let enhancedPrompt = request.prompt.trim();
      const promptLower = enhancedPrompt.toLowerCase();
      
      // Only add aspect ratio if not already mentioned (avoid redundancy)
      if (request.aspectRatio && !promptLower.includes('aspect ratio') && !promptLower.includes(request.aspectRatio.replace(':', ':'))) {
        enhancedPrompt += `, ${request.aspectRatio} aspect ratio`;
      }
      
      // Only add duration if not already mentioned
      if (request.duration && !promptLower.includes('duration') && !promptLower.includes(`${request.duration} second`)) {
        enhancedPrompt += `, ${request.duration} seconds`;
      }
      
      // Don't add redundant reference note - the uploaded image in contents is sufficient
      // The model understands image-to-video from the multimodal input

      // Video generation with Veo requires Google Cloud Vertex AI or GenAI SDK
      // For now, return an error indicating video generation needs to be configured
      
      return {
        success: false,
        error: 'Video generation via Veo 3.1 is not yet implemented. Please use Google Cloud Vertex AI or configure Veo API access separately.'
      };

    } catch (error) {
      logger.error('❌ AISDKService: Video generation failed', error);
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
    logger.log('📝 AISDKService: Starting text streaming', {
      prompt: prompt.substring(0, 100) + '...'
    });

    try {
      // Use the new @google/genai SDK API for streaming
      const stream = await this.genAI.models.generateContentStream({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          temperature: 0.7,
          maxOutputTokens: 1000,
        },
      });

      for await (const chunk of stream) {
        const text = chunk.text;
        if (text) {
          yield text;
        }
      }

    } catch (error) {
      logger.error('❌ AISDKService: Text streaming failed', error);
      throw new Error(`Text streaming failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate structured data using Google Generative AI
   */
  async generateStructuredData<T>(schema: z.ZodSchema<T>, prompt: string): Promise<T> {
    logger.log('📊 AISDKService: Starting structured data generation', {
      prompt: prompt.substring(0, 100) + '...'
    });

    try {
      // Use the new @google/genai SDK API
      const response = await this.genAI.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          temperature: 0.7,
          maxOutputTokens: 1000,
          responseMimeType: 'application/json',
        },
      });

      const responseText = response.text;
      let parsedResult;
      try {
        parsedResult = JSON.parse(responseText);
      } catch (parseError) {
        // Try to extract JSON from markdown code blocks if present
        const jsonMatch = responseText.match(/```json\s*([\s\S]*?)\s*```/) || responseText.match(/```\s*([\s\S]*?)\s*```/);
        if (jsonMatch) {
          parsedResult = JSON.parse(jsonMatch[1]);
        } else {
          throw new Error('Failed to parse JSON response');
        }
      }

      // Validate with zod schema
      const validatedResult = schema.parse(parsedResult);

      console.log('📊 AISDKService: Structured data generation successful');
      return validatedResult;

    } catch (error) {
      console.error('❌ AISDKService: Structured data generation failed', error);
      throw new Error(`Structured data generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate text completion
   */
  async generateText(prompt: string, options?: {
    temperature?: number;
    maxTokens?: number;
  }): Promise<{ text: string; usage?: { promptTokenCount?: number; candidatesTokenCount?: number; totalTokenCount?: number } }> {
    try {
      // Use the new @google/genai SDK API
      const response = await this.genAI.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          temperature: options?.temperature ?? 0.7,
          maxOutputTokens: options?.maxTokens ?? 1000,
        },
      });

      return {
        text: response.text,
        usage: response.usageMetadata,
      };
    } catch (error) {
      logger.error('❌ AISDKService: Text generation failed', error);
      throw new Error(`Text generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Stream chat messages
   */
  async *streamChat(messages: Array<{ role: 'user' | 'assistant'; content: string }>) {
    try {
      // Use the new @google/genai SDK API
      // Convert messages to the new format
      const history: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = [];
      
      // Build conversation history (exclude the last user message if present)
      for (let i = 0; i < messages.length - 1; i++) {
        const msg = messages[i];
        history.push({
          role: msg.role === 'user' ? 'user' : 'model',
          parts: [{ text: msg.content }],
        });
      }

      // Last message is the current user prompt
      const currentMessage = messages[messages.length - 1];
      if (currentMessage && currentMessage.role === 'user') {
        // Use the new @google/genai SDK API for streaming
        const stream = await this.genAI.models.generateContentStream({
          model: 'gemini-2.5-flash',
          contents: [...history, { role: 'user', parts: [{ text: currentMessage.content }] }],
          config: {
            temperature: 0.7,
            maxOutputTokens: 1000,
          },
        });

        for await (const chunk of stream) {
          const text = chunk.text;
          if (text) {
            yield text;
          }
        }
      }
    } catch (error) {
      logger.error('❌ AISDKService: Chat streaming failed', error);
      throw new Error(`Chat streaming failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}