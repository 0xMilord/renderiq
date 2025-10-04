/**
 * Prompt Enhancement Service
 * Uses Gemini 2.0 Flash to enhance user prompts for better image generation
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

export interface PromptEnhancementResult {
  enhancedPrompt: string;
  originalPrompt: string;
  enhancementType: 'architectural' | 'general' | 'detailed';
  processingTime: number;
}

export class PromptEnhancementService {
  private static instance: PromptEnhancementService;
  private genAI: GoogleGenerativeAI;

  constructor() {
    const apiKey = process.env.GOOGLE_AI_API_KEY;
    if (!apiKey) {
      throw new Error('GOOGLE_AI_API_KEY is not set');
    }
    this.genAI = new GoogleGenerativeAI(apiKey);
  }

  static getInstance(): PromptEnhancementService {
    if (!PromptEnhancementService.instance) {
      PromptEnhancementService.instance = new PromptEnhancementService();
    }
    return PromptEnhancementService.instance;
  }

  async enhancePrompt(originalPrompt: string): Promise<{ success: boolean; data?: PromptEnhancementResult; error?: string }> {
    console.log('🔍 PromptEnhancementService: Starting prompt enhancement', {
      originalPrompt: originalPrompt.substring(0, 100) + '...'
    });

    try {
      const startTime = Date.now();
      
      // Use Gemini 2.0 Flash (latest model)
      const model = this.genAI.getGenerativeModel({ 
        model: 'gemini-2.0-flash',
        generationConfig: {
          temperature: 0.7,
          topP: 0.8,
          topK: 40,
          maxOutputTokens: 1000,
        }
      });

      const enhancementPrompt = `You are an expert AI prompt engineer specializing in architectural and design image generation. Your task is to enhance the user's prompt to create a more detailed, specific, and visually compelling description that will generate better images.

Guidelines:
1. Keep the core intent and style of the original prompt
2. Add specific architectural details, materials, lighting, and composition elements
3. Include technical specifications when relevant (dimensions, proportions, etc.)
4. Enhance visual descriptions with colors, textures, and atmospheric details
5. Make it 2x more detailed and meaningful while staying true to the original vision
6. Focus on architectural and design elements
7. Keep the enhanced prompt under 200 words

Original prompt: "${originalPrompt}"

Enhanced prompt:`;

      console.log('🔍 PromptEnhancementService: Calling Gemini 2.0 Flash');
      
      const result = await model.generateContent(enhancementPrompt);
      const response = await result.response;
      
      console.log('🔍 PromptEnhancementService: Raw response received', {
        hasResponse: !!response,
        candidates: response.candidates?.length || 0,
        finishReason: response.candidates?.[0]?.finishReason
      });
      
      const enhancedText = response.text().trim();
      
      console.log('🔍 PromptEnhancementService: Extracted text', {
        enhancedText: enhancedText.substring(0, 100) + (enhancedText.length > 100 ? '...' : ''),
        textLength: enhancedText.length
      });

      // If no enhanced text is returned, return the original prompt
      if (!enhancedText || enhancedText.length === 0) {
        console.warn('⚠️ PromptEnhancementService: Empty response received, returning original prompt');
        const processingTime = Date.now() - startTime;
        
        const enhancementResult: PromptEnhancementResult = {
          enhancedPrompt: originalPrompt,
          originalPrompt,
          enhancementType: 'general',
          processingTime
        };

        return {
          success: true,
          data: enhancementResult
        };
      }

      const processingTime = Date.now() - startTime;

      console.log('✅ PromptEnhancementService: Enhancement completed', {
        processingTime: `${processingTime}ms`,
        originalLength: originalPrompt.length,
        enhancedLength: enhancedText.length
      });

      // Determine enhancement type based on content
      let enhancementType: 'architectural' | 'general' | 'detailed' = 'general';
      if (enhancedText.toLowerCase().includes('architectural') || 
          enhancedText.toLowerCase().includes('building') ||
          enhancedText.toLowerCase().includes('structure')) {
        enhancementType = 'architectural';
      } else if (enhancedText.length > originalPrompt.length * 1.5) {
        enhancementType = 'detailed';
      }

      const enhancementResult: PromptEnhancementResult = {
        enhancedPrompt: enhancedText,
        originalPrompt,
        enhancementType,
        processingTime
      };

      return {
        success: true,
        data: enhancementResult
      };

    } catch (error) {
      console.error('❌ PromptEnhancementService: Enhancement failed', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to enhance prompt'
      };
    }
  }
}
