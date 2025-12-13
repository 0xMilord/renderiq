# Figma-Like Canvas Implementation Plan
## Transforming Renderiq Chat Interface with tldraw Canvas

**Date**: 2025-01-27  
**Status**: Planning Phase  
**Priority**: High - Core UX Enhancement

---

## Executive Summary

This document outlines the complete transformation of the `unified-chat-interface.tsx` render display area into a **Figma-like canvas** using **tldraw**. The canvas will enable:

1. **Interactive image editing** with zoom, pan, and selection
2. **Mask-based inpainting** for precise region edits
3. **Layer-based workflow** for complex compositions
4. **Direct canvas-to-pipeline integration** for seamless regeneration

**Key Technology Stack**:
- **tldraw**: Infinite canvas (primary)
- **Konva** (optional): Advanced mask rendering overlay
- **Existing 7-stage pipeline**: Semantic parsing → Image understanding → Prompt optimization → Model routing → Generation → Validation → Memory extraction

---

## Table of Contents

1. [Current State Audit](#1-current-state-audit)
2. [Database Schema Analysis](#2-database-schema-analysis)
3. [Infrastructure Analysis (7-Stage Pipeline)](#3-infrastructure-analysis-7-stage-pipeline)
4. [Architecture Design](#4-architecture-design)
5. [Implementation Plan](#5-implementation-plan)
6. [API Endpoints](#6-api-endpoints)
7. [Database Changes](#7-database-changes)
8. [UI/UX Design](#8-uiux-design)
9. [Performance Considerations](#9-performance-considerations)
10. [Roadmap & Timeline](#10-roadmap--timeline)

---

## 1. Current State Audit

### 1.1 Current Render Display Area

**Location**: `components/chat/unified-chat-interface.tsx` (lines ~3724-4328)

**Current Implementation**:
```tsx
// Current: Simple image/video display
<div className="flex-1 p-1 sm:p-2 overflow-hidden min-h-0">
  {currentRender && (
    <Card className="w-full h-full">
      {/* Simple image/video display */}
      <Image src={currentRender.outputUrl} alt={currentRender.prompt} />
      {/* Basic before/after toggle */}
    </Card>
  )}
</div>
```

**Limitations**:
- ❌ No zoom/pan capability
- ❌ No layer management
- ❌ No masking/inpainting interface
- ❌ No multi-image composition
- ❌ Static display only (no editing tools)
- ❌ No vector drawing capabilities
- ❌ Limited before/after comparison

**Strengths**:
- ✅ Responsive layout (sidebar 1/4, render 3/4)
- ✅ Before/after toggle for iterative edits
- ✅ Version carousel for history
- ✅ Video support
- ✅ CDN fallback handling

### 1.2 Current Database Schema

**Relevant Tables**:

```typescript
// lib/db/schema.ts - Renders table (lines 237-294)
export const renders = pgTable('renders', {
  id: uuid('id').primaryKey().defaultRandom(),
  projectId: uuid('project_id'),
  userId: uuid('user_id'),
  type: text('type', { enum: ['image', 'video'] }),
  prompt: text('prompt'),
  settings: jsonb('settings'), // Already supports complex settings
  outputUrl: text('output_url'),
  outputKey: text('output_key'),
  status: text('status', { enum: ['pending', 'processing', 'completed', 'failed'] }),
  // Version control
  chainId: uuid('chain_id'),
  chainPosition: integer('chain_position'),
  referenceRenderId: uuid('reference_render_id'),
  contextData: jsonb('context_data'), // ✅ Can store canvas state here
  // Uploaded image fields
  uploadedImageUrl: text('uploaded_image_url'),
  uploadedImageKey: text('uploaded_image_key'),
  // Metadata
  metadata: jsonb('metadata'), // ✅ Can store canvas metadata
  createdAt: timestamp('created_at'),
  updatedAt: timestamp('updated_at'),
});
```

**Analysis**:
- ✅ `contextData` (JSONB) - **Perfect for storing canvas state, masks, layers**
- ✅ `metadata` (JSONB) - **Can store canvas-specific metadata**
- ✅ `settings` (JSONB) - **Already extensible for canvas tools**
- ✅ Version control infrastructure exists (`chainId`, `chainPosition`)

### 1.3 Current 7-Stage Pipeline

**Pipeline Flow** (`lib/services/render-pipeline.ts`):

```
Stage 1: Semantic Parsing (Gemini 2.5 Flash)
  ↓
Stage 2: Image Understanding (Gemini 2.5 Flash Vision)
  ↓
Stage 3: Prompt Optimization (Gemini 2.5 Flash)
  ↓
Stage 4: Model Routing (Rules-based)
  ↓
Stage 5: Image Generation (Gemini 2.5/3 Pro Image)
  ↓
Stage 6: Validation (Gemini 2.5 Flash Vision)
  ↓
Stage 7: Memory Extraction (Pipeline Memory Service)
```

**Key Integration Points**:
- ✅ `RenderPipeline.generateRender()` accepts `referenceImageData`
- ✅ Supports `styleReferenceData` for style transfer
- ✅ Returns `contextData` with pipeline memory
- ✅ Supports `chainId` for version control
- ✅ `metadata` can include stage events

**Gaps for Canvas Integration**:
- ❌ No mask support in `RenderPipelineRequest`
- ❌ No inpainting-specific endpoint
- ❌ No canvas state persistence

---

## 2. Database Schema Analysis

### 2.1 Required Schema Changes

#### Option A: Extend Existing `renders` Table (Recommended)

**Advantages**:
- No migration needed
- Uses existing JSONB fields
- Backwards compatible

**Implementation**:
```typescript
// Extend contextData to include canvas state
contextData: jsonb('context_data').$type<{
  // Existing fields
  successfulElements?: string[];
  previousPrompts?: string[];
  userFeedback?: string;
  chainEvolution?: string;
  // NEW: Canvas-specific fields
  canvasState?: {
    version: string; // tldraw document version
    canvasData?: any; // tldraw serialized state
    layers?: Array<{
      id: string;
      name: string;
      visible: boolean;
      locked: boolean;
      opacity: number;
      renderId: string; // Reference to render.id
    }>;
    masks?: Array<{
      id: string;
      renderId: string; // Which render this mask applies to
      maskData: string; // Base64 PNG mask
      prompt: string; // Inpainting prompt
      createdAt: string;
    }>;
  };
}>();

// Extend metadata for canvas tools
metadata: jsonb('metadata').$type<{
  // Existing fields
  sourcePlatform?: string;
  pluginVersion?: string;
  // NEW: Canvas metadata
  canvas?: {
    canvasId?: string; // Unique canvas identifier
    toolVersion?: string; // Canvas tool version
    lastModified?: string;
    zoomLevel?: number;
    viewport?: { x: number; y: number; zoom: number };
  };
}>();
```

#### Option B: New `canvas_states` Table (For Advanced Features)

**Only if needed** for complex multi-project canvases:

```sql
CREATE TABLE canvas_states (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chain_id UUID REFERENCES render_chains(id) ON DELETE CASCADE,
  canvas_data JSONB NOT NULL, -- tldraw serialized state
  version TEXT NOT NULL, -- tldraw document version
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_canvas_states_chain_id ON canvas_states(chain_id);
```

**Recommendation**: Start with **Option A** (extend existing schema), migrate to Option B only if needed.

---

## 3. Infrastructure Analysis (7-Stage Pipeline)

### 3.1 Current Pipeline Capabilities

**File**: `lib/services/render-pipeline.ts`

**Current Request Interface**:
```typescript
export interface RenderPipelineRequest {
  prompt: string;
  referenceImageData?: string; // Base64
  referenceImageType?: string;
  styleReferenceData?: string; // Base64
  styleReferenceType?: string;
  toolContext?: { toolId?: string; toolName?: string; toolSettings?: Record<string, string> };
  quality: 'standard' | 'high' | 'ultra';
  aspectRatio: string;
  chainId?: string;
  skipStages?: { semanticParsing?: boolean; imageUnderstanding?: boolean; validation?: boolean; memoryExtraction?: boolean; };
  forceModel?: ImageModelId;
}
```

**Required Extensions for Canvas**:
```typescript
export interface RenderPipelineRequest {
  // ... existing fields ...
  
  // NEW: Mask-based inpainting
  maskData?: string; // Base64 PNG mask (white = replace, black = keep)
  maskType?: 'inpaint' | 'outpaint' | 'replace'; // Inpainting mode
  inpaintingPrompt?: string; // Specific prompt for masked region
  
  // NEW: Canvas context
  canvasContext?: {
    layers?: string[]; // Array of render IDs in layer order
    selectedLayer?: string; // Currently selected render ID
    viewport?: { x: number; y: number; zoom: number }; // For context-aware generation
  };
}
```

### 3.2 Mask Processing Integration

**New Service**: `lib/services/mask-inpainting.ts`

```typescript
export class MaskInpaintingService {
  /**
   * Process mask and integrate with 7-stage pipeline
   */
  static async generateInpainted(
    request: {
      imageData: string; // Base64 source image
      maskData: string; // Base64 PNG mask (white = replace)
      prompt: string;
      quality: 'standard' | 'high' | 'ultra';
      chainId?: string;
      contextData?: any;
    }
  ): Promise<RenderPipelineResult> {
    // 1. Validate mask dimensions match image
    // 2. Convert mask to proper format for Gemini
    // 3. Call RenderPipeline.generateRender() with mask
    // 4. Return result
  }
}
```

**Gemini API Mask Support**:
- Gemini 2.5/3 Pro Image supports **inpainting** via `mask` parameter
- Mask must be same size as image
- White pixels = replace, black pixels = keep

---

## 4. Architecture Design

### 4.1 Component Architecture

```
┌─────────────────────────────────────────────────────────┐
│         UnifiedChatInterface (Main Container)           │
│  ┌──────────────────┐  ┌──────────────────────────────┐│
│  │  Chat Sidebar    │  │   RenderCanvas Component     ││
│  │  (1/4 width)     │  │   (3/4 width, 100vh)        ││
│  │                  │  │                              ││
│  │  - Messages      │  │  ┌────────────────────────┐  ││
│  │  - Input         │  │  │  TldrawCanvas         │  ││
│  │  - Settings      │  │  │  (Infinite Canvas)    │  ││
│  │  - Versions      │  │  │                       │  ││
│  │                  │  │  │  - Image nodes        │  ││
│  │                  │  │  │  - Vector shapes      │  ││
│  │                  │  │  │  - Text annotations   │  ││
│  │                  │  │  │  - Mask layers        │  ││
│  │                  │  │  └────────────────────────┘  ││
│  │                  │  │                              ││
│  │                  │  │  ┌────────────────────────┐  ││
│  │                  │  │  │  CanvasToolbar        │  ││
│  │                  │  │  │  - Zoom/Pan           │  ││
│  │                  │  │  │  - Mask Tool          │  ││
│  │                  │  │  │  - Layer Panel        │  ││
│  │                  │  │  │  - Properties Panel   │  ││
│  │                  │  │  │  - Export             │  ││
│  │                  │  │  └────────────────────────┘  ││
│  └──────────────────┘  └──────────────────────────────┘│
└─────────────────────────────────────────────────────────┘
```

### 4.2 Data Flow

```
User Action: Generate Render
  ↓
1. Chat Interface → POST /api/renders (with prompt, settings)
  ↓
2. Backend → RenderPipeline.generateRender()
  ↓
3. Pipeline → 7-stage processing → Returns image URL
  ↓
4. Frontend → addImageToCanvas(imageUrl, renderId)
  ↓
5. Canvas → Creates tldraw image node → Displays in canvas
  ↓
6. User Action: Draw Mask → Mask Tool (Konva overlay or tldraw)
  ↓
7. User Action: "Inpaint Masked Region" → POST /api/renders/inpaint
  ↓
8. Backend → MaskInpaintingService → RenderPipeline (with mask)
  ↓
9. Pipeline → Returns new image → Canvas updates image node
```

### 4.3 State Management

**Canvas State Storage**:
- **Primary**: `renders.contextData.canvasState` (persisted to DB)
- **Secondary**: Local tldraw document state (synced to DB on save)
- **Tertiary**: Zustand store for UI state (zoom, pan, selected tool)

**Sync Strategy**:
- **Auto-save**: Debounced saves to `contextData` every 2 seconds
- **Manual save**: On "Save Canvas" button click
- **Load on mount**: Restore from `chain.contextData` (latest render's canvas state)

---

## 5. Implementation Plan

### 5.1 Phase 1: Basic Canvas Integration (Week 1)

**Goal**: Replace static image display with tldraw canvas

#### Step 1.1: Install Dependencies

```bash
npm install @tldraw/tldraw
npm install @tldraw/utils
npm install konva react-konva  # For mask overlay (optional, Phase 2)
```

#### Step 1.2: Create Canvas Component

**New File**: `components/canvas/render-canvas.tsx`

```typescript
'use client';

import { Tldraw, TldrawApp } from '@tldraw/tldraw';
import '@tldraw/tldraw/tldraw.css';
import { useRef, useEffect, useCallback } from 'react';
import { Render } from '@/lib/types/render';

interface RenderCanvasProps {
  currentRender: Render | null;
  chainId?: string;
  onRenderUpdate?: (render: Render) => void;
}

export function RenderCanvas({ currentRender, chainId, onRenderUpdate }: RenderCanvasProps) {
  const appRef = useRef<TldrawApp | null>(null);

  // Add image to canvas when render completes
  useEffect(() => {
    if (!currentRender?.outputUrl || !appRef.current) return;

    const app = appRef.current;
    const centerX = app.viewportPageBounds.width / 2;
    const centerY = app.viewportPageBounds.height / 2;

    // Create image node
    app.createShapes([
      {
        id: `render-${currentRender.id}`,
        type: 'image',
        x: centerX - 600, // Center 1200px image
        y: centerY - 400, // Center 800px image
        props: {
          w: 1200,
          h: 800,
          url: currentRender.outputUrl,
        },
      },
    ]);
  }, [currentRender?.id, currentRender?.outputUrl]);

  return (
    <div className="w-full h-full">
      <Tldraw
        ref={appRef}
        showPages={false}
        showZoomControls={true}
        showTools={true}
        showMenu={false}
      />
    </div>
  );
}
```

#### Step 1.3: Integrate into UnifiedChatInterface

**Modify**: `components/chat/unified-chat-interface.tsx`

```typescript
// Replace lines ~3724-4328 (render display area)
import { RenderCanvas } from '@/components/canvas/render-canvas';

// In render:
<div className={cn(
  "flex-1 flex flex-col overflow-hidden min-h-0 min-w-0",
  "lg:w-3/4 lg:flex-shrink-0",
  mobileView === 'render' ? 'flex' : 'hidden lg:flex'
)}>
  {/* Keep existing header toolbar */}
  <div className="border-b border-border shrink-0 z-10">
    {/* ... existing toolbar code ... */}
  </div>

  {/* Replace simple image display with canvas */}
  <RenderCanvas
    currentRender={renderWithLatestData}
    chainId={chainId}
    onRenderUpdate={(updatedRender) => {
      // Update render in state
      setCurrentRender(updatedRender);
    }}
  />
</div>
```

**Deliverables**:
- ✅ tldraw canvas replaces static image display
- ✅ Generated images automatically appear on canvas
- ✅ Zoom/pan/selection works
- ✅ Responsive layout maintained

---

### 5.2 Phase 2: Mask Tool Integration (Week 2)

**Goal**: Add mask drawing tool for inpainting

#### Step 2.1: Create Mask Overlay Component

**New File**: `components/canvas/mask-tool.tsx`

**Approach**: Use Konva overlay for brush-based masking (easier than tldraw polygons for freehand drawing)

```typescript
'use client';

import { Stage, Layer, Image, Line } from 'react-konva';
import { useRef, useState, useCallback } from 'react';

interface MaskToolProps {
  imageUrl: string;
  onMaskComplete: (maskDataUrl: string) => void;
  visible: boolean;
}

export function MaskTool({ imageUrl, onMaskComplete, visible }: MaskToolProps) {
  const [isDrawing, setIsDrawing] = useState(false);
  const [lines, setLines] = useState<Array<{ points: number[] }>>([]);
  const stageRef = useRef<any>(null);

  const handleMouseDown = useCallback((e: any) => {
    if (!visible) return;
    setIsDrawing(true);
    const pos = e.target.getStage().getPointerPosition();
    setLines([...lines, { points: [pos.x, pos.y] }]);
  }, [visible, lines]);

  const handleMouseMove = useCallback((e: any) => {
    if (!isDrawing || !visible) return;
    const stage = e.target.getStage();
    const point = stage.getPointerPosition();
    const lastLine = lines[lines.length - 1];
    lastLine.points = lastLine.points.concat([point.x, point.y]);
    setLines([...lines.slice(0, -1), lastLine]);
  }, [isDrawing, visible, lines]);

  const handleMouseUp = useCallback(() => {
    if (!isDrawing || !visible) return;
    setIsDrawing(false);
    
    // Export mask as PNG
    const stage = stageRef.current;
    if (stage) {
      const maskDataUrl = stage.toDataURL({ pixelRatio: 2 });
      onMaskComplete(maskDataUrl);
    }
  }, [isDrawing, visible, onMaskComplete]);

  if (!visible) return null;

  return (
    <Stage
      ref={stageRef}
      width={window.innerWidth * 0.75} // Match canvas width
      height={window.innerHeight}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      style={{ position: 'absolute', top: 0, left: 0, zIndex: 100 }}
    >
      <Layer>
        <Image image={imageUrl} />
        {lines.map((line, i) => (
          <Line
            key={i}
            points={line.points}
            stroke="white"
            strokeWidth={20}
            tension={0.5}
            lineCap="round"
            lineJoin="round"
            globalCompositeOperation="source-over"
          />
        ))}
      </Layer>
    </Stage>
  );
}
```

#### Step 2.2: Add Mask Tool to Canvas Toolbar

**Modify**: `components/canvas/render-canvas.tsx`

```typescript
// Add mask tool state
const [isMaskMode, setIsMaskMode] = useState(false);
const [maskData, setMaskData] = useState<string | null>(null);

// In render:
<div className="relative w-full h-full">
  <Tldraw ref={appRef} />
  
  {/* Mask overlay */}
  {isMaskMode && currentRender?.outputUrl && (
    <MaskTool
      imageUrl={currentRender.outputUrl}
      onMaskComplete={(maskDataUrl) => {
        setMaskData(maskDataUrl);
        setIsMaskMode(false);
        // Show inpainting prompt dialog
      }}
      visible={isMaskMode}
    />
  )}
</div>
```

#### Step 2.3: Create Inpainting API Endpoint

**New File**: `app/api/renders/inpaint/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getCachedUser } from '@/lib/services/auth-cache';
import { MaskInpaintingService } from '@/lib/services/mask-inpainting';
import { RenderPipeline } from '@/lib/services/render-pipeline';

export async function POST(request: NextRequest) {
  try {
    const { user } = await getCachedUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { renderId, maskData, prompt, quality, chainId } = body;

    // Get source render
    const render = await RendersDAL.getById(renderId);
    if (!render?.outputUrl) {
      return NextResponse.json({ success: false, error: 'Render not found' }, { status: 404 });
    }

    // Fetch source image
    const imageResponse = await fetch(render.outputUrl);
    const imageBlob = await imageResponse.blob();
    const imageBase64 = await blobToBase64(imageBlob);

    // Generate inpainted image
    const result = await RenderPipeline.generateRender({
      prompt,
      referenceImageData: imageBase64,
      referenceImageType: 'image/png',
      maskData, // NEW: Pass mask
      maskType: 'inpaint', // NEW: Inpainting mode
      quality: quality || 'high',
      aspectRatio: render.settings?.aspectRatio || '16:9',
      chainId: chainId || render.chainId,
    });

    if (result.success && result.imageUrl) {
      // Create new render record
      const newRender = await RendersDAL.create({
        projectId: render.projectId,
        userId: user.id,
        type: 'image',
        prompt: `${render.prompt} + ${prompt} (inpainted)`,
        settings: render.settings,
        outputUrl: result.imageUrl,
        chainId: render.chainId,
        chainPosition: (render.chainPosition || 0) + 1,
        referenceRenderId: render.id,
      });

      return NextResponse.json({
        success: true,
        data: newRender,
      });
    }

    return NextResponse.json({
      success: false,
      error: result.error || 'Inpainting failed',
    }, { status: 500 });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
```

**Deliverables**:
- ✅ Mask tool with brush drawing
- ✅ Mask export as PNG
- ✅ Inpainting API endpoint
- ✅ Canvas updates with new inpainted image

---

### 5.3 Phase 3: Advanced Features (Week 3-4)

**Goal**: Layer management, properties panel, export

#### Step 3.1: Layer Management

**Add to Canvas Toolbar**:
- Layers panel (left sidebar)
- Show/hide layers
- Reorder layers (drag & drop)
- Lock/unlock layers
- Opacity slider per layer

**Implementation**:
```typescript
// Store layers in contextData
const layers = [
  { id: 'render-1', name: 'Version 1', visible: true, locked: false, opacity: 1.0, renderId: '...' },
  { id: 'render-2', name: 'Version 2 (Masked)', visible: true, locked: false, opacity: 0.8, renderId: '...' },
];
```

#### Step 3.2: Properties Panel

**Add to Canvas Toolbar**:
- Selected image properties (x, y, width, height, rotation)
- Opacity slider
- Blend modes (normal, multiply, overlay, etc.)
- Lock/visibility toggles

#### Step 3.3: Export Functionality

**Export Options**:
- Export canvas as PNG (composited)
- Export individual layers
- Export mask as PNG
- Export canvas state (JSON)

**Implementation**:
```typescript
const exportCanvas = async () => {
  const app = appRef.current;
  if (!app) return;

  // Export tldraw canvas as image
  const imageDataUrl = await app.getImage();
  
  // Download
  const link = document.createElement('a');
  link.download = `canvas-export-${Date.now()}.png`;
  link.href = imageDataUrl;
  link.click();
};
```

---

## 6. API Endpoints

### 6.1 New Endpoints Required

#### POST `/api/renders/inpaint`

**Purpose**: Generate inpainted image from mask

**Request**:
```json
{
  "renderId": "uuid",
  "maskData": "data:image/png;base64,...",
  "prompt": "Replace curtain with glass door",
  "quality": "high",
  "chainId": "uuid"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "outputUrl": "https://cdn.renderiq.io/...",
    "status": "completed",
    "chainId": "uuid",
    "chainPosition": 2
  }
}
```

#### GET/POST `/api/canvas/state/[chainId]`

**Purpose**: Get/save canvas state

**GET Request**:
```
GET /api/canvas/state/chain-uuid-123
```

**GET Response**:
```json
{
  "success": true,
  "data": {
    "canvasState": {
      "version": "1.0.0",
      "canvasData": { /* tldraw serialized state */ },
      "layers": [ /* ... */ ],
      "masks": [ /* ... */ ]
    }
  }
}
```

**POST Request**:
```json
{
  "canvasState": {
    "version": "1.0.0",
    "canvasData": { /* tldraw state */ },
    "layers": [ /* ... */ ]
  }
}
```

---

## 7. Database Changes

### 7.1 Migration Required

**New Migration**: `drizzle/0028_add_canvas_state_support.sql`

```sql
-- No schema changes needed! We're using existing JSONB fields.
-- Just add a comment for documentation:

COMMENT ON COLUMN renders.context_data IS 'Stores pipeline context and canvas state. Canvas state structure: { canvasState: { version, canvasData, layers[], masks[] } }';
COMMENT ON COLUMN renders.metadata IS 'Stores render metadata and canvas-specific data. Canvas metadata: { canvas: { canvasId, toolVersion, lastModified, zoomLevel, viewport } }';
```

### 7.2 TypeScript Types Update

**Modify**: `lib/types/render.ts`

```typescript
export interface Render {
  // ... existing fields ...
  contextData?: {
    // Existing fields
    successfulElements?: string[];
    previousPrompts?: string[];
    userFeedback?: string;
    chainEvolution?: string;
    // NEW: Canvas state
    canvasState?: {
      version: string;
      canvasData?: any; // tldraw serialized state
      layers?: CanvasLayer[];
      masks?: CanvasMask[];
    };
  };
  metadata?: {
    // Existing fields
    sourcePlatform?: string;
    pluginVersion?: string;
    // NEW: Canvas metadata
    canvas?: {
      canvasId?: string;
      toolVersion?: string;
      lastModified?: string;
      zoomLevel?: number;
      viewport?: { x: number; y: number; zoom: number };
    };
    [key: string]: any;
  };
}

export interface CanvasLayer {
  id: string;
  name: string;
  visible: boolean;
  locked: boolean;
  opacity: number;
  renderId: string;
  order: number;
}

export interface CanvasMask {
  id: string;
  renderId: string;
  maskData: string; // Base64 PNG
  prompt: string;
  createdAt: string;
  applied?: boolean; // Whether this mask has been applied
}
```

---

## 8. UI/UX Design

### 8.1 Canvas Layout

```
┌──────────────────────────────────────────────────────────┐
│  [Back] [Version: v2 ▼] │ [Mask] [Layers] [Props] [Export] │  ← Toolbar (56px)
├──────────────────────────────────────────────────────────┤
│                                                          │
│                    tldraw Canvas                        │
│                    (Infinite Space)                     │
│                                                          │
│          ┌────────────────────┐                         │
│          │                    │                         │
│          │   Generated Image  │  ← Image Node          │
│          │   (Version 2)      │                         │
│          │                    │                         │
│          └────────────────────┘                         │
│                                                          │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

### 8.2 Toolbar Icons

- **Mask Tool**: 🎨 (Brush icon)
- **Layers Panel**: 📚 (Layers icon)
- **Properties Panel**: ⚙️ (Settings icon)
- **Export**: 💾 (Save icon)
- **Zoom Controls**: 🔍 (tldraw built-in)

### 8.3 Mask Tool UX

1. User clicks "Mask Tool" → Canvas enters mask mode
2. Brush cursor appears → User draws white strokes
3. Mask preview shows (semi-transparent overlay)
4. User clicks "Apply Mask" → Prompt dialog appears
5. User enters inpainting prompt → "Generate" button
6. Loading state → New image appears on canvas as new layer

---

## 9. Performance Considerations

### 9.1 Canvas Performance

**Optimizations**:
- **Lazy image loading**: Load full-res images only when zoomed in
- **Thumbnail previews**: Show low-res previews for distant layers
- **Debounced saves**: Auto-save canvas state every 2 seconds (not on every change)
- **Virtual scrolling**: For large layer lists (50+ layers)

### 9.2 Mask Performance

**Optimizations**:
- **Brush size limit**: Max 50px brush (prevents huge strokes)
- **Stroke simplification**: Simplify path points for smoother performance
- **Canvas clearing**: Clear mask overlay after export (don't keep in memory)

### 9.3 API Performance

**Optimizations**:
- **Mask compression**: Compress mask PNG before sending (quality: 0.8)
- **Image caching**: Cache fetched source images for repeated inpainting
- **Batch operations**: Support batch inpainting (multiple masks at once)

---

## 10. Roadmap & Timeline

### Week 1: Basic Canvas (MVP)
- ✅ Install tldraw
- ✅ Create `RenderCanvas` component
- ✅ Replace static image display
- ✅ Test zoom/pan/selection
- ✅ Auto-add generated images to canvas

### Week 2: Mask Tool
- ✅ Install Konva/react-konva
- ✅ Create `MaskTool` component
- ✅ Add mask tool to toolbar
- ✅ Create `/api/renders/inpaint` endpoint
- ✅ Integrate mask → inpainting flow

### Week 3: Layers & Properties
- ✅ Layer management panel
- ✅ Properties panel
- ✅ Canvas state persistence
- ✅ Load/save canvas state

### Week 4: Polish & Export
- ✅ Export functionality
- ✅ Performance optimizations
- ✅ Mobile responsiveness
- ✅ Documentation

---

## 11. Testing Strategy

### 11.1 Unit Tests

- `RenderCanvas` component renders correctly
- Mask tool draws correctly
- Canvas state serialization/deserialization
- API endpoint validation

### 11.2 Integration Tests

- Generate render → appears on canvas
- Draw mask → export mask → send to API → new image appears
- Canvas state saves → reload page → state restores

### 11.3 Performance Tests

- 10+ images on canvas → smooth pan/zoom
- Large masks (4K images) → export performance
- Concurrent inpainting requests → API handling

---

## 12. Security Considerations

### 12.1 Mask Data Validation

- **Size limit**: Max 10MB mask PNG
- **Dimension validation**: Mask must match source image dimensions
- **Format validation**: Only PNG masks accepted

### 12.2 Canvas State Validation

- **Size limit**: Max 5MB canvas state JSON
- **Schema validation**: Validate canvas state structure before saving
- **XSS prevention**: Sanitize user inputs in canvas annotations

---

## 13. Future Enhancements

### 13.1 Advanced Masking

- **Magic wand selection**: Auto-select similar pixels
- **Polygon masks**: Vector-based masking (tldraw polygons)
- **Feather edges**: Soft mask edges for better blending

### 13.2 Collaboration

- **Multi-user canvas**: Real-time collaboration (tldraw multiplayer)
- **Comments**: Add comments to specific regions
- **Share links**: Share canvas view-only links

### 13.3 AI-Powered Tools

- **Auto-mask**: AI detects regions to mask
- **Style transfer on layer**: Apply style to specific layer
- **Smart suggestions**: AI suggests next edits based on canvas state

---

## 14. Dependencies

### Required Packages

```json
{
  "dependencies": {
    "@tldraw/tldraw": "^2.0.0",
    "@tldraw/utils": "^2.0.0",
    "konva": "^9.2.0",
    "react-konva": "^18.2.10"
  }
}
```

### Estimated Bundle Size Impact

- **tldraw**: ~200KB gzipped
- **Konva + react-konva**: ~150KB gzipped
- **Total**: ~350KB additional bundle size

---

## 15. Rollback Plan

If issues arise:

1. **Feature flag**: Add `ENABLE_CANVAS_MODE` env var
2. **Fallback**: If flag disabled, show original static image display
3. **Gradual rollout**: Enable for beta users first, then all users

---

## 16. Success Metrics

### 16.1 User Engagement

- **Canvas usage rate**: % of users who use canvas tools
- **Mask tool usage**: % of renders that use masking
- **Time on canvas**: Average time spent in canvas mode

### 16.2 Quality Metrics

- **Inpainting success rate**: % of successful inpainting requests
- **Canvas state save rate**: % of sessions that save canvas state
- **Error rate**: % of canvas-related errors

### 16.3 Performance Metrics

- **Canvas load time**: < 500ms
- **Mask export time**: < 1s for 2K images
- **Inpainting API response**: < 30s (depends on pipeline)

---

## Conclusion

This implementation plan transforms Renderiq's static render display into a powerful Figma-like canvas, enabling:

1. **Interactive editing** with zoom, pan, and selection
2. **Mask-based inpainting** for precise region edits
3. **Layer management** for complex compositions
4. **Seamless integration** with existing 7-stage pipeline

**Next Steps**:
1. Review and approve this plan
2. Set up development branch
3. Begin Phase 1 implementation (Week 1)
4. Iterate based on user feedback

**Questions?** Contact: [Your Team Contact]

---

**Document Version**: 1.0  
**Last Updated**: 2025-01-27  
**Status**: Ready for Implementation

