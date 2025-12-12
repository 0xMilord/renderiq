import { AISDKService } from './ai-sdk-service';
import { logger } from '@/lib/utils/logger';

/**
 * Design Intent extracted from user prompt
 * Used in Stage 1 of the technical moat pipeline
 */
export interface DesignIntent {
  userIntent: string;
  structuralInference: string[];
  materialSpecs: string[];
  aecRequirements: {
    perspective?: 'orthographic' | 'perspective' | 'isometric';
    lighting?: string;
    materials?: string[];
    scale?: string;
  };
  complexity: 'simple' | 'medium' | 'complex';
}

/**
 * Semantic Parsing Service - Stage 1 of Technical Moat Pipeline
 * 
 * Uses cheap Gemini 2.5 Flash model with STRUCTURED OUTPUTS to extract:
 * - User's design intent
 * - Structural inference (architectural elements)
 * - Material specifications
 * - AEC-specific requirements
 * - Task complexity
 * 
 * Cost: ~$0.001 per request
 */
export class SemanticParsingService {
  private static aiService = AISDKService.getInstance();

  /**
   * Parse user prompt to extract design intent and AEC requirements
   * Uses cheap Gemini 2.5 Flash model with STRUCTURED OUTPUTS
   * This guarantees type-safe, parseable JSON responses
   */
  static async parseDesignIntent(
    prompt: string,
    toolContext?: { toolId?: string; toolName?: string; toolSettings?: Record<string, string> }
  ): Promise<DesignIntent> {
    const startTime = Date.now();

    try {
      logger.log('🔍 SemanticParsingService: Parsing design intent', {
        promptLength: prompt.length,
        hasToolContext: !!toolContext
      });

      // Apply Google's prompt design best practices:
      // - Use XML structure for clarity
      // - Be precise and direct
      // - Define parameters explicitly
      // - Use structured outputs (already implemented)
      const systemPrompt = `<role>
You are an expert architectural AI assistant specializing in design intent extraction and AEC requirements analysis.
</role>

<task>
Analyze the user's prompt and extract structured design intent information.
</task>

<context>
User Prompt: "${prompt}"
${toolContext ? `Tool Context: ${toolContext.toolName || toolContext.toolId || 'unknown'}` : ''}
${toolContext?.toolSettings && Object.keys(toolContext.toolSettings).length > 0 ? `Tool Settings: ${JSON.stringify(toolContext.toolSettings)}` : ''}
${toolContext?.toolSettings?.style || toolContext?.toolSettings?.effect ? `IMPORTANT: User selected output style: ${toolContext.toolSettings.style || toolContext.toolSettings.effect}. This must be respected in the design intent extraction.` : ''}
</context>

<instructions>
Extract the following information:
1. User's design intent: What the user wants to create (concise summary)
   - If user selected a style (e.g., "photoreal"), ensure the intent reflects that style
   - DO NOT add conflicting style terms (e.g., if user selected "photoreal", do NOT add "illustration", "sketch", "drawing")
2. Structural inference: List all architectural elements mentioned (walls, windows, doors, columns, beams, etc.)
3. Material specifications: List all materials, textures, and finishes specified
4. AEC-specific requirements:
   - Perspective type: orthographic, perspective, or isometric
   - Lighting: Natural, artificial, mixed, or specific requirements
   - Materials: Array of materials if specified
   - Scale: Human scale, building scale, or specific scale requirements
5. Task complexity: Assess as "simple", "medium", or "complex" based on:
   - Simple: Basic render, single view, standard materials
   - Medium: Multiple elements, specific style requirements, moderate detail
   - Complex: Technical drawings, CAD, multiple perspectives, advanced materials, precision requirements
   - NOTE: If user selected a specific style, respect that style in complexity assessment
</instructions>

<output_format>
Return a JSON object with the extracted information matching the provided schema.
</output_format>`;

      // Use structured outputs for guaranteed JSON schema compliance
      // Enable Google Search Grounding for architectural knowledge (e.g., building types, materials, styles)
      // This helps with factual accuracy when parsing architectural prompts
      const response = await this.aiService.generateTextWithStructuredOutput(
        systemPrompt,
        {
          model: 'gemini-2.5-flash', // Explicitly use Flash for grounding support
          responseMimeType: 'application/json',
          responseJsonSchema: {
            type: 'object',
            properties: {
              userIntent: {
                type: 'string',
                description: 'The user\'s primary design intent'
              },
              structuralInference: {
                type: 'array',
                items: { type: 'string' },
                description: 'Architectural elements mentioned in the prompt'
              },
              materialSpecs: {
                type: 'array',
                items: { type: 'string' },
                description: 'Materials, textures, and finishes specified'
              },
              aecRequirements: {
                type: 'object',
                properties: {
                  perspective: {
                    type: 'string',
                    enum: ['orthographic', 'perspective', 'isometric'],
                    description: 'Required perspective type'
                  },
                  lighting: {
                    type: 'string',
                    description: 'Lighting requirements'
                  },
                  materials: {
                    type: 'array',
                    items: { type: 'string' }
                  },
                  scale: {
                    type: 'string',
                    description: 'Scale requirements'
                  }
                }
              },
              complexity: {
                type: 'string',
                enum: ['simple', 'medium', 'complex'],
                description: 'Task complexity level'
              }
            },
            required: ['userIntent', 'structuralInference', 'materialSpecs', 'aecRequirements', 'complexity']
          },
          temperature: 0.3 // Low temperature for consistent parsing
        }
      );

      const designIntent = JSON.parse(response.text) as DesignIntent;

      const processingTime = Date.now() - startTime;
      logger.log('✅ SemanticParsingService: Design intent parsed', {
        complexity: designIntent.complexity,
        structuralElements: designIntent.structuralInference.length,
        materials: designIntent.materialSpecs.length,
        processingTime: `${processingTime}ms`
      });

      return designIntent;

    } catch (error) {
      logger.error('❌ SemanticParsingService: Failed to parse design intent', error);
      
      // Fallback to simple parsing
      return {
        userIntent: prompt,
        structuralInference: [],
        materialSpecs: [],
        aecRequirements: {},
        complexity: 'medium' // Default to medium complexity
      };
    }
  }
}

