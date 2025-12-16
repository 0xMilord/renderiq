'use client';

import { useMemo, useEffect, useCallback, useState } from 'react';
import type { Editor } from '@tldraw/tldraw';
import { react } from 'tldraw';
// Import TldrawAgent as a value (runtime) not just a type
import { TldrawAgent } from '@/agent-kit/client/agent/TldrawAgent';
import { useTldrawAgent } from '@/agent-kit/client/agent/useTldrawAgent';
import type { AgentInput } from '@/agent-kit/shared/types/AgentInput';
import type { ChatHistoryItem } from '@/agent-kit/shared/types/ChatHistoryItem';
import type { Render } from '@/lib/types/render';
import { logger } from '@/lib/utils/logger';
import { useChatStore } from '@/lib/stores/chat-store';
import { useCanvasStore } from '@/lib/stores/canvas-store';

interface UseRenderiqAgentOptions {
  editor: Editor | null;
  chainId?: string | null;
  projectId?: string | null;
  currentRender?: Render | null;
  enabled?: boolean;
}

/**
 * Renderiq-specific agent hook
 * Wraps useTldrawAgent with Renderiq context and chat integration
 */
export function useRenderiqAgent({
  editor,
  chainId,
  projectId,
  currentRender,
  enabled = true,
}: UseRenderiqAgentOptions) {
  const { addMessage } = useChatStore();
  const { setAgent } = useCanvasStore();

  // Create agent instance when editor is available
  // Note: We need to handle the case where editor might be null
  // Since useTldrawAgent requires a non-null editor, we'll use a ref pattern
  // to conditionally create the agent only when editor is available
  const [agentState, setAgentState] = useState<TldrawAgent | null>(null);
  
  useEffect(() => {
    if (!enabled || !editor) {
      setAgentState(null);
      return;
    }
    
    try {
      // Create agent using the hook pattern
      // We'll create it directly since we can't conditionally call hooks
      const newAgent = new TldrawAgent({
        editor,
        id: 'renderiq-agent',
        onError: (e: any) => {
          const message = typeof e === 'string' ? e : e instanceof Error ? e.message : 'An error occurred';
          logger.error('❌ Agent error', { error: message });
          // Could also show toast here if needed
        },
      });
      
      setAgentState(newAgent);
      logger.log('🤖 useRenderiqAgent: Agent created', {
        chainId,
        currentRenderId: currentRender?.id,
      });
      
      return () => {
        // Cleanup: dispose agent when editor changes or component unmounts
        newAgent.dispose();
      };
    } catch (error) {
      logger.error('❌ useRenderiqAgent: Failed to create agent', error);
      setAgentState(null);
    }
  }, [enabled, editor, chainId, currentRender?.id]);
  
  const agent = agentState;

  // Sync agent to canvas store for cross-component access
  useEffect(() => {
    setAgent(agent);
    return () => {
      // Cleanup: remove agent from store when component unmounts
      setAgent(null);
    };
  }, [agent, setAgent]);

  // Sync agent chat history with chat store using Signia react()
  useEffect(() => {
    if (!agent) return;

    // Track last processed history length to only sync new items
    let lastHistoryLength = agent.$chatHistory.get().length;

    // Subscribe to agent chat history changes using Signia react()
    // react() returns a cleanup function
    const unsubscribe = react('sync-agent-chat-history-renderiq', () => {
      // Access the atom value (this makes react() track it)
      const history = agent.$chatHistory.get();
      
      // Only process new items
      if (history.length <= lastHistoryLength) {
        return;
      }

      const newItems = history.slice(lastHistoryLength);
      lastHistoryLength = history.length;

      // Map new agent chat history items to chat store messages
      const existingMessages = useChatStore.getState().messages;
      const existingMessageIds = new Set(existingMessages.map(m => m.id));

      // Process new items and save to database
      const savePromises = newItems.map(async (item: ChatHistoryItem) => {
        if (item.type === 'prompt') {
          // User prompt - add as user message to store
          const messageId = `agent-user-${item.message.substring(0, 50)}-${Date.now()}`;
          if (!existingMessageIds.has(messageId)) {
            addMessage({
              id: messageId,
              type: 'user',
              content: item.message,
              timestamp: new Date(),
            });
            
            // ✅ NEW: Save to database
            if (chainId && projectId) {
              try {
                await fetch('/api/chat/messages', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    chainId,
                    projectId,
                    messageType: 'agent',
                    contentType: 'prompt',
                    content: item.message,
                  }),
                });
              } catch (error) {
                logger.error('❌ useRenderiqAgent: Failed to save prompt to database', error);
              }
            }
          }
        } else if (item.type === 'action') {
          // Check if action is a message action
          if (item.action._type === 'message') {
            const messageContent = (item.action as any).text || '';
            if (messageContent) {
              const messageId = `agent-assistant-${Date.now()}-${Math.random()}`;
              if (!existingMessageIds.has(messageId)) {
                addMessage({
                  id: messageId,
                  type: 'assistant',
                  content: messageContent,
                  timestamp: new Date(),
                  isGenerating: !item.action.complete,
                });
                
                // ✅ NEW: Save to database
                if (chainId && projectId) {
                  try {
                    await fetch('/api/chat/messages', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        chainId,
                        projectId,
                        messageType: 'agent',
                        contentType: 'message',
                        content: messageContent,
                        agentActionData: {
                          actionType: item.action._type,
                          intent: (item.action as any).intent,
                          acceptance: (item as any).acceptance || 'pending',
                        },
                      }),
                    });
                  } catch (error) {
                    logger.error('❌ useRenderiqAgent: Failed to save action to database', error);
                  }
                }
              }
            }
          } else {
            // ✅ NEW: Save other actions to database (think, create, update, etc.)
            if (chainId && projectId) {
              try {
                await fetch('/api/chat/messages', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    chainId,
                    projectId,
                    messageType: 'agent',
                    contentType: item.action._type,
                    content: (item.action as any).intent || `${item.action._type} action`,
                    agentActionData: {
                      actionType: item.action._type,
                      intent: (item.action as any).intent,
                      diff: (item as any).diff,
                      acceptance: (item as any).acceptance || 'pending',
                    },
                  }),
                });
              } catch (error) {
                logger.error('❌ useRenderiqAgent: Failed to save action to database', error);
              }
            }
          }
        }
      });
      
      // Wait for all saves to complete (fire and forget)
      Promise.all(savePromises).catch((error) => {
        logger.error('❌ useRenderiqAgent: Error saving messages to database', error);
      });
    });

    return () => {
      unsubscribe();
    };
  }, [agent, addMessage]);

  /**
   * Prompt the agent with Renderiq context
   * Automatically includes chain and render context
   */
  const promptAgent = useCallback(
    async (input: string | AgentInput) => {
      if (!agent) {
        logger.warn('⚠️ useRenderiqAgent: Cannot prompt - agent not available');
        return;
      }

      // Convert string input to AgentInput
      const baseInput: AgentInput =
        typeof input === 'string'
          ? { message: input }
          : input;

      // Add Renderiq context data
      const contextData = {
        type: 'renderiq-context',
        chainId: chainId ?? null,
        currentRenderId: currentRender?.id ?? null,
        projectId: currentRender?.projectId ?? null,
        timestamp: new Date().toISOString(),
      };

      const fullInput: AgentInput = {
        ...baseInput,
        data: [contextData, ...(baseInput.data ?? [])],
      };

      logger.log('🤖 useRenderiqAgent: Prompting agent', {
        message: typeof input === 'string' ? input : input.message || input.messages?.[0],
        chainId,
        currentRenderId: currentRender?.id,
      });

      try {
        await agent.prompt(fullInput);
      } catch (error) {
        logger.error('❌ useRenderiqAgent: Agent prompt failed', error);
        throw error;
      }
    },
    [agent, chainId, currentRender]
  );

  /**
   * Cancel current agent request
   */
  const cancelAgent = useCallback(() => {
    if (agent) {
      agent.cancel();
      logger.log('🛑 useRenderiqAgent: Agent cancelled');
    }
  }, [agent]);

  /**
   * Reset agent state (chat history, todos, etc.)
   */
  const resetAgent = useCallback(() => {
    if (agent) {
      agent.reset();
      logger.log('🔄 useRenderiqAgent: Agent reset');
    }
  }, [agent]);

  /**
   * Check if agent is currently generating
   */
  const isAgentGenerating = useMemo(() => {
    if (!agent) return false;
    return agent.isGenerating();
  }, [agent]);

  return {
    agent,
    promptAgent,
    cancelAgent,
    resetAgent,
    isAgentGenerating,
  };
}

