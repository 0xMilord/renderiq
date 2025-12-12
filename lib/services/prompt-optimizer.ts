import { DesignIntent } from './semantic-parsing';
import { ImageAnalysis } from './image-understanding';
import { AISDKService } from './ai-sdk-service';
import { logger } from '@/lib/utils/logger';

/**
 * Enhanced Prompt Optimizer - Stage 3 of Technical Moat Pipeline
 * 
 * Uses DesignIntent and ImageAnalysis to create optimized prompts
 * This is the advanced version that uses all pipeline stages
 * 
 * Cost: ~$0.001 per request (Gemini 2.5 Flash)
 */
export class PromptOptimizer {
  private static aiService = AISDKService.getInstance();

  /**
   * Create optimized final prompt using all inputs
   * Uses cheap Gemini 2.5 Flash model with structured outputs
   */
  static async optimizePrompt(
    userPrompt: string,
    designIntent: DesignIntent,
    referenceAnalysis?: ImageAnalysis,
    styleAnalysis?: { styleCharacteristics: string[]; visualElements: string[] },
    toolContext?: { toolId?: string; toolName?: string; toolSettings?: Record<string, string> },
    pipelineMemory?: {
      styleCodes?: any;
      palette?: string[];
      geometry?: any;
      materials?: string[];
    }
  ): Promise<string> {
    const startTime = Date.now();

    try {
      logger.log('🔍 PromptOptimizer: Optimizing prompt with full context', {
        hasReferenceAnalysis: !!referenceAnalysis,
        hasStyleAnalysis: !!styleAnalysis,
        hasPipelineMemory: !!pipelineMemory
      });

      // Build MINIMAL context - only what's absolutely necessary
      // Too much context causes the optimizer to over-interpret and change user intent
      const contextParts: string[] = [];

      // CRITICAL: Prioritize user's style choice (style > effect)
      // Both 'style' and 'effect' come from unified chat interface, but 'style' is the primary field
      const userStyle = toolContext?.toolSettings?.style || toolContext?.toolSettings?.effect;
      if (userStyle && userStyle !== 'none') {
        contextParts.push(`REQUIRED OUTPUT STYLE: ${userStyle} (USER SELECTED - MUST BE RESPECTED)`);
      }
      
      // Only add environment if specified and not "none"
      if (toolContext?.toolSettings?.environment && toolContext.toolSettings.environment !== 'none') {
        contextParts.push(`Environment: ${toolContext.toolSettings.environment}`);
      }

      // Only add reference image info if it exists (but don't describe contents - image will be sent separately)
      if (referenceAnalysis) {
        contextParts.push(`Note: A reference image is provided - use it as the base, but do not describe its contents in the prompt`);
      }

      // Apply Google's prompt design best practices:
      // - Use XML structure for clarity
      // - Be precise and direct
      // - MINIMAL changes - preserve user intent
      const systemPrompt = `<role>
You are a prompt REFINER, not a prompt REWRITER. Your job is to make MINIMAL improvements to the user's prompt.
</role>

<task>
Refine the user's prompt by ONLY fixing typos and adding the required effect/style if specified. Do NOT rewrite or expand the prompt.
</task>

<user_prompt>
"${userPrompt}"
</user_prompt>

${contextParts.length > 0 ? `<additional_context>
${contextParts.join('\n')}
</additional_context>` : ''}

<instructions>
Your task is to REFINE the user's prompt, NOT rewrite it. Follow these rules STRICTLY:

1. PRESERVE THE EXACT USER INTENT - Do not add, remove, or change the core meaning
2. Only make MINIMAL improvements:
   - Fix obvious typos (e.g., "ARHCIETCTURE" → "ARCHITECTURE")
   - Add missing articles (a, an, the) only if needed for clarity
   - Clarify ambiguous terms ONLY if necessary
3. If Tool Settings specify a REQUIRED OUTPUT STYLE (e.g., "photoreal", "technical-drawing"), ensure the prompt clearly requests that style
4. DO NOT add conflicting style terms - if user selected "photoreal", do NOT add "illustration", "sketch", "drawing", or any other style term
5. If a reference image is provided, mention it exists but DO NOT describe what's in it (the image will be sent separately)
6. Keep the prompt SHORT and DIRECT - do not add unnecessary descriptive words
7. Use the user's exact words whenever possible
8. If the user says "MAKE X OF THIS", keep it as "MAKE X OF THIS" - do not expand into long descriptions

CRITICAL: The optimized prompt should be 90% the same as the original. Only fix typos and add the style if specified. NEVER add conflicting style terms.
</instructions>

<constraints>
- DO NOT add new concepts, elements, or details not in the original prompt
- DO NOT change "MAKE X" to "Generate a detailed X with Y and Z"
- DO NOT expand simple requests into complex descriptions
- DO NOT add architectural jargon unless the user used it
- DO NOT add conflicting style terms (e.g., if user selected "photoreal", do NOT add "illustration", "sketch", "drawing", "diagram", etc.)
- If REQUIRED OUTPUT STYLE is specified, add it at the end: ", in [style] style" (e.g., ", in photoreal style")
- Maximum length: original prompt length + 20% (unless style needs to be added)
- Keep the same tone and directness as the original
</constraints>

<output_format>
Return ONLY the optimized prompt text as a string. No explanations, no meta-commentary, just the prompt.
</output_format>`;

      // Use structured outputs to ensure we get just the prompt
      // Use LOW temperature to preserve user intent and minimize changes
      const response = await this.aiService.generateTextWithStructuredOutput(
        systemPrompt,
        {
          temperature: 0.2, // LOW temperature to preserve user intent - only fix typos, don't rewrite
          maxTokens: 1024, // Increased to prevent truncation (was 500, but responses were being cut off)
          responseMimeType: 'application/json',
          responseJsonSchema: {
            type: 'object',
            properties: {
              optimizedPrompt: {
                type: 'string',
                description: 'The refined prompt - should be nearly identical to the original, only fixing typos and adding effect if specified'
              }
            },
            required: ['optimizedPrompt']
          }
        }
      );

      // Parse JSON with error handling for truncated responses
      let result: any;
      try {
        result = JSON.parse(response.text);
      } catch (parseError) {
        logger.error('⚠️ PromptOptimizer: JSON parse error, attempting to fix', {
          error: parseError,
          responsePreview: response.text.substring(0, 200)
        });
        
        // Try to fix truncated JSON
        let cleanedText = response.text.trim();
        
        // Remove markdown code blocks if present
        cleanedText = cleanedText.replace(/```json\s*/g, '').replace(/```\s*/g, '');
        
        // Try to fix unterminated strings by closing them
        // Find the last unterminated string and close it
        const lastQuoteIndex = cleanedText.lastIndexOf('"');
        const lastNewlineIndex = cleanedText.lastIndexOf('\n');
        
        // If we have an unterminated string (quote without closing), try to fix it
        if (lastQuoteIndex > lastNewlineIndex) {
          // Check if string is unterminated (no closing quote after)
          const afterQuote = cleanedText.substring(lastQuoteIndex + 1);
          if (!afterQuote.includes('"') && !afterQuote.includes('}') && !afterQuote.includes(']')) {
            // Likely unterminated - try to close it
            cleanedText = cleanedText.substring(0, lastQuoteIndex + 1) + '"';
          }
        }
        
        // Try to close incomplete JSON objects/arrays
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
        
        try {
          result = JSON.parse(cleanedText);
        } catch (retryError) {
          logger.error('❌ PromptOptimizer: Failed to parse JSON after cleanup, using fallback');
          // Fallback: just add style if specified, otherwise return original
          const userStyle = toolContext?.toolSettings?.style || toolContext?.toolSettings?.effect;
          if (userStyle && userStyle !== 'none') {
            return `${userPrompt}, in ${userStyle} style`.trim();
          }
          return userPrompt;
        }
      }
      
      let optimizedPrompt = result.optimizedPrompt || userPrompt;
      optimizedPrompt = optimizedPrompt.trim();

      // SAFETY CHECK: If the optimized prompt is too different from the original, use original
      // Calculate similarity: if length increased by more than 50%, it's likely over-expanded
      const lengthIncrease = (optimizedPrompt.length - userPrompt.length) / userPrompt.length;
      if (lengthIncrease > 0.5) {
        logger.warn('⚠️ PromptOptimizer: Optimized prompt too different from original, using original', {
          originalLength: userPrompt.length,
          optimizedLength: optimizedPrompt.length,
          lengthIncrease: `${(lengthIncrease * 100).toFixed(0)}%`
        });
        // Only add style if specified, otherwise return original
        const userStyle = toolContext?.toolSettings?.style || toolContext?.toolSettings?.effect;
        if (userStyle && userStyle !== 'none') {
          return `${userPrompt}, in ${userStyle} style`.trim();
        }
        return userPrompt;
      }

      const processingTime = Date.now() - startTime;
      logger.log('✅ PromptOptimizer: Prompt optimized', {
        originalLength: userPrompt.length,
        optimizedLength: optimizedPrompt.length,
        lengthIncrease: `${(lengthIncrease * 100).toFixed(0)}%`,
        processingTime: `${processingTime}ms`
      });

      return optimizedPrompt;

    } catch (error) {
      logger.error('❌ PromptOptimizer: Failed to optimize prompt', error);
      // Fallback to original prompt
      return userPrompt;
    }
  }
}

