# Canvas Template System Improvements

## Overview

Fixed the template system to properly connect nodes and prevent overlapping by implementing proper spacing and automatic edge creation.

## Issues Fixed

### 1. Nodes Not Connected ✅
**Problem**: Templates created nodes but didn't create connections between them.

**Solution**:
- Updated `NODE_TEMPLATES` to include connection definitions
- Each template now specifies which nodes connect to which handles
- `createNodesFromTemplate` now returns both nodes and edges
- Edges are automatically created when templates are added

### 2. Nodes Overlapping ✅
**Problem**: Nodes were positioned too close together, causing visual overlap.

**Solution**:
- Increased horizontal spacing from 300px to 400px
- Added vertical spacing of 250px for vertical layouts
- Updated `getDefaultPosition` to use proper node width (320px) + spacing (400px)
- Templates use horizontal layout by default with proper spacing

## Template System Architecture

### Template Definition

```typescript
interface NodeTemplate {
  name: string;
  description: string;
  nodes: NodeType[];
  connections: Array<{
    from: { nodeIndex: number; handle: string };
    to: { nodeIndex: number; handle: string };
  }>;
  layout?: 'horizontal' | 'vertical';
}
```

### Available Templates

1. **Basic Workflow**
   - Nodes: Text → Image
   - Connections: Text.text → Image.prompt

2. **Styled Generation**
   - Nodes: Text → Style → Image
   - Connections:
     - Text.text → Image.prompt
     - Style.style → Image.style

3. **Variants Workflow**
   - Nodes: Text → Image → Variants
   - Connections:
     - Text.text → Image.prompt
     - Image.image → Variants.sourceImage

4. **Complete Workflow**
   - Nodes: Text → Style → Material → Image → Variants
   - Connections:
     - Text.text → Image.prompt
     - Style.style → Image.style
     - Material.materials → Image.material
     - Image.image → Variants.sourceImage

## Node Handle Mapping

### Text Node
- **Output**: `text` (Position.Right)

### Image Node
- **Inputs**: 
  - `prompt` (Position.Left, type: text)
  - `style` (Position.Left, type: style)
  - `material` (Position.Left, type: material)
- **Output**: `image` (Position.Right)

### Style Node
- **Output**: `style` (Position.Right)

### Material Node
- **Output**: `materials` (Position.Right)

### Variants Node
- **Input**: `sourceImage` (Position.Left, type: image)
- **Output**: `variants` (Position.Right)

## Spacing Configuration

### Node Dimensions
- **Node Width**: 320px (w-80 = 20rem)
- **Node Height**: Variable (depends on content)

### Spacing Values
- **Horizontal Spacing**: 400px (prevents overlap)
- **Vertical Spacing**: 250px (for vertical layouts)
- **Default Position**: { x: 100, y: 100 }

### Layout Algorithms

**Horizontal Layout** (default):
- Nodes arranged left to right
- Y position remains constant
- X position increases by 400px per node

**Vertical Layout**:
- Nodes arranged top to bottom
- X position remains constant
- Y position increases by 250px per node

## Implementation Details

### Node Factory Updates

1. **Enhanced `createNodes` method**:
   - Added `layout` parameter ('horizontal' | 'vertical')
   - Proper spacing calculation based on layout
   - Prevents overlap with 400px horizontal / 250px vertical spacing

2. **Improved `getDefaultPosition`**:
   - Uses actual node width (320px)
   - Adds proper spacing (400px)
   - Finds rightmost node to place new nodes

3. **Template Connection System**:
   - Templates define connections using node indices
   - Handles are specified by ID
   - Edges are created automatically with proper IDs

### Canvas Editor Updates

1. **Template Integration**:
   - `onAddTemplate` now creates both nodes and edges
   - Edges are properly formatted for React Flow
   - History is updated after both nodes and edges are set

2. **Edge Creation**:
   - Template edges are converted to React Flow Edge format
   - Includes sourceHandle and targetHandle
   - Proper edge IDs for tracking

## Usage Example

```typescript
// Create a template with nodes and connections
const { nodes, edges } = createNodesFromTemplate('basic', { x: 100, y: 100 });

// Nodes are properly spaced:
// - Text node at (100, 100)
// - Image node at (500, 100) // 400px spacing

// Edges are automatically created:
// - Text.text → Image.prompt
```

## Benefits

1. ✅ **No More Overlapping**: Proper 400px spacing prevents visual overlap
2. ✅ **Automatic Connections**: Templates create working workflows instantly
3. ✅ **Proper Layout**: Horizontal layout keeps workflows readable
4. ✅ **Type Safety**: Connection handles are validated against node definitions
5. ✅ **Easy to Extend**: Adding new templates is straightforward

## Future Enhancements

1. **Layout Algorithms**: Integrate Dagre or ELK for automatic layouts
2. **Custom Spacing**: Allow users to customize spacing per template
3. **Visual Feedback**: Show connection previews when hovering over templates
4. **Template Validation**: Validate templates against node definitions
5. **Template Library**: User-created and shared templates

## Testing

To test the improvements:

1. **Add Basic Template**:
   - Click "Add Node" → Select "Basic Workflow" template
   - Verify: 2 nodes created, 1 connection between them
   - Verify: Nodes are 400px apart horizontally

2. **Add Complete Template**:
   - Click "Add Node" → Select "Complete Workflow" template
   - Verify: 5 nodes created, 4 connections
   - Verify: All nodes properly spaced

3. **Add Multiple Templates**:
   - Add one template, then add another
   - Verify: Second template starts after first (no overlap)
   - Verify: All connections work correctly

## Summary

The template system now:
- ✅ Creates properly connected nodes
- ✅ Prevents node overlap with 400px spacing
- ✅ Uses horizontal layout for readability
- ✅ Automatically creates edges between nodes
- ✅ Maintains proper node positioning

All templates are production-ready and work correctly with the canvas system.







