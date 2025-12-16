'use client';

import { logger } from './logger';

interface SaveChatMessageParams {
  chainId: string;
  projectId: string;
  messageType: 'render' | 'agent';
  contentType: 'user' | 'assistant' | 'video' | 'action' | 'prompt' | 'think' | 'message';
  content: string;
  renderId?: string;
  agentActionData?: {
    actionType?: string;
    intent?: string;
    diff?: any;
    acceptance?: 'pending' | 'accepted' | 'rejected';
  };
  uploadedImageUrl?: string;
  uploadedImageKey?: string;
}

/**
 * Save a chat message to the database
 * This is a fire-and-forget operation - errors are logged but don't block UI
 */
export async function saveChatMessage(params: SaveChatMessageParams): Promise<void> {
  try {
    const response = await fetch('/api/chat/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(error.error || 'Failed to save message');
    }

    logger.log('💾 saveChatMessage: Message saved to database', {
      chainId: params.chainId,
      messageType: params.messageType,
      contentType: params.contentType,
    });
  } catch (error) {
    // Log but don't throw - this is a background operation
    logger.error('❌ saveChatMessage: Failed to save message to database', error);
  }
}

