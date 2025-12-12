import { AISDKService } from './ai-sdk-service';
import { logger } from '@/lib/utils/logger';

/**
 * Video Design Intent extracted from user prompt
 * Used in Stage 1 of video generation pipeline
 */
export interface VideoDesignIntent {
  subject: string;
  action: string;
  style: string;
  cameraMotion?: string;
  composition?: string;
  audioCues?: {
    dialogue?: string[];
    soundEffects?: string[];
    ambientNoise?: string[];
  };
  complexity: 'simple' | 'medium' | 'complex';
}

/**
 * Video Prompt Optimizer - Stage 3 of Video Generation Pipeline
 * 
 * Uses cheap Gemini 2.5 Flash model with structured outputs to optimize video prompts
 * Incorporates reference images, camera motion, audio cues, and AEC constraints
 * 
 * Cost: ~$0.001 per request
 */
export class VideoPromptOptimizer {
  private static aiService = AISDKService.getInstance();

  /**
   * Optimize video prompt using structured outputs
   * Uses cheap Gemini 2.5 Flash model
   */
  static async optimizeVideoPrompt(
    userPrompt: string,
    referenceImages?: Array<{ imageData: string; imageType: string }>,
    previousVideoAnalysis?: any
  ): Promise<{ optimizedPrompt: string; designIntent: VideoDesignIntent }> {
    const startTime = Date.now();

    try {
      logger.log('🔍 VideoPromptOptimizer: Optimizing video prompt', {
        promptLength: userPrompt.length,
        referenceImageCount: referenceImages?.length || 0,
        hasPreviousVideo: !!previousVideoAnalysis
      });

      // Apply Google's prompt design best practices:
      // - Use XML structure for clarity
      // - Be precise and direct
      // - Use structured outputs (already implemented)
      const visionPrompt = `<role>
You are an expert video prompt engineer specializing in architectural and cinematic video generation for Veo 3.1.
</role>

<task>
Analyze the user's prompt and any reference images, then create an optimized prompt for Veo 3.1 video generation.
</task>

<input>
User's Prompt: "${userPrompt}"

${referenceImages && referenceImages.length > 0 ? `Reference Images: ${referenceImages.length} reference image(s) provided. Analyze them and extract: subject, style, composition, visual elements to preserve.` : ''}
${previousVideoAnalysis ? `Previous Video Context: ${JSON.stringify(previousVideoAnalysis)}` : ''}
</input>

<instructions>
Create an optimized video prompt that:
1. Preserves the user's original intent exactly
2. Includes specific camera motion descriptions:
   - Types: dolly shot, tracking shot, pan, zoom, crane, static, handheld
   - Speed: slow, medium, fast
   - Direction: left, right, forward, backward, up, down
3. Specifies shot composition:
   - Type: wide shot, close-up, medium shot, establishing shot, extreme close-up
   - Framing: rule of thirds, centered, asymmetric
4. Includes audio cues if mentioned:
   - Dialogue: in quotes with speaker context
   - Sound effects: specific sounds (footsteps, door closing, etc.)
   - Ambient noise: background sounds (wind, traffic, etc.)
5. Incorporates style, materials, and geometry from reference images (if provided)
6. Ensures architectural and cinematic accuracy
7. Is detailed and specific for Veo 3.1's capabilities
8. Describes temporal progression (how the scene changes over time)
</instructions>

<constraints>
- Veo 3.1 supports up to 8 seconds of video
- Camera motion should be smooth and cinematic
- Audio cues must be clearly specified
- Maintain consistency with reference images if provided
</constraints>

<output_format>
Return JSON with:
- optimizedPrompt: The optimized video generation prompt (string)
- designIntent: Object containing subject, action, style, cameraMotion, composition, audioCues, complexity
</output_format>`;

      // Google best practice: Place images BEFORE text prompt for better model understanding
      const contents: any[] = [];
      
      // Add reference images first if provided
      if (referenceImages && referenceImages.length > 0) {
        for (const img of referenceImages.slice(0, 3)) { // Veo supports up to 3
          contents.push({
            inlineData: {
              mimeType: img.imageType || 'image/png',
              data: img.imageData
            }
          });
        }
      }
      
      // Add text prompt AFTER all images (Google best practice)
      contents.push({ text: visionPrompt });

      // Use structured outputs for guaranteed JSON response
      const response = await this.aiService.generateTextWithMultipleImages(
        visionPrompt,
        referenceImages?.slice(0, 3) || [],
        {
          temperature: 0.7,
          maxTokens: 2000,
          responseMimeType: 'application/json',
          responseJsonSchema: {
            type: 'object',
            properties: {
              optimizedPrompt: {
                type: 'string',
                description: 'The optimized video generation prompt for Veo 3.1'
              },
              designIntent: {
                type: 'object',
                properties: {
                  subject: {
                    type: 'string',
                    description: 'Main subject of the video'
                  },
                  action: {
                    type: 'string',
                    description: 'Action or movement in the video'
                  },
                  style: {
                    type: 'string',
                    description: 'Visual style of the video'
                  },
                  cameraMotion: {
                    type: 'string',
                    description: 'Camera movement type (dolly, tracking, pan, zoom, etc.)'
                  },
                  composition: {
                    type: 'string',
                    description: 'Shot composition (wide, close-up, medium, etc.)'
                  },
                  audioCues: {
                    type: 'object',
                    properties: {
                      dialogue: {
                        type: 'array',
                        items: { type: 'string' },
                        description: 'Dialogue lines (in quotes)'
                      },
                      soundEffects: {
                        type: 'array',
                        items: { type: 'string' },
                        description: 'Sound effects'
                      },
                      ambientNoise: {
                        type: 'array',
                        items: { type: 'string' },
                        description: 'Ambient noise/soundscape'
                      }
                    }
                  },
                  complexity: {
                    type: 'string',
                    enum: ['simple', 'medium', 'complex'],
                    description: 'Video complexity level'
                  }
                },
                required: ['subject', 'action', 'style', 'complexity']
              }
            },
            required: ['optimizedPrompt', 'designIntent']
          }
        }
      );

      const result = JSON.parse(response.text);

      const processingTime = Date.now() - startTime;
      logger.log('✅ VideoPromptOptimizer: Prompt optimized', {
        originalLength: userPrompt.length,
        optimizedLength: result.optimizedPrompt.length,
        complexity: result.designIntent.complexity,
        hasCameraMotion: !!result.designIntent.cameraMotion,
        processingTime: `${processingTime}ms`
      });

      return {
        optimizedPrompt: result.optimizedPrompt,
        designIntent: result.designIntent
      };

    } catch (error) {
      logger.error('❌ VideoPromptOptimizer: Failed to optimize prompt', error);
      
      // Fallback to original prompt
      return {
        optimizedPrompt: userPrompt,
        designIntent: {
          subject: 'architectural space',
          action: 'walkthrough',
          style: 'cinematic',
          complexity: 'medium'
        }
      };
    }
  }
}

