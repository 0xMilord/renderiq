import { AISDKService } from './ai-sdk-service';
import { DesignIntent } from './semantic-parsing';
import { ImageAnalysis } from './image-understanding';
import { logger } from '@/lib/utils/logger';

/**
 * Validation Result from image validation
 * Used in Stage 6 of the technical moat pipeline
 */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  corrections?: string[];
}

/**
 * Image Validator Service - Stage 6 of Technical Moat Pipeline
 * 
 * Uses cheap Gemini 2.5 Flash Vision model to validate generated images:
 * - Perspective grid consistency
 * - Proportions (realistic?)
 * - Architectural elements (correct?)
 * - Materials (realistic?)
 * - Lighting (consistent?)
 * 
 * Cost: ~$0.001 per image
 */
export class ImageValidator {
  private static aiService = AISDKService.getInstance();

  /**
   * Validate generated image using cheap vision model
   * Uses structured outputs for guaranteed JSON response
   */
  static async validateImage(
    imageData: string,
    imageType: string,
    designIntent?: DesignIntent,
    referenceAnalysis?: ImageAnalysis
  ): Promise<ValidationResult> {
    const startTime = Date.now();

    try {
      logger.log('🔍 ImageValidator: Validating generated image');

      // Apply Google's prompt design best practices:
      // - Use XML structure for clarity
      // - Be precise and direct
      // - Use structured outputs (already implemented)
      const systemPrompt = `<role>
You are an expert architectural image validator specializing in quality control for AI-generated architectural renderings.
</role>

<task>
Analyze the provided generated architectural image and validate it against architectural standards and design requirements.
</task>

<context>
${designIntent ? `Design Intent: ${designIntent.userIntent}` : ''}
${referenceAnalysis ? `Reference Requirements: Style=${referenceAnalysis.styleCodes.architecturalStyle}, Perspective=${referenceAnalysis.geometry.perspective}` : ''}
</context>

<validation_criteria>
Validate the following aspects:

1. Perspective grid:
   - Are parallel lines actually parallel?
   - Is the perspective consistent throughout the image?
   - Do vanishing points align correctly?

2. Proportions:
   - Are elements scaled realistically?
   - Do human-scale elements (doors, windows) have correct dimensions?
   - Are building elements proportional to each other?

3. Architectural elements:
   - Are walls, windows, doors correctly formed?
   - Do structural elements make architectural sense?
   - Are there any impossible geometries?

4. Materials:
   - Do materials look realistic?
   - Are textures consistent and appropriate?
   - Do material properties match the design intent?

5. Lighting:
   - Is lighting consistent throughout the scene?
   - Are shadows cast correctly?
   - Does lighting match the time of day/artificial sources?
</validation_criteria>

<instructions>
For each validation criterion, determine if it passes or fails. If it fails, provide specific error descriptions and actionable correction suggestions.
</instructions>

<output_format>
Return JSON with:
- valid: boolean (true if all critical criteria pass)
- errors: array of error descriptions (empty if valid)
- warnings: array of non-critical issues
- corrections: array of specific correction suggestions (if errors found)
</output_format>`;

      const response = await this.aiService.generateTextWithImage(
        systemPrompt,
        imageData,
        imageType,
        {
          temperature: 0.2, // Low temperature for consistent validation
          maxTokens: 1000,
          responseMimeType: 'application/json',
          responseJsonSchema: {
            type: 'object',
            properties: {
              valid: {
                type: 'boolean',
                description: 'Whether the image passes validation'
              },
              errors: {
                type: 'array',
                items: { type: 'string' },
                description: 'List of errors found (empty if valid)'
              },
              warnings: {
                type: 'array',
                items: { type: 'string' },
                description: 'List of warnings (non-critical issues)'
              },
              corrections: {
                type: 'array',
                items: { type: 'string' },
                description: 'Suggested corrections if errors found'
              }
            },
            required: ['valid', 'errors', 'warnings']
          }
        }
      );

      const result = JSON.parse(response.text) as ValidationResult;

      const processingTime = Date.now() - startTime;
      logger.log('✅ ImageValidator: Validation complete', {
        valid: result.valid,
        errors: result.errors.length,
        warnings: result.warnings.length,
        processingTime: `${processingTime}ms`
      });

      return result;

    } catch (error) {
      logger.error('❌ ImageValidator: Failed to validate image', error);
      
      // Fallback: assume valid if validation fails (don't block generation)
      return {
        valid: true,
        errors: [],
        warnings: ['Validation service unavailable']
      };
    }
  }

  /**
   * Quick validation (faster, less detailed)
   * Use for simple tasks or when speed is more important
   */
  static async quickValidate(
    imageData: string,
    imageType: string
  ): Promise<{ valid: boolean; hasErrors: boolean }> {
    try {
      const result = await this.validateImage(imageData, imageType);
      return {
        valid: result.valid,
        hasErrors: result.errors.length > 0
      };
    } catch (error) {
      logger.error('❌ ImageValidator: Quick validation failed', error);
      return { valid: true, hasErrors: false }; // Fail open
    }
  }
}

