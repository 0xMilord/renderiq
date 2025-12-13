// Client-side render types to avoid importing database schema in client components

export interface Render {
  id: string;
  projectId: string;
  userId: string;
  type: 'image' | 'video';
  prompt: string;
  settings: Record<string, any> | null;
  outputUrl: string | null;
  outputKey: string | null;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  errorMessage: string | null;
  processingTime: number | null;
  creditsCost: number;
  chainId: string | null;
  chainPosition: number | null;
  referenceRenderId: string | null;
  // Uploaded image fields
  uploadedImageUrl: string | null;
  uploadedImageKey: string | null;
  uploadedImageId: string | null;
  // Canvas state (optional, backwards compatible)
  contextData?: {
    // Existing pipeline context
    successfulElements?: string[];
    previousPrompts?: string[];
    userFeedback?: string;
    chainEvolution?: string;
    // NEW: tldraw render canvas state (separate from node editor canvas)
    tldrawCanvasState?: CanvasState;
  };
  // Canvas metadata (optional, backwards compatible)
  metadata?: {
    // Existing metadata
    sourcePlatform?: string;
    pluginVersion?: string;
    // NEW: tldraw render canvas metadata (separate from node editor canvas)
    tldrawCanvas?: CanvasMetadata;
    [key: string]: any;
  };
  createdAt: Date;
  updatedAt: Date;
}

// NEW: Canvas types for tldraw integration
export interface CanvasState {
  version: string; // tldraw document version
  canvasData?: any; // tldraw serialized state (TLStoreSnapshot)
  layers?: CanvasLayer[];
  masks?: CanvasMask[];
}

export interface CanvasLayer {
  id: string;
  name: string;
  visible: boolean;
  locked: boolean;
  opacity: number;
  renderId: string; // Reference to render.id
  order: number;
}

export interface CanvasMask {
  id: string;
  renderId: string; // Which render this mask applies to
  maskData: string; // Base64 PNG mask
  prompt: string; // Inpainting prompt
  createdAt: string;
  applied?: boolean;
}

export interface CanvasMetadata {
  canvasId?: string;
  toolVersion?: string;
  lastModified?: string;
  zoomLevel?: number;
  viewport?: { x: number; y: number; zoom: number };
}

export interface RenderChain {
  id: string;
  projectId: string;
  name: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface RenderVersion {
  id: string;
  renderId: string;
  versionNumber: number;
  imageUrl: string;
  settings: Record<string, any> | null;
  createdAt: Date;
}
