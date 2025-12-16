'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { AgentIcon, type AgentIconType } from '@/agent-kit/client/components/icons/AgentIcon';
import { cn } from '@/lib/utils';

interface StyledPromptTagProps {
  text: string;
  icon: AgentIconType;
  onClick?: () => void;
  className?: string;
}

/**
 * Styled PromptTag component matching Renderiq design system
 * Replaces the original PromptTag with Tailwind classes
 */
export function StyledPromptTag({ text, icon, onClick, className }: StyledPromptTagProps) {
  const content = (
    <Badge
      variant="outline"
      className={cn(
        'h-7 px-2 text-xs font-normal gap-1.5 flex items-center bg-muted/50 hover:bg-muted',
        onClick && 'cursor-pointer',
        className
      )}
      onClick={onClick}
    >
      <AgentIcon type={icon} />
      <span>{text}</span>
    </Badge>
  );

  return content;
}

