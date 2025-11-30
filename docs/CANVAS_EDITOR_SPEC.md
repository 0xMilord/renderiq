# Canvas-Based Node Editor Specification

## Overview

A Blender-style node-based visual editor for creating and managing AI render workflows. The editor will be accessible at `/canvas/[project-slug]/[chat-id]` and use React Flow for the node-based interface.

## Table of Contents

1. [Infrastructure Analysis](#infrastructure-analysis)
2. [Route Structure](#route-structure)
3. [Node System Architecture](#node-system-architecture)
4. [Initial Node Types](#initial-node-types)
5. [Data Flow](#data-flow)
6. [Implementation Plan](#implementation-plan)
7. [Database Schema](#database-schema)
8. [API Endpoints](#api-endpoints)

---

## Infrastructure Analysis

### Current Routing Structure

#### Project System
- **Route Pattern**: `/[projectSlug]/chat/[chainId]`
- **Project Lookup**: Projects are identified by `slug` (unique, URL-friendly identifier)
- **Project Data**: Stored in `projects` table with fields:
  - `id` (UUID)
  - `slug` (unique text)
  - `name`, `description`, `userId`
  - `status`, `isPublic`, `tags`, `metadata`

#### Chat/Chain System
- **Chain ID**: Render chains are identified by UUID (`chainId`)
- **Chain Data**: Stored in `renderChains` table:
  - `id` (UUID)
  - `projectId` (references projects)
  - `name`, `description`
  - Related to `renders` table via `chainId` foreign key

#### Current Route Files
- `app/[projectSlug]/chat/[chainId]/page.tsx` - Chat interface
- `app/dashboard/projects/[slug]/page.tsx` - Project detail page
- `app/dashboard/projects/[slug]/chain/[chainId]/page.tsx` - Chain detail page

### Data Flow
1. User navigates to `/canvas/project-slug/chat-id`
2. System fetches project by slug using `useProjectBySlug(slug)`
3. System fetches chain by ID using `useRenderChain(chainId)`
4. Canvas editor loads with node graph state

---

## Route Structure

### New Route: `/canvas/[projectSlug]/[chatId]`

**File Location**: `app/canvas/[projectSlug]/[chatId]/page.tsx`

**Route Parameters**:
- `projectSlug`: Project identifier (string, URL-friendly)
- `chatId`: Render chain ID (UUID string)

**Example URLs**:
- `/canvas/my-architecture-project/550e8400-e29b-41d4-a716-446655440000`
- `/canvas/modern-house-design/123e4567-e89b-12d3-a456-426614174000`

**Access Control**:
- User must be authenticated
- User must own the project (verified via `project.userId`)
- Chain must belong to the project (verified via `chain.projectId`)

---

## Node System Architecture

### Core Concepts

#### Node Graph
- **Canvas**: Infinite 2D space where nodes are placed
- **Nodes**: Individual processing units (Text, Image, Variants, etc.)
- **Connections**: Directed edges between node outputs and inputs
- **Execution**: Nodes execute in topological order based on connections

#### Node Structure
```typescript
interface CanvasNode {
  id: string;                    // Unique node ID
  type: NodeType;                // Node type (text, image, variants, etc.)
  position: { x: number; y: number };  // Canvas position
  data: NodeData;                // Node-specific data
  inputs: NodeInput[];           // Input ports
  outputs: NodeOutput[];         // Output ports
}

interface NodeInput {
  id: string;
  name: string;
  type: DataType;                // string, image, number, etc.
  required: boolean;
  defaultValue?: any;
}

interface NodeOutput {
  id: string;
  name: string;
  type: DataType;
}
```

#### Connection Structure
```typescript
interface NodeConnection {
  id: string;
  sourceNodeId: string;
  sourceOutputId: string;
  targetNodeId: string;
  targetInputId: string;
}
```

---

## Initial Node Types

### 1. Text Node

**Purpose**: Input and edit text prompts for image generation

**Node Type**: `text`

**Inputs**:
- None (root node)

**Outputs**:
- `text` (string): The prompt text

**Data Structure**:
```typescript
interface TextNodeData {
  prompt: string;
  placeholder?: string;
}
```

**UI Components**:
- Large textarea for prompt input
- Character counter
- Formatting hints
- Auto-save on blur

**Features**:
- Multi-line text input
- Real-time validation
- Prompt suggestions
- History/undo support

---

### 2. Image Node

**Purpose**: Generate images from prompts with AI

**Node Type**: `image`

**Inputs**:
- `prompt` (string, required): Text prompt from Text Node
- `referenceImage` (image, optional): Reference image for image-to-image

**Outputs**:
- `image` (image): Generated image URL
- `prompt` (string): Final prompt used (may be enhanced)
- `settings` (object): Render settings used

**Data Structure**:
```typescript
interface ImageNodeData {
  prompt: string;                // From input or manual entry
  settings: {
    style: string;               // e.g., 'architectural', 'modern', 'photorealistic'
    quality: 'standard' | 'high' | 'ultra';
    aspectRatio: string;         // e.g., '16:9', '1:1', '4:3'
    negativePrompt?: string;
    seed?: number;
  };
  status: 'idle' | 'generating' | 'completed' | 'error';
  outputUrl?: string;
  errorMessage?: string;
  generatedAt?: Date;
}
```

**UI Components**:
- **Generate Button**: Triggers image generation
- **Prompt Enhancement Button**: Uses AI to improve prompt
- **Settings Panel**: Style, quality, aspect ratio selectors
- **Preview Area**: Shows generated image or placeholder
- **Status Indicator**: Loading, success, error states

**Actions**:
1. **Generate**: Calls `/api/ai/generate-image` with prompt and settings
2. **Enhance Prompt**: Calls `/api/ai/enhance-prompt` to improve prompt
3. **Regenerate**: Re-generate with same settings
4. **Download**: Download generated image

**Integration**:
- Uses existing `/api/ai/generate-image` endpoint
- Creates `Render` record in database
- Updates `renderChains` with new render
- Deducts credits via `BillingService.deductCredits()`

---

### 3. Variants Node

**Purpose**: Generate multiple variations of an input image

**Node Type**: `variants`

**Inputs**:
- `sourceImage` (image, required): Image to create variants from
- `prompt` (string, optional): Additional prompt modifications
- `count` (number, optional): Number of variants to generate (default: 4)

**Outputs**:
- `variants` (array<image>): Array of variant image URLs
- `metadata` (object): Variant generation metadata

**Data Structure**:
```typescript
interface VariantsNodeData {
  sourceImageUrl?: string;
  prompt?: string;
  count: number;                 // Number of variants (1-8)
  settings: {
    variationStrength: number;   // 0.0 - 1.0
    style?: string;
    quality: 'standard' | 'high' | 'ultra';
  };
  status: 'idle' | 'generating' | 'completed' | 'error';
  variants: Array<{
    id: string;
    url: string;
    prompt: string;
    settings: object;
  }>;
  errorMessage?: string;
}
```

**UI Components**:
- **Source Image Preview**: Shows input image
- **Variant Count Slider**: 1-8 variants
- **Variation Strength Slider**: 0.0 - 1.0
- **Generate Variants Button**: Triggers generation
- **Variant Grid**: Displays all generated variants
- **Select Variant**: Click to use variant as output

**Actions**:
1. **Generate Variants**: Creates multiple renders with variations
2. **Select Variant**: Choose which variant to pass to next node
3. **Regenerate**: Create new set of variants

**Integration**:
- Uses `/api/ai/generate-image` with variation parameters
- Creates multiple `Render` records (one per variant)
- Links variants via `parentRenderId` in renders table

---

## Data Flow

### Execution Flow

```
Text Node → Image Node → Variants Node
   ↓           ↓              ↓
 prompt    [Generate]    [Generate Variants]
   ↓           ↓              ↓
   └───────────┴──────────────┘
              ↓
         Output Image(s)
```

### Node Execution Order

1. **Text Node**: Always executes first (no dependencies)
   - Outputs: `{ text: string }`

2. **Image Node**: Executes after Text Node
   - Receives: `prompt` from Text Node
   - Outputs: `{ image: string, prompt: string, settings: object }`

3. **Variants Node**: Executes after Image Node
   - Receives: `sourceImage` from Image Node
   - Outputs: `{ variants: Array<image>, metadata: object }`

### State Management

**Canvas State**:
```typescript
interface CanvasState {
  nodes: CanvasNode[];
  connections: NodeConnection[];
  selectedNodeId: string | null;
  viewport: {
    x: number;
    y: number;
    zoom: number;
  };
  executionState: {
    executing: boolean;
    currentNodeId: string | null;
    results: Record<string, any>;
  };
}
```

**Persistence**:
- Canvas state saved to database in `renderChains.metadata` or new `canvasGraphs` table
- Auto-save on node changes
- Version history for undo/redo

---

## Implementation Plan

### Phase 1: Foundation (Week 1)

#### 1.1 Install Dependencies
```bash
npm install reactflow @xyflow/react
npm install @types/reactflow --save-dev
```

#### 1.2 Create Route Structure
- Create `app/canvas/[projectSlug]/[chatId]/page.tsx`
- Implement authentication and authorization
- Fetch project and chain data
- Create loading and error states

#### 1.3 Set Up React Flow Canvas
- Create `components/canvas/canvas-editor.tsx`
- Configure React Flow with:
  - Custom node types
  - Connection validation
  - Pan and zoom controls
  - Mini-map
  - Controls toolbar

#### 1.4 Database Schema Extension
- Add `canvasGraphs` table (optional, or use `renderChains.metadata`)
- Store node graph state as JSON

### Phase 2: Text Node (Week 1-2)

#### 2.1 Text Node Component
- Create `components/canvas/nodes/text-node.tsx`
- Implement textarea input
- Handle node data updates
- Connect to React Flow

#### 2.2 Text Node Logic
- Validate text input
- Emit output data on change
- Auto-save functionality

### Phase 3: Image Node (Week 2-3)

#### 3.1 Image Node Component
- Create `components/canvas/nodes/image-node.tsx`
- Implement settings panel
- Add generate button
- Create preview area

#### 3.2 Image Generation Integration
- Connect to `/api/ai/generate-image`
- Handle async generation
- Update node state during generation
- Display generated image
- Error handling

#### 3.3 Prompt Enhancement
- Add "Enhance Prompt" button
- Connect to `/api/ai/enhance-prompt`
- Update prompt in Text Node or Image Node

### Phase 4: Variants Node (Week 3-4)

#### 4.1 Variants Node Component
- Create `components/canvas/nodes/variants-node.tsx`
- Implement variant count selector
- Add variation strength slider
- Create variant grid display

#### 4.2 Variant Generation
- Generate multiple renders
- Handle batch generation
- Display all variants
- Allow variant selection

### Phase 5: Polish & Testing (Week 4)

#### 5.1 UI/UX Improvements
- Node styling and theming
- Animations and transitions
- Keyboard shortcuts
- Context menus

#### 5.2 Error Handling
- Network error handling
- Validation errors
- User-friendly error messages

#### 5.3 Testing
- Unit tests for node logic
- Integration tests for API calls
- E2E tests for user flows

---

## Database Schema

### Option 1: Store in Existing Table

**Use `renderChains.metadata` field**:
```typescript
// In renderChains table (already exists)
metadata: jsonb('metadata').$type<{
  canvasGraph?: {
    nodes: CanvasNode[];
    connections: NodeConnection[];
    viewport: { x: number; y: number; zoom: number };
    lastSaved: Date;
  };
}>();
```

### Option 2: New Table (Recommended)

**Create `canvasGraphs` table**:
```sql
CREATE TABLE canvas_graphs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chain_id UUID REFERENCES render_chains(id) ON DELETE CASCADE NOT NULL,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  nodes JSONB NOT NULL,
  connections JSONB NOT NULL,
  viewport JSONB,
  version INTEGER DEFAULT 1 NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
  UNIQUE(chain_id)
);
```

**Drizzle Schema**:
```typescript
export const canvasGraphs = pgTable('canvas_graphs', {
  id: uuid('id').primaryKey().defaultRandom(),
  chainId: uuid('chain_id').references(() => renderChains.id, { onDelete: 'cascade' }).notNull(),
  projectId: uuid('project_id').references(() => projects.id, { onDelete: 'cascade' }).notNull(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  nodes: jsonb('nodes').$type<CanvasNode[]>().notNull(),
  connections: jsonb('connections').$type<NodeConnection[]>().notNull(),
  viewport: jsonb('viewport').$type<{ x: number; y: number; zoom: number }>(),
  version: integer('version').default(1).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
```

---

## API Endpoints

### Canvas Graph Management

#### GET `/api/canvas/[chainId]/graph`
Get canvas graph state for a chain.

**Response**:
```json
{
  "success": true,
  "data": {
    "nodes": [...],
    "connections": [...],
    "viewport": { "x": 0, "y": 0, "zoom": 1 }
  }
}
```

#### POST `/api/canvas/[chainId]/graph`
Save canvas graph state.

**Request Body**:
```json
{
  "nodes": [...],
  "connections": [...],
  "viewport": { "x": 0, "y": 0, "zoom": 1 }
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "updatedAt": "2024-01-01T00:00:00Z"
  }
}
```

### Node Execution

#### POST `/api/canvas/[chainId]/execute-node`
Execute a specific node in the graph.

**Request Body**:
```json
{
  "nodeId": "node-uuid",
  "inputData": {
    "prompt": "modern house",
    "settings": {...}
  }
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "outputData": {
      "image": "https://...",
      "prompt": "enhanced prompt",
      "settings": {...}
    },
    "renderId": "render-uuid"
  }
}
```

---

## File Structure

```
app/
  canvas/
    [projectSlug]/
      [chatId]/
        page.tsx                    # Main canvas page

components/
  canvas/
    canvas-editor.tsx              # Main React Flow canvas
    canvas-toolbar.tsx             # Toolbar with controls
    canvas-minimap.tsx             # Mini-map component
    nodes/
      base-node.tsx                # Base node component
      text-node.tsx                # Text input node
      image-node.tsx               # Image generation node
      variants-node.tsx            # Variants generation node
    node-types.ts                  # Node type definitions
    node-utils.ts                  # Node utility functions

lib/
  canvas/
    canvas-state.ts                # Canvas state management
    node-execution.ts              # Node execution engine
    graph-validation.ts            # Graph validation logic
  dal/
    canvas.ts                      # Canvas data access layer
  actions/
    canvas.actions.ts              # Canvas server actions
  hooks/
    use-canvas.ts                  # Canvas hook
    use-node-execution.ts          # Node execution hook

api/
  canvas/
    [chainId]/
      graph/
        route.ts                   # GET/POST graph state
      execute-node/
        route.ts                   # POST execute node
```

---

## Technical Stack

### Core Libraries
- **React Flow** (`@xyflow/react`): Node-based UI framework
- **React**: UI framework
- **Next.js**: Framework and routing
- **TypeScript**: Type safety
- **Zustand/Redux**: State management (optional)
- **Zod**: Schema validation

### Styling
- **Tailwind CSS**: Utility-first CSS
- **shadcn/ui**: UI component library
- **Lucide React**: Icons

### Backend
- **Drizzle ORM**: Database queries
- **PostgreSQL**: Database
- **Supabase**: Auth and database

---

## Node Execution Engine

### Execution Algorithm

```typescript
async function executeGraph(
  nodes: CanvasNode[],
  connections: NodeConnection[]
): Promise<ExecutionResult> {
  // 1. Build dependency graph
  const graph = buildDependencyGraph(nodes, connections);
  
  // 2. Topological sort to determine execution order
  const executionOrder = topologicalSort(graph);
  
  // 3. Execute nodes in order
  const results: Record<string, any> = {};
  
  for (const nodeId of executionOrder) {
    const node = nodes.find(n => n.id === nodeId);
    if (!node) continue;
    
    // 4. Collect input data from connected nodes
    const inputData = collectInputData(node, connections, results);
    
    // 5. Execute node
    const outputData = await executeNode(node, inputData);
    
    // 6. Store results
    results[nodeId] = outputData;
  }
  
  return { results, success: true };
}
```

### Node Execution Handlers

```typescript
async function executeNode(
  node: CanvasNode,
  inputData: Record<string, any>
): Promise<any> {
  switch (node.type) {
    case 'text':
      return { text: node.data.prompt };
      
    case 'image':
      return await generateImage(inputData.prompt, node.data.settings);
      
    case 'variants':
      return await generateVariants(
        inputData.sourceImage,
        inputData.prompt,
        node.data.count,
        node.data.settings
      );
      
    default:
      throw new Error(`Unknown node type: ${node.type}`);
  }
}
```

---

## Security Considerations

1. **Authentication**: Verify user owns project and chain
2. **Authorization**: Check project access before loading canvas
3. **Input Validation**: Validate all node inputs with Zod
4. **Rate Limiting**: Limit API calls per user
5. **Credit Deduction**: Verify credits before generation
6. **XSS Prevention**: Sanitize user inputs in nodes
7. **CSRF Protection**: Use Next.js CSRF tokens

---

## Future Enhancements

### Additional Node Types
- **Filter Node**: Apply image filters/effects
- **Combine Node**: Blend multiple images
- **Conditional Node**: Branch logic based on conditions
- **Loop Node**: Iterate over arrays
- **API Node**: Call external APIs
- **Template Node**: Reusable node templates

### Features
- **Node Templates**: Save and reuse node configurations
- **Collaboration**: Real-time multi-user editing
- **Version Control**: Git-like branching for graphs
- **Export/Import**: Export graphs as JSON
- **Node Marketplace**: Share custom nodes
- **Performance Optimization**: Lazy loading, caching
- **Mobile Support**: Touch-friendly node editing

---

## Success Metrics

1. **User Adoption**: % of users using canvas editor
2. **Generation Success Rate**: % of successful image generations
3. **Performance**: Average graph execution time
4. **Error Rate**: % of failed node executions
5. **User Satisfaction**: Feedback scores

---

## Documentation Updates

- Update main README with canvas editor section
- Create user guide for canvas editor
- Add API documentation for canvas endpoints
- Create video tutorials for node workflows

---

## Conclusion

This canvas-based node editor will provide a powerful, visual way for users to create complex AI rendering workflows. The Blender-inspired interface will make it intuitive for users to chain together text prompts, image generation, and variant creation.

The modular node system allows for easy extension with new node types in the future, making this a scalable foundation for advanced workflow creation.

