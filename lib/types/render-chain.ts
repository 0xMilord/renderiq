import { RenderChain, Render } from '@/lib/db/schema';

// Context types
export interface ChainContext {
  successfulElements?: string[];
  previousPrompts?: string[];
  userFeedback?: string;
  chainEvolution?: string;
}

export interface ContextData {
  successfulElements?: string[];
  previousPrompts?: string[];
  userFeedback?: string;
  chainEvolution?: string;
}

// Render with context
export interface RenderWithContext extends Render {
  parentRender?: Render | null;
  referenceRender?: Render | null;
  chain?: RenderChain | null;
}

// Chain with renders
export interface RenderChainWithRenders extends RenderChain {
  renders: Render[];
}

// Enhanced prompt
export interface EnhancedPrompt {
  originalPrompt: string;
  enhancedPrompt: string;
  contextElements: string[];
  styleModifiers: string[];
}

// Prompt feedback
export interface PromptFeedback {
  renderId: string;
  rating: number;
  successfulElements: string[];
  issuesFound: string[];
  improvements: string[];
}

// Thumbnail types
export type ThumbnailSize = 'small' | 'medium' | 'large';

export interface ThumbnailGrid {
  chainId: string;
  thumbnails: {
    renderId: string;
    url: string;
    position: number;
  }[];
}

// Create chain data
export interface CreateChainData {
  projectId: string;
  name: string;
  description?: string;
}

// Update chain data
export interface UpdateChainData {
  name?: string;
  description?: string;
}

// Create render with chain data
export interface CreateRenderWithChainData {
  projectId?: string | null;
  userId: string;
  type: 'image' | 'video';
  prompt: string;
  settings: {
    style: string;
    quality: 'standard' | 'high' | 'ultra';
    aspectRatio: string;
    duration?: number;
  };
  status: 'pending' | 'processing' | 'completed' | 'failed';
  chainId?: string;
  referenceRenderId?: string;
  parentRenderId?: string;
  chainPosition?: number;
  contextData?: ContextData;
}

