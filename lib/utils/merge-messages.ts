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
  // ✅ FIXED: Add both user and assistant messages together to maintain conversational order
  const addedRenderIds = new Set(merged.filter(m => m.render?.id).map(m => m.render!.id));
  const addedMessageIds = new Set(merged.map(m => m.id));
  
  // Group messages from chain by render ID to pair user/assistant messages
  const messagesByRenderId = new Map<string, { userMsg?: Message; assistantMsg?: Message }>();
  
  for (const chainMsg of newMessagesFromChain) {
    if (chainMsg.render?.id) {
      // This is an assistant message with a render
      const renderId = chainMsg.render.id;
      if (!messagesByRenderId.has(renderId)) {
        messagesByRenderId.set(renderId, {});
      }
      messagesByRenderId.get(renderId)!.assistantMsg = chainMsg;
    } else if (chainMsg.type === 'user') {
      // This is a user message - find its corresponding assistant message by matching prompt content
      const matchingAssistant = newMessagesFromChain.find(
        m => m.render && 
        m.render.prompt === chainMsg.content &&
        Math.abs(m.timestamp.getTime() - chainMsg.timestamp.getTime()) < 200
      );
      if (matchingAssistant?.render?.id) {
        const renderId = matchingAssistant.render.id;
        if (!messagesByRenderId.has(renderId)) {
          messagesByRenderId.set(renderId, {});
        }
        messagesByRenderId.get(renderId)!.userMsg = chainMsg;
      } else if (!addedMessageIds.has(chainMsg.id)) {
        // Standalone user message (shouldn't happen with renders, but handle gracefully)
        merged.push(chainMsg);
        addedMessageIds.add(chainMsg.id);
      }
    }
  }
  
  // Add paired user/assistant messages together
  for (const [renderId, { userMsg, assistantMsg }] of messagesByRenderId.entries()) {
    if (assistantMsg && !addedRenderIds.has(renderId)) {
      // Add user message first if it exists and isn't already in merged
      if (userMsg && !addedMessageIds.has(userMsg.id)) {
        merged.push(userMsg);
        addedMessageIds.add(userMsg.id);
      }
      // Add assistant message
      merged.push(assistantMsg);
      addedRenderIds.add(renderId);
      addedMessageIds.add(assistantMsg.id);
    }
  }
  
  // ✅ FIXED: Sort by timestamp with secondary sort by message type (user before assistant for same timestamp)
  // This ensures conversational order: user messages appear before their corresponding assistant messages
  merged.sort((a, b) => {
    const timeDiff = a.timestamp.getTime() - b.timestamp.getTime();
    if (Math.abs(timeDiff) < 200) {
      // Messages within 200ms of each other: user messages come first
      if (a.type === 'user' && b.type === 'assistant') return -1;
      if (a.type === 'assistant' && b.type === 'user') return 1;
    }
    return timeDiff;
  });
  
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

