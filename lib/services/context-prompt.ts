import { RendersDAL } from '@/lib/dal/renders';
import { Render } from '@/lib/db/schema';
import { ChainContext, EnhancedPrompt, PromptFeedback } from '@/lib/types/render-chain';

export class ContextPromptService {
  /**
   * Build enhanced prompt with context awareness
   */
  static async buildContextAwarePrompt(
    userPrompt: string,
    referenceRender?: Render,
    chainContext?: ChainContext,
    style?: string,
    imageType?: string
  ): Promise<EnhancedPrompt> {
    const contextElements: string[] = [];
    const styleModifiers: string[] = [];

    // Add reference render context
    if (referenceRender?.contextData) {
      if (referenceRender.contextData.successfulElements) {
        contextElements.push(
          `Maintain these successful elements: ${referenceRender.contextData.successfulElements.join(', ')}`
        );
      }
      
      if (referenceRender.contextData.userFeedback) {
        contextElements.push(
          `Previous feedback: ${referenceRender.contextData.userFeedback}`
        );
      }
    }

    // Add chain evolution context
    if (chainContext) {
      if (chainContext.successfulElements) {
        contextElements.push(
          `Proven successful elements from chain: ${chainContext.successfulElements.join(', ')}`
        );
      }

      if (chainContext.chainEvolution) {
        contextElements.push(
          `Chain evolution context: ${chainContext.chainEvolution}`
        );
      }

      if (chainContext.previousPrompts && chainContext.previousPrompts.length > 0) {
        const recentPrompts = chainContext.previousPrompts.slice(-3);
        contextElements.push(
          `Building upon previous iterations: ${recentPrompts.join(' → ')}`
        );
      }
    }

    // Add style modifiers
    if (style) {
      styleModifiers.push(`Style: ${style}`);
    }

    if (imageType) {
      styleModifiers.push(`Type: ${imageType}`);
    }

    // Build enhanced prompt
    let enhancedPrompt = userPrompt;

    if (contextElements.length > 0) {
      enhancedPrompt = `${userPrompt}\n\nContext: ${contextElements.join('. ')}`;
    }

    if (styleModifiers.length > 0) {
      enhancedPrompt += `\n\nRequirements: ${styleModifiers.join(', ')}`;
    }

    return {
      originalPrompt: userPrompt,
      enhancedPrompt,
      contextElements,
      styleModifiers,
    };
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
    console.log('📝 Updating prompt preferences for user:', userId);
    
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

    console.log('✅ Prompt preferences updated');
  }

  /**
   * Generate contextual suggestions for next iteration
   */
  static async generateIterationSuggestions(
    chainId: string,
    currentPrompt: string
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

