import type { Render } from '@/lib/types/render';

// Message type definition (matches UnifiedChatInterface)
export interface Message {
  id: string;
  type: 'user' | 'assistant' | 'video';
  content: string;
  timestamp: Date;
  render?: Render;
  isGenerating?: boolean;
  uploadedImage?: {
    file?: File;
    previewUrl: string;
    persistedUrl?: string;
  };
  referenceRenderId?: string;
}

/**
 * Converts a Render object to a pair of user and assistant messages
 * @param render - The render object to convert
 * @returns A tuple of [userMessage, assistantMessage]
 */
export function convertRenderToMessages(render: Render): [Message, Message] {
  const userMessage: Message = {
    id: `user-${render.id}`,
    type: 'user',
    content: render.prompt,
    timestamp: render.createdAt,
    referenceRenderId: render.referenceRenderId || undefined,
    uploadedImage: render.uploadedImageUrl
      ? {
          previewUrl: render.uploadedImageUrl,
          persistedUrl: render.uploadedImageUrl,
        }
      : undefined,
  };

  const assistantMessage: Message = {
    id: `assistant-${render.id}`,
    type: 'assistant',
    content:
      render.status === 'failed'
        ? "Sorry, I couldn't generate your render. Please try again."
        : render.status === 'processing' || render.status === 'pending'
          ? 'Generating your render...'
          : '',
    timestamp: render.updatedAt,
    render: render.status === 'completed' ? render : undefined,
    isGenerating: render.status === 'processing' || render.status === 'pending',
  };

  return [userMessage, assistantMessage];
}

/**
 * Converts an array of renders to messages, sorted by chain position
 * @param renders - Array of render objects
 * @returns Array of messages (pairs of user and assistant messages)
 */
export function convertRendersToMessages(renders: Render[]): Message[] {
  return renders
    .sort((a, b) => (a.chainPosition || 0) - (b.chainPosition || 0))
    .flatMap(render => convertRenderToMessages(render));
}

