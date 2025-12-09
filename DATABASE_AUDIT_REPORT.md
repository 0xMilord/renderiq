# Database Architecture Audit Report
## Cross-Platform Data Contamination Analysis

**Date**: 2025-01-27  
**Scope**: Database tables, columns, and data storage patterns across `/render`, `/apps`, and `/canvas` platforms

---

## Executive Summary

**CRITICAL ISSUES IDENTIFIED:**
1. ❌ **No dedicated tools database table** - Tools use `renders` table with `imageType` field
2. ❌ **All 3 platforms share the same `renders` table** - Cross-contamination between render, apps, and canvas
3. ❌ **Canvas incorrectly uses `chain_id`** - Canvas should have Figma-like structure (Project → File → Canvas), not render chains
4. ❌ **No tool-specific settings/metadata storage** - All tool settings stored in generic `renders.settings` JSONB
5. ❌ **No reproducibility tracking** - Tools can't track their specific inputs/outputs independently

---

## 1. Current Database Schema Analysis

### 1.1 Core Tables Used Across Platforms

#### `renders` Table (SHARED - PROBLEMATIC)
```typescript
// lib/db/schema.ts:218-265
renders {
  id: UUID
  projectId: UUID (FK → projects)
  userId: UUID (FK → users)
  type: 'image' | 'video'
  prompt: TEXT
  settings: JSONB {
    style: string
    quality: 'standard' | 'high' | 'ultra'
    aspectRatio: string
    imageType?: string  // ⚠️ Used to identify tool (e.g., "render-to-floor-plan")
    drawingType?: string
    elevationSide?: string
    floorPlanType?: string
    sectionCutDirection?: string
    // ... other render-specific fields
  }
  chainId: UUID (FK → renderChains)  // ⚠️ RENDER-SPECIFIC, used by canvas incorrectly
  chainPosition: INTEGER
  // ... other fields
}
```

**Problems:**
- Used by `/render` (chat interface)
- Used by `/apps` (tools) - identified via `settings.imageType`
- Used by `/canvas` (node editor) - incorrectly uses `chainId`
- No separation of concerns
- Can't query tool-specific data efficiently
- Settings JSONB is a catch-all with no validation

#### `renderChains` Table (RENDER-SPECIFIC)
```typescript
// lib/db/schema.ts:197-204
renderChains {
  id: UUID
  projectId: UUID (FK → projects)
  name: TEXT
  description: TEXT
  createdAt: TIMESTAMP
  updatedAt: TIMESTAMP
}
```

**Problems:**
- Designed for `/render` chat conversations
- Canvas incorrectly uses this as "file" concept
- No relationship to tools
- Not suitable for canvas workflows

#### `canvasGraphs` Table (CANVAS-SPECIFIC, BUT MISALIGNED)
```typescript
// lib/db/schema.ts:375-386
canvasGraphs {
  id: UUID
  chainId: UUID (FK → renderChains)  // ❌ WRONG - Should reference canvas files, not render chains
  projectId: UUID (FK → projects)
  userId: UUID (FK → users)
  nodes: JSONB
  connections: JSONB
  viewport: JSONB
  version: INTEGER
  createdAt: TIMESTAMP
  updatedAt: TIMESTAMP
}
```

**Problems:**
- Uses `chainId` which is render-specific
- Canvas should have: Project → File → Canvas structure (like Figma)
- Currently: Project → Render Chain → Canvas (WRONG)

#### `projects` Table (SHARED - OK)
```typescript
// lib/db/schema.ts:169-182
projects {
  id: UUID
  userId: UUID (FK → users)
  name: TEXT
  slug: TEXT (unique)
  description: TEXT
  originalImageId: UUID (FK → fileStorage)
  status: TEXT
  isPublic: BOOLEAN
  tags: JSONB
  metadata: JSONB  // ⚠️ Used to mark tools projects: { isToolsProject: true }
  createdAt: TIMESTAMP
  updatedAt: TIMESTAMP
}
```

**Status:** ✅ OK - Projects are correctly shared across platforms

---

## 2. Platform-Specific Data Storage Analysis

### 2.1 `/render` Platform (Chat Interface)

**Data Flow:**
```
User → Project → Render Chain → Renders
```

**Storage:**
- Uses `renderChains` table for conversations
- Uses `renders` table for individual renders
- Settings stored in `renders.settings` JSONB
- Chain position tracked via `renders.chainPosition`

**Status:** ✅ Works correctly for its purpose

---

### 2.2 `/apps` Platform (Tools)

**Data Flow:**
```
User → Project → Tool Execution → Renders (with imageType)
```

**Current Implementation:**
```typescript
// components/tools/base-tool-component.tsx:290
formData.append('imageType', tool.id);  // e.g., "render-to-floor-plan"

// lib/actions/render.actions.ts:290
formData.append('imageType', tool.id);

// Stored in renders.settings.imageType
```

**Storage:**
- ❌ **NO dedicated tools table**
- Uses `renders` table with `settings.imageType = tool.id`
- Tool settings mixed with render settings in JSONB
- No tool-specific metadata table
- No reproducibility tracking per tool

**Problems:**
1. Can't efficiently query "all renders from tool X"
2. Tool settings not validated (just JSONB)
3. No tool-specific input/output tracking
4. Can't store tool-specific metadata (e.g., tool version, config)
5. Cross-contaminated with render data

**Example Query Issues:**
```sql
-- Current: Inefficient JSONB query
SELECT * FROM renders 
WHERE settings->>'imageType' = 'render-to-floor-plan';

-- Should be: Direct foreign key
SELECT * FROM tool_executions 
WHERE tool_id = 'render-to-floor-plan';
```

---

### 2.3 `/canvas` Platform (Node Editor)

**Data Flow:**
```
User → Project → Render Chain (WRONG!) → Canvas Graph
```

**Current Implementation:**
```typescript
// lib/dal/canvas.ts:7-37
static async getByChainId(chainId: string) {
  // Uses render chain ID to fetch canvas
  const [graph] = await db
    .select()
    .from(canvasGraphs)
    .where(eq(canvasGraphs.chainId, chainId))  // ❌ Using render chain
    .limit(1);
}
```

**Storage:**
- Uses `canvasGraphs` table
- ❌ **Incorrectly references `renderChains` via `chainId`**
- Should have: Project → Canvas File → Canvas Graph structure

**Problems:**
1. Canvas uses render-specific `chain_id` concept
2. Canvas should be like Figma: Project → File → Canvas
3. Currently tied to render infrastructure
4. Can't have multiple canvases per project without render chains

**Correct Structure Should Be:**
```
User
  └── Project
       └── Canvas File (like Figma file)
            └── Canvas Graph (node editor state)
```

**Current (WRONG):**
```
User
  └── Project
       └── Render Chain (chat conversation)
            └── Canvas Graph (node editor)
```

---

## 3. Cross-Contamination Issues

### 3.1 Shared `renders` Table

**All 3 platforms write to the same table:**

| Platform | How It Uses `renders` | Identification Method |
|----------|----------------------|----------------------|
| `/render` | Chat-generated renders | `chainId` + `chainPosition` |
| `/apps` | Tool-generated renders | `settings.imageType = tool.id` |
| `/canvas` | Node-generated renders | `chainId` (from render chain) |

**Issues:**
- Can't separate tool renders from chat renders
- Can't have tool-specific indexes
- Can't enforce tool-specific constraints
- Query performance issues (JSONB lookups)

### 3.2 Canvas Using Render Chains

**Problem:**
- Canvas uses `renderChains` table which is designed for chat conversations
- Canvas should have its own file structure
- Creates dependency between canvas and render systems

**Impact:**
- Can't create canvas without render chain
- Canvas "files" are actually render chains
- Confusing data model

---

## 4. Tools Infrastructure Analysis

### 4.1 Current Tools Storage

**No Database Table for Tools:**
- Tools are defined in code: `lib/tools/registry.ts`
- Tool executions stored in `renders` table
- Tool identification via `settings.imageType`

**Tool Registry:**
```typescript
// lib/tools/registry.ts:13-31
interface ToolConfig {
  id: string;           // e.g., "render-to-floor-plan"
  slug: string;
  name: string;
  description: string;
  category: ToolCategory;
  systemPrompt: string;
  inputType: 'image' | 'image+text' | 'multiple';
  outputType: 'image' | 'video';
  // ... metadata
}
```

**Tool Execution Storage:**
```typescript
// Stored in renders table
{
  projectId: "...",
  userId: "...",
  prompt: tool.systemPrompt,
  settings: {
    imageType: tool.id,  // ⚠️ Only way to identify tool
    quality: "...",
    aspectRatio: "...",
    // Tool-specific settings mixed here
  },
  chainId: "...",  // ⚠️ Uses render chain
  // ...
}
```

### 4.2 Missing Infrastructure

**What's Missing:**
1. ❌ `tools` table - Tool definitions/metadata
2. ❌ `tool_executions` table - Tool-specific execution tracking
3. ❌ `tool_settings` table - Tool-specific settings schema
4. ❌ `tool_inputs` table - Tool input tracking
5. ❌ `tool_outputs` table - Tool output tracking
6. ❌ Reproducibility tracking - Can't replay tool executions

---

## 5. Recommended Database Structure

### 5.1 Tools Infrastructure

#### New Table: `tools`
```sql
CREATE TABLE tools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  system_prompt TEXT NOT NULL,
  input_type TEXT NOT NULL,  -- 'image' | 'image+text' | 'multiple'
  output_type TEXT NOT NULL,  -- 'image' | 'video'
  icon TEXT,
  color TEXT,
  priority TEXT,  -- 'high' | 'medium' | 'low'
  status TEXT DEFAULT 'online',  -- 'online' | 'offline'
  settings_schema JSONB,  -- Tool-specific settings schema
  default_settings JSONB,  -- Default settings
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### New Table: `tool_executions`
```sql
CREATE TABLE tool_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tool_id UUID NOT NULL REFERENCES tools(id),
  project_id UUID NOT NULL REFERENCES projects(id),
  user_id UUID NOT NULL REFERENCES users(id),
  
  -- Input tracking
  input_images JSONB,  -- Array of input image IDs/URLs
  input_text TEXT,
  input_settings JSONB,  -- Tool-specific input settings
  
  -- Output tracking
  output_render_id UUID REFERENCES renders(id),  -- Link to generated render
  output_url TEXT,
  output_key TEXT,
  
  -- Execution metadata
  status TEXT DEFAULT 'pending',  -- 'pending' | 'processing' | 'completed' | 'failed'
  error_message TEXT,
  processing_time INTEGER,  -- seconds
  credits_cost INTEGER,
  
  -- Reproducibility
  execution_config JSONB,  -- Full config for reproducibility
  parent_execution_id UUID REFERENCES tool_executions(id),  -- For variations
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### New Table: `tool_settings_templates`
```sql
CREATE TABLE tool_settings_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tool_id UUID NOT NULL REFERENCES tools(id),
  user_id UUID REFERENCES users(id),  -- NULL = global template
  name TEXT NOT NULL,
  settings JSONB NOT NULL,  -- Tool-specific settings
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### 5.2 Canvas Infrastructure (Figma-like)

#### New Table: `canvas_files`
```sql
CREATE TABLE canvas_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id),
  user_id UUID NOT NULL REFERENCES users(id),
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  thumbnail_url TEXT,
  version INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(project_id, slug)
);
```

#### Update: `canvas_graphs`
```sql
-- Remove chain_id, add file_id
ALTER TABLE canvas_graphs 
  DROP CONSTRAINT canvas_graphs_chain_id_fkey,
  DROP COLUMN chain_id,
  ADD COLUMN file_id UUID NOT NULL REFERENCES canvas_files(id) ON DELETE CASCADE,
  ADD CONSTRAINT canvas_graphs_file_id_unique UNIQUE(file_id);
```

**New Structure:**
```
User
  └── Project
       └── Canvas File (like Figma file)
            └── Canvas Graph (node editor state)
```

### 5.3 Render Infrastructure (Keep Separate)

**Keep `renders` table for `/render` platform only:**
- Remove tool usage (tools should use `tool_executions`)
- Keep `renderChains` for chat conversations
- Keep `renders.chainId` for render-specific tracking

---

## 6. Migration Strategy

### Phase 1: Tools Infrastructure
1. Create `tools` table
2. Migrate tool definitions from `lib/tools/registry.ts` to database
3. Create `tool_executions` table
4. Migrate existing tool renders to `tool_executions`
5. Update tool code to use new tables

### Phase 2: Canvas Infrastructure
1. Create `canvas_files` table
2. Migrate existing canvas graphs to use files
3. Update `canvas_graphs` to reference `canvas_files` instead of `renderChains`
4. Update canvas routes: `/canvas/[projectSlug]/[fileSlug]`

### Phase 3: Cleanup
1. Remove tool usage from `renders` table
2. Add constraints to prevent cross-contamination
3. Create indexes for performance
4. Update queries to use new structure

---

## 7. Current Code Locations

### Tools Code
- **Registry**: `lib/tools/registry.ts` - Tool definitions
- **Component**: `components/tools/base-tool-component.tsx` - Tool UI
- **Action**: `lib/actions/render.actions.ts` - Creates renders with `imageType`
- **DAL**: None - Uses `RendersDAL` directly

### Canvas Code
- **DAL**: `lib/dal/canvas.ts` - Uses `chainId` (WRONG)
- **Schema**: `lib/db/schema.ts:375-386` - `canvasGraphs` table
- **Route**: `app/canvas/[projectSlug]/[chatId]/page.tsx` - Uses chain ID

### Render Code
- **DAL**: `lib/dal/renders.ts` - Render operations
- **DAL**: `lib/dal/render-chains.ts` - Chain operations
- **Action**: `lib/actions/render.actions.ts` - Render creation

---

## 8. Recommendations

### Immediate Actions
1. ✅ **Create tools database infrastructure** - Separate tools from renders
2. ✅ **Create canvas files table** - Proper Figma-like structure
3. ✅ **Update canvas to use files** - Remove render chain dependency
4. ✅ **Migrate tool data** - Move tool executions to dedicated table

### Long-term Improvements
1. Add tool versioning system
2. Add tool analytics/usage tracking
3. Add tool settings templates per user
4. Add reproducibility system for tools
5. Add tool input/output validation

---

## 9. Summary

**Current State:**
- ❌ All 3 platforms share `renders` table
- ❌ Tools identified via JSONB field (`settings.imageType`)
- ❌ Canvas uses render chains (wrong abstraction)
- ❌ No tool-specific infrastructure
- ❌ No reproducibility tracking

**Target State:**
- ✅ Separate `tool_executions` table for tools
- ✅ Canvas uses `canvas_files` (Figma-like)
- ✅ `renders` table only for `/render` platform
- ✅ Proper foreign keys and indexes
- ✅ Tool-specific settings and metadata

**Impact:**
- Better query performance
- Clear separation of concerns
- Proper data modeling
- Easier to maintain and extend
- Better reproducibility

---

**Report Generated**: 2025-01-27  
**Next Steps**: Review and approve migration plan, then execute Phase 1 (Tools Infrastructure)

