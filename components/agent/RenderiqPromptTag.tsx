'use client';

import { AgentIcon } from '@/agent-kit/client/components/icons/AgentIcon';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';

interface RenderiqPromptTagProps {
  text: string;
  icon?: string;
  onClick?: () => void;
  showRemove?: boolean;
}

/**
 * Styled PromptTag component matching Renderiq design
 */
export function RenderiqPromptTag({
  text,
  icon,
  onClick,
  showRemove = false,
}: RenderiqPromptTagProps) {
  if (showRemove && onClick) {
    return (
      <Badge
        variant="secondary"
        className={cn(
          'flex items-center gap-1.5 px-2 py-0.5 text-xs',
          'cursor-pointer hover:bg-secondary/80'
        )}
        onClick={onClick}
      >
        {icon && (
          <span className="flex-shrink-0">
            <AgentIcon type={icon as any} />
          </span>
        )}
        <span>{text}</span>
        <X className="h-3 w-3 ml-0.5" />
      </Badge>
    );
  }

  return (
    <Badge
      variant="secondary"
      className={cn(
        'flex items-center gap-1.5 px-2 py-0.5 text-xs',
        onClick && 'cursor-pointer hover:bg-secondary/80'
      )}
      onClick={onClick}
    >
      {icon && (
        <span className="flex-shrink-0">
          <AgentIcon type={icon as any} />
        </span>
      )}
      <span>{text}</span>
    </Badge>
  );
}

