'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ToolConfig, CATEGORIES } from '@/lib/tools/registry';

interface ToolLayoutProps {
  tool: ToolConfig;
  children: React.ReactNode;
}

export function ToolLayout({ tool, children }: ToolLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b fixed top-0 left-0 right-0 z-10 w-full pointer-events-none">
        <div className="w-full max-w-[1920px] mx-auto px-4 py-2 pointer-events-auto">
          <div className="flex items-center gap-3">
            {/* Back Button - Auto width (hugging) */}
            <Link href="/apps">
              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            
            {/* Vertical Separator */}
            <div className="h-6 w-px bg-border shrink-0"></div>
            
            {/* Title and Description - Flex grow */}
            <div className="text-left flex-1 min-w-0">
              <h1 className="text-xl font-bold mb-0.5 leading-tight">{tool.name}</h1>
              <p className="text-xs text-muted-foreground line-clamp-1">{tool.description}</p>
            </div>
            
            {/* Badge - Auto width (hugging) */}
            <div className="shrink-0">
              <Badge className="bg-primary text-primary-foreground text-sm px-3 py-1">
                {CATEGORIES.find(cat => cat.id === tool.category)?.name || tool.category}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="w-full max-w-[1920px] mx-auto px-4 py-8 pt-16">
        {children}
      </div>
    </div>
  );
}

