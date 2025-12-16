'use client';

import { useMemo, useState } from 'react';
import Markdown from 'react-markdown';
import { AgentAction } from '@/agent-kit/shared/types/AgentAction';
import { ChatHistoryActionItem } from '@/agent-kit/shared/types/ChatHistoryItem';
import { Streaming } from '@/agent-kit/shared/types/Streaming';
import { TldrawAgent } from '@/agent-kit/client/agent/TldrawAgent';
import { ChatHistoryGroup } from '@/agent-kit/client/components/chat-history/ChatHistoryGroup';
import { getActionInfo } from '@/agent-kit/client/components/chat-history/getActionInfo';
import { AgentIcon } from '@/agent-kit/client/components/icons/AgentIcon';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ChevronDown, ChevronRight } from 'lucide-react';

interface RenderiqChatHistoryGroupWithoutDiffProps {
  group: ChatHistoryGroup;
  agent: TldrawAgent;
}

/**
 * Styled ChatHistoryGroupWithoutDiff component matching Renderiq design
 */
export function RenderiqChatHistoryGroupWithoutDiff({
  group,
  agent,
}: RenderiqChatHistoryGroupWithoutDiffProps) {
  const { items } = group;

  const nonEmptyItems = useMemo(() => {
    return items.filter((item) => {
      const { description } = getActionInfo(item.action, agent);
      return description !== null;
    });
  }, [items, agent]);

  const [collapsed, setCollapsed] = useState(true);

  const complete = useMemo(() => {
    return items.every((item) => item.action.complete);
  }, [items]);

  const summary = useMemo(() => {
    const time = Math.floor(items.reduce((acc, item) => acc + item.action.time, 0) / 1000);
    if (time === 0) return 'Thought for less than a second';
    if (time === 1) return 'Thought for 1 second';
    return `Thought for ${time} seconds`;
  }, [items]);

  if (nonEmptyItems.length === 0) {
    return null;
  }

  if (nonEmptyItems.length < 2) {
    return (
      <div className="flex flex-col gap-2">
        {nonEmptyItems.map((item, i) => {
          return <RenderiqChatHistoryItem item={item} agent={agent} key={`action-${i}`} />;
        })}
      </div>
    );
  }

  const showContent = !collapsed || !complete;

  return (
    <div className="flex flex-col gap-2 p-2 rounded-lg bg-muted/50">
      {complete && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCollapsed((v) => !v)}
          className="h-7 justify-start"
        >
          {showContent ? (
            <ChevronDown className="h-3 w-3 mr-1" />
          ) : (
            <ChevronRight className="h-3 w-3 mr-1" />
          )}
          <span className="text-xs text-muted-foreground">{summary}</span>
        </Button>
      )}
      {showContent && (
        <div className="flex flex-col gap-1.5">
          {nonEmptyItems.map((item, i) => {
            return (
              <RenderiqChatHistoryItemExpanded
                action={item.action}
                agent={agent}
                key={`action-${i}`}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

function RenderiqChatHistoryItem({
  item,
  agent,
}: {
  item: ChatHistoryActionItem;
  agent: TldrawAgent;
}) {
  const { action } = item;
  const { description, summary } = getActionInfo(action, agent);
  const collapsible = summary !== null;
  const [collapsed, setCollapsed] = useState(collapsible);

  if (!description) return null;

  return (
    <div className="flex flex-col gap-1.5">
      {action.complete && collapsible && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCollapsed((v) => !v)}
          className="h-7 justify-start"
        >
          {collapsed ? (
            <ChevronRight className="h-3 w-3 mr-1" />
          ) : (
            <ChevronDown className="h-3 w-3 mr-1" />
          )}
          <span className="text-xs text-muted-foreground">{summary}</span>
        </Button>
      )}

      {(!collapsed || !action.complete) && (
        <RenderiqChatHistoryItemExpanded action={action} agent={agent} />
      )}
    </div>
  );
}

function RenderiqChatHistoryItemExpanded({
  action,
  agent,
}: {
  action: Streaming<AgentAction>;
  agent: TldrawAgent;
}) {
  const { icon, description } = getActionInfo(action, agent);

  return (
    <div
      className={cn(
        'flex items-start gap-2 p-2 rounded-md text-sm',
        'bg-background border border-border'
      )}
    >
      {icon && (
        <span className="flex-shrink-0 mt-0.5">
          <AgentIcon type={icon} />
        </span>
      )}
      <span className="text-foreground flex-1">
        <Markdown>{description}</Markdown>
      </span>
    </div>
  );
}

