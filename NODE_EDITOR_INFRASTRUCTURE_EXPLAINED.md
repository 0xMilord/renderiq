# Node Editor Infrastructure - Simple Explanation

## What is the Node Editor?

A visual workflow builder where you connect nodes (boxes) together to create AI image generation workflows. Think of it like a flowchart or Blender's node editor.

---

## How It Works - Simple Overview

### 1. **The Canvas** (The Big Picture)
- An infinite 2D space where you place nodes
- Built with React Flow library (@xyflow/react)
- You can pan, zoom, and drag nodes around

### 2. **Nodes** (The Building Blocks)
Each node is a box that does something:
- **Text Node**: You type a prompt
- **Image Node**: Generates an image from a prompt
- **Style Node**: Controls camera, lighting, environment settings
- **Material Node**: Defines materials (concrete, wood, etc.)
- **Variants Node**: Creates multiple variations of an image

### 3. **Connections** (The Wires)
- Connect nodes by dragging from an output (right side) to an input (left side)
- Data flows through connections (e.g., text from Text Node → Image Node)
- System validates connections (can't connect incompatible types)

### 4. **The Flow** (How Data Moves)
```
Text Node → Image Node → Variants Node
   ↓            ↓              ↓
"house"    [generates]    [4 variations]
```

---

## Key Components Explained Simply

### Node Factory (`lib/canvas/node-factory.ts`)
**What it does**: Creates nodes for you

**Why it exists**: Instead of manually creating node configurations everywhere, you use:
```typescript
NodeFactory.createNode('text', { x: 100, y: 100 })
```

**Key Features**:
- **Registry**: Defines all node types in one place
- **Templates**: Pre-made workflows (e.g., "Basic Workflow" = Text + Image)
- **Smart Positioning**: Automatically places new nodes so they don't overlap

**Example Templates**:
- `basic`: Text → Image
- `styled`: Text → Style → Image
- `complete`: Text → Style → Material → Image → Variants

---

### Connection Validator (`lib/canvas/connection-validator.ts`)
**What it does**: Checks if you can connect two nodes

**Rules**:
- Text can only connect to Text inputs
- Image can connect to Image or Variants inputs
- Style can only connect to Style inputs
- Material can only connect to Material inputs
- **No cycles**: Can't create loops (A → B → A)

**What happens**:
1. You try to connect two nodes
2. Validator checks: "Can these types connect?"
3. If yes → Connection created
4. If no → Error message shown

---

### Workflow Executor (`lib/canvas/workflow-executor.ts`)
**What it does**: Executes nodes in the right order

**How it works**:
1. **Builds dependency graph**: "Which nodes depend on which?"
2. **Topological sort**: Orders nodes so dependencies run first
3. **Executes in order**: Runs nodes that are ready (all dependencies completed)

**Example**:
```
Text Node (no dependencies) → runs first
Image Node (needs Text) → runs second
Variants Node (needs Image) → runs third
```

**Status**: This exists but is **not currently used** in the UI. It's infrastructure for future "Execute All" feature.

---

### Canvas History (`lib/canvas/canvas-history.ts`)
**What it does**: Undo/Redo system

**How it works**:
- Every change saves a "snapshot" of the canvas state
- Undo = go back to previous snapshot
- Redo = go forward to next snapshot

**Keyboard shortcuts**:
- Ctrl+Z = Undo
- Ctrl+Y = Redo

---

## Data Flow - Step by Step

### When You Open the Canvas

```
1. Page loads
   ↓
2. Fetches project and chain from database
   ↓
3. Fetches canvas graph (nodes + connections) from database
   ↓
4. Converts database format → React Flow format
   ↓
5. Renders nodes on canvas
```

### When You Add a Node

```
1. Click "Add Node" → Select type (e.g., "Text Node")
   ↓
2. NodeFactory.createNode('text') creates the node
   ↓
3. NodeFactory.getDefaultPosition() finds a spot (avoids overlap)
   ↓
4. Node added to canvas
   ↓
5. Auto-save triggers (after 1 second)
   ↓
6. Saves to database via API
```

### When You Connect Nodes

```
1. Drag from output handle (right side of node)
   ↓
2. Drop on input handle (left side of another node)
   ↓
3. ConnectionValidator checks:
   - Are types compatible?
   - Would this create a cycle?
   ↓
4. If valid → Connection created
   ↓
5. useEffect watches connections
   ↓
6. Updates target node's data with source node's output
   ↓
7. Auto-save triggers
```

### When You Generate an Image

```
1. Click "Generate" on Image Node
   ↓
2. Image Node collects data:
   - Prompt (from connected Text Node OR typed in)
   - Style settings (from connected Style Node OR defaults)
   - Material settings (from connected Material Node OR none)
   - Quality, aspect ratio, etc.
   ↓
3. Calls API to generate image
   ↓
4. Status: idle → generating → completed
   ↓
5. Image displayed in node
   ↓
6. Output available for connected nodes (e.g., Variants Node)
```

---

## Storage - Where Data Lives

### Database Table: `canvas_graphs`

Stores:
- **nodes**: Array of node objects (type, position, data)
- **connections**: Array of connection objects (source, target, handles)
- **viewport**: Camera position (x, y, zoom)

**Structure**:
```json
{
  "nodes": [
    {
      "id": "text-123",
      "type": "text",
      "position": { "x": 100, "y": 100 },
      "data": { "prompt": "A modern house" }
    }
  ],
  "connections": [
    {
      "id": "edge-456",
      "source": "text-123",
      "target": "image-789",
      "sourceHandle": "text",
      "targetHandle": "prompt"
    }
  ],
  "viewport": { "x": 0, "y": 0, "zoom": 1 }
}
```

### Auto-Save
- Saves automatically after 1 second of no changes
- Also saves on Ctrl+S
- Version number increments on each save

---

## Node Design Complexity - The Problem

### StyleNode - Too Many Controls

**Current**: 15+ controls all visible at once
- Camera: 4 controls
- Environment: 4 controls
- Lighting: 4 controls
- Atmosphere: 3 controls

**Problem**: 
- Node is 600-800px tall (requires scrolling)
- Overwhelming for users
- Hard to find specific settings

**Solution Needed**:
- Collapsible sections
- Presets (e.g., "Professional", "Dramatic")
- Hide advanced settings by default

### ImageNode - Conditional Complexity

**Current**: Different UI based on connections
- If connected to Text Node → Shows image preview
- If not connected → Shows textarea
- Multiple states and buttons

**Problem**:
- Complex conditional rendering
- Hard to maintain
- Inconsistent UX

**Solution Needed**:
- Consistent layout
- Extract settings to separate panel
- Simplify state management

---

## Architecture Summary

```
┌─────────────────────────────────────────┐
│         Canvas Editor Page              │
│  (app/canvas/[projectSlug]/[chatId])   │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│         CanvasEditor Component          │
│  (components/canvas/canvas-editor.tsx)  │
│  - React Flow wrapper                   │
│  - Node state management                │
│  - Connection handling                  │
└──────────────┬──────────────────────────┘
               │
       ┌───────┴───────┐
       │               │
       ▼               ▼
┌─────────────┐  ┌─────────────┐
│   Nodes     │  │  Toolbar    │
│  (5 types)  │  │  (Controls) │
└──────┬──────┘  └─────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│         Infrastructure Layer            │
│  - NodeFactory (creates nodes)          │
│  - ConnectionValidator (validates)      │
│  - WorkflowExecutor (executes)          │
│  - CanvasHistory (undo/redo)            │
└──────────────┬──────────────────────────┘
               │
       ┌───────┴───────┐
       │               │
       ▼               ▼
┌─────────────┐  ┌─────────────┐
│  useCanvas  │  │  CanvasDAL  │
│    Hook     │  │  (Database) │
└──────┬──────┘  └──────┬──────┘
       │                │
       └────────┬───────┘
                │
                ▼
        ┌───────────────┐
        │   API Route   │
        │  /api/canvas/ │
        └───────┬───────┘
                │
                ▼
        ┌───────────────┐
        │   Database    │
        │ canvas_graphs │
        └───────────────┘
```

---

## Key Takeaways

1. **Nodes are building blocks** - Each does one thing
2. **Connections pass data** - Output → Input
3. **Factory creates nodes** - Don't create manually
4. **Validator checks connections** - Prevents errors
5. **Auto-save keeps work safe** - Saves every second
6. **History enables undo/redo** - Ctrl+Z works

### Main Issues

1. **StyleNode is too complex** - Too many controls, needs simplification
2. **ImageNode is complex** - Conditional UI makes it hard to use
3. **No server actions** - Uses API routes instead (inconsistent pattern)
4. **WorkflowExecutor unused** - Infrastructure exists but not in UI

---

**Simple Summary**: The node editor is like a visual programming language for AI image generation. You connect boxes (nodes) together, data flows through connections, and the system validates everything. The main problem is that some nodes (especially StyleNode) have too many controls and need to be simplified.

