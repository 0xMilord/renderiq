'use client';

import { useCallback } from 'react';
import { useValue } from 'tldraw';
import type { TodoItem } from '@/agent-kit/shared/types/TodoItem';
import type { TldrawAgent } from '@/agent-kit/client/agent/TldrawAgent';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AgentTodoListProps {
  agent: TldrawAgent | null;
}

/**
 * Styled TodoList component for Renderiq
 * Displays agent's todo items with Renderiq design system
 */
export function AgentTodoList({ agent }: AgentTodoListProps) {
  const todoItems = agent ? useValue(agent.$todoList) : [];

  if (!agent || todoItems.length === 0) {
    return null;
  }

  return (
    <div className="space-y-1.5 px-2 py-1.5 border-b border-border bg-muted/30">
      <div className="flex items-center gap-1.5 flex-wrap">
        {todoItems.map((item) => (
          <AgentTodoItem key={item.id} agent={agent} item={item} />
        ))}
      </div>
    </div>
  );
}

interface AgentTodoItemProps {
  agent: TldrawAgent;
  item: TodoItem;
}

function AgentTodoItem({ agent, item }: AgentTodoItemProps) {
  const deleteTodo = useCallback(() => {
    agent.$todoList.update((items) => items.filter((i) => i.id !== item.id));
  }, [item.id, agent]);

  const getStatusConfig = (status: TodoItem['status']) => {
    switch (status) {
      case 'todo':
        return {
          icon: '○',
          className: 'bg-muted text-muted-foreground border-border',
          label: 'Todo',
        };
      case 'in-progress':
        return {
          icon: '➤',
          className: 'bg-primary/20 text-primary border-primary/50',
          label: 'In Progress',
        };
      case 'done':
        return {
          icon: '●',
          className: 'bg-green-500/20 text-green-600 dark:text-green-400 border-green-500/50',
          label: 'Done',
        };
    }
  };

  const config = getStatusConfig(item.status);

  return (
    <Badge
      variant="outline"
      className={cn(
        'h-6 px-2 text-xs font-normal gap-1.5 flex items-center',
        config.className
      )}
    >
      <span className="text-[10px] leading-none">{config.icon}</span>
      <span className="truncate max-w-[120px]">{item.text}</span>
      <Button
        variant="ghost"
        size="icon"
        className="h-4 w-4 p-0 ml-0.5 hover:bg-destructive/20 hover:text-destructive"
        onClick={deleteTodo}
        title="Remove todo"
      >
        <X className="h-3 w-3" />
      </Button>
    </Badge>
  );
}

