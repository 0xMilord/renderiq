# Agent Implementation Audit & Strategy
## Current State Analysis & Build vs Buy Decision

**Date**: 2025-01-27  
**Status**: Comprehensive Audit  
**Decision Point**: Build on tldraw Agent Starter Kit vs Custom Implementation

---

## Executive Summary

### Current State
- ❌ **No agent implementation exists** - Only planning document (`TLDRAW_AGENT_INTEGRATION_PLAN.md`)
- ✅ **tldraw canvas integrated** - `renderiq-canvas.tsx` uses tldraw v4.2.1
- ✅ **Image generation works** - 7-stage pipeline generates images
- ❌ **No canvas manipulation agent** - Can only display renders, no AI-driven canvas operations
- ⚠️ **Dual canvas systems** - `renderiq-canvas.tsx` (tldraw) + `canvas-editor.tsx` (ReactFlow)

### Target Capabilities (Cursor IDE for Visualization)
1. **AI-Powered Canvas Manipulation**
   - Create, update, delete shapes
   - Draw freehand strokes
   - Multi-shape operations (rotate, resize, align, distribute, stack, reorder)
   - Write thinking and send messages
   - Track tasks with todo lists
   - Move viewport to different canvas areas
   - Schedule follow-up work

2. **Presentation & Diagram Generation**
   - Complex presentations with multiple slides
   - Architecture diagrams
   - Flowcharts and system diagrams
   - Technical illustrations
   - Layout organization
   - Multi-page compositions

3. **Visual AI Assistant**
   - Read, interpret, and modify drawings
   - Provide analysis and insights
   - Automated annotations
   - Shape recognition and classification
   - Convert sketches to structured content

---

## Architecture Analysis

### Current Infrastructure

#### 1. Canvas Components
```
components/canvas/
├── renderiq-canvas.tsx          ✅ tldraw v4.2.1 (Figma-like canvas)
├── canvas-editor.tsx            ✅ ReactFlow (node-based workflow)
├── contextual-toolbar.tsx       ✅ Context menu for selected shapes
├── generate-variants-dialog.tsx ✅ Variant generation UI
├── generate-drawing-dialog.tsx  ✅ Drawing generation UI
├── image-to-video-dialog.tsx    ✅ Video generation UI
└── upscale-dialog.tsx           ✅ Upscaling UI
```

**Status**: Canvas exists but **no agent integration**

#### 2. Services Layer
```
lib/services/
├── ai-sdk-service.ts           ✅ Google Gemini integration
├── render-pipeline.ts           ✅ 7-stage generation pipeline
├── canvas.service.ts            ✅ Canvas state persistence
├── chat-session-manager.ts      ✅ Multi-turn chat sessions
├── centralized-context-service.ts ✅ Context building
└── [47 total services]
```

**Status**: Services exist but **no agent service**

#### 3. Hooks
```
lib/hooks/
├── use-renderiq-canvas.ts       ✅ Canvas state management
├── use-ai-sdk.ts                ✅ AI SDK wrapper
├── use-render-pipeline.ts       ✅ Pipeline orchestration
└── [40+ total hooks]
```

**Status**: Hooks exist but **no agent hook**

#### 4. Actions
```
lib/actions/
├── canvas.actions.ts            ✅ Canvas state actions
├── render.actions.ts            ✅ Render generation actions
├── centralized-context.actions.ts ✅ Context actions
└── [20+ total actions]
```

**Status**: Actions exist but **no agent actions**

#### 5. DAL (Data Access Layer)
```
lib/dal/
├── renders.ts                   ✅ Render CRUD
├── render-chains.ts             ✅ Chain management
├── canvas.ts                    ✅ Canvas graph storage
└── [10+ total DALs]
```

**Status**: DAL exists, **canvas state stored in `render.contextData.tldrawCanvasState`**

#### 6. Types
```
lib/types/
├── render.ts                    ✅ Render types
├── canvas.ts                    ✅ Canvas node types
├── context.ts                   ✅ Context types
└── render-chain.ts              ✅ Chain types
```

**Status**: Types exist but **no agent types**

---

## tldraw Agent Starter Kit Analysis

### What tldraw Agent Provides

#### ✅ Built-in Capabilities
1. **Visual Context System**
   - Canvas screenshots
   - Structured shape data
   - Spatial relationships
   - Visual appearance
   - Semantic meaning

2. **Action System**
   - Create, update, delete shapes
   - Draw freehand strokes
   - Multi-shape operations
   - Custom actions via `AgentActionUtil`

3. **Prompt System**
   - User messages
   - Canvas state
   - Selection context
   - Viewport information
   - Chat history
   - Custom context via `PromptPartUtil`

4. **Streaming System**
   - Real-time AI responses
   - Progressive canvas updates
   - WebSocket support
   - Backpressure handling

5. **Memory System**
   - Conversation history
   - Canvas snapshots
   - Multi-turn context
   - Session persistence

6. **Model Integration**
   - Anthropic (Claude)
   - OpenAI (GPT-4)
   - Google (Gemini) ✅ **Already using in Renderiq**

### tldraw Agent Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    User Input                           │
│  • Chat message                                         │
│  • Canvas selection                                     │
│  • Viewport context                                     │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────┐
│              PromptPartUtils (Agent's "Eyes")           │
│  • UserMessagePartUtil                                  │
│  • CanvasScreenshotPartUtil                             │
│  • ShapeDataPartUtil                                    │
│  • ViewportPartUtil                                     │
│  • ChatHistoryPartUtil                                  │
│  • Custom: RenderiqContextPartUtil                      │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────┐
│                  AI Model (Gemini)                      │
│  • Structured outputs (Zod schemas)                     │
│  • Streaming responses                                  │
│  • Multi-turn context                                   │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────┐
│            AgentActionUtils (Agent's "Hands")           │
│  • CreateShapeActionUtil                                │
│  • UpdateShapeActionUtil                                │
│  • DeleteShapeActionUtil                                │
│  • DrawStrokeActionUtil                                 │
│  • AlignShapesActionUtil                                │
│  • Custom: AddRenderImageActionUtil                     │
│  • Custom: CreateMaskActionUtil                         │
│  • Custom: InpaintMaskedRegionActionUtil                │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────┐
│                  tldraw Canvas                          │
│  • Shape creation                                       │
│  • Canvas updates                                       │
│  • Real-time rendering                                  │
└─────────────────────────────────────────────────────────┘
```

---

## Build vs Buy Decision Matrix

### Option 1: Build on tldraw Agent Starter Kit ✅ **RECOMMENDED**

#### Pros
1. **Proven Architecture**
   - Production-ready agent system
   - Battle-tested by tldraw team
   - Handles edge cases
   - Performance optimized

2. **Perfect Fit**
   - Already using tldraw v4.2.1
   - Canvas already integrated
   - Google Gemini already integrated
   - Same tech stack

3. **Extensibility**
   - Custom actions via `AgentActionUtil`
   - Custom context via `PromptPartUtil`
   - Full control over agent behavior
   - Can add Renderiq-specific actions

4. **Time to Market**
   - ~2-3 weeks to integrate
   - vs 3-6 months to build custom
   - Focus on Renderiq-specific features
   - Leverage existing infrastructure

5. **Maintenance**
   - tldraw team maintains core
   - We maintain Renderiq-specific parts
   - Regular updates from tldraw
   - Community support

#### Cons
1. **Dependency**
   - Tied to tldraw's roadmap
   - Potential breaking changes
   - Less control over core

2. **Customization Limits**
   - Must work within tldraw's architecture
   - Some constraints on agent behavior
   - May need workarounds for edge cases

#### Implementation Effort
- **Week 1**: Install agent starter kit, basic integration
- **Week 2**: Custom actions (AddRenderImage, CreateMask, Inpaint)
- **Week 3**: Chat integration, testing, polish

**Total**: ~3 weeks

---

### Option 2: Build Custom Agent from Scratch ❌ **NOT RECOMMENDED**

#### Pros
1. **Full Control**
   - Complete customization
   - No dependencies
   - Own the roadmap

2. **Optimization**
   - Can optimize for Renderiq-specific use cases
   - No unnecessary features
   - Leaner codebase

#### Cons
1. **Time Investment**
   - 3-6 months development
   - Need to build all systems from scratch
   - High risk of bugs
   - Performance optimization needed

2. **Missing Features**
   - Visual context system
   - Action system
   - Streaming system
   - Memory system
   - Model integration
   - Error handling
   - Edge cases

3. **Maintenance Burden**
   - Maintain entire agent system
   - Fix bugs ourselves
   - No community support
   - Slower feature development

4. **Risk**
   - May not match tldraw's quality
   - Performance issues
   - Security concerns
   - Integration complexity

#### Implementation Effort
- **Month 1-2**: Core agent architecture
- **Month 3-4**: Visual context, action system
- **Month 5-6**: Streaming, memory, polish

**Total**: ~6 months

---

## Recommendation: Build on tldraw Agent Starter Kit

### Why?
1. **Already 80% there**
   - tldraw canvas integrated ✅
   - Google Gemini integrated ✅
   - Canvas state persistence ✅
   - Chat interface exists ✅

2. **Focus on Differentiators**
   - Renderiq-specific actions (mask inpainting, render generation)
   - AEC-specific context (architectural reasoning)
   - Integration with 7-stage pipeline
   - Custom presentation layouts

3. **Faster Time to Market**
   - 3 weeks vs 6 months
   - Can iterate quickly
   - Get user feedback sooner

4. **Lower Risk**
   - Proven architecture
   - Community support
   - Regular updates
   - Battle-tested

---

## Implementation Plan

### Phase 1: Basic Agent Integration (Week 1)

#### 1.1 Install Agent Starter Kit
```bash
npm install @tldraw/tldraw@latest
# Agent starter kit is part of tldraw v4.2.1
```

#### 1.2 Create Agent Hook
**New File**: `lib/hooks/use-renderiq-agent.ts`
```typescript
'use client';

import { Editor } from '@tldraw/tldraw';
import { useTldrawAgent } from '@tldraw/tldraw';
import { RENDERIQ_AGENT_ACTIONS } from '@/lib/agent/agent-utils';
import { RENDERIQ_PROMPT_PARTS } from '@/lib/agent/agent-utils';

export function useRenderiqAgent(
  editor: Editor | null,
  options?: {
    chainId?: string;
    currentRender?: Render | null;
    onMessage?: (message: string) => void;
  }
) {
  const agent = useTldrawAgent(editor, {
    actions: RENDERIQ_AGENT_ACTIONS,
    promptParts: RENDERIQ_PROMPT_PARTS,
    modelName: 'gemini-2.5-flash', // Match Renderiq's model
    onMessage: options?.onMessage,
  });

  return agent;
}
```

#### 1.3 Integrate with Canvas
**Modify**: `components/canvas/renderiq-canvas.tsx`
```typescript
import { useRenderiqAgent } from '@/lib/hooks/use-renderiq-agent';

export function RenderiqCanvas({ ... }) {
  const editorRef = useRef<Editor | null>(null);
  const agent = useRenderiqAgent(editorRef.current, {
    chainId,
    currentRender,
    onMessage: (message) => {
      // Send agent messages to chat
    },
  });

  // ... rest of component
}
```

### Phase 2: Custom Actions (Week 2)

#### 2.1 Renderiq-Specific Actions
**New File**: `lib/agent/actions/renderiq-actions.ts`

1. **AddRenderImageAction**
   - Adds generated render to canvas as image shape
   - Auto-layouts with other renders
   - Links to render in database

2. **CreateMaskAction**
   - Activates mask tool
   - Allows user to draw mask
   - Stores mask in canvas state

3. **InpaintMaskedRegionAction**
   - Calls Renderiq inpainting API
   - Uses mask from canvas
   - Adds new render to canvas

4. **GeneratePresentationAction**
   - Creates multi-slide presentation
   - Organizes renders into layout
   - Adds annotations and labels

5. **OrganizeLayoutAction**
   - Arranges shapes in grid/masonry
   - Aligns and distributes
   - Creates visual hierarchy

#### 2.2 Custom Prompt Parts
**New File**: `lib/agent/prompt-parts/renderiq-prompt-parts.ts`

1. **RenderiqContextPartUtil**
   - Current render chain
   - Render history
   - Project context

2. **RenderPipelineContextPartUtil**
   - 7-stage pipeline state
   - Memory extraction data
   - Style consistency

### Phase 3: Chat Integration (Week 3)

#### 3.1 Route Messages to Agent
**Modify**: `components/chat/unified-chat-interface.tsx`
```typescript
const handleSendMessage = async () => {
  // Check if message is canvas command
  const isCanvasCommand = 
    inputValue.includes('on canvas') ||
    inputValue.includes('arrange') ||
    inputValue.includes('create presentation') ||
    inputValue.includes('organize') ||
    inputValue.startsWith('/canvas');

  if (isCanvasCommand && agent) {
    // Route to agent
    agent.prompt({
      message: inputValue,
      chainId,
      currentRender,
    });
    return;
  }

  // Otherwise, use existing render pipeline
  // ... existing code
};
```

#### 3.2 Display Agent Messages
- Show agent thinking in chat
- Display agent actions
- Show canvas updates in real-time

---

## Current Capabilities Audit

### ✅ What Exists

#### Canvas Infrastructure
- [x] tldraw v4.2.1 integrated
- [x] Canvas state persistence (`render.contextData.tldrawCanvasState`)
- [x] Custom shapes (render frames)
- [x] Contextual toolbar
- [x] Variant generation UI
- [x] Drawing generation UI
- [x] Video generation UI
- [x] Upscaling UI

#### AI Infrastructure
- [x] Google Gemini integration
- [x] 7-stage render pipeline
- [x] Multi-turn chat sessions
- [x] Context building service
- [x] Pipeline memory
- [x] Image understanding
- [x] Prompt optimization

#### Presentation Tools (Image Generation Only)
- [x] Presentation Board Maker
- [x] Portfolio Layout Generator
- [x] Presentation Sequence Creator

**Note**: These tools generate **images**, not canvas layouts. They don't manipulate canvas.

### ❌ What's Missing

#### Agent Capabilities
- [ ] AI-powered canvas manipulation
- [ ] Shape creation/editing via chat
- [ ] Multi-shape operations (align, distribute, etc.)
- [ ] Presentation layout generation
- [ ] Diagram generation
- [ ] Automated organization
- [ ] Task tracking (todo lists)
- [ ] Agent thinking/messaging

#### Integration
- [ ] Agent hook
- [ ] Agent actions
- [ ] Agent prompt parts
- [ ] Chat → Agent routing
- [ ] Agent → Canvas updates
- [ ] Agent message display

---

## Services, Types, DAL, Actions, Hooks Audit

### Services (`lib/services/`)

#### ✅ Existing (47 services)
- `ai-sdk-service.ts` - Google Gemini wrapper
- `render-pipeline.ts` - 7-stage pipeline
- `canvas.service.ts` - Canvas state management
- `chat-session-manager.ts` - Multi-turn chat
- `centralized-context-service.ts` - Context building
- `image-understanding.ts` - Vision analysis
- `prompt-optimizer.ts` - Prompt enhancement
- `model-router.ts` - Model selection
- `pipeline-memory.ts` - Memory extraction
- `mask-inpainting.ts` - Inpainting logic
- `video-pipeline.ts` - Video generation
- ... and 36 more

#### ❌ Missing
- `agent.service.ts` - Agent orchestration
- `agent-actions.service.ts` - Action execution
- `agent-context.service.ts` - Agent context building

### Types (`lib/types/`)

#### ✅ Existing
- `render.ts` - Render types
- `canvas.ts` - Canvas node types
- `context.ts` - Context types
- `render-chain.ts` - Chain types

#### ❌ Missing
- `agent.ts` - Agent types
- `agent-actions.ts` - Action schemas
- `agent-prompt.ts` - Prompt part types

### DAL (`lib/dal/`)

#### ✅ Existing
- `renders.ts` - Render CRUD
- `render-chains.ts` - Chain management
- `canvas.ts` - Canvas graph storage

**Note**: Canvas state stored in `render.contextData.tldrawCanvasState.canvasData`

#### ❌ Missing
- `agent-sessions.ts` - Agent session storage (optional)
- `agent-history.ts` - Agent action history (optional)

### Actions (`lib/actions/`)

#### ✅ Existing (20+ actions)
- `canvas.actions.ts` - Canvas state actions
- `render.actions.ts` - Render generation
- `centralized-context.actions.ts` - Context building

#### ❌ Missing
- `agent.actions.ts` - Agent orchestration actions
- `agent-actions.actions.ts` - Custom action execution

### Hooks (`lib/hooks/`)

#### ✅ Existing (40+ hooks)
- `use-renderiq-canvas.ts` - Canvas state
- `use-ai-sdk.ts` - AI SDK wrapper
- `use-render-pipeline.ts` - Pipeline orchestration

#### ❌ Missing
- `use-renderiq-agent.ts` - Agent hook
- `use-agent-actions.ts` - Action execution hook

### APIs (`app/api/`)

#### ✅ Existing
- `/api/renders` - Render generation
- `/api/renders/inpaint` - Inpainting
- `/api/ai/chat` - Chat API
- `/api/ai/generate-image` - Image generation

#### ❌ Missing
- `/api/agent/prompt` - Agent prompt endpoint (optional, can be client-side)
- `/api/agent/actions` - Action execution endpoint (optional)

### UI Components (`components/`)

#### ✅ Existing
- `canvas/renderiq-canvas.tsx` - Main canvas
- `canvas/contextual-toolbar.tsx` - Context menu
- `chat/unified-chat-interface.tsx` - Chat UI

#### ❌ Missing
- `agent/agent-chat-panel.tsx` - Agent chat UI (can reuse existing chat)
- `agent/agent-actions-panel.tsx` - Action display (optional)

---

## Recommendation Summary

### ✅ Build on tldraw Agent Starter Kit

**Rationale**:
1. **80% infrastructure exists** - Just need agent layer
2. **3 weeks vs 6 months** - 10x faster
3. **Proven architecture** - Lower risk
4. **Focus on differentiators** - Renderiq-specific features
5. **Already using tldraw** - Natural extension

### Implementation Priority

1. **Week 1**: Basic agent integration
   - Install agent starter kit
   - Create agent hook
   - Integrate with canvas

2. **Week 2**: Custom actions
   - AddRenderImageAction
   - CreateMaskAction
   - InpaintMaskedRegionAction
   - GeneratePresentationAction

3. **Week 3**: Chat integration
   - Route messages to agent
   - Display agent messages
   - Real-time canvas updates

### Next Steps

1. Review this audit with team
2. Approve tldraw agent approach
3. Create detailed implementation tickets
4. Start Week 1 implementation

---

## Appendix: tldraw Agent Starter Kit Capabilities

### What Agent Can Do (Out of the Box)
- ✅ Create, update, delete shapes
- ✅ Draw freehand pen strokes
- ✅ Rotate, resize, align, distribute, stack, reorder shapes
- ✅ Write thinking and send messages
- ✅ Track tasks with todo lists
- ✅ Move viewport to different areas
- ✅ Schedule follow-up work

### What We Need to Add (Custom)
- 🔧 AddRenderImageAction - Add renders to canvas
- 🔧 CreateMaskAction - Mask tool integration
- 🔧 InpaintMaskedRegionAction - Inpainting integration
- 🔧 GeneratePresentationAction - Presentation layouts
- 🔧 OrganizeLayoutAction - Auto-organization
- 🔧 RenderiqContextPartUtil - Renderiq-specific context

---

**End of Audit**

