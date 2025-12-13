# tldraw Agent Starter Kit Integration Plan
## Integrating AI-Powered Canvas with Existing Chat Interface

**Date**: 2025-01-27  
**Status**: Ready for Implementation  
**Approach**: Use tldraw Agent Starter Kit + Existing Chat Interface

---

## Executive Summary

This plan integrates **tldraw's Agent Starter Kit** with Renderiq's existing unified chat interface. The Agent Starter Kit provides a battle-tested pattern for AI agents that can interpret and manipulate canvas based on chat input - perfect for our use case.

**Key Advantages**:
- ✅ **Proven architecture**: tldraw's Agent Starter Kit is production-ready
- ✅ **AI integration**: Built-in support for Anthropic, OpenAI, Google models
- ✅ **Visual context**: Agent can see canvas screenshots and shape data
- ✅ **Action system**: Modular actions for canvas manipulation
- ✅ **Streaming**: Real-time AI responses with canvas updates
- ✅ **Chat + Canvas**: Perfect pattern for our existing chat + new canvas

**What We're Building**:
1. **Canvas Integration**: Add tldraw canvas to render display area
2. **Agent Connection**: Connect existing chat messages to agent actions
3. **Render Integration**: Auto-add generated renders to canvas as image shapes
4. **Mask Actions**: Create agent actions for mask-based inpainting
5. **Custom Actions**: Agent actions specific to Renderiq's render pipeline

---

## Architecture Overview

### Current State
```
┌─────────────────────────────────────────────────────────┐
│         UnifiedChatInterface                            │
│  ┌──────────────────┐  ┌──────────────────────────────┐│
│  │  Chat Sidebar    │  │   Static Image Display       ││
│  │  (1/4 width)     │  │   (3/4 width)                ││
│  │                  │  │                              ││
│  │  ✅ Messages     │  │  ❌ No canvas                ││
│  │  ✅ Input        │  │  ❌ No agent                 ││
│  │  ✅ Settings     │  │  ❌ Static only              ││
│  │  ✅ Versions     │  │                              ││
│  └──────────────────┘  └──────────────────────────────┘│
└─────────────────────────────────────────────────────────┘
```

### Target State
```
┌─────────────────────────────────────────────────────────┐
│         UnifiedChatInterface                            │
│  ┌──────────────────┐  ┌──────────────────────────────┐│
│  │  Chat Sidebar    │  │   Tldraw Canvas + Agent      ││
│  │  (1/4 width)     │  │   (3/4 width)                ││
│  │                  │  │                              ││
│  │  ✅ Messages     │  │  ✅ tldraw canvas            ││
│  │  ✅ Input        │  │  ✅ Agent actions            ││
│  │  ✅ Settings     │  │  ✅ Generated renders        ││
│  │  ✅ Versions     │  │  ✅ Mask tool                ││
│  │                  │  │  ✅ Layer management         ││
│  │  [Chat → Agent]  │  │  [Agent → Canvas]           ││
│  └──────────────────┘  └──────────────────────────────┘│
└─────────────────────────────────────────────────────────┘
```

### Data Flow

```
User Types Message in Chat
  ↓
1. Send to Renderiq Render Pipeline (existing)
  ↓
2. Generate Render → Image URL returned
  ↓
3. Agent Action: "AddRenderImageAction"
  ↓
4. tldraw Canvas: Creates image shape
  ↓
5. User: "Draw a mask on this render"
  ↓
6. Agent Action: "CreateMaskAction" → Mask tool activated
  ↓
7. User: "Inpaint the masked region with 'glass door'"
  ↓
8. Agent Action: "InpaintMaskedRegionAction"
  ↓
9. Renderiq API: POST /api/renders/inpaint
  ↓
10. New render generated → Agent adds to canvas
```

---

## Implementation Steps

### Step 1: Install tldraw Agent Starter Kit

```bash
# Create a new tldraw project with agent template
npm create tldraw@latest renderiq-canvas -- --template agent

# This creates:
# - tldraw setup
# - Agent utilities
# - Chat panel (we'll adapt this to our existing chat)
# - Action system
```

**Or install manually**:
```bash
npm install @tldraw/tldraw
npm install @tldraw/editor
npm install zod  # For action schemas
```

---

### Step 2: Create Canvas Component

**New File**: `components/canvas/renderiq-canvas.tsx`

```typescript
'use client';

import { Tldraw } from '@tldraw/tldraw';
import '@tldraw/tldraw/tldraw.css';
import { Editor } from '@tldraw/editor';
import { useTldrawAgent } from '@/lib/agent/use-tldraw-agent';
import { Render } from '@/lib/types/render';

interface RenderiqCanvasProps {
  currentRender: Render | null;
  chainId?: string;
  onAgentMessage?: (message: string) => void;
  onRenderAdded?: (render: Render) => void;
}

export function RenderiqCanvas({
  currentRender,
  chainId,
  onAgentMessage,
  onRenderAdded,
}: RenderiqCanvasProps) {
  const editorRef = useRef<Editor | null>(null);
  
  // Initialize agent (we'll create this hook)
  const agent = useTldrawAgent(editorRef.current, {
    // Custom configuration
    onMessage: onAgentMessage,
    onRenderAdded: onRenderAdded,
  });

  // Handle new renders from chat
  useEffect(() => {
    if (!currentRender?.outputUrl || !agent) return;
    
    // Use agent to add render to canvas
    agent.prompt({
      message: `Add this render to the canvas: ${currentRender.outputUrl}`,
      // Agent will use AddRenderImageAction to add the image
    });
  }, [currentRender?.id, currentRender?.outputUrl, agent]);

  return (
    <div className="w-full h-full relative">
      <Tldraw
        onMount={(editor) => {
          editorRef.current = editor;
        }}
        // Hide default UI, we'll use our own
        hideUi
      />
      
      {/* Custom toolbar for Renderiq-specific actions */}
      <CanvasToolbar agent={agent} currentRender={currentRender} />
    </div>
  );
}
```

---

### Step 3: Create Custom Agent Actions

**New File**: `lib/agent/actions/renderiq-actions.ts`

These actions extend tldraw's agent system with Renderiq-specific capabilities.

#### Action 1: Add Render Image to Canvas

```typescript
import { z } from 'zod';
import { AgentActionUtil } from '@tldraw/tldraw';
import { Render } from '@/lib/types/render';

const AddRenderImageAction = z
  .object({
    _type: z.literal('add-render-image'),
    renderId: z.string(),
    imageUrl: z.string(),
    x: z.number().optional(),
    y: z.number().optional(),
    width: z.number().optional(),
    height: z.number().optional(),
  })
  .meta({
    title: 'Add Render Image',
    description: 'Add a generated render image to the canvas.',
  });

type AddRenderImageAction = z.infer<typeof AddRenderImageAction>;

export class AddRenderImageActionUtil extends AgentActionUtil<AddRenderImageAction> {
  static override type = 'add-render-image' as const;

  override getSchema() {
    return AddRenderImageAction;
  }

  override getInfo(action: Streaming<AddRenderImageAction>) {
    return {
      icon: 'image' as const,
      description: 'Added render image to canvas',
    };
  }

  override applyAction(action: Streaming<AddRenderImageAction>, helpers: AgentHelpers) {
    if (!action.complete) return;
    if (!this.editor) return;

    const { imageUrl, x, y, width, height } = action;

    // Default position to center if not specified
    const position = x !== undefined && y !== undefined
      ? helpers.removeOffsetFromVec({ x, y })
      : this.editor.getViewportPageBounds().center;

    // Default size
    const w = width || 1200;
    const h = height || 800;

    // Create image shape
    this.editor.createShape({
      type: 'image',
      id: createShapeId(),
      x: position.x - w / 2,
      y: position.y - h / 2,
      props: {
        w,
        h,
        url: imageUrl,
      },
    });
  }
}
```

#### Action 2: Create Mask for Inpainting

```typescript
const CreateMaskAction = z
  .object({
    _type: z.literal('create-mask'),
    shapeId: z.string(), // The render image shape to mask
    maskType: z.enum(['brush', 'polygon', 'rectangle']),
    prompt: z.string().optional(), // Optional inpainting prompt
  })
  .meta({
    title: 'Create Mask',
    description: 'Create a mask on a render image for inpainting.',
  });

type CreateMaskAction = z.infer<typeof CreateMaskAction>;

export class CreateMaskActionUtil extends AgentActionUtil<CreateMaskAction> {
  static override type = 'create-mask' as const;

  override getSchema() {
    return CreateMaskAction;
  }

  override getInfo(action: Streaming<CreateMaskAction>) {
    return {
      icon: 'pencil' as const,
      description: 'Created mask for inpainting',
    };
  }

  override applyAction(action: Streaming<CreateMaskAction>, helpers: AgentHelpers) {
    if (!action.complete) return;
    if (!this.editor) return;

    // Activate mask tool on the specified shape
    // This will trigger the mask overlay UI
    const shape = this.editor.getShape(helpers.ensureShapeIdExists(action.shapeId));
    
    if (shape) {
      // Store mask state
      this.editor.updateShape({
        id: shape.id,
        meta: {
          ...shape.meta,
          maskMode: true,
          maskType: action.maskType,
          inpaintingPrompt: action.prompt,
        },
      });
    }
  }
}
```

#### Action 3: Inpaint Masked Region

```typescript
const InpaintMaskedRegionAction = z
  .object({
    _type: z.literal('inpaint-masked-region'),
    shapeId: z.string(), // The render image shape
    maskData: z.string(), // Base64 PNG mask
    prompt: z.string(),
    quality: z.enum(['standard', 'high', 'ultra']).default('high'),
  })
  .meta({
    title: 'Inpaint Masked Region',
    description: 'Generate a new render with masked region inpainted.',
  });

type InpaintMaskedRegionAction = z.infer<typeof InpaintMaskedRegionAction>;

export class InpaintMaskedRegionActionUtil extends AgentActionUtil<InpaintMaskedRegionAction> {
  static override type = 'inpaint-masked-region' as const;

  override getSchema() {
    return InpaintMaskedRegionAction;
  }

  override getInfo(action: Streaming<InpaintMaskedRegionAction>) {
    return {
      icon: 'sparkles' as const,
      description: 'Inpainting masked region...',
    };
  }

  override async applyAction(action: Streaming<InpaintMaskedRegionAction>, helpers: AgentHelpers) {
    if (!action.complete) return;
    if (!this.editor) return;

    const shape = this.editor.getShape(helpers.ensureShapeIdExists(action.shapeId));
    if (!shape || shape.type !== 'image') return;

    const imageUrl = shape.props.url;

    try {
      // Call Renderiq inpainting API
      const response = await fetch('/api/renders/inpaint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageUrl,
          maskData: action.maskData,
          prompt: action.prompt,
          quality: action.quality,
        }),
      });

      const result = await response.json();

      if (result.success && result.data?.outputUrl) {
        // Create new render image shape
        this.editor.createShape({
          type: 'image',
          id: createShapeId(),
          x: shape.x,
          y: shape.y + shape.props.h + 20, // Place below original
          props: {
            w: shape.props.w,
            h: shape.props.h,
            url: result.data.outputUrl,
          },
        });

        // Schedule follow-up message
        if (this.agent) {
          this.agent.schedule({
            message: `Inpainting complete! New render added to canvas.`,
          });
        }
      }
    } catch (error) {
      console.error('Inpainting failed:', error);
      if (this.agent) {
        this.agent.schedule({
          message: `Inpainting failed: ${error.message}`,
        });
      }
    }
  }
}
```

#### Action 4: Arrange Renders

```typescript
const ArrangeRendersAction = z
  .object({
    _type: z.literal('arrange-renders'),
    arrangement: z.enum(['horizontal', 'vertical', 'grid', 'stack']),
    spacing: z.number().default(20),
  })
  .meta({
    title: 'Arrange Renders',
    description: 'Arrange render images on the canvas.',
  });

type ArrangeRendersAction = z.infer<typeof ArrangeRendersAction>;

export class ArrangeRendersActionUtil extends AgentActionUtil<ArrangeRendersAction> {
  static override type = 'arrange-renders' as const;

  override getSchema() {
    return ArrangeRendersAction;
  }

  override applyAction(action: Streaming<ArrangeRendersAction>, helpers: AgentHelpers) {
    if (!action.complete) return;
    if (!this.editor) return;

    const { editor } = this;
    const renderImages = editor.getCurrentPageShapes().filter(
      (s) => s.type === 'image'
    );

    if (renderImages.length === 0) return;

    // Arrange images based on arrangement type
    // (Implementation depends on arrangement type)
    // ...
  }
}
```

---

### Step 4: Configure Agent with Renderiq Actions

**New File**: `lib/agent/agent-utils.ts`

```typescript
import { PROMPT_PART_UTILS, AGENT_ACTION_UTILS } from '@tldraw/tldraw';
import { AddRenderImageActionUtil } from './actions/renderiq-actions';
import { CreateMaskActionUtil } from './actions/renderiq-actions';
import { InpaintMaskedRegionActionUtil } from './actions/renderiq-actions';
import { ArrangeRendersActionUtil } from './actions/renderiq-actions';

// Add Renderiq actions to the agent
export const RENDERIQ_AGENT_ACTIONS = [
  // ... default tldraw actions ...
  AddRenderImageActionUtil,
  CreateMaskActionUtil,
  InpaintMaskedRegionActionUtil,
  ArrangeRendersActionUtil,
];

// Custom prompt parts for Renderiq context
export class RenderiqContextPartUtil extends PromptPartUtil {
  static override type = 'renderiq-context' as const;

  override getPart(): RenderiqContextPart {
    return {
      type: 'renderiq-context',
      chainId: this.chainId,
      currentRender: this.currentRender,
    };
  }

  override buildContent({ chainId, currentRender }: RenderiqContextPart) {
    return [
      `You are working with Renderiq, an AI image generation platform.`,
      `Current render chain: ${chainId}`,
      currentRender ? `Current render: ${currentRender.id} - ${currentRender.prompt}` : 'No current render',
      `You can add renders to the canvas, create masks, and inpaint regions.`,
    ];
  }
}
```

---

### Step 5: Integrate with Existing Chat

**Modify**: `components/chat/unified-chat-interface.tsx`

```typescript
// Add canvas import
import { RenderiqCanvas } from '@/components/canvas/renderiq-canvas';

// In component:
const [agentMessages, setAgentMessages] = useState<string[]>([]);

// Replace render display area (lines ~3724-4328)
<div className={cn(
  "flex-1 flex flex-col overflow-hidden min-h-0 min-w-0",
  "lg:w-3/4 lg:flex-shrink-0",
  mobileView === 'render' ? 'flex' : 'hidden lg:flex'
)}>
  {/* Keep existing toolbar */}
  <div className="border-b border-border shrink-0 z-10">
    {/* ... existing toolbar code ... */}
  </div>

  {/* Replace static image with canvas */}
  <RenderiqCanvas
    currentRender={renderWithLatestData}
    chainId={chainId}
    onAgentMessage={(message) => {
      // Add agent message to chat
      addMessage({
        id: `agent-${Date.now()}`,
        type: 'assistant',
        content: message,
        timestamp: new Date(),
      });
    }}
    onRenderAdded={(newRender) => {
      // Handle new render added to canvas
      setCurrentRender(newRender);
      onRenderComplete?.(newRender);
    }}
  />
</div>

// Modify handleSendMessage to optionally route to agent
const handleSendMessage = async () => {
  if (!inputValue.trim()) return;

  // Check if message is a canvas command
  const isCanvasCommand = inputValue.startsWith('/canvas') || 
                         inputValue.includes('on canvas') ||
                         inputValue.includes('mask') ||
                         inputValue.includes('arrange');

  if (isCanvasCommand && agent) {
    // Route to agent instead of render pipeline
    agent.prompt({
      message: inputValue,
      chainId,
      currentRender: currentRender,
    });
    setInputValue('');
    return;
  }

  // Otherwise, use existing render pipeline
  // ... existing handleSendMessage code ...
};
```

---

### Step 6: Create Agent Hook

**New File**: `lib/agent/use-tldraw-agent.ts`

```typescript
'use client';

import { Editor } from '@tldraw/editor';
import { useTldrawAgent as useTldrawAgentBase } from '@tldraw/tldraw';
import { RENDERIQ_AGENT_ACTIONS } from './agent-utils';

export function useTldrawAgent(
  editor: Editor | null,
  options?: {
    onMessage?: (message: string) => void;
    onRenderAdded?: (render: Render) => void;
    chainId?: string;
    currentRender?: Render | null;
  }
) {
  const agent = useTldrawAgentBase(editor, {
    // Use Renderiq actions
    actions: RENDERIQ_AGENT_ACTIONS,
    
    // Custom model configuration (use Gemini for consistency with Renderiq)
    modelName: 'gemini-2.5-flash',
    
    // Custom handlers
    onMessage: options?.onMessage,
  });

  return agent;
}
```

---

### Step 7: Add Canvas State Persistence

**New File**: `lib/agent/canvas-persistence.ts`

```typescript
import { Editor } from '@tldraw/editor';
import { RendersDAL } from '@/lib/dal/renders';

export async function saveCanvasState(
  editor: Editor,
  chainId: string,
  renderId: string
) {
  // Get canvas state
  const canvasState = editor.store.serialize();

  // Save to render's contextData
  await RendersDAL.update(renderId, {
    contextData: {
      canvasState: {
        version: '1.0.0',
        canvasData: canvasState,
        savedAt: new Date().toISOString(),
      },
    },
  });
}

export async function loadCanvasState(
  editor: Editor,
  chainId: string,
  latestRenderId?: string
) {
  if (!latestRenderId) return;

  const render = await RendersDAL.getById(latestRenderId);
  const canvasState = render?.contextData?.canvasState;

  if (canvasState?.canvasData) {
    // Load canvas state
    editor.store.deserialize(canvasState.canvasData);
  }
}
```

---

## Integration with Existing Infrastructure

### 7-Stage Pipeline Integration

The agent actions integrate seamlessly with your existing pipeline:

```typescript
// In InpaintMaskedRegionActionUtil
const result = await RenderPipeline.generateRender({
  prompt: action.prompt,
  referenceImageData: await fetchImageAsBase64(imageUrl),
  maskData: action.maskData, // NEW: Pass mask
  quality: action.quality,
  chainId: options.chainId,
  // Pipeline handles: semantic parsing, optimization, generation, etc.
});
```

### Database Integration

Canvas state stored in existing `contextData` JSONB field:

```typescript
// No schema changes needed!
renders.contextData = {
  // Existing pipeline context
  successfulElements: [...],
  previousPrompts: [...],
  
  // NEW: Canvas state
  canvasState: {
    version: '1.0.0',
    canvasData: { /* tldraw serialized state */ },
    layers: [...],
    masks: [...],
  },
};
```

---

## UI Components

### Canvas Toolbar

**New File**: `components/canvas/canvas-toolbar.tsx`

```typescript
interface CanvasToolbarProps {
  agent: TldrawAgent | null;
  currentRender: Render | null;
}

export function CanvasToolbar({ agent, currentRender }: CanvasToolbarProps) {
  return (
    <div className="absolute top-4 right-4 z-50 flex gap-2">
      <Button
        onClick={() => agent?.prompt('Arrange all renders in a grid')}
        variant="outline"
      >
        Arrange
      </Button>
      
      <Button
        onClick={() => agent?.prompt('Create a mask on the current render')}
        variant="outline"
      >
        Mask Tool
      </Button>
      
      <Button
        onClick={() => agent?.prompt('Export canvas as image')}
        variant="outline"
      >
        Export
      </Button>
    </div>
  );
}
```

---

## Testing Strategy

### Unit Tests

```typescript
// Test agent actions
describe('AddRenderImageAction', () => {
  it('should add render image to canvas', async () => {
    const action = { _type: 'add-render-image', imageUrl: '...', renderId: '...' };
    const util = new AddRenderImageActionUtil();
    await util.applyAction(action, helpers);
    // Assert image shape created
  });
});
```

### Integration Tests

```typescript
// Test agent + canvas integration
describe('RenderiqCanvas', () => {
  it('should add render to canvas when render completes', async () => {
    // Generate render
    const render = await generateRender(...);
    // Assert agent receives render
    // Assert canvas shows image
  });
});
```

---

## Migration Path

### Phase 1: Basic Canvas (Week 1)
- ✅ Install tldraw
- ✅ Create RenderiqCanvas component
- ✅ Add basic AddRenderImageAction
- ✅ Replace static image with canvas

### Phase 2: Agent Integration (Week 2)
- ✅ Create agent hook
- ✅ Connect chat messages to agent
- ✅ Add mask actions
- ✅ Add inpainting action

### Phase 3: Advanced Features (Week 3)
- ✅ Layer management
- ✅ Canvas state persistence
- ✅ Export functionality
- ✅ Custom Renderiq actions

---

## Performance Considerations

### Canvas Performance
- **Lazy loading**: Load full-res images only when zoomed
- **Debounced saves**: Auto-save canvas state every 2s
- **Virtual rendering**: Only render shapes in viewport

### Agent Performance
- **Streaming**: Real-time agent responses
- **Caching**: Cache canvas screenshots for agent context
- **Batch actions**: Group multiple actions together

---

## Success Metrics

- **Canvas usage**: % of renders that use canvas
- **Agent interactions**: % of messages that trigger agent actions
- **Mask usage**: % of renders that use masking
- **Canvas persistence**: % of sessions that save/restore canvas state

---

## Next Steps

1. **Install tldraw**: `npm install @tldraw/tldraw @tldraw/editor`
2. **Create canvas component**: Start with basic tldraw setup
3. **Add first action**: Implement AddRenderImageAction
4. **Connect to chat**: Route canvas commands to agent
5. **Iterate**: Add more actions based on user feedback

---

**Document Version**: 1.0  
**Last Updated**: 2025-01-27  
**Status**: Ready for Implementation

