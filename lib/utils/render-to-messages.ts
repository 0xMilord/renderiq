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

  // Ensure assistant message comes after user message with proper spacing to maintain conversational order
  // Use a larger gap (100ms) to ensure proper ordering even when multiple renders are created quickly
  const userTime = render.createdAt instanceof Date ? render.createdAt.getTime() : new Date(render.createdAt).getTime();
  const updateTime = render.updatedAt instanceof Date ? render.updatedAt.getTime() : new Date(render.updatedAt).getTime();
  const assistantTime = Math.max(userTime + 100, updateTime); // Ensure assistant is after user message with 100ms gap

  const assistantMessage: Message = {
    id: `assistant-${render.id}`,
    type: 'assistant',
    content:
      render.status === 'failed'
        ? "Sorry, I couldn't generate your render. Please try again."
        : render.status === 'processing' || render.status === 'pending'
          ? 'Generating your render...'
          : '',
    timestamp: new Date(assistantTime),
    render: render.status === 'completed' ? render : undefined,
    isGenerating: render.status === 'processing' || render.status === 'pending',
  };

  return [userMessage, assistantMessage];
}

/**
 * Converts an array of renders to messages, sorted by createdAt (oldest first, newest at bottom)
 * @param renders - Array of render objects
 * @returns Array of messages (pairs of user and assistant messages) in chronological order
 */
export function convertRendersToMessages(renders: Render[]): Message[] {
  return renders
    .sort((a, b) => {
      // Simple chronological order: sort by createdAt (oldest first)
      const aTime = a.createdAt instanceof Date ? a.createdAt.getTime() : new Date(a.createdAt).getTime();
      const bTime = b.createdAt instanceof Date ? b.createdAt.getTime() : new Date(b.createdAt).getTime();
      return aTime - bTime;
    })
    .flatMap(render => convertRenderToMessages(render));
}

