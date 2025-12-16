import { RenderChainsDAL } from '@/lib/dal/render-chains';
import { RendersDAL } from '@/lib/dal/renders';
import { AISDKService } from './ai-sdk-service';
import { logger } from '@/lib/utils/logger';

/**
 * Chat Session Manager
 * 
 * Manages Google Chat Sessions for multi-turn image editing
 * Maps chainId → Google Chat Session ID
 * 
 * Aligned with MULTI_TURN_IMAGE_EDITING_ALIGNMENT.md
 */
export class ChatSessionManager {
  private static aiService = AISDKService.getInstance();

  /**
   * Get or create Google Chat session for a chain
   * Maps chainId → Google Chat Session ID
   * 
   * @param chainId - The render chain ID
   * @param model - The model to use for the chat session (default: gemini-2.5-flash-image)
   * @param config - Optional config for aspect ratio and image size
   * @returns The Google Chat Session ID
   */
  static async getOrCreateChatSession(
    chainId: string,
    model: string = 'gemini-2.5-flash-image',
    config?: {
      aspectRatio?: string;
      imageSize?: '1K' | '2K' | '4K';
    }
  ): Promise<string> {
    try {
      logger.log('💬 ChatSessionManager: Getting or creating chat session', { chainId, model });

      // Check if chain already has a chat session
      const chain = await RenderChainsDAL.getById(chainId);
      if (!chain) {
        throw new Error(`Chain ${chainId} not found`);
      }

      // Check if chain has existing chat session
      const existingSessionId = (chain as any).googleChatSessionId;
      if (existingSessionId) {
        logger.log('✅ ChatSessionManager: Found existing chat session', { 
          chainId, 
          sessionId: existingSessionId 
        });
        return existingSessionId;
      }

      // Create new chat session
      logger.log('🆕 ChatSessionManager: Creating new chat session', { chainId, model });
      const chatSession = await ChatSessionManager.aiService.createChatSession({
        model,
        aspectRatio: config?.aspectRatio || '16:9',
        imageSize: config?.imageSize || '1K'
      });

      // Store session ID in chain
      await RenderChainsDAL.update(chainId, {
        googleChatSessionId: chatSession.id,
        chatSessionCreatedAt: new Date(),
        lastChatTurn: 0
      } as any); // Type assertion needed until schema is updated

      logger.log('✅ ChatSessionManager: Chat session created and stored', {
        chainId,
        sessionId: chatSession.id
      });

      return chatSession.id;
    } catch (error) {
      logger.error('❌ ChatSessionManager: Failed to get or create chat session', error);
      throw error;
    }
  }

  /**
   * Check if chain should use chat API (iterative edit)
   * 
   * Decision logic:
   * - Use chat API if chain exists AND has previous renders (iterative edit)
   * - Use chat API if reference render exists (explicit reference)
   * - Otherwise use generateContent() for first render
   * 
   * @param chainId - The render chain ID (optional)
   * @param referenceRenderId - The reference render ID (optional)
   * @returns true if chat API should be used, false otherwise
   */
  static async shouldUseChatAPI(
    chainId: string | null,
    referenceRenderId: string | null
  ): Promise<boolean> {
    try {
      // No chain ID = new chain, use generateContent()
      if (!chainId) {
        logger.log('💬 ChatSessionManager: No chainId, using generateContent()');
        return false;
      }

      // Check if chain exists
      const chain = await RenderChainsDAL.getById(chainId);
      if (!chain) {
        logger.log('💬 ChatSessionManager: Chain not found, using generateContent()');
        return false;
      }

      // Check if chain has previous renders (iterative edit)
      const renders = await RendersDAL.getByChainId(chainId);
      const hasPreviousRenders = renders.length > 0;

      // Use chat API if:
      // 1. Chain has previous renders (iterative edit)
      // 2. Reference render exists (explicit reference)
      const shouldUse = hasPreviousRenders || !!referenceRenderId;

      logger.log('💬 ChatSessionManager: Decision', {
        chainId,
        hasPreviousRenders,
        hasReferenceRender: !!referenceRenderId,
        shouldUseChatAPI: shouldUse
      });

      return shouldUse;
    } catch (error) {
      logger.error('❌ ChatSessionManager: Error checking shouldUseChatAPI', error);
      // On error, default to generateContent() (safer)
      return false;
    }
  }

  /**
   * Update chain's last chat turn counter
   * 
   * @param chainId - The render chain ID
   */
  static async incrementChatTurn(chainId: string): Promise<void> {
    try {
      const chain = await RenderChainsDAL.getById(chainId);
      if (!chain) {
        throw new Error(`Chain ${chainId} not found`);
      }

      const currentTurn = ((chain as any).lastChatTurn || 0) as number;
      await RenderChainsDAL.update(chainId, {
        lastChatTurn: currentTurn + 1
      } as any); // Type assertion needed until schema is updated

      logger.log('✅ ChatSessionManager: Incremented chat turn', {
        chainId,
        newTurn: currentTurn + 1
      });
    } catch (error) {
      logger.error('❌ ChatSessionManager: Failed to increment chat turn', error);
      // Don't throw - this is not critical
    }
  }

  /**
   * Get chat session ID for a chain (if exists)
   * 
   * @param chainId - The render chain ID
   * @returns The chat session ID or null if not found
   */
  static async getChatSessionId(chainId: string): Promise<string | null> {
    try {
      const chain = await RenderChainsDAL.getById(chainId);
      if (!chain) {
        return null;
      }

      return ((chain as any).googleChatSessionId as string) || null;
    } catch (error) {
      logger.error('❌ ChatSessionManager: Failed to get chat session ID', error);
      return null;
    }
  }
}






