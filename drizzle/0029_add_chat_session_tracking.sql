-- Migration: Add chat session tracking to render_chains
-- Aligned with MULTI_TURN_IMAGE_EDITING_ALIGNMENT.md
-- Date: 2025-01-27

-- Add nullable columns for Google Chat Session tracking
-- These columns are backward compatible (nullable, no breaking changes)
ALTER TABLE render_chains 
ADD COLUMN IF NOT EXISTS google_chat_session_id TEXT,
ADD COLUMN IF NOT EXISTS chat_session_created_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS last_chat_turn INTEGER DEFAULT 0;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_render_chains_chat_session_id 
ON render_chains(google_chat_session_id) 
WHERE google_chat_session_id IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN render_chains.google_chat_session_id IS 'Google Chat Session ID for multi-turn image editing. Maps chainId to Google Chat Session for automatic context preservation.';
COMMENT ON COLUMN render_chains.chat_session_created_at IS 'Timestamp when the chat session was created for this chain.';
COMMENT ON COLUMN render_chains.last_chat_turn IS 'Last conversation turn number in the chat session. Incremented with each iterative edit.';





