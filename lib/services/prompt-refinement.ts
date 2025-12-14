import { AISDKService } from './ai-sdk-service';
import { logger } from '@/lib/utils/logger';

/**
 * Prompt Refinement Service
 * 
 * This service analyzes system-generated prompts and reference images to create
 * refined prompts that better align with the intended output. It acts as a
 * "thinking" stage before final generation.
 * 
 * Flow:
 * 1. System generates a prompt (from tools, templates, etc.)
 * 2. AI analyzes the prompt + image (if provided)
 * 3. AI "thinks" about what the prompt wants and what the image is
 * 4. AI creates a refined prompt that better bridges the gap
 * 5. Refined prompt is sent to final generation
 * 
 * This is a "detour" or additional stage in the rendering pipeline that
 * improves quality by adding an AI reasoning step before generation.
 */
export class PromptRefinementService {
  private static aiService = AISDKService.getInstance();

  /**
   * Refine a system-generated prompt by analyzing it alongside reference images
   * 
   * This method:
   * 1. Analyzes what the prompt is asking for
   * 2. Analyzes what the reference image contains
   * 3. Identifies gaps, conflicts, or opportunities for improvement
   * 4. Creates a refined prompt that better aligns prompt intent with image content
   * 
   * @param systemPrompt - The system-generated prompt (from tools, templates, etc.)
   * @param referenceImageData - Optional reference image (base64)
   * @param referenceImageType - MIME type of reference image
   * @param styleReferenceData - Optional style reference image (base64)
   * @param styleReferenceType - MIME type of style reference image
   * @param context - Additional context (tool settings, quality, etc.)
   * @returns Refined prompt string
   */
  static async refinePrompt(
    systemPrompt: string,
    referenceImageData?: string,
    referenceImageType?: string,
    styleReferenceData?: string,
    styleReferenceType?: string,
    context?: {
      toolId?: string;
      toolName?: string;
      quality?: 'standard' | 'high' | 'ultra';
      aspectRatio?: string;
      [key: string]: any;
    }
  ): Promise<string> {
    const startTime = Date.now();

    try {
      logger.log('🔍 PromptRefinementService: Starting prompt refinement', {
        hasReferenceImage: !!referenceImageData,
        hasStyleReference: !!styleReferenceData,
        promptLength: systemPrompt.length,
        toolId: context?.toolId
      });

      // Build the refinement prompt
      // This asks the AI to "think" about what the prompt wants vs what the image is
      const refinementPrompt = this.buildRefinementPrompt(
        systemPrompt,
        referenceImageData,
        styleReferenceData,
        context
      );

      // Use vision model to analyze prompt + image(s)
      // If we have images, use multi-image analysis; otherwise use text-only
      let response: { text: string; usage?: any };

      if (referenceImageData || styleReferenceData) {
        // We have images - use vision model with structured outputs
        const images: Array<{ imageData: string; imageType: string }> = [];
        
        if (referenceImageData) {
          images.push({
            imageData: referenceImageData,
            imageType: referenceImageType || 'image/png'
          });
        }
        
        if (styleReferenceData) {
          images.push({
            imageData: styleReferenceData,
            imageType: styleReferenceType || 'image/png'
          });
        }

        response = await this.aiService.generateTextWithMultipleImages(
          refinementPrompt,
          images,
          {
            temperature: 0.7,
            maxTokens: 2000, // More tokens for complex reasoning
            responseMimeType: 'application/json',
            responseJsonSchema: this.getRefinementSchema()
          }
        );
      } else {
        // No images - use text-only analysis
        response = await this.aiService.generateTextWithStructuredOutput(
          refinementPrompt,
          {
            temperature: 0.7,
            maxTokens: 2000,
            responseMimeType: 'application/json',
            responseJsonSchema: this.getRefinementSchema()
          }
        );
      }

      // Parse the structured response
      const result = JSON.parse(response.text);
      const refinedPrompt = result.refinedPrompt || systemPrompt; // Fallback to original

      const processingTime = Date.now() - startTime;
      logger.log('✅ PromptRefinementService: Prompt refined', {
        originalLength: systemPrompt.length,
        refinedLength: refinedPrompt.length,
        processingTime: `${processingTime}ms`,
        improvements: result.improvements?.length || 0,
        conflictsResolved: result.conflictsResolved?.length || 0
      });

      return refinedPrompt;

    } catch (error) {
      logger.error('❌ PromptRefinementService: Failed to refine prompt', error);
      // Fallback to original prompt if refinement fails
      return systemPrompt;
    }
  }

  /**
   * Build the refinement prompt that asks AI to analyze and improve
   */
  private static buildRefinementPrompt(
    systemPrompt: string,
    referenceImageData?: string,
    styleReferenceData?: string,
    context?: {
      toolId?: string;
      toolName?: string;
      quality?: 'standard' | 'high' | 'ultra';
      aspectRatio?: string;
      [key: string]: any;
    }
  ): string {
    const toolContext = context?.toolId 
      ? `\nTool Context: ${context.toolName || context.toolId}`
      : '';
    
    const qualityContext = context?.quality
      ? `\nQuality Requirement: ${context.quality}`
      : '';

    return `<role>
You are an expert architectural prompt engineer specializing in analyzing and refining prompts for AI image generation. Your role is to "think" about what the prompt is asking for and what the reference image(s) contain, then create a refined prompt that better aligns the two.
</role>

<task>
Analyze the system-generated prompt and any reference images, then create a refined prompt that:
1. Preserves the original intent of the system prompt
2. Better aligns with what the reference image(s) actually contain
3. Resolves any conflicts or gaps between prompt intent and image content
4. Enhances clarity and specificity for better generation results
5. Maintains architectural accuracy and realism
</task>

<input>
System-Generated Prompt:
"${systemPrompt}"
${toolContext}${qualityContext}

${referenceImageData ? 'Reference Image: A reference image is provided. Analyze what it contains:\n- Visual elements, composition, perspective\n- Style, materials, lighting\n- Architectural elements and details\n- What the image IS vs what the prompt WANTS' : ''}

${styleReferenceData ? 'Style Reference Image: A style reference image is provided. Analyze its style characteristics:\n- Visual style, aesthetic, mood\n- Color palette, materials, textures\n- Composition patterns, lighting style' : ''}
</input>

<analysis_instructions>
Think critically about:

1. **Prompt Intent Analysis**:
   - What is the system prompt actually asking for?
   - What are the key requirements and constraints?
   - What architectural elements are specified?

2. **Image Content Analysis** (if images provided):
   - What does the reference image actually contain?
   - What visual elements, style, and composition are present?
   - What is the perspective, lighting, and material quality?

3. **Gap Analysis**:
   - What does the prompt want that the image doesn't have?
   - What does the image have that the prompt doesn't mention?
   - Are there conflicts between prompt and image?
   - Are there opportunities to enhance the prompt based on image content?

4. **Refinement Strategy**:
   - How can we bridge the gap between prompt intent and image content?
   - What specific details should be added to make the prompt more accurate?
   - How can we preserve the original intent while better aligning with the image?
   - What architectural details should be emphasized?
</analysis_instructions>

<output>
Return JSON with:
- refinedPrompt: The refined prompt that better aligns prompt intent with image content
- improvements: Array of specific improvements made
- conflictsResolved: Array of conflicts or gaps that were resolved
- reasoning: Brief explanation of the refinement strategy
</output>`;
  }

  /**
   * Get the JSON schema for structured output
   */
  private static getRefinementSchema(): any {
    return {
      type: 'object',
      properties: {
        refinedPrompt: {
          type: 'string',
          description: 'The refined prompt that better aligns prompt intent with image content, preserving original intent while improving clarity and alignment'
        },
        improvements: {
          type: 'array',
          items: { type: 'string' },
          description: 'List of specific improvements made to the prompt'
        },
        conflictsResolved: {
          type: 'array',
          items: { type: 'string' },
          description: 'List of conflicts or gaps that were resolved between prompt and image'
        },
        reasoning: {
          type: 'string',
          description: 'Brief explanation of the refinement strategy and why changes were made'
        }
      },
      required: ['refinedPrompt']
    };
  }

  /**
   * Quick refinement for simple cases (no images, just prompt improvement)
   * This is a lighter-weight version for cases where we just want to improve the prompt
   */
  static async quickRefine(
    systemPrompt: string,
    context?: {
      toolId?: string;
      toolName?: string;
      [key: string]: any;
    }
  ): Promise<string> {
    const startTime = Date.now();

    try {
      logger.log('🔍 PromptRefinementService: Quick refinement', {
        promptLength: systemPrompt.length
      });

      const refinementPrompt = `<role>
You are an expert architectural prompt engineer.
</role>

<task>
Analyze and refine this system-generated prompt to improve clarity, specificity, and architectural accuracy while preserving the original intent.
</task>

<input>
System Prompt: "${systemPrompt}"
${context?.toolId ? `\nTool: ${context.toolName || context.toolId}` : ''}
</input>

<instructions>
Create a refined prompt that:
1. Preserves the original intent exactly
2. Improves clarity and specificity
3. Adds architectural details where helpful
4. Maintains professional quality
5. Is ready for AI image generation
</instructions>

<output>
Return JSON with:
- refinedPrompt: The refined prompt (string)
- improvements: Array of improvements made (string[])
</output>`;

      const response = await this.aiService.generateTextWithStructuredOutput(
        refinementPrompt,
        {
          temperature: 0.7,
          maxTokens: 1500,
          responseMimeType: 'application/json',
          responseJsonSchema: {
            type: 'object',
            properties: {
              refinedPrompt: { type: 'string' },
              improvements: { type: 'array', items: { type: 'string' } }
            },
            required: ['refinedPrompt']
          }
        }
      );

      const result = JSON.parse(response.text);
      const refinedPrompt = result.refinedPrompt || systemPrompt;

      const processingTime = Date.now() - startTime;
      logger.log('✅ PromptRefinementService: Quick refinement complete', {
        processingTime: `${processingTime}ms`
      });

      return refinedPrompt;

    } catch (error) {
      logger.error('❌ PromptRefinementService: Quick refinement failed', error);
      return systemPrompt;
    }
  }
}

