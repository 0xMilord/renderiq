import type { Message } from '@/lib/stores/chat-store';
import type { Render } from '@/lib/types/render';
import { convertRendersToMessages } from './render-to-messages';
import { logger } from './logger';

/**
 * Merges existing messages with renders from chain, preserving user messages without renders
 * This is the single source of truth for message merging logic
 */
export function mergeMessagesWithRenders(
  existingMessages: Message[],
  chainRenders: Render[],
  options?: {
    preserveGenerating?: boolean;
    recentGenerationId?: string;
    recentGenerationRender?: Render;
  }
): Message[] {
  const { preserveGenerating = false, recentGenerationId, recentGenerationRender } = options || {};
  
  const newMessagesFromChain = convertRendersToMessages(chainRenders);
  const chainMessageMap = new Map(newMessagesFromChain.map(m => [m.render?.id, m]));
  const merged: Message[] = [];
  
  // Process existing messages
  for (const prevMsg of existingMessages) {
    // ✅ CRITICAL: Always preserve ALL user messages FIRST (highest priority)
    // User messages should NEVER be filtered out, regardless of whether they have a render or referenceRenderId
    if (prevMsg.type === 'user') {
      // ✅ CRITICAL FIX: Always preserve user messages
      // Only skip if we already have a render-based user message with the same content AND similar timestamp
      // (to avoid duplicates when render is created, but preserve messages that are newer)
      const hasRenderBasedUserMessage = newMessagesFromChain.some(
        chainMsg => chainMsg.type === 'user' && 
                   chainMsg.content === prevMsg.content &&
                   Math.abs(chainMsg.timestamp.getTime() - prevMsg.timestamp.getTime()) < 5000 // Within 5 seconds
      );
      if (!hasRenderBasedUserMessage) {
        merged.push(prevMsg);
        logger.log('✅ Merge: Preserving user message', {
          id: prevMsg.id,
          content: prevMsg.content?.substring(0, 50) || '(empty)',
          hasRender: !!prevMsg.render,
          hasReferenceRenderId: !!prevMsg.referenceRenderId,
        });
      } else {
        // We have a render-based user message, so skip the local one to avoid duplicate
        logger.log('🔄 Merge: Skipping local user message, render-based version exists', {
          content: prevMsg.content?.substring(0, 50) || '(empty)'
        });
      }
      continue; // Skip to next message
    }
    
    // Preserve generating messages if requested
    if (preserveGenerating && (prevMsg.isGenerating || (!prevMsg.render && prevMsg.type === 'assistant'))) {
      if (prevMsg.render?.id) {
        const chainMsg = chainMessageMap.get(prevMsg.render.id);
        if (chainMsg && chainMsg.render?.status === 'completed') {
          // Render is now complete, update message
          merged.push({
            ...chainMsg,
            isGenerating: false
          });
        } else {
          // Still generating, keep as is
          merged.push(prevMsg);
        }
      } else {
        // Generating assistant message without render, keep as is
        merged.push(prevMsg);
      }
      continue; // Skip to next message
    }
    // Handle recent generation render
    else if (recentGenerationId && prevMsg.render?.id === recentGenerationId) {
      const renderToUse = recentGenerationRender || prevMsg.render;
      merged.push({
        ...prevMsg,
        render: renderToUse
      });
    }
    // Update messages with renders from chain
    else if (prevMsg.render?.id) {
      const chainMsg = chainMessageMap.get(prevMsg.render.id);
      if (chainMsg) {
        merged.push(chainMsg);
      } else {
        // Render was removed, keep old message
        merged.push(prevMsg);
      }
    }
    // Keep other messages as is
    else {
      merged.push(prevMsg);
    }
  }
  
  // Add any new renders from chain that aren't in existing messages
  for (const chainMsg of newMessagesFromChain) {
    if (chainMsg.render && !merged.some(m => m.render?.id === chainMsg.render?.id)) {
      merged.push(chainMsg);
    }
  }
  
  // Simple chronological order: sort by timestamp (oldest first, newest at bottom)
  merged.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  
  return merged;
}

/**
 * Checks if messages should be preserved (not cleared).
 * 
 * @param messages - Current messages array
 * @param isGenerating - Whether image generation is in progress
 * @param isImageGenerating - Whether image generation is in progress
 * @param isVideoGenerating - Whether video generation is in progress
 * @returns True if messages should be preserved, false otherwise
 * 
 * @example
 * ```typescript
 * if (shouldPreserveMessages(messages, isGenerating, isImageGenerating, isVideoGenerating)) {
 *   // Don't clear messages
 * }
 * ```
 */
export function shouldPreserveMessages(
  messages: Message[],
  isGenerating: boolean,
  isImageGenerating: boolean,
  isVideoGenerating: boolean
): boolean {
  // Always preserve if generating
  if (isGenerating || isImageGenerating || isVideoGenerating) {
    return true;
  }
  
  // Preserve if there are user messages without renders
  const hasUserMessages = messages.some(msg => msg.type === 'user' && !msg.render);
  if (hasUserMessages) {
    logger.log('⚠️ Chat: Preserving messages - user messages without renders exist');
    return true;
  }
  
  return false;
}

