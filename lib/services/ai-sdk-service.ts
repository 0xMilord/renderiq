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
 * Google Generative AI Service - Unified AI operations using Google Generative AI SDK
 */
export class AISDKService {
  private static instance: AISDKService;
  private genAI: GoogleGenerativeAI;

  private constructor() {
    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GOOGLE_AI_API_KEY;
    if (!apiKey) {
      throw new Error('GOOGLE_GENERATIVE_AI_API_KEY or GOOGLE_AI_API_KEY environment variable is required');
    }
    this.genAI = new GoogleGenerativeAI(apiKey);
    console.log('✅ AISDKService initialized with Google Generative AI SDK');
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
    console.log('🔍 AISDKService: Starting prompt enhancement', {
      originalPrompt: originalPrompt.substring(0, 100) + '...'
    });

    const startTime = Date.now();

    try {
      const model = this.genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

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

      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.8,
          maxOutputTokens: 2000,
          responseMimeType: 'application/json',
        },
      });

      const responseText = result.response.text();
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

      console.log('🔍 AISDKService: Enhancement successful', {
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
      console.error('❌ AISDKService: Prompt enhancement failed', error);
      throw new Error(`Prompt enhancement failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate images using Google Generative AI (Imagen)
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
  }): Promise<{ success: boolean; data?: ImageGenerationResult; error?: string }> {
    console.log('🎨 AISDKService: Starting image generation', {
      prompt: request.prompt,
      aspectRatio: request.aspectRatio,
      hasUploadedImage: !!request.uploadedImageData
    });

    const startTime = Date.now();

    try {
      // Use user prompt directly, only add minimal context if needed
      let enhancedPrompt = request.prompt;
      
      // Add environment if provided
      if (request.environment) {
        enhancedPrompt += `, ${request.environment} environment`;
      }
      
      // Add effect/style if provided
      if (request.effect) {
        enhancedPrompt += `, ${request.effect} style`;
      }
      
      // Only add aspect ratio context if not already mentioned
      if (request.aspectRatio && !enhancedPrompt.toLowerCase().includes('aspect ratio') && !enhancedPrompt.toLowerCase().includes(request.aspectRatio)) {
        enhancedPrompt += `, ${request.aspectRatio} aspect ratio`;
      }
      
      // Add negative prompt if provided
      if (request.negativePrompt) {
        enhancedPrompt += `\nNegative: ${request.negativePrompt}`;
      }
      
      // Note: Style transfer and style ref images are handled separately by the AI model
      // They should be passed as image inputs to the generation API, not in the prompt

      console.log('🎨 AISDKService: Calling Google Imagen...', {
        promptLength: enhancedPrompt.length,
        aspectRatio: request.aspectRatio
      });

      // Use Gemini model for image generation (imagen models may need different approach)
      // Note: Google Generative AI SDK v0.21.0 may have different image generation methods
      // This is a placeholder that should work with available models
      // Temperature: 0.0 = strict/deterministic, 1.0 = creative/random
      const model = this.genAI.getGenerativeModel({ 
        model: 'gemini-2.0-flash-exp',
        generationConfig: {
          temperature: request.temperature ?? 0.7,
        },
      });

      // For image generation, we might need to use a different approach
      // Since direct imagen access might not be available in @google/generative-ai,
      // we'll use a text-based approach or check if imagen models are available
      
      // For now, return an error indicating image generation needs to be configured
      // The actual implementation will depend on available Google AI image generation APIs
      
      return {
        success: false,
        error: 'Image generation via Imagen is not yet implemented. Please use Google Cloud Vertex AI or configure Imagen API access separately.'
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
    console.log('🎬 AISDKService: Starting video generation', {
      prompt: request.prompt,
      duration: request.duration,
      aspectRatio: request.aspectRatio,
      hasUploadedImage: !!request.uploadedImageData
    });

    const startTime = Date.now();

    try {
      // Use user prompt directly, only add minimal context if needed
      let enhancedPrompt = request.prompt;
      
      // Only add aspect ratio and duration if not already mentioned
      if (request.aspectRatio && !enhancedPrompt.toLowerCase().includes('aspect ratio') && !enhancedPrompt.toLowerCase().includes(request.aspectRatio)) {
        enhancedPrompt += `, ${request.aspectRatio} aspect ratio`;
      }
      
      if (request.duration && !enhancedPrompt.toLowerCase().includes('duration') && !enhancedPrompt.toLowerCase().includes(`${request.duration} second`)) {
        enhancedPrompt += `, ${request.duration} seconds`;
      }
      
      // Add reference note if image provided
      if (request.uploadedImageData) {
        enhancedPrompt += ', use uploaded image as reference';
      }

      // Video generation with Veo requires Google Cloud Vertex AI or GenAI SDK
      // For now, return an error indicating video generation needs to be configured
      
      return {
        success: false,
        error: 'Video generation via Veo 3.1 is not yet implemented. Please use Google Cloud Vertex AI or configure Veo API access separately.'
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
      const model = this.genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

      const result = await model.generateContentStream({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1000,
        },
      });

      for await (const chunk of result.stream) {
        const text = chunk.text();
        if (text) {
          yield text;
        }
      }

    } catch (error) {
      console.error('❌ AISDKService: Text streaming failed', error);
      throw new Error(`Text streaming failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate structured data using Google Generative AI
   */
  async generateStructuredData<T>(schema: z.ZodSchema<T>, prompt: string): Promise<T> {
    console.log('📊 AISDKService: Starting structured data generation', {
      prompt: prompt.substring(0, 100) + '...'
    });

    try {
      const model = this.genAI.getGenerativeModel({ 
        model: 'gemini-2.0-flash',
        generationConfig: {
          responseMimeType: 'application/json',
        },
      });

      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1000,
          responseMimeType: 'application/json',
        },
      });

      const responseText = result.response.text();
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
  }): Promise<{ text: string; usage?: any }> {
    try {
      const model = this.genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: options?.temperature ?? 0.7,
          maxOutputTokens: options?.maxTokens ?? 1000,
        },
      });

      return {
        text: result.response.text(),
        usage: result.response.usageMetadata,
      };
    } catch (error) {
      console.error('❌ AISDKService: Text generation failed', error);
      throw new Error(`Text generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Stream chat messages
   */
  async *streamChat(messages: Array<{ role: 'user' | 'assistant'; content: string }>) {
    try {
      const model = this.genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

      // Convert messages to Google AI format (user -> user, assistant -> model)
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
        const result = await model.generateContentStream({
          contents: [...history, { role: 'user', parts: [{ text: currentMessage.content }] }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1000,
          },
        });

        for await (const chunk of result.stream) {
          const text = chunk.text();
          if (text) {
            yield text;
          }
        }
      }
    } catch (error) {
      console.error('❌ AISDKService: Chat streaming failed', error);
      throw new Error(`Chat streaming failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}