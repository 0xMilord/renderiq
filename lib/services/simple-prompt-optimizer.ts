import { AISDKService } from './ai-sdk-service';
import { logger } from '@/lib/utils/logger';

/**
 * Simple Prompt Optimizer - Uses vision models to optimize prompts before generation
 * This is the EASIEST solution from the technical moat implementation plan
 * 
 * Uses Gemini 2.5 Flash (cheap vision model) with structured outputs to:
 * - Analyze reference images
 * - Analyze style reference images
 * - Generate optimized prompts for better image generation
 */
export class SimplePromptOptimizer {
  private static aiService = AISDKService.getInstance();

  /**
   * Optimize prompt using vision model analysis
   * Uses STRUCTURED OUTPUTS for guaranteed JSON response
   * 
   * @param userPrompt - Original user prompt
   * @param referenceImageData - Optional reference image (base64)
   * @param referenceImageType - MIME type of reference image
   * @param styleReferenceData - Optional style reference image (base64)
   * @param styleReferenceType - MIME type of style reference image
   * @returns Optimized prompt string
   */
  static async optimizePrompt(
    userPrompt: string,
    referenceImageData?: string,
    referenceImageType?: string,
    styleReferenceData?: string,
    styleReferenceType?: string
  ): Promise<string> {
    const startTime = Date.now();
    
    try {
      logger.log('🔍 SimplePromptOptimizer: Starting prompt optimization', {
        hasReferenceImage: !!referenceImageData,
        hasStyleReference: !!styleReferenceData,
        promptLength: userPrompt.length
      });

      // Apply Google's prompt design best practices:
      // - Use XML structure for clarity
      // - Use prefixes for input/output
      // - Be precise and direct
      const visionPrompt = `<role>
You are an expert architectural prompt engineer specializing in creating optimized prompts for AI image generation.
</role>

<task>
Analyze the user's prompt and any reference images, then create an optimized prompt for architectural image generation.
</task>

<input>
User's Prompt: "${userPrompt}"

${referenceImageData ? 'Reference Image: A reference image is provided. Analyze it and extract: style, palette, geometry, materials, lighting, architectural elements.' : ''}
${styleReferenceData ? 'Style Reference Image: A style reference image is provided. Analyze it and extract: style characteristics, visual elements, composition patterns.' : ''}
</input>

<instructions>
Create an optimized prompt that:
1. Preserves the user's original intent exactly
2. Incorporates style, materials, and geometry from reference images (if provided)
3. Ensures architectural accuracy and realism
4. Is detailed and specific for better image generation quality
5. Maintains visual consistency with reference images when provided
</instructions>

<output>
Return JSON with:
- optimizedPrompt: The optimized prompt text (string)
- extractedElements: Object containing extracted style, palette, geometry, materials, lighting (if images provided)
</output>`;

      // Use structured outputs for guaranteed JSON response
      const response = await this.aiService.generateTextWithImage(
        visionPrompt,
        referenceImageData || styleReferenceData ? (referenceImageData || styleReferenceData) : undefined,
        referenceImageData ? (referenceImageType || 'image/png') : (styleReferenceData ? (styleReferenceType || 'image/png') : undefined),
        {
          temperature: 0.7,
          maxTokens: 1000,
          responseMimeType: 'application/json',
          responseJsonSchema: {
            type: 'object',
            properties: {
              optimizedPrompt: {
                type: 'string',
                description: 'The optimized architectural image generation prompt'
              },
              extractedElements: {
                type: 'object',
                properties: {
                  style: { type: 'string', description: 'Architectural style detected' },
                  palette: { 
                    type: 'array', 
                    items: { type: 'string' },
                    description: 'Color palette extracted from images'
                  },
                  geometry: { type: 'string', description: 'Geometric perspective and composition' },
                  materials: { 
                    type: 'array', 
                    items: { type: 'string' },
                    description: 'Materials detected in images'
                  },
                  lighting: { type: 'string', description: 'Lighting characteristics' }
                }
              }
            },
            required: ['optimizedPrompt']
          }
        }
      );

      const result = JSON.parse(response.text);
      const optimizedPrompt = result.optimizedPrompt || userPrompt; // Fallback to original if parsing fails

      const processingTime = Date.now() - startTime;
      logger.log('✅ SimplePromptOptimizer: Prompt optimized', {
        originalLength: userPrompt.length,
        optimizedLength: optimizedPrompt.length,
        processingTime: `${processingTime}ms`,
        extractedElements: result.extractedElements ? Object.keys(result.extractedElements).length : 0
      });

      return optimizedPrompt;

    } catch (error) {
      logger.error('❌ SimplePromptOptimizer: Failed to optimize prompt', error);
      // Fallback to original prompt if optimization fails
      return userPrompt;
    }
  }

  /**
   * Optimize prompt with multiple reference images (for video generation)
   * Enhanced to handle up to 3 images (Veo 3.1 limit)
   */
  static async optimizePromptWithMultipleImages(
    userPrompt: string,
    referenceImages?: Array<{ imageData: string; imageType: string }>
  ): Promise<string> {
    if (!referenceImages || referenceImages.length === 0) {
      return userPrompt;
    }

    const startTime = Date.now();
    
    try {
      logger.log('🔍 SimplePromptOptimizer: Optimizing prompt with multiple images', {
        imageCount: referenceImages.length,
        promptLength: userPrompt.length
      });

      // Apply Google's prompt design best practices:
      // - Use XML structure for clarity
      // - Use prefixes for input/output
      // - Be precise and direct
      const visionPrompt = `<role>
You are an expert architectural prompt engineer specializing in multi-image analysis and prompt optimization.
</role>

<task>
Analyze the user's prompt and multiple reference images, then create an optimized prompt for architectural video/image generation.
</task>

<input>
User's Prompt: "${userPrompt}"

Reference Images: ${referenceImages.length} reference image(s) are provided. Analyze them and extract:
- Style, palette, geometry, materials, lighting from each image
- Common elements across images (for consistency)
- Unique elements in each image (to preserve)
- Overall composition and visual flow
</input>

<instructions>
Create an optimized prompt that:
1. Preserves the user's original intent exactly
2. Incorporates style, materials, and geometry from all reference images
3. Ensures architectural accuracy and realism
4. Maintains visual consistency across multiple reference images
5. Is detailed and specific for better generation quality
6. Preserves unique elements from each image when relevant
</instructions>

<output>
Return JSON with:
- optimizedPrompt: The optimized generation prompt (string)
- extractedElements: Object containing commonStyle, commonPalette, uniqueElements, composition
</output>`;

      // Google best practice: Place images BEFORE text prompt for better model understanding
      // Build contents array with images first, then prompt
      const contents: any[] = [];
      
      // Add all reference images first (up to 3 for Veo, but we can handle more for analysis)
      for (const img of referenceImages.slice(0, 3)) {
        contents.push({
          inlineData: {
            mimeType: img.imageType || 'image/png',
            data: img.imageData
          }
        });
      }
      
      // Add text prompt AFTER all images (Google best practice)
      contents.push({ text: visionPrompt });

      // Use the new method for multiple images
      const multiImageResponse = await this.aiService.generateTextWithMultipleImages(
        visionPrompt,
        referenceImages.slice(0, 3), // Limit to 3 for Veo compatibility
        {
          temperature: 0.7,
          maxTokens: 1500,
          responseMimeType: 'application/json',
          responseJsonSchema: {
            type: 'object',
            properties: {
              optimizedPrompt: {
                type: 'string',
                description: 'The optimized architectural generation prompt'
              },
              extractedElements: {
                type: 'object',
                properties: {
                  commonStyle: { type: 'string' },
                  commonPalette: { type: 'array', items: { type: 'string' } },
                  uniqueElements: { type: 'array', items: { type: 'string' } },
                  composition: { type: 'string' }
                }
              }
            },
            required: ['optimizedPrompt']
          }
        }
      );

      const result = JSON.parse(multiImageResponse.text);
      const optimizedPrompt = result.optimizedPrompt || userPrompt;

      const processingTime = Date.now() - startTime;
      logger.log('✅ SimplePromptOptimizer: Prompt optimized with multiple images', {
        originalLength: userPrompt.length,
        optimizedLength: optimizedPrompt.length,
        processingTime: `${processingTime}ms`,
        imageCount: referenceImages.length
      });

      return optimizedPrompt;

    } catch (error) {
      logger.error('❌ SimplePromptOptimizer: Failed to optimize prompt with multiple images', error);
      // Fallback to original prompt if optimization fails
      return userPrompt;
    }
  }
}

