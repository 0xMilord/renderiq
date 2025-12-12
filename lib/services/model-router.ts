import { getModelConfig, getDefaultModel, getModelsByType, modelSupports, modelSupportsQuality, ImageModelId, VideoModelId } from '@/lib/config/models';
import { logger } from '@/lib/utils/logger';

/**
 * Model Router - Selects optimal model based on task requirements
 * Uses existing models.ts infrastructure for model selection
 * 
 * This is Stage 4 of the technical moat pipeline
 */
export class ModelRouter {
  /**
   * Select optimal image model based on task complexity and requirements
   * Uses simple rules-based routing (fast and free)
   * 
   * @param quality - Quality requirement (standard, high, ultra)
   * @param toolContext - Optional tool context (CAD tools need better models)
   * @param complexity - Optional task complexity (simple, medium, complex)
   * @returns Selected model ID
   */
  static selectImageModel(
    quality: 'standard' | 'high' | 'ultra',
    toolContext?: { toolId?: string; toolName?: string },
    complexity?: 'simple' | 'medium' | 'complex'
  ): ImageModelId {
    // Get available image models from config
    const availableModels = getModelsByType('image');
    
    // Complex tasks or ultra quality → Gemini 3 Pro Image
    if (complexity === 'complex' || quality === 'ultra') {
      const proModel = availableModels.find(m => m.id === 'gemini-3-pro-image-preview');
      if (proModel && modelSupportsQuality('gemini-3-pro-image-preview', quality)) {
        logger.log('🎯 ModelRouter: Selected Gemini 3 Pro Image (complex task or ultra quality)');
        return 'gemini-3-pro-image-preview';
      }
    }

    // CAD tools or technical drawings → Gemini 3 Pro (better precision)
    if (toolContext?.toolId) {
      const toolIdLower = toolContext.toolId.toLowerCase();
      if (toolIdLower.includes('cad') || 
          toolIdLower.includes('section') || 
          toolIdLower.includes('elevation') ||
          toolIdLower.includes('technical')) {
        const proModel = availableModels.find(m => m.id === 'gemini-3-pro-image-preview');
        if (proModel) {
          logger.log('🎯 ModelRouter: Selected Gemini 3 Pro Image (CAD/technical tool)');
          return 'gemini-3-pro-image-preview';
        }
      }
    }

    // High quality → Check if Flash supports it, otherwise use Pro
    if (quality === 'high') {
      const flashModel = availableModels.find(m => m.id === 'gemini-2.5-flash-image');
      if (flashModel && modelSupportsQuality('gemini-2.5-flash-image', quality)) {
        logger.log('🎯 ModelRouter: Selected Gemini 2.5 Flash Image (high quality)');
        return 'gemini-2.5-flash-image';
      } else {
        // Flash doesn't support high quality, use Pro
        logger.log('🎯 ModelRouter: Selected Gemini 3 Pro Image (high quality, Flash not supported)');
        return 'gemini-3-pro-image-preview';
      }
    }

    // Simple/medium tasks → Gemini 2.5 Flash Image (cheaper)
    const flashModel = availableModels.find(m => m.id === 'gemini-2.5-flash-image');
    if (flashModel) {
      logger.log('🎯 ModelRouter: Selected Gemini 2.5 Flash Image (simple/standard task)');
      return 'gemini-2.5-flash-image';
    }

    // Fallback to default
    logger.log('🎯 ModelRouter: Using default model');
    return getDefaultModel('image').id as ImageModelId;
  }

  /**
   * Select optimal video model based on task complexity
   * 
   * @param quality - Quality requirement (standard, high, ultra)
   * @param complexity - Optional task complexity
   * @returns Selected model ID
   */
  static selectVideoModel(
    quality: 'standard' | 'high' | 'ultra',
    complexity?: 'simple' | 'medium' | 'complex'
  ): VideoModelId {
    // Get available video models from config
    const availableModels = getModelsByType('video');
    
    // Complex tasks or ultra quality → Veo 3.1 Standard
    if (complexity === 'complex' || quality === 'ultra') {
      const standardModel = availableModels.find(m => m.id === 'veo-3.1-generate-preview');
      if (standardModel) {
        logger.log('🎯 ModelRouter: Selected Veo 3.1 Standard (complex task or ultra quality)');
        return 'veo-3.1-generate-preview';
      }
    }

    // High quality → Use Standard if available
    if (quality === 'high') {
      const standardModel = availableModels.find(m => m.id === 'veo-3.1-generate-preview');
      if (standardModel) {
        logger.log('🎯 ModelRouter: Selected Veo 3.1 Standard (high quality)');
        return 'veo-3.1-generate-preview';
      }
    }

    // Simple/medium tasks → Veo 3.1 Fast (cheaper)
    const fastModel = availableModels.find(m => m.id === 'veo-3.1-fast-generate-preview');
    if (fastModel) {
      logger.log('🎯 ModelRouter: Selected Veo 3.1 Fast (simple/standard task)');
      return 'veo-3.1-fast-generate-preview';
    }

    // Fallback to default
    logger.log('🎯 ModelRouter: Using default video model');
    return getDefaultModel('video').id as VideoModelId;
  }

  /**
   * Get model config for selected model
   * Helper method to get full model configuration
   */
  static getModelConfig(modelId: string) {
    return getModelConfig(modelId as any);
  }
}

