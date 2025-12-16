'use client';

import { useEffect, useRef } from 'react';
import { useValue } from 'tldraw';
import { TldrawAgent } from '@/agent-kit/client/agent/TldrawAgent';
import { ChatHistorySection, getAgentHistorySections } from '@/agent-kit/client/components/chat-history/ChatHistorySection';
import { cn } from '@/lib/utils';
import { RenderiqChatHistorySection } from './RenderiqChatHistorySection';
import { Loader2 } from 'lucide-react';

interface RenderiqChatHistoryProps {
  agent: TldrawAgent;
  className?: string;
}

/**
 * Styled ChatHistory component matching Renderiq design system
 * Displays agent chat history with Renderiq styling
 */
export function RenderiqChatHistory({ agent, className }: RenderiqChatHistoryProps) {
  const historyItems = useValue(agent.$chatHistory);
  const sections = getAgentHistorySections(historyItems);
  const historyRef = useRef<HTMLDivElement>(null);
  const previousScrollDistanceFromBottomRef = useRef(0);

  useEffect(() => {
    if (!historyRef.current) return;

    // If a new prompt is submitted by the user, scroll to the bottom
    if (historyItems.at(-1)?.type === 'prompt') {
      if (previousScrollDistanceFromBottomRef.current <= 0) {
        historyRef.current.scrollTo(0, historyRef.current.scrollHeight);
        previousScrollDistanceFromBottomRef.current = 0;
      }
      return;
    }

    // If the user is scrolled to the bottom, keep them there while new actions appear
    if (previousScrollDistanceFromBottomRef.current <= 0) {
      const scrollDistanceFromBottom =
        historyRef.current.scrollHeight -
        historyRef.current.scrollTop -
        historyRef.current.clientHeight;

      if (scrollDistanceFromBottom > 0) {
        historyRef.current.scrollTo(0, historyRef.current.scrollHeight);
      }
    }
  }, [historyRef, historyItems]);

  // Keep track of the user's scroll position
  const handleScroll = () => {
    if (!historyRef.current) return;
    const scrollDistanceFromBottom =
      historyRef.current.scrollHeight -
      historyRef.current.scrollTop -
      historyRef.current.clientHeight;

    previousScrollDistanceFromBottomRef.current = scrollDistanceFromBottom;
  };

  const isGenerating = useValue('isGenerating', () => agent.isGenerating(), [agent]);

  if (sections.length === 0) {
    return null;
  }

  return (
    <div
      ref={historyRef}
      onScroll={handleScroll}
      className={cn(
        'flex flex-col gap-2 p-2 overflow-y-auto',
        className
      )}
    >
      {sections.map((section, i) => {
        return (
          <RenderiqChatHistorySection
            key={`history-section-${i}`}
            section={section}
            agent={agent}
            loading={i === sections.length - 1 && isGenerating}
          />
        );
      })}
      {isGenerating && sections.length > 0 && (
        <div className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Agent is thinking...</span>
        </div>
      )}
    </div>
  );
}

