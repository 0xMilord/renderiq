'use client';

import { logger } from './logger';
import type { Message } from './render-to-messages';
import type { Render } from '@/lib/types/render';

/**
 * Database chat message structure (from API response)
 * Note: API returns snake_case field names from Drizzle ORM
 */
export interface DbChatMessage {
  id: string;
  chainId: string; // camelCase from Drizzle
  projectId: string; // camelCase from Drizzle
  userId: string; // camelCase from Drizzle
  messageType: 'render' | 'agent'; // camelCase from Drizzle
  contentType: 'user' | 'assistant' | 'video' | 'action' | 'prompt' | 'think' | 'message'; // camelCase from Drizzle
  content: string;
  renderId: string | null; // camelCase from Drizzle
  agentActionData: {
    actionType?: string;
    intent?: string;
    diff?: any;
    acceptance?: 'pending' | 'accepted' | 'rejected';
  } | null; // camelCase from Drizzle
  uploadedImageUrl: string | null; // camelCase from Drizzle
  uploadedImageKey: string | null; // camelCase from Drizzle
  position: number;
  timestamp: string | Date;
  createdAt: string | Date; // camelCase from Drizzle
  updatedAt: string | Date; // camelCase from Drizzle
}

/**
 * Convert a database chat message to a unified Message format
 */
export function convertDbMessageToMessage(
  dbMessage: DbChatMessage,
  render?: Render | null
): Message {
  const timestamp = dbMessage.timestamp instanceof Date 
    ? dbMessage.timestamp 
    : new Date(dbMessage.timestamp);
  
  // Determine message type based on contentType and messageType
  let messageType: 'user' | 'assistant' | 'video' = 'assistant';
  if (dbMessage.contentType === 'user' || dbMessage.contentType === 'prompt') {
    messageType = 'user';
  } else if (dbMessage.contentType === 'video') {
    messageType = 'video';
  } else if (dbMessage.contentType === 'assistant' || dbMessage.contentType === 'message' || dbMessage.contentType === 'think' || dbMessage.contentType === 'action') {
    messageType = 'assistant';
  }

  // Build the message
  const message: Message = {
    id: dbMessage.id,
    type: messageType,
    content: dbMessage.content,
    timestamp,
    // Include render if available (for render messages)
    render: render || undefined,
    // Include uploaded image if available
    uploadedImage: dbMessage.uploadedImageUrl
      ? {
          previewUrl: dbMessage.uploadedImageUrl,
          persistedUrl: dbMessage.uploadedImageUrl,
        }
      : undefined,
    // Include reference render ID if available
    referenceRenderId: dbMessage.renderId || undefined,
  };

  // For agent messages with action data, we might want to include additional metadata
  // This can be extended later if needed

  return message;
}

/**
 * Load chat messages from the database
 * @param chainId - Chain ID
 * @param projectId - Project ID
 * @returns Array of messages sorted by position
 * 
 * NOTE: chat_messages API has been removed. This function now returns an empty array.
 * Messages are loaded from chain.renders instead.
 */
export async function loadChatMessages(
  chainId: string,
  projectId: string
): Promise<Message[]> {
  // chat_messages table and API have been removed
  // Messages are now loaded from chain.renders only
  logger.log('📖 loadChatMessages: chat_messages API removed, returning empty array', {
    chainId,
    projectId,
  });
  return [];
}

/**
 * Merge database messages with render messages
 * NOTE: Since chat_messages API is removed, this now just returns render messages sorted by timestamp
 * @param dbMessages - Messages loaded from database (now always empty)
 * @param renderMessages - Messages converted from chain.renders
 * @returns Sorted messages by timestamp (oldest first, newest at bottom)
 */
export function mergeChatMessages(
  dbMessages: Message[],
  renderMessages: Message[]
): Message[] {
  // Simple chronological order: sort by timestamp (oldest first, newest at bottom)
  const sorted = [...renderMessages].sort((a, b) => {
    return a.timestamp.getTime() - b.timestamp.getTime();
  });

  logger.log('🔄 mergeChatMessages: Sorted messages by timestamp', {
    renderCount: renderMessages.length,
    sortedCount: sorted.length,
  });

  return sorted;
}

