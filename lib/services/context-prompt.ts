import { RendersDAL } from '@/lib/dal/renders';
import { Render } from '@/lib/db/schema';
import { ChainContext, EnhancedPrompt, PromptFeedback } from '@/lib/types/render-chain';
import { logger } from '@/lib/utils/logger';

export class ContextPromptService {
  /**
   * Build enhanced prompt with context awareness - MINIMAL and SMART
   */
  static async buildContextAwarePrompt(
    userPrompt: string,
    referenceRender?: Render,
    chainContext?: ChainContext,
    _style?: string,
    _imageType?: string
  ): Promise<EnhancedPrompt> {
    // Detect conversation patterns
    const isIteration = this.isIterationRequest(userPrompt);
    const isReferenceRequest = userPrompt.includes('@') || userPrompt.includes('version');
    const isNewImage = !referenceRender && !chainContext;
    
    logger.log('🧠 ContextPrompt: Analyzing prompt:', {
      isIteration,
      isReferenceRequest,
      isNewImage,
      hasReferenceRender: !!referenceRender,
      hasChainContext: !!chainContext
    });

    // MINIMAL context - only add what's absolutely necessary
    const contextElements: string[] = [];
    const styleModifiers: string[] = [];

    // Only add reference context if user explicitly mentions it or it's a new image
    if ((isReferenceRequest || isNewImage) && referenceRender?.contextData?.successfulElements) {
      // Extract only the most relevant elements (max 3)
      const keyElements = referenceRender.contextData.successfulElements.slice(0, 3);
      contextElements.push(`Keep: ${keyElements.join(', ')}`);
    }

    // Only add chain context for new images or explicit chain references
    if ((isNewImage || userPrompt.includes('chain')) && chainContext?.successfulElements) {
      const keyElements = chainContext.successfulElements.slice(0, 2);
      contextElements.push(`Chain elements: ${keyElements.join(', ')}`);
    }

    // NEVER add style/type modifiers - they're handled elsewhere and cause conflicts
    // The user's prompt and UI selections should be sufficient

    // Build clean enhanced prompt following best practices
    // Start with user's prompt - it's the primary instruction
    let enhancedPrompt = userPrompt.trim();

    // Only add minimal context if explicitly needed
    // Keep it concise and avoid redundancy
    if (contextElements.length > 0 && (isReferenceRequest || isNewImage)) {
      // Use clear, structured format
      const contextText = contextElements.join('. ');
      enhancedPrompt = `${userPrompt}. ${contextText}`;
    }

    logger.log('🧠 ContextPrompt: Enhanced prompt created:', {
      originalLength: userPrompt.length,
      enhancedLength: enhancedPrompt.length,
      contextElementsCount: contextElements.length,
      styleModifiersCount: styleModifiers.length
    });

    return {
      originalPrompt: userPrompt,
      enhancedPrompt,
      contextElements,
      styleModifiers,
    };
  }

  /**
   * Simple detection of iteration requests - less strict
   */
  private static isIterationRequest(prompt: string): boolean {
    // Only detect obvious iteration keywords, let user intent guide
    const iterationKeywords = ['ADD', 'REMOVE', 'CHANGE', 'MODIFY'];
    const upperPrompt = prompt.toUpperCase();
    return iterationKeywords.some(keyword => upperPrompt.startsWith(keyword) || upperPrompt.includes(` ${keyword} `));
  }

  /**
   * Extract successful elements from renders in a chain
   */
  static async extractSuccessfulElements(chainId: string): Promise<string[]> {
    const renders = await RendersDAL.getByChainId(chainId);
    const successfulElements: string[] = [];

    // Get completed renders only
    const completedRenders = renders.filter(r => r.status === 'completed');

    for (const render of completedRenders) {
      if (render.contextData?.successfulElements) {
        successfulElements.push(...render.contextData.successfulElements);
      }
    }

    // Remove duplicates and return
    return [...new Set(successfulElements)];
  }

  /**
   * Build chain evolution context string
   */
  static async buildChainContext(chainId: string): Promise<string> {
    const renders = await RendersDAL.getByChainId(chainId);
    
    if (renders.length === 0) {
      return '';
    }

    const completedRenders = renders
      .filter(r => r.status === 'completed')
      .sort((a, b) => (a.chainPosition || 0) - (b.chainPosition || 0));

    if (completedRenders.length === 0) {
      return '';
    }

    const evolution = completedRenders.map((render, index) => {
      const position = index + 1;
      const prompt = render.prompt.slice(0, 50); // Truncate for brevity
      return `v${position}: ${prompt}`;
    });

    return `Evolution: ${evolution.join(' → ')}`;
  }

  /**
   * Update prompt preferences based on user feedback
   */
  static async updatePromptPreferences(
    userId: string,
    feedback: PromptFeedback
  ): Promise<void> {
    logger.log('📝 Updating prompt preferences for user:', userId);
    
    const render = await RendersDAL.getById(feedback.renderId);
    
    if (!render) {
      throw new Error('Render not found');
    }

    // Update render context with feedback
    const updatedContext = {
      ...render.contextData,
      successfulElements: feedback.successfulElements,
      userFeedback: `Rating: ${feedback.rating}/5. Issues: ${feedback.issuesFound.join(', ')}. Improvements: ${feedback.improvements.join(', ')}`,
    };

    await RendersDAL.updateContext(feedback.renderId, updatedContext);

    logger.log('✅ Prompt preferences updated');
  }

  /**
   * Generate contextual suggestions for next iteration
   */
  static async generateIterationSuggestions(
    chainId: string,
    _currentPrompt: string
  ): Promise<string[]> {
    const renders = await RendersDAL.getByChainId(chainId);
    const suggestions: string[] = [];

    // Analyze previous renders
    const completedRenders = renders.filter(r => r.status === 'completed');
    const failedRenders = renders.filter(r => r.status === 'failed');

    // Suggest based on success rate
    if (completedRenders.length > 0) {
      suggestions.push('Continue refining successful elements');
    }

    // Suggest based on failures
    if (failedRenders.length > 0) {
      suggestions.push('Consider alternative approaches to avoid previous failures');
    }

    // Suggest based on chain length
    if (renders.length > 5) {
      suggestions.push('Consider branching into a new direction');
    }

    // Analyze prompt patterns
    const prompts = completedRenders.map(r => r.prompt);
    const commonWords = this.extractCommonWords(prompts);
    
    if (commonWords.length > 0) {
      suggestions.push(`Build upon recurring themes: ${commonWords.slice(0, 3).join(', ')}`);
    }

    return suggestions;
  }

  /**
   * Helper: Extract common words from prompts
   */
  private static extractCommonWords(prompts: string[]): string[] {
    const wordFrequency = new Map<string, number>();
    const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'is', 'are', 'was', 'were']);

    for (const prompt of prompts) {
      const words = prompt
        .toLowerCase()
        .split(/\W+/)
        .filter(word => word.length > 3 && !stopWords.has(word));

      for (const word of words) {
        wordFrequency.set(word, (wordFrequency.get(word) || 0) + 1);
      }
    }

    // Sort by frequency and return top words
    return Array.from(wordFrequency.entries())
      .filter(([, count]) => count > 1)
      .sort(([, a], [, b]) => b - a)
      .map(([word]) => word);
  }

  /**
   * Analyze render quality based on context
   */
  static async analyzeRenderQuality(renderId: string): Promise<{
    score: number;
    factors: string[];
  }> {
    const render = await RendersDAL.getById(renderId);
    
    if (!render) {
      throw new Error('Render not found');
    }

    let score = 50; // Base score
    const factors: string[] = [];

    // Factor 1: Completion status
    if (render.status === 'completed') {
      score += 20;
      factors.push('Successfully completed');
    } else if (render.status === 'failed') {
      score -= 30;
      factors.push('Failed to complete');
    }

    // Factor 2: Context preservation
    if (render.contextData?.successfulElements && render.contextData.successfulElements.length > 0) {
      score += 10;
      factors.push('Has successful elements tracked');
    }

    // Factor 3: Chain position (later positions might indicate refinement)
    if (render.chainPosition !== null && render.chainPosition > 2) {
      score += 10;
      factors.push('Part of refined iteration');
    }

    // Factor 4: Processing time (faster might indicate simpler/better prompt)
    if (render.processingTime && render.processingTime < 30) {
      score += 10;
      factors.push('Fast processing time');
    }

    // Normalize score to 0-100
    score = Math.max(0, Math.min(100, score));

    return { score, factors };
  }
}

