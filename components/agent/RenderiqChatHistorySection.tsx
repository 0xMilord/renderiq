'use client';

import { TldrawAgent } from '@/agent-kit/client/agent/TldrawAgent';
import { ChatHistorySection } from '@/agent-kit/client/components/chat-history/ChatHistorySection';
import { ChatHistoryGroup, getActionHistoryGroups } from '@/agent-kit/client/components/chat-history/ChatHistoryGroup';
import { RenderiqChatHistoryPrompt } from './RenderiqChatHistoryPrompt';
import { RenderiqChatHistoryGroup } from './RenderiqChatHistoryGroup';
import { cn } from '@/lib/utils';

interface RenderiqChatHistorySectionProps {
  section: ChatHistorySection;
  agent: TldrawAgent;
  loading: boolean;
}

/**
 * Styled ChatHistorySection component matching Renderiq design
 */
export function RenderiqChatHistorySection({
  section,
  agent,
  loading,
}: RenderiqChatHistorySectionProps) {
  const actions = section.items.filter((item) => item.type === 'action');
  const groups = getActionHistoryGroups(actions, agent);

  return (
    <div className={cn('flex flex-col gap-2')}>
      <RenderiqChatHistoryPrompt item={section.prompt} editor={agent.editor} />
      {groups.map((group, i) => {
        return (
          <RenderiqChatHistoryGroup
            key={`chat-history-group-${i}`}
            group={group}
            agent={agent}
          />
        );
      })}
    </div>
  );
}

