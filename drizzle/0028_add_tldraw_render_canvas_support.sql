-- Migration: Add tldraw render canvas support
-- This migration adds support for tldraw-based canvas state in renders table
-- Note: This is separate from the node-based canvas editor (canvas_files, canvas_graphs)
-- Naming convention: Use "tldraw" or "render_canvas" prefix to distinguish from node editor canvas

-- Add comments to document the tldraw canvas state structure in renders.context_data
COMMENT ON COLUMN renders.context_data IS 'Stores pipeline context and tldraw render canvas state. Structure: { successfulElements?: string[], previousPrompts?: string[], userFeedback?: string, chainEvolution?: string, tldrawCanvasState?: { version: string, canvasData?: jsonb, layers?: jsonb, masks?: jsonb } }';

COMMENT ON COLUMN renders.metadata IS 'Stores render metadata including tldraw canvas metadata. Canvas metadata structure: { sourcePlatform?: string, pluginVersion?: string, tldrawCanvas?: { canvasId?: string, toolVersion?: string, lastModified?: string, zoomLevel?: number, viewport?: jsonb } }';

-- Create index for faster queries on renders with tldraw canvas state
-- This helps find renders that have canvas state for performance
CREATE INDEX IF NOT EXISTS idx_renders_has_tldraw_canvas_state 
ON renders USING GIN ((context_data -> 'tldrawCanvasState'));

-- Create index for canvas metadata queries
CREATE INDEX IF NOT EXISTS idx_renders_tldraw_canvas_metadata 
ON renders USING GIN ((metadata -> 'tldrawCanvas'));

