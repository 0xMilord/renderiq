'use client';

import { useCallback } from 'react';
import { useValue } from 'tldraw';
import { TodoItem } from '@/agent-kit/shared/types/TodoItem';
import { TldrawAgent } from '@/agent-kit/client/agent/TldrawAgent';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { X, Circle, PlayCircle, CheckCircle2 } from 'lucide-react';

interface RenderiqTodoListProps {
  agent: TldrawAgent;
  className?: string;
}

/**
 * Styled TodoList component matching Renderiq design
 * Displays agent's todo items
 */
export function RenderiqTodoList({ agent, className }: RenderiqTodoListProps) {
  const todoItems = useValue(agent.$todoList);

  if (todoItems.length === 0) {
    return null;
  }

  return (
    <div className={cn('flex flex-col gap-1.5 p-2 bg-muted/50 rounded-lg', className)}>
      <div className="text-xs font-medium text-muted-foreground mb-1">Agent Tasks</div>
      <div className="flex flex-col gap-1">
        {todoItems.map((item) => (
          <RenderiqTodoListItem key={item.id} agent={agent} item={item} />
        ))}
      </div>
    </div>
  );
}

function RenderiqTodoListItem({
  agent,
  item,
}: {
  agent: TldrawAgent;
  item: TodoItem;
}) {
  const deleteTodo = useCallback(() => {
    agent.$todoList.update((items) => items.filter((i) => i.id !== item.id));
  }, [item.id, agent.$todoList]);

  const getStatusIcon = (status: TodoItem['status']) => {
    switch (status) {
      case 'todo':
        return <Circle className="h-3 w-3" />;
      case 'in-progress':
        return <PlayCircle className="h-3 w-3" />;
      case 'done':
        return <CheckCircle2 className="h-3 w-3" />;
    }
  };

  const getStatusColor = (status: TodoItem['status']) => {
    switch (status) {
      case 'todo':
        return 'text-muted-foreground';
      case 'in-progress':
        return 'text-blue-500';
      case 'done':
        return 'text-green-500';
    }
  };

  return (
    <div
      className={cn(
        'flex items-center gap-2 p-1.5 rounded text-xs',
        'bg-background border border-border'
      )}
    >
      <span className={cn('flex-shrink-0', getStatusColor(item.status))}>
        {getStatusIcon(item.status)}
      </span>
      <span className="flex-1 text-foreground">{item.text}</span>
      <Button
        variant="ghost"
        size="sm"
        onClick={deleteTodo}
        className="h-5 w-5 p-0 hover:bg-destructive/10"
      >
        <X className="h-3 w-3" />
      </Button>
    </div>
  );
}

