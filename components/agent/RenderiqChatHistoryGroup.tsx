'use client';

import { isRecordsDiffEmpty } from 'tldraw';
import { ChatHistoryActionItem } from '@/agent-kit/shared/types/ChatHistoryItem';
import { TldrawAgent } from '@/agent-kit/client/agent/TldrawAgent';
import { ChatHistoryGroup as ChatHistoryGroupType } from '@/agent-kit/client/components/chat-history/ChatHistoryGroup';
import { RenderiqChatHistoryGroupWithDiff } from './RenderiqChatHistoryGroupWithDiff';
import { RenderiqChatHistoryGroupWithoutDiff } from './RenderiqChatHistoryGroupWithoutDiff';

interface RenderiqChatHistoryGroupProps {
  group: ChatHistoryGroupType;
  agent: TldrawAgent;
}

/**
 * Styled ChatHistoryGroup component matching Renderiq design
 */
export function RenderiqChatHistoryGroup({
  group,
  agent,
}: RenderiqChatHistoryGroupProps) {
  if (group.withDiff) {
    return <RenderiqChatHistoryGroupWithDiff group={group} agent={agent} />;
  }

  return <RenderiqChatHistoryGroupWithoutDiff group={group} agent={agent} />;
}

