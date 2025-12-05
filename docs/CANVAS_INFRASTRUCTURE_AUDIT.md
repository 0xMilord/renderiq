# Canvas Infrastructure Audit

## Overview

This document provides a complete audit of the canvas infrastructure, how canvases are stored, accessed, and the relationship between canvases and render chains.

## Canvas Storage Architecture

### Database Schema

**Table: `canvas_graphs`**
```sql
CREATE TABLE canvas_graphs (
  id UUID PRIMARY KEY,
  chain_id UUID UNIQUE NOT NULL REFERENCES render_chains(id),
  project_id UUID NOT NULL REFERENCES projects(id),
  user_id UUID NOT NULL REFERENCES users(id),
  nodes JSONB NOT NULL,
  connections JSONB NOT NULL,
  viewport JSONB,
  version INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**Key Points:**
- Each canvas graph is linked to a **render chain** (`chain_id`)
- One-to-one relationship: Each chain can have only one canvas graph
- Canvas graphs are linked to projects and users for ownership
- Graph data (nodes, connections) stored as JSONB

### Relationship Model

```
User
  └── Project
       └── Render Chain (chat/workflow)
            └── Canvas Graph (one per chain)
```

**Important:**
- A **render chain must exist** before a canvas can be created
- Canvas graphs are created automatically on first save
- Canvas can work with empty graph (returns empty state if no graph exists)

## Access Flow

### Route Structure

**Canvas Editor Route:**
```
/canvas/[projectSlug]/[chatId]
```

**Note:** The parameter is called `chatId` but it's actually a `chainId` (render chain ID)

### Access Flow Steps

1. **User navigates to `/canvas/[projectSlug]/[chatId]`**
   - `projectSlug`: Project identifier (URL-friendly)
   - `chatId`: Render chain ID (UUID)

2. **Page Component (`app/canvas/[projectSlug]/[chatId]/page.tsx`)**
   - Fetches project by slug using `useProjectBySlug(projectSlug)`
   - Fetches chain by ID using `useRenderChain(chatId)`
   - If chain doesn't exist → Shows "Canvas Not Found" error
   - If project doesn't exist → Shows "Project Not Found" error

3. **Canvas Editor Component**
   - Uses `useCanvas(chainId)` hook
   - Fetches graph from `/api/canvas/[chainId]/graph`
   - If no graph exists → Returns empty graph state
   - Canvas editor initializes with empty or existing graph

4. **API Route (`/api/canvas/[chainId]/graph`)**
   - **GET**: Fetches canvas graph
     - Verifies chain exists
     - Verifies user owns the project
     - Returns graph or empty state
   - **POST**: Saves canvas graph
     - Verifies chain exists
     - Creates or updates graph
     - Returns success/error

## Data Access Layer

### CanvasDAL (`lib/dal/canvas.ts`)

**Methods:**
- `getByChainId(chainId)`: Get canvas graph by chain ID
- `saveGraph(chainId, userId, state)`: Save or update canvas graph

**Behavior:**
- Returns `null` if graph doesn't exist (not an error)
- Creates graph on first save if it doesn't exist
- Updates graph if it already exists
- Verifies chain exists before saving

### API Route (`app/api/canvas/[chainId]/graph/route.ts`)

**GET Endpoint:**
1. Authenticates user
2. Verifies chain exists
3. Verifies user owns the project
4. Fetches graph (or returns empty if none exists)
5. Verifies graph ownership (if graph exists)

**POST Endpoint:**
1. Authenticates user
2. Verifies chain exists
3. Verifies user owns the project
4. Saves/updates graph
5. Returns success/error

## Error Handling

### Error Messages

**"Canvas Not Found"** (Updated)
- Shown when render chain doesn't exist
- Previously said "Chat Not Found" (fixed)
- Provides navigation back to canvas or project

**"Project Not Found"**
- Shown when project doesn't exist
- Provides navigation back to canvas

**"Access Denied"**
- Shown when user doesn't own the project
- 403 status code

**"Chain not found"**
- Shown in API when chain doesn't exist
- 404 status code

## Canvas Initialization

### First-Time Canvas Creation

1. User creates a render chain (via canvas page or render page)
2. User navigates to canvas editor for that chain
3. Canvas editor loads with empty graph state
4. User adds nodes and makes changes
5. On first save, canvas graph is created in database
6. Subsequent saves update the existing graph

### Graph State

**Empty Graph (Default):**
```json
{
  "nodes": [],
  "connections": [],
  "viewport": { "x": 0, "y": 0, "zoom": 1 }
}
```

**Populated Graph:**
```json
{
  "nodes": [...],
  "connections": [...],
  "viewport": { "x": 0, "y": 0, "zoom": 1 }
}
```

## Key Infrastructure Points

### ✅ What Works

1. **Canvas Storage**: Properly stored in `canvas_graphs` table
2. **Chain Relationship**: One canvas per chain (1:1 relationship)
3. **Ownership**: Properly verified at API level
4. **Empty State**: Handles empty graphs correctly
5. **Auto-Creation**: Creates graph on first save

### ⚠️ Important Notes

1. **Chain Required**: A render chain MUST exist before canvas can be used
2. **Parameter Naming**: Route uses `chatId` but it's actually `chainId`
3. **Error Messages**: Updated to say "Canvas Not Found" instead of "Chat Not Found"
4. **Access Control**: Chain and project ownership verified at API level

### 🔧 Recent Fixes

1. **Error Message**: Changed "Chat Not Found" → "Canvas Not Found"
2. **API Validation**: Added chain existence check in API route
3. **Ownership Verification**: Added project ownership check in API route
4. **Better Error Handling**: More descriptive error messages

## Usage Examples

### Creating a Canvas

1. Navigate to `/canvas`
2. Select a project
3. Click "Create Canvas" (creates new render chain)
4. Canvas editor opens with empty graph
5. Add nodes and save

### Accessing Existing Canvas

1. Navigate to `/canvas/[projectSlug]/[chainId]`
2. Canvas editor loads with existing graph
3. Make changes and save

### Canvas API Usage

**Fetch Canvas:**
```typescript
GET /api/canvas/[chainId]/graph
Response: { success: true, data: { nodes: [], connections: [], viewport: {...} } }
```

**Save Canvas:**
```typescript
POST /api/canvas/[chainId]/graph
Body: { nodes: [...], connections: [...], viewport: {...} }
Response: { success: true, data: { id: "...", updatedAt: "..." } }
```

## Summary

The canvas infrastructure is properly set up with:
- ✅ Separate storage in `canvas_graphs` table
- ✅ Proper relationship to render chains
- ✅ Ownership verification
- ✅ Empty state handling
- ✅ Auto-creation on first save
- ✅ Updated error messages
- ✅ Proper access control

The canvas system is production-ready and properly integrated with the render chain system.





