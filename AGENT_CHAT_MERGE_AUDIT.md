# Agent Chat & Render Chat Merge Audit

**Date**: 2025-12-16  
**Status**: Planning & Implementation  
**Goal**: Merge render chat and agent chat into unified interface with smart routing

---

## Executive Summary

Currently, Renderiq has two separate chat interfaces:
1. **Render Chat** - Full-featured interface for image/video generation
2. **Agent Chat** - Canvas-focused interface for agent operations

The goal is to merge these into a single, unified interface that:
- Uses the same input component for both modes
- Uses the same model selector
- Uses the same mention tagger (@)
- Uses the same generate button
- Smartly routes between render generation and agent operations
- Generates images and places them on canvas
- Creates sophisticated presentations

---

## Current Architecture

### 1. Render Chat (`components/chat/unified-chat-interface.tsx`)

**Location**: Lines 2965-3476

**Features**:
- ModelSelector (lines 4240-4267) - Full model selection UI
- MentionTagger integration (lines 3558-3600) - @ mentions for version references
- Unified input with all settings (lines 3505-4900)
- Image/video generation
- Quality, aspect ratio, effect, environment controls
- Upload support
- Project rules integration

**Input Area** (lines 3505-4900):
- Textarea with mention detection
- Model selector in header
- Generate button
- Upload support
- All render settings

### 2. Agent Chat (`components/agent/RenderiqChatInput.tsx`)

**Location**: `components/agent/RenderiqChatInput.tsx`

**Features**:
- Separate model selector (lines 116-132) - Uses AGENT_MODEL_DEFINITIONS
- Context selection tools (lines 94-114)
- Canvas-specific input
- Agent-specific submit handler

**Current Structure**:
```typescript
- RenderiqChatInput (separate component)
  - Model selector (agent models only)
  - Context tools (Pick Shapes, Pick Area)
  - Text input
  - Submit button
```

### 3. Agent Kit Structure (`agent-kit/`)

**Key Components**:
- `client/agent/TldrawAgent.ts` - Main agent class
- `client/components/ChatInput.tsx` - Original agent chat input
- `worker/do/AgentService.ts` - Backend service (now Gemini-only)
- `worker/models.ts` - Agent model definitions (Gemini only)
- `shared/actions/` - Canvas action utilities
- `shared/parts/` - Prompt part utilities

**Agent Models**:
- `gemini-2.5-flash` (default)
- `gemini-2.5-pro`

**Render Models**:
- Multiple Gemini models via `@/lib/config/models`
- Auto mode
- Quality levels (standard, high, ultra)

---

## Current Tab Structure

**Location**: `components/chat/unified-chat-interface.tsx` lines 2965-3476

```typescript
<Tabs defaultValue="render">
  <TabsList>
    <TabsTrigger value="render">Render Chat</TabsTrigger>
    <TabsTrigger value="agent">Agent Chat</TabsTrigger>
  </TabsList>
  
  <TabsContent value="render">
    {/* Render chat messages */}
  </TabsContent>
  
  <TabsContent value="agent">
    <RenderiqChatHistory />
    <RenderiqTodoList />
    <RenderiqChatInput /> {/* Separate input */}
  </TabsContent>
</Tabs>
```

**Problem**: Two separate inputs, two separate model selectors, duplicate functionality

---

## Smart Routing System

**Location**: `lib/utils/agent-routing.ts`

**Current Capabilities**:
- Analyzes input to determine: `agent`, `image-gen`, or `hybrid`
- Keyword-based detection
- Confidence scoring
- Prompt splitting for hybrid mode

**Keywords**:
- Agent: `on canvas`, `draw`, `arrange`, `organize`, `presentation`, etc.
- Image Gen: `generate`, `create image`, `render`, `photo of`, etc.
- Hybrid: `and then`, `also`, `plus`, `additionally`, etc.

**Current Usage**: Lines 1749-1784 in `unified-chat-interface.tsx`

---

## Image Placement on Canvas

**Location**: `components/canvas/renderiq-canvas.tsx` lines 523-715

**Current Implementation**:
- Auto-loads chain renders onto canvas
- Uses auto-layout (spiral/grid) for positioning
- Creates frame shapes with image assets
- Handles image loading and errors

**Key Function**: `loadChainRenders()`
- Filters completed renders
- Creates frame shapes
- Calculates optimal positions
- Loads images as assets

---

## Merge Plan

### Phase 1: Unified Input Component

**Goal**: Create single input component that works for both render and agent modes

**Changes**:
1. Remove separate `RenderiqChatInput` from agent tab
2. Use unified input from render chat for both tabs
3. Add agent-specific context tools to unified input
4. Merge model selectors (support both render and agent models)

**New Component**: `components/chat/unified-chat-input.tsx`

**Features**:
- Single textarea with mention support
- Unified model selector (supports both render and agent models)
- Context tools (when agent mode active)
- Generate button (routes based on input)
- Upload support
- All render settings

### Phase 2: Enhanced Smart Routing

**Goal**: Improve routing to support canvas planning and building

**Enhancements**:
1. Add canvas planning keywords
2. Add presentation generation keywords
3. Improve hybrid mode detection
4. Add "generate and place" mode

**New Keywords**:
- Planning: `plan`, `design`, `layout`, `structure`, `outline`
- Building: `build`, `create`, `make`, `construct`, `assemble`
- Presentations: `presentation`, `slide`, `deck`, `showcase`, `portfolio`

### Phase 3: Image Generation & Placement

**Goal**: Generate images and automatically place them on canvas

**Implementation**:
1. After image generation, trigger canvas placement
2. Use existing `loadChainRenders` logic
3. Add agent action for "place image on canvas"
4. Support manual placement via agent commands

**New Agent Action**: `PlaceRenderAction`
- Takes render ID
- Places on canvas at specified position
- Or uses auto-layout

### Phase 4: Presentation Generation

**Goal**: Create sophisticated presentations on canvas

**Implementation**:
1. Add `GeneratePresentationAction` to agent
2. Creates multi-slide layout
3. Organizes renders into presentation structure
4. Adds annotations and labels
5. Supports different presentation styles

**Presentation Styles**:
- Grid layout
- Linear flow
- Storyboard
- Portfolio

---

## Implementation Steps

### Step 1: Create Unified Input Component

**File**: `components/chat/unified-chat-input.tsx`

**Features**:
- Accepts `mode` prop: `'render' | 'agent' | 'auto'`
- Shows appropriate controls based on mode
- Unified model selector
- Mention tagger integration
- Context tools (agent mode only)

### Step 2: Update UnifiedChatInterface

**Changes**:
- Remove separate `RenderiqChatInput` from agent tab
- Use unified input for both tabs
- Pass mode to input component
- Handle routing in unified input

### Step 3: Enhance Routing

**File**: `lib/utils/agent-routing.ts`

**Add**:
- Canvas planning keywords
- Presentation keywords
- "Generate and place" mode
- Better hybrid detection

### Step 4: Add Image Placement Action

**File**: `agent-kit/shared/actions/PlaceRenderActionUtil.ts`

**Functionality**:
- Place render on canvas
- Auto-layout support
- Manual positioning
- Link to render in database

### Step 5: Add Presentation Action

**File**: `agent-kit/shared/actions/GeneratePresentationActionUtil.ts`

**Functionality**:
- Create presentation layout
- Organize renders
- Add annotations
- Support multiple styles

---

## File Structure After Merge

```
components/
  chat/
    unified-chat-interface.tsx (updated)
    unified-chat-input.tsx (new)
    mention-tagger.tsx (existing)
    
  agent/
    RenderiqChatHistory.tsx (keep)
    RenderiqTodoList.tsx (keep)
    RenderiqChatInput.tsx (deprecated - remove)
    
agent-kit/
  shared/
    actions/
      PlaceRenderActionUtil.ts (new)
      GeneratePresentationActionUtil.ts (new)
      
lib/
  utils/
    agent-routing.ts (enhanced)
```

---

## Benefits of Merge

1. **Unified UX**: Single input for all operations
2. **Consistent Model Selection**: Same selector for both modes
3. **Better Routing**: Smarter detection of user intent
4. **Seamless Workflow**: Generate → Place → Organize in one flow
5. **Reduced Code Duplication**: Single input component
6. **Better Discoverability**: All features in one place

---

## Migration Notes

1. **Backward Compatibility**: Existing agent chat will continue to work
2. **Gradual Rollout**: Can be feature-flagged
3. **User Education**: May need onboarding for new unified interface
4. **Performance**: Single input should be more performant

---

## Next Steps

1. ✅ Create audit document (this file)
2. ⏳ Create unified input component
3. ⏳ Update UnifiedChatInterface
4. ⏳ Enhance routing
5. ⏳ Add image placement action
6. ⏳ Add presentation action
7. ⏳ Testing & refinement

