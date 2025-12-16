'use client';

import { Editor } from 'tldraw';
import { ChatHistoryPromptItem } from '@/agent-kit/shared/types/ChatHistoryItem';
import { RenderiqContextItemTag } from './RenderiqContextItemTag';
import { RenderiqSelectionTag } from './RenderiqSelectionTag';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface RenderiqChatHistoryPromptProps {
  item: ChatHistoryPromptItem;
  editor: Editor;
}

/**
 * Styled ChatHistoryPrompt component matching Renderiq design
 */
export function RenderiqChatHistoryPrompt({
  item,
  editor,
}: RenderiqChatHistoryPromptProps) {
  const { contextItems, message, selectedShapes } = item;
  const showTags = selectedShapes.length > 0 || contextItems.length > 0;

  return (
    <div className={cn(
      'flex flex-col gap-2 p-3 rounded-lg',
      'bg-primary/10 border border-primary/20',
      'max-w-[85%] sm:max-w-[80%] ml-auto'
    )}>
      {showTags && (
        <div className="flex flex-wrap gap-1.5">
          {selectedShapes.length > 0 && <RenderiqSelectionTag />}
          {contextItems.map((contextItem, i) => (
            <RenderiqContextItemTag
              editor={editor}
              key={`context-item-${i}`}
              item={contextItem}
            />
          ))}
        </div>
      )}
      <p className="text-sm text-foreground whitespace-pre-wrap break-words">
        {message}
      </p>
    </div>
  );
}

