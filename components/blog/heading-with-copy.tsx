'use client';

import { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface HeadingWithCopyProps {
  id: string;
  level: 1 | 2 | 3 | 4;
  children: React.ReactNode;
  className?: string;
}

export function HeadingWithCopy({ id, level, children, className }: HeadingWithCopyProps) {
  const [copied, setCopied] = useState(false);

  const copyAnchorLink = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const anchorUrl = typeof window !== 'undefined' 
      ? `${window.location.origin}${window.location.pathname}#${id}`
      : `#${id}`;

    try {
      await navigator.clipboard.writeText(anchorUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy link:', error);
    }
  };

  const Tag = `h${level}` as keyof JSX.IntrinsicElements;
  const baseClasses = {
    1: 'text-4xl font-bold tracking-tight mt-8 mb-4 scroll-mt-20',
    2: 'text-3xl font-semibold tracking-tight mt-8 mb-4 scroll-mt-20',
    3: 'text-2xl font-semibold tracking-tight mt-6 mb-3 scroll-mt-20',
    4: 'text-xl font-semibold tracking-tight mt-4 mb-2 scroll-mt-20',
  };

  return (
    <Tag
      id={id}
      className={cn(
        'group relative flex items-center gap-2',
        baseClasses[level],
        className
      )}
    >
      <span className="flex-1">{children}</span>
      <Button
        variant="ghost"
        size="sm"
        className={cn(
          'opacity-0 group-hover:opacity-100 transition-opacity h-7 w-7 p-0 shrink-0',
          'hover:bg-muted'
        )}
        onClick={copyAnchorLink}
        title="Copy link to this section"
        aria-label="Copy link to this section"
      >
        {copied ? (
          <Check className="h-3.5 w-3.5 text-primary" />
        ) : (
          <Copy className="h-3.5 w-3.5 text-muted-foreground" />
        )}
      </Button>
    </Tag>
  );
}

