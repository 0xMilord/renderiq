/**
 * Context Types
 * 
 * Shared types for context management
 * These types are safe to import in client components
 * 
 * ✅ CLIENT-SAFE: Types only, no server code
 * 
 * Note: We define types here to avoid importing server-side services in client components
 */

import type { Render } from '@/lib/types/render';
import type { ChainContext } from '@/lib/types/render-chain';

// Define types inline to avoid importing server-side services
export interface ParsedPrompt {
  originalPrompt: string;
  userIntent: string;
  mentionedVersions: MentionedVersion[];
  hasMentions: boolean;
}

export interface MentionedVersion {
  mentionText: string;
  renderId?: string;
  context?: VersionContext;
}

export interface VersionContext {
  renderId: string;
  prompt: string;
  settings: any;
  outputUrl: string;
  type: 'image' | 'video';
  createdAt: Date;
  chainPosition?: number;
  imageData?: string;
  metadata?: {
    processingTime?: number;
    provider?: string;
    quality?: string;
    style?: string;
    aspectRatio?: string;
    imageType?: string;
  };
}

export interface PipelineMemory {
  styleCodes?: {
    colorPalette: string[];
    lightingStyle: string;
    materialStyle: string;
    architecturalStyle: string;
  };
  palette?: string[];
  geometry?: {
    perspective: 'orthographic' | 'perspective' | 'isometric';
    focalLength: string;
    cameraAngle: string;
  };
  materials?: string[];
  extractedAt?: string;
}

export interface UnifiedContext {
  // Version context (from mentions, @v1, @latest, etc.)
  versionContext?: {
    parsedPrompt: ParsedPrompt;
    mentionedVersions: VersionContext[];
  };
  
  // Context prompt (enhanced with chain context)
  contextPrompt?: {
    originalPrompt: string;
    enhancedPrompt: string;
    contextElements: string[];
  };
  
  // Pipeline memory (from 7-stage technical moat)
  pipelineMemory?: PipelineMemory;
  
  // Chain context (successful elements, evolution)
  chainContext?: ChainContext;
  
  // Reference render (for iterative editing)
  referenceRender?: Render;
  
  // Canvas context (if from canvas selection)
  canvasContext?: {
    selectedRenderIds: string[];
    layers?: string[];
  };
}

export interface ContextRequest {
  prompt: string;
  chainId?: string;
  referenceRenderId?: string;
  projectId?: string;
  canvasSelectedRenderIds?: string[];
  useVersionContext?: boolean; // Parse @mentions
  useContextPrompt?: boolean; // Enhance with chain context
  usePipelineMemory?: boolean; // Load pipeline memory
}

