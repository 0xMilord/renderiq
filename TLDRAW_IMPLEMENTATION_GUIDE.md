# tldraw Canvas Implementation Guide
## Practical Implementation Following Renderiq Architecture Patterns

**Date**: 2025-01-27  
**Status**: Implementation In Progress  
**Approach**: Reuse existing infrastructure, follow established patterns

---

## Architecture Pattern

Following existing Renderiq architecture:

```
Components → Hooks → Actions → Services → DAL → Database
```

**Key Pattern Consistency**:
- ✅ **Types**: Extend existing `Render` type in `lib/types/render.ts`
- ✅ **Services**: Create `lib/services/canvas.service.ts` following existing service patterns
- ✅ **Actions**: Create `lib/actions/canvas.actions.ts` following existing action patterns  
- ✅ **Hooks**: Create `lib/hooks/use-canvas.ts` following existing hook patterns
- ✅ **Components**: Create `components/canvas/renderiq-canvas.tsx`
- ✅ **Integration**: Extend existing `RenderPipeline` service with mask support

---

## Step-by-Step Implementation

### Step 1: Install Dependencies

```bash
npm install @tldraw/tldraw @tldraw/store @tldraw/utils
```

**Note**: tldraw v2 uses modular packages. We'll use:
- `@tldraw/tldraw` - Core UI component
- `@tldraw/store` - State management
- `@tldraw/utils` - Utilities

---

### Step 2: Extend Types (Reuse Existing)

**Modify**: `lib/types/render.ts`

Add canvas-related types to existing Render interface using optional fields:

```typescript
export interface Render {
  // ... existing fields ...
  
  // NEW: Canvas state (optional, backwards compatible)
  contextData?: {
    // Existing pipeline context
    successfulElements?: string[];
    previousPrompts?: string[];
    userFeedback?: string;
    chainEvolution?: string;
    // NEW: Canvas state
    canvasState?: CanvasState;
  };
  
  // NEW: Canvas metadata
  metadata?: {
    // Existing metadata
    sourcePlatform?: string;
    pluginVersion?: string;
    // NEW: Canvas metadata
    canvas?: CanvasMetadata;
    [key: string]: any;
  };
}

// NEW: Canvas types
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
```

---

### Step 3: Extend RenderPipeline (Reuse Existing Service)

**Modify**: `lib/services/render-pipeline.ts`

Add mask support to existing `RenderPipelineRequest`:

```typescript
export interface RenderPipelineRequest {
  // ... existing fields ...
  
  // NEW: Mask-based inpainting
  maskData?: string; // Base64 PNG mask (white = replace, black = keep)
  maskType?: 'inpaint' | 'outpaint' | 'replace';
  inpaintingPrompt?: string; // Specific prompt for masked region
  
  // NEW: Canvas context (optional)
  canvasContext?: {
    layers?: string[]; // Array of render IDs in layer order
    selectedLayer?: string;
    viewport?: { x: number; y: number; zoom: number };
  };
}
```

**Note**: Gemini API supports inpainting via mask parameter in image generation.

---

### Step 4: Create Canvas Service (Follow Existing Service Pattern)

**New File**: `lib/services/canvas.service.ts`

Following pattern from `lib/services/render-chain.ts`:

```typescript
import { logger } from '@/lib/utils/logger';
import { RendersDAL } from '@/lib/dal/renders';
import type { CanvasState, CanvasLayer, CanvasMask } from '@/lib/types/render';

/**
 * Canvas Service
 * Manages canvas state persistence and operations
 * Follows same pattern as RenderChainService
 */
export class CanvasService {
  private static instance: CanvasService;

  static getInstance(): CanvasService {
    if (!CanvasService.instance) {
      CanvasService.instance = new CanvasService();
    }
    return CanvasService.instance;
  }

  /**
   * Save canvas state to render's contextData
   */
  async saveCanvasState(
    renderId: string,
    canvasState: CanvasState
  ): Promise<void> {
    try {
      const render = await RendersDAL.getById(renderId);
      if (!render) {
        throw new Error(`Render ${renderId} not found`);
      }

      // Merge with existing contextData
      const existingContextData = render.contextData || {};
      
      await RendersDAL.update(renderId, {
        contextData: {
          ...existingContextData,
          canvasState: {
            ...canvasState,
            version: canvasState.version || '1.0.0',
          },
        },
      });

      logger.log('✅ CanvasService: Saved canvas state', { renderId });
    } catch (error) {
      logger.error('❌ CanvasService: Failed to save canvas state', error);
      throw error;
    }
  }

  /**
   * Load canvas state from render's contextData
   */
  async loadCanvasState(renderId: string): Promise<CanvasState | null> {
    try {
      const render = await RendersDAL.getById(renderId);
      if (!render) return null;

      return render.contextData?.canvasState || null;
    } catch (error) {
      logger.error('❌ CanvasService: Failed to load canvas state', error);
      return null;
    }
  }

  /**
   * Get canvas state from latest render in chain
   */
  async getChainCanvasState(chainId: string): Promise<CanvasState | null> {
    try {
      // Get latest render from chain (via existing infrastructure)
      const { RenderChainsDAL } = await import('@/lib/dal/render-chains');
      const chain = await RenderChainsDAL.getById(chainId);
      
      if (!chain?.renders || chain.renders.length === 0) return null;

      // Get latest render
      const latestRender = chain.renders
        .sort((a, b) => (b.chainPosition || 0) - (a.chainPosition || 0))[0];

      return latestRender?.contextData?.canvasState || null;
    } catch (error) {
      logger.error('❌ CanvasService: Failed to get chain canvas state', error);
      return null;
    }
  }
}

export const canvasService = CanvasService.getInstance();
```

---

### Step 5: Create Canvas Actions (Follow Existing Action Pattern)

**New File**: `lib/actions/canvas.actions.ts`

Following pattern from `lib/actions/render.actions.ts`:

```typescript
'use server';

import { getCachedUser } from '@/lib/services/auth-cache';
import { canvasService } from '@/lib/services/canvas.service';
import { RendersDAL } from '@/lib/dal/renders';
import { logger } from '@/lib/utils/logger';
import type { CanvasState } from '@/lib/types/render';

/**
 * Save canvas state to render
 * Follows same pattern as other server actions
 */
export async function saveCanvasStateAction(
  renderId: string,
  canvasState: CanvasState
) {
  try {
    const { user } = await getCachedUser();
    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    // Verify render ownership
    const render = await RendersDAL.getById(renderId);
    if (!render || render.userId !== user.id) {
      return { success: false, error: 'Render not found or unauthorized' };
    }

    await canvasService.saveCanvasState(renderId, canvasState);

    return { success: true };
  } catch (error) {
    logger.error('❌ saveCanvasStateAction: Failed', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Load canvas state from render
 */
export async function loadCanvasStateAction(renderId: string) {
  try {
    const { user } = await getCachedUser();
    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    const render = await RendersDAL.getById(renderId);
    if (!render || render.userId !== user.id) {
      return { success: false, error: 'Render not found or unauthorized' };
    }

    const canvasState = await canvasService.loadCanvasState(renderId);

    return { success: true, data: canvasState };
  } catch (error) {
    logger.error('❌ loadCanvasStateAction: Failed', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Load canvas state from chain (latest render)
 */
export async function loadChainCanvasStateAction(chainId: string) {
  try {
    const { user } = await getCachedUser();
    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    const canvasState = await canvasService.getChainCanvasState(chainId);

    return { success: true, data: canvasState };
  } catch (error) {
    logger.error('❌ loadChainCanvasStateAction: Failed', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
```

---

### Step 6: Create Canvas Hook (Follow Existing Hook Pattern)

**New File**: `lib/hooks/use-renderiq-canvas.ts`

Following pattern from `lib/hooks/use-canvas.ts` and `lib/hooks/use-render-pipeline.ts`:

```typescript
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Editor } from '@tldraw/editor';
import { Store } from '@tldraw/store';
import type { TLStoreSnapshot } from '@tldraw/tldraw';
import { saveCanvasStateAction, loadCanvasStateAction } from '@/lib/actions/canvas.actions';
import type { CanvasState } from '@/lib/types/render';
import { logger } from '@/lib/utils/logger';

interface UseRenderiqCanvasOptions {
  chainId?: string;
  currentRenderId?: string;
  autoSave?: boolean;
  autoSaveInterval?: number; // milliseconds
}

export function useRenderiqCanvas(options: UseRenderiqCanvasOptions = {}) {
  const {
    chainId,
    currentRenderId,
    autoSave = true,
    autoSaveInterval = 2000, // 2 seconds
  } = options;

  const [editor, setEditor] = useState<Editor | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedStateRef = useRef<string | null>(null);

  /**
   * Load canvas state from render
   */
  const loadCanvasState = useCallback(async () => {
    if (!currentRenderId || !editor) return;

    setIsLoading(true);
    try {
      const result = await loadCanvasStateAction(currentRenderId);
      
      if (result.success && result.data?.canvasData) {
        // Deserialize tldraw state
        const snapshot = result.data.canvasData as TLStoreSnapshot;
        editor.store.loadSnapshot(snapshot);
        
        logger.log('✅ useRenderiqCanvas: Loaded canvas state', { currentRenderId });
      }
    } catch (error) {
      logger.error('❌ useRenderiqCanvas: Failed to load canvas state', error);
    } finally {
      setIsLoading(false);
    }
  }, [currentRenderId, editor]);

  /**
   * Save canvas state to render
   */
  const saveCanvasState = useCallback(async () => {
    if (!currentRenderId || !editor) return;

    try {
      // Serialize tldraw state
      const snapshot = editor.store.getSnapshot();
      const snapshotString = JSON.stringify(snapshot);
      
      // Skip if state hasn't changed
      if (snapshotString === lastSavedStateRef.current) {
        return;
      }

      setIsSaving(true);

      const canvasState: CanvasState = {
        version: '1.0.0',
        canvasData: snapshot,
      };

      const result = await saveCanvasStateAction(currentRenderId, canvasState);

      if (result.success) {
        lastSavedStateRef.current = snapshotString;
        logger.log('✅ useRenderiqCanvas: Saved canvas state', { currentRenderId });
      }
    } catch (error) {
      logger.error('❌ useRenderiqCanvas: Failed to save canvas state', error);
    } finally {
      setIsSaving(false);
    }
  }, [currentRenderId, editor]);

  /**
   * Auto-save on state changes
   */
  useEffect(() => {
    if (!autoSave || !editor || !currentRenderId) return;

    const unsubscribe = editor.store.listen(() => {
      // Debounce auto-save
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }

      autoSaveTimerRef.current = setTimeout(() => {
        saveCanvasState();
      }, autoSaveInterval);
    });

    return () => {
      unsubscribe();
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [autoSave, editor, currentRenderId, autoSaveInterval, saveCanvasState]);

  /**
   * Load state on mount
   */
  useEffect(() => {
    if (editor && currentRenderId) {
      loadCanvasState();
    }
  }, [editor, currentRenderId, loadCanvasState]);

  return {
    editor,
    setEditor,
    isLoading,
    isSaving,
    loadCanvasState,
    saveCanvasState,
  };
}
```

---

### Step 7: Create Canvas Component

**New File**: `components/canvas/renderiq-canvas.tsx`

Basic implementation following tldraw v2 patterns:

```typescript
'use client';

import { Tldraw } from '@tldraw/tldraw';
import '@tldraw/tldraw/tldraw.css';
import { useEffect, useRef } from 'react';
import { Editor } from '@tldraw/editor';
import { useRenderiqCanvas } from '@/lib/hooks/use-renderiq-canvas';
import type { Render } from '@/lib/types/render';

interface RenderiqCanvasProps {
  currentRender: Render | null;
  chainId?: string;
  onRenderAdded?: (render: Render) => void;
}

export function RenderiqCanvas({
  currentRender,
  chainId,
  onRenderAdded,
}: RenderiqCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { editor, setEditor, isLoading } = useRenderiqCanvas({
    chainId,
    currentRenderId: currentRender?.id,
    autoSave: true,
  });

  // Add render image to canvas when render completes
  useEffect(() => {
    if (!currentRender?.outputUrl || !editor) return;

    // Check if image already exists on canvas
    const existingShapes = editor.getCurrentPageShapes();
    const alreadyExists = existingShapes.some(
      (shape) => shape.type === 'image' && shape.id === `render-${currentRender.id}`
    );

    if (alreadyExists) return;

    // Get viewport center
    const viewportBounds = editor.getViewportPageBounds();
    const centerX = viewportBounds.x + viewportBounds.width / 2;
    const centerY = viewportBounds.y + viewportBounds.height / 2;

    // Create image shape
    editor.createShape({
      id: `render-${currentRender.id}` as any,
      type: 'image',
      x: centerX - 600, // Center 1200px image
      y: centerY - 400, // Center 800px image
      props: {
        w: 1200,
        h: 800,
        assetId: null, // We'll use URL directly
        // Note: tldraw v2 may need asset management
        // For now, we'll use a custom image shape or workaround
      },
    });

    logger.log('✅ RenderiqCanvas: Added render to canvas', {
      renderId: currentRender.id,
    });
  }, [currentRender?.id, currentRender?.outputUrl, editor]);

  return (
    <div ref={containerRef} className="w-full h-full relative">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/50 z-50">
          <div className="text-sm text-muted-foreground">Loading canvas...</div>
        </div>
      )}

      <Tldraw
        onMount={(editorInstance) => {
          setEditor(editorInstance);
        }}
        // Hide default UI, we'll use our custom toolbar
        hideUi={false}
        // Custom theme to match Renderiq
        inferDarkMode={false}
      />
    </div>
  );
}
```

**Note**: tldraw v2 API may differ slightly. We'll adjust based on actual API.

---

## Next Steps

1. ✅ Install dependencies
2. ✅ Extend types
3. ✅ Create service
4. ✅ Create actions
5. ✅ Create hook
6. ⏳ Create component
7. ⏳ Integrate into unified-chat-interface
8. ⏳ Add mask tool
9. ⏳ Add inpainting API endpoint

---

**Status**: Ready for implementation  
**Pattern**: Following existing Renderiq architecture  
**Integration**: Reuses existing services, actions, hooks patterns

