/**
 * Gemini Model Configuration
 * 
 * Central configuration for all supported Gemini image and video generation models
 * Includes pricing, credit calculations, and model capabilities
 */

export type ModelType = 'image' | 'video';
export type ImageModelId = 
  | 'gemini-3-pro-image-preview'
  | 'gemini-2.5-flash-image';
  // Note: gemini-2.5-flash, gemini-2.5-flash-lite, gemini-2.5-pro are TEXT models, not image generation models

export type VideoModelId =
  | 'veo-3.1-generate-preview'
  | 'veo-3.1-fast-generate-preview'
  | 'veo-3.0-generate-001'
  | 'veo-3.0-fast-generate-001';

export type ModelId = ImageModelId | VideoModelId;

export interface ModelConfig {
  id: ModelId;
  name: string;
  alias?: string;
  type: ModelType;
  description: string;
  // Pricing in USD
  pricing: {
    // For image models: cost per image
    // For video models: cost per second
    base: number;
    // Optional tiered pricing (e.g., for different resolutions)
    tiers?: {
      [key: string]: number;
    };
  };
  // Credit calculation function
  calculateCredits: (params: {
    quality?: 'standard' | 'high' | 'ultra';
    duration?: number;
    imageSize?: '1K' | '2K' | '4K';
    tokens?: { input?: number; output?: number };
  }) => number;
  // Model capabilities
  capabilities: {
    maxResolution?: string;
    supportedResolutions?: ('1K' | '2K' | '4K')[]; // Which resolutions this model supports
    supportedAspectRatios?: string[]; // Which aspect ratios are supported
    supportsTextRendering?: boolean;
    supportsGrounding?: boolean;
    supportsThinking?: boolean;
    supportsAudio?: boolean;
    supportsImageInput?: boolean; // Can accept image input for editing
    supportsStyleTransfer?: boolean; // Can do style transfer
    speed?: 'fast' | 'standard' | 'slow';
  };
  // Model availability
  available: boolean;
  // Recommended use cases
  recommendedFor?: string[];
}

// Exchange rate: 1 USD = 100 INR
const USD_TO_INR = 100;
// Credit price: 1 credit = 5 INR
const INR_PER_CREDIT = 5;
// Markup multiplier
const MARKUP = 2;

/**
 * Calculate credits from USD cost
 */
function usdToCredits(usdCost: number): number {
  return Math.ceil((usdCost * MARKUP * USD_TO_INR) / INR_PER_CREDIT);
}

/**
 * Image Generation Models
 */
export const IMAGE_MODELS: Record<ImageModelId, ModelConfig> = {
  'gemini-3-pro-image-preview': {
    id: 'gemini-3-pro-image-preview',
    name: 'Gemini 3 Pro Image',
    alias: 'Nano Banana Pro',
    type: 'image',
    description: 'Best model for multimodal understanding, most powerful agentic and vibe-coding model with richer visuals and deeper interactivity',
    pricing: {
      base: 0.134, // 1K/2K images
      tiers: {
        '1K': 0.134,
        '2K': 0.134,
        '4K': 0.24,
      },
    },
    calculateCredits: ({ quality, imageSize }) => {
      // Map quality to image size if not specified
      const size = imageSize || (quality === 'ultra' ? '4K' : quality === 'high' ? '2K' : '1K');
      const cost = size === '4K' ? 0.24 : 0.134;
      return usdToCredits(cost);
    },
    capabilities: {
      maxResolution: '4K (4096x4096)',
      supportedResolutions: ['1K', '2K', '4K'],
      supportedAspectRatios: ['1:1', '2:3', '3:2', '3:4', '4:3', '4:5', '5:4', '9:16', '16:9', '21:9'],
      supportsTextRendering: true,
      supportsGrounding: true,
      supportsThinking: true,
      supportsImageInput: true,
      supportsStyleTransfer: true,
      speed: 'standard',
    },
    available: true,
    recommendedFor: ['Professional assets', 'High-quality renders', 'Text-heavy images', '4K output'],
  },
  'gemini-2.5-flash-image': {
    id: 'gemini-2.5-flash-image',
    name: 'Gemini 2.5 Flash Image',
    alias: 'Nano Banana',
    type: 'image',
    description: 'Fast and efficient image generation model optimized for speed and cost-effectiveness',
    pricing: {
      base: 0.039,
    },
    calculateCredits: () => {
      return usdToCredits(0.039);
    },
    capabilities: {
      maxResolution: '1K (1024x1024)',
      supportedResolutions: ['1K'], // Only 1K supported
      supportedAspectRatios: ['1:1', '2:3', '3:2', '3:4', '4:3', '4:5', '5:4', '9:16', '16:9', '21:9'],
      supportsTextRendering: false,
      supportsGrounding: false,
      supportsThinking: false,
      supportsImageInput: true,
      supportsStyleTransfer: true,
      speed: 'fast',
    },
    available: true,
    recommendedFor: ['Standard quality', 'Fast generation', 'Cost-effective', 'High volume'],
  },
};

/**
 * Video Generation Models
 */
export const VIDEO_MODELS: Record<VideoModelId, ModelConfig> = {
  'veo-3.1-generate-preview': {
    id: 'veo-3.1-generate-preview',
    name: 'Veo 3.1 Standard',
    type: 'video',
    description: 'Latest video generation model with synchronized audio and enhanced quality',
    pricing: {
      base: 0.40, // per second
    },
    calculateCredits: ({ duration = 5 }) => {
      return usdToCredits(0.40 * duration);
    },
    capabilities: {
      supportsAudio: true,
      speed: 'standard',
    },
    available: true,
    recommendedFor: ['High quality videos', 'Audio synchronization', 'Professional output'],
  },
  'veo-3.1-fast-generate-preview': {
    id: 'veo-3.1-fast-generate-preview',
    name: 'Veo 3.1 Fast',
    type: 'video',
    description: 'Fast variant of Veo 3.1 with good quality and faster generation times',
    pricing: {
      base: 0.15, // per second
    },
    calculateCredits: ({ duration = 5 }) => {
      return usdToCredits(0.15 * duration);
    },
    capabilities: {
      supportsAudio: true,
      speed: 'fast',
    },
    available: true,
    recommendedFor: ['Fast generation', 'Cost-effective', 'Good quality'],
  },
  'veo-3.0-generate-001': {
    id: 'veo-3.0-generate-001',
    name: 'Veo 3.0 Standard',
    type: 'video',
    description: 'Stable video generation model with good quality',
    pricing: {
      base: 0.40, // per second
    },
    calculateCredits: ({ duration = 5 }) => {
      return usdToCredits(0.40 * duration);
    },
    capabilities: {
      supportsAudio: false,
      speed: 'standard',
    },
    available: true,
    recommendedFor: ['Stable output', 'Reliable generation'],
  },
  'veo-3.0-fast-generate-001': {
    id: 'veo-3.0-fast-generate-001',
    name: 'Veo 3.0 Fast',
    type: 'video',
    description: 'Fast variant of Veo 3.0',
    pricing: {
      base: 0.15, // per second
    },
    calculateCredits: ({ duration = 5 }) => {
      return usdToCredits(0.15 * duration);
    },
    capabilities: {
      supportsAudio: false,
      speed: 'fast',
    },
    available: true,
    recommendedFor: ['Fast generation', 'Cost-effective'],
  },
};

/**
 * All models combined
 */
export const ALL_MODELS: Record<ModelId, ModelConfig> = {
  ...IMAGE_MODELS,
  ...VIDEO_MODELS,
};

/**
 * Get model configuration by ID
 */
export function getModelConfig(modelId: ModelId): ModelConfig | undefined {
  return ALL_MODELS[modelId];
}

/**
 * Get all available models of a specific type
 */
export function getModelsByType(type: ModelType): ModelConfig[] {
  return Object.values(ALL_MODELS).filter(model => model.type === type && model.available);
}

/**
 * Get default model for a type
 */
export function getDefaultModel(type: ModelType): ModelConfig {
  if (type === 'image') {
    return IMAGE_MODELS['gemini-3-pro-image-preview'];
  }
  return VIDEO_MODELS['veo-3.1-generate-preview'];
}

/**
 * Check if a model supports a specific feature
 */
export function modelSupports(modelId: ModelId, feature: keyof ModelConfig['capabilities']): boolean {
  const model = getModelConfig(modelId);
  if (!model) return false;
  return model.capabilities[feature] === true || !!model.capabilities[feature];
}

/**
 * Check if a model supports a specific resolution
 */
export function modelSupportsResolution(modelId: ModelId, resolution: '1K' | '2K' | '4K'): boolean {
  const model = getModelConfig(modelId);
  if (!model || !model.capabilities.supportedResolutions) return false;
  return model.capabilities.supportedResolutions.includes(resolution);
}

/**
 * Get supported resolutions for a model
 */
export function getSupportedResolutions(modelId: ModelId): ('1K' | '2K' | '4K')[] {
  const model = getModelConfig(modelId);
  if (!model || !model.capabilities.supportedResolutions) return ['1K']; // Default to 1K
  return model.capabilities.supportedResolutions;
}

/**
 * Check if a quality level is supported by the model
 * Maps: standard -> 1K, high -> 2K, ultra -> 4K
 */
export function modelSupportsQuality(modelId: ModelId, quality: 'standard' | 'high' | 'ultra'): boolean {
  const resolution = quality === 'ultra' ? '4K' : quality === 'high' ? '2K' : '1K';
  return modelSupportsResolution(modelId, resolution);
}

/**
 * Get the maximum quality supported by a model
 */
export function getMaxQuality(modelId: ModelId): 'standard' | 'high' | 'ultra' {
  const resolutions = getSupportedResolutions(modelId);
  if (resolutions.includes('4K')) return 'ultra';
  if (resolutions.includes('2K')) return 'high';
  return 'standard';
}

