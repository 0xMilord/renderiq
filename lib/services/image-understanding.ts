import { AISDKService } from './ai-sdk-service';
import { logger } from '@/lib/utils/logger';

/**
 * Image Analysis extracted from reference/style images
 * Used in Stage 2 of the technical moat pipeline
 */
export interface ImageAnalysis {
  styleCodes: {
    colorPalette: string[];
    lightingStyle: string;
    materialStyle: string;
    architecturalStyle: string;
  };
  geometry: {
    perspective: 'orthographic' | 'perspective' | 'isometric';
    focalLength: string;
    cameraAngle: string;
  };
  architecturalElements: string[];
  materials: string[];
  lighting: {
    type: string;
    direction: string;
    mood: string;
  };
}

/**
 * Image Understanding Service - Stage 2 of Technical Moat Pipeline
 * 
 * Uses cheap Gemini 2.5 Flash Vision model to analyze images and extract:
 * - Style codes (palette, lighting, materials, architectural style)
 * - Geometry (perspective, focal length, camera angle)
 * - Architectural elements
 * - Materials
 * - Lighting characteristics
 * 
 * Cost: ~$0.001 per image
 */
export class ImageUnderstandingService {
  private static aiService = AISDKService.getInstance();

  /**
   * Analyze reference image to extract style, geometry, materials
   * Uses cheap Gemini 2.5 Flash Vision model with STRUCTURED OUTPUTS
   */
  static async analyzeReferenceImage(
    imageData: string, // Base64
    imageType: string
  ): Promise<ImageAnalysis> {
    const startTime = Date.now();

    try {
      logger.log('🔍 ImageUnderstandingService: Analyzing reference image');

      // Apply Google's prompt design best practices:
      // - Use XML structure for clarity
      // - Be precise and direct
      // - Use structured outputs (already implemented)
      const systemPrompt = `<role>
You are an expert architectural image analyst specializing in visual analysis of architectural renderings and photographs.
</role>

<task>
Analyze the provided architectural image and extract comprehensive visual characteristics.
</task>

<instructions>
Extract the following information from the image:

1. Style codes:
   - Color palette: List 5-8 dominant colors (use descriptive color names like "warm beige", "cool gray", "deep navy")
   - Lighting style: Identify as "natural", "artificial", "mixed", or specific type
   - Material style: Primary material aesthetic (e.g., "concrete", "glass", "wood", "metal", "mixed")
   - Architectural style: Overall style (e.g., "modern", "traditional", "contemporary", "brutalist", "minimalist")

2. Geometry:
   - Perspective type: "orthographic", "perspective", or "isometric"
   - Focal length: "wide", "normal", or "telephoto"
   - Camera angle: "eye-level", "bird's-eye", "worm's-eye", or specific angle description

3. Architectural elements:
   - List all visible architectural elements (e.g., "walls", "windows", "doors", "columns", "beams", "stairs", "roof")

4. Materials:
   - List all materials visible in the image (e.g., "concrete", "glass", "wood", "metal", "stone", "brick")

5. Lighting:
   - Type: "natural", "artificial", or "mixed"
   - Direction: Light source direction (e.g., "from left", "from right", "front", "back", "top", "diffuse")
   - Mood: Lighting mood (e.g., "bright", "moody", "dramatic", "soft", "harsh")
</instructions>

<output_format>
Return a JSON object matching the provided schema with all extracted information.
</output_format>`;

      // Use structured outputs for guaranteed JSON response
      const response = await this.aiService.generateTextWithImage(
        systemPrompt,
        imageData,
        imageType,
        {
          temperature: 0.3,
          maxTokens: 2048, // Increased to prevent truncation (was 1500, but responses were being cut off)
          responseMimeType: 'application/json',
          responseJsonSchema: {
            type: 'object',
            properties: {
              styleCodes: {
                type: 'object',
                properties: {
                  colorPalette: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'Dominant colors in the image (5-8 colors)'
                  },
                  lightingStyle: {
                    type: 'string',
                    description: 'Lighting style (natural, artificial, mixed, etc.)'
                  },
                  materialStyle: {
                    type: 'string',
                    description: 'Material style (concrete, glass, wood, etc.)'
                  },
                  architecturalStyle: {
                    type: 'string',
                    description: 'Architectural style (modern, traditional, contemporary, etc.)'
                  }
                },
                required: ['colorPalette', 'lightingStyle', 'materialStyle', 'architecturalStyle']
              },
              geometry: {
                type: 'object',
                properties: {
                  perspective: {
                    type: 'string',
                    enum: ['orthographic', 'perspective', 'isometric'],
                    description: 'Perspective type'
                  },
                  focalLength: {
                    type: 'string',
                    description: 'Focal length (wide, normal, telephoto)'
                  },
                  cameraAngle: {
                    type: 'string',
                    description: 'Camera angle (eye-level, bird\'s-eye, worm\'s-eye, etc.)'
                  }
                },
                required: ['perspective', 'focalLength', 'cameraAngle']
              },
              architecturalElements: {
                type: 'array',
                items: { type: 'string' },
                description: 'List of visible architectural elements'
              },
              materials: {
                type: 'array',
                items: { type: 'string' },
                description: 'List of materials visible in the image'
              },
              lighting: {
                type: 'object',
                properties: {
                  type: {
                    type: 'string',
                    description: 'Lighting type (natural, artificial, mixed)'
                  },
                  direction: {
                    type: 'string',
                    description: 'Light direction (from left, from right, front, back, etc.)'
                  },
                  mood: {
                    type: 'string',
                    description: 'Lighting mood (bright, moody, dramatic, soft, etc.)'
                  }
                },
                required: ['type', 'direction', 'mood']
              }
            },
            required: ['styleCodes', 'geometry', 'architecturalElements', 'materials', 'lighting']
          }
        }
      );

      // Parse JSON response with error handling
      let analysis: ImageAnalysis;
      try {
        // Try to parse the response
        const parsed = JSON.parse(response.text);
        analysis = parsed as ImageAnalysis;
        
        // Validate required fields exist
        if (!analysis.styleCodes || !analysis.geometry || !analysis.architecturalElements || !analysis.materials || !analysis.lighting) {
          throw new Error('Missing required fields in analysis');
        }
      } catch (parseError) {
        logger.error('⚠️ ImageUnderstandingService: JSON parse error, attempting to fix', {
          error: parseError,
          responsePreview: response.text.substring(0, 200)
        });
        
        // Try to extract JSON from markdown code blocks or fix common issues
        let cleanedText = response.text.trim();
        
        // Remove markdown code blocks if present
        cleanedText = cleanedText.replace(/```json\s*/g, '').replace(/```\s*/g, '');
        
        // Fix unterminated strings (common in truncated responses)
        // Find the last quote and check if string is unterminated
        const lastQuoteIndex = cleanedText.lastIndexOf('"');
        if (lastQuoteIndex > 0) {
          const afterQuote = cleanedText.substring(lastQuoteIndex + 1);
          // If no closing quote, brace, or bracket after, likely unterminated
          if (!afterQuote.match(/["}\]]/)) {
            // Try to find where the string should end (before next comma, brace, or bracket)
            const nextDelimiter = afterQuote.search(/[,}\]]/);
            if (nextDelimiter > 0) {
              // Insert closing quote before delimiter
              cleanedText = cleanedText.substring(0, lastQuoteIndex + 1 + nextDelimiter) + 
                           '"' + cleanedText.substring(lastQuoteIndex + 1 + nextDelimiter);
            } else {
              // Just close the string
              cleanedText = cleanedText.substring(0, lastQuoteIndex + 1) + '"';
            }
          }
        }
        
        // Close incomplete JSON objects/arrays
        const openBraces = (cleanedText.match(/{/g) || []).length;
        const closeBraces = (cleanedText.match(/}/g) || []).length;
        const openBrackets = (cleanedText.match(/\[/g) || []).length;
        const closeBrackets = (cleanedText.match(/\]/g) || []).length;
        
        // Close missing braces/brackets
        if (openBraces > closeBraces) {
          cleanedText += '}'.repeat(openBraces - closeBraces);
        }
        if (openBrackets > closeBrackets) {
          cleanedText += ']'.repeat(openBrackets - closeBrackets);
        }
        
        // Try to fix trailing commas
        cleanedText = cleanedText.replace(/,(\s*[}\]])/g, '$1');
        
        try {
          analysis = JSON.parse(cleanedText) as ImageAnalysis;
          
          // Validate required fields exist
          if (!analysis.styleCodes || !analysis.geometry || !analysis.architecturalElements || !analysis.materials || !analysis.lighting) {
            throw new Error('Missing required fields in analysis');
          }
        } catch (retryError) {
          // If still fails, use fallback
          logger.error('❌ ImageUnderstandingService: Failed to parse JSON after cleanup, using fallback');
          throw parseError; // Will be caught by outer catch
        }
      }

      const processingTime = Date.now() - startTime;
      logger.log('✅ ImageUnderstandingService: Reference image analyzed', {
        style: analysis.styleCodes.architecturalStyle,
        palette: analysis.styleCodes.colorPalette.length,
        elements: analysis.architecturalElements.length,
        materials: analysis.materials.length,
        processingTime: `${processingTime}ms`
      });

      return analysis;

    } catch (error) {
      logger.error('❌ ImageUnderstandingService: Failed to analyze reference image', error);
      
      // Fallback to basic analysis
      return {
        styleCodes: {
          colorPalette: [],
          lightingStyle: 'natural',
          materialStyle: 'unknown',
          architecturalStyle: 'modern'
        },
        geometry: {
          perspective: 'perspective',
          focalLength: 'normal',
          cameraAngle: 'eye-level'
        },
        architecturalElements: [],
        materials: [],
        lighting: {
          type: 'natural',
          direction: 'front',
          mood: 'bright'
        }
      };
    }
  }

  /**
   * Analyze style reference image
   * Extracts style characteristics and visual elements
   */
  static async analyzeStyleReference(
    imageData: string,
    imageType: string
  ): Promise<{ styleCharacteristics: string[]; visualElements: string[] }> {
    const startTime = Date.now();

    try {
      logger.log('🔍 ImageUnderstandingService: Analyzing style reference image');

      // Apply Google's prompt design best practices
      const systemPrompt = `<role>
You are an expert visual style analyst specializing in architectural and design aesthetics.
</role>

<task>
Analyze the provided style reference image and extract style characteristics and visual elements.
</task>

<instructions>
Extract the following information:

1. Style characteristics: List 5-10 characteristics that make this style unique (e.g., "minimalist lines", "warm color tones", "organic shapes", "geometric patterns")

2. Visual elements: List 5-10 visual elements, patterns, textures, compositions, or visual motifs present in the image (e.g., "repeating grid pattern", "rough concrete texture", "asymmetric composition", "golden ratio layout")
</instructions>

<output_format>
Return a JSON object with "styleCharacteristics" and "visualElements" arrays matching the provided schema.
</output_format>`;

      const response = await this.aiService.generateTextWithImage(
        systemPrompt,
        imageData,
        imageType,
        {
          temperature: 0.3,
          maxTokens: 1000,
          responseMimeType: 'application/json',
          responseJsonSchema: {
            type: 'object',
            properties: {
              styleCharacteristics: {
                type: 'array',
                items: { type: 'string' },
                description: 'What makes this style unique (5-10 characteristics)'
              },
              visualElements: {
                type: 'array',
                items: { type: 'string' },
                description: 'Visual elements, patterns, textures, compositions (5-10 elements)'
              }
            },
            required: ['styleCharacteristics', 'visualElements']
          }
        }
      );

      const result = JSON.parse(response.text);

      const processingTime = Date.now() - startTime;
      logger.log('✅ ImageUnderstandingService: Style reference analyzed', {
        characteristics: result.styleCharacteristics.length,
        visualElements: result.visualElements.length,
        processingTime: `${processingTime}ms`
      });

      return result;

    } catch (error) {
      logger.error('❌ ImageUnderstandingService: Failed to analyze style reference', error);
      
      // Fallback
      return {
        styleCharacteristics: [],
        visualElements: []
      };
    }
  }
}

