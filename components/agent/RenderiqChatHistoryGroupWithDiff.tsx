'use client';

import { useCallback, useMemo } from 'react';
import { reverseRecordsDiff, squashRecordDiffs } from 'tldraw';
import { ChatHistoryActionItem } from '@/agent-kit/shared/types/ChatHistoryItem';
import { TldrawAgent } from '@/agent-kit/client/agent/TldrawAgent';
import { ChatHistoryGroup } from '@/agent-kit/client/components/chat-history/ChatHistoryGroup';
import { TldrawDiffViewer } from '@/agent-kit/client/components/chat-history/TldrawDiffViewer';
import { getActionInfo } from '@/agent-kit/client/components/chat-history/getActionInfo';
import { AgentIcon, AgentIconType } from '@/agent-kit/client/components/icons/AgentIcon';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { CheckCircle2, XCircle } from 'lucide-react';
import Markdown from 'react-markdown';

interface RenderiqChatHistoryGroupWithDiffProps {
  group: ChatHistoryGroup;
  agent: TldrawAgent;
}

/**
 * Styled ChatHistoryGroupWithDiff component matching Renderiq design
 */
export function RenderiqChatHistoryGroupWithDiff({
  group,
  agent,
}: RenderiqChatHistoryGroupWithDiffProps) {
  const { items } = group;
  const { editor } = agent;
  const diff = useMemo(() => squashRecordDiffs(items.map((item) => item.diff)), [items]);

  // Accept all changes from this group
  const handleAccept = useCallback(() => {
    agent.$chatHistory.update((currentChatHistoryItems) => {
      const newItems = [...currentChatHistoryItems];
      for (const item of items) {
        const index = newItems.findIndex((v) => v === item);

        // Mark the item as accepted
        if (index !== -1) {
          newItems[index] = { ...item, acceptance: 'accepted' };
        }

        // Apply the diff if needed
        if (item.acceptance === 'rejected') {
          editor.store.applyDiff(item.diff);
        }
      }
      return newItems;
    });
  }, [items, editor, agent.$chatHistory]);

  // Reject all changes from this group
  const handleReject = useCallback(() => {
    agent.$chatHistory.update((currentChatHistoryItems) => {
      const newItems = [...currentChatHistoryItems];
      for (const item of items) {
        const index = newItems.findIndex((v) => v === item);

        // Mark the item as rejected
        if (index !== -1) {
          newItems[index] = { ...item, acceptance: 'rejected' };
        }

        // Reverse the diff if needed
        if (item.acceptance !== 'rejected') {
          const reverseDiff = reverseRecordsDiff(item.diff);
          editor.store.applyDiff(reverseDiff);
        }
      }
      return newItems;
    });
  }, [items, editor, agent.$chatHistory]);

  // Get the acceptance status of the group
  const acceptance = useMemo<ChatHistoryActionItem['acceptance']>(() => {
    if (items.length === 0) return 'pending';
    const acceptance = items[0].acceptance;
    for (let i = 1; i < items.length; i++) {
      if (items[i].acceptance !== acceptance) {
        return 'pending';
      }
    }
    return acceptance;
  }, [items]);

  const steps = useMemo(
    () => items.map((item) => getActionInfo(item.action, agent)),
    [items, agent]
  );

  return (
    <div className={cn(
      'flex flex-col gap-3 p-3 rounded-lg border',
      acceptance === 'accepted' && 'bg-green-500/10 border-green-500/20',
      acceptance === 'rejected' && 'bg-red-500/10 border-red-500/20',
      acceptance === 'pending' && 'bg-muted border-border'
    )}>
      {/* Acceptance Controls */}
      <div className="flex items-center gap-2">
        <Button
          variant={acceptance === 'rejected' ? 'destructive' : 'outline'}
          size="sm"
          onClick={handleReject}
          disabled={acceptance === 'rejected'}
          className="h-7"
        >
          <XCircle className="h-3 w-3 mr-1" />
          {acceptance === 'rejected' ? 'Rejected' : 'Reject'}
        </Button>
        <Button
          variant={acceptance === 'accepted' ? 'default' : 'outline'}
          size="sm"
          onClick={handleAccept}
          disabled={acceptance === 'accepted'}
          className="h-7"
        >
          <CheckCircle2 className="h-3 w-3 mr-1" />
          {acceptance === 'accepted' ? 'Accepted' : 'Accept'}
        </Button>
      </div>

      {/* Action Steps */}
      <DiffSteps steps={steps} />

      {/* Diff Viewer */}
      <div className="border rounded-md overflow-hidden">
        <TldrawDiffViewer diff={diff} />
      </div>
    </div>
  );
}

interface DiffStep {
  icon: AgentIconType | null;
  description: string | null;
}

function DiffSteps({ steps }: { steps: DiffStep[] }) {
  let previousDescription = '';
  return (
    <div className="flex flex-col gap-1.5">
      {steps.map((step, i) => {
        if (!step.description) return null;

        if (step.description === previousDescription) return null;
        previousDescription = step.description;
        return (
          <div key={`intent-${i}`} className="flex items-center gap-2 text-sm">
            {step.icon && (
              <span className="flex-shrink-0">
                <AgentIcon type={step.icon} />
              </span>
            )}
            <span className="text-muted-foreground">
              <Markdown>{step.description}</Markdown>
            </span>
          </div>
        );
      })}
    </div>
  );
}

