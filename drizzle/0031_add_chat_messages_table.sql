-- Migration: Add unified chat messages table
-- Stores both render chat and agent chat messages as part of message chain
-- Date: 2025-12-16

-- Create chat_messages table
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  chain_id UUID NOT NULL REFERENCES render_chains(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  -- Message type: 'render' for render chat, 'agent' for agent chat
  message_type TEXT NOT NULL CHECK (message_type IN ('render', 'agent')),
  -- Content type: 'user', 'assistant', 'video', 'action', 'prompt', 'think', 'message'
  content_type TEXT NOT NULL CHECK (content_type IN ('user', 'assistant', 'video', 'action', 'prompt', 'think', 'message')),
  content TEXT NOT NULL,
  -- Optional render reference (for render chat messages)
  render_id UUID REFERENCES renders(id) ON DELETE SET NULL,
  -- Optional agent action data (for agent chat messages)
  agent_action_data JSONB,
  -- Optional uploaded image reference
  uploaded_image_url TEXT,
  uploaded_image_key TEXT,
  -- Message position in chain (for ordering)
  position INTEGER NOT NULL,
  timestamp TIMESTAMP DEFAULT now() NOT NULL,
  created_at TIMESTAMP DEFAULT now() NOT NULL,
  updated_at TIMESTAMP DEFAULT now() NOT NULL
);

-- Add indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_chat_messages_chain_id ON chat_messages(chain_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_project_id ON chat_messages(project_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_user_id ON chat_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_chain_position ON chat_messages(chain_id, position);
CREATE INDEX IF NOT EXISTS idx_chat_messages_message_type ON chat_messages(message_type);
CREATE INDEX IF NOT EXISTS idx_chat_messages_render_id ON chat_messages(render_id) WHERE render_id IS NOT NULL;

-- Add comments for documentation
COMMENT ON TABLE chat_messages IS 'Unified chat messages table - stores both render chat and agent chat messages as part of message chain. Messages are chain-specific and project-specific.';
COMMENT ON COLUMN chat_messages.message_type IS 'Type of message: render (for image/video generation chat) or agent (for canvas manipulation chat)';
COMMENT ON COLUMN chat_messages.content_type IS 'Content type: user, assistant, video, action, prompt, think, message';
COMMENT ON COLUMN chat_messages.position IS 'Message position in chain (for ordering). Increments with each message.';
COMMENT ON COLUMN chat_messages.agent_action_data IS 'JSONB data for agent actions: actionType, intent, diff, acceptance status';

