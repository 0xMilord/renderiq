'use client';

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRight } from 'lucide-react';
import { getToolBySlug, type ToolConfig } from '@/lib/tools/registry';
import { getToolIconPath } from '@/lib/utils/tool-icons';

interface RelatedToolsProps {
  toolSlugs: string[];
  title?: string;
  description?: string;
}

export function RelatedTools({ toolSlugs, title = "Related Tools", description }: RelatedToolsProps) {
  const relatedTools: ToolConfig[] = toolSlugs
    .map(slug => getToolBySlug(slug))
    .filter((tool): tool is ToolConfig => tool !== undefined && tool.status === 'online');

  if (relatedTools.length === 0) {
    return null;
  }

  return (
    <section className="py-12 px-4 bg-muted/30">
      <div className="container mx-auto max-w-7xl">
        <div className="mb-8">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">{title}</h2>
          {description && (
            <p className="text-lg text-muted-foreground max-w-2xl">
              {description}
            </p>
          )}
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {relatedTools.map((tool) => {
            const iconPath = getToolIconPath(tool.slug);
            const isOnline = tool.status === 'online';

            return (
              <Link 
                key={tool.id} 
                href={isOnline ? `/apps/${tool.slug}` : '#'}
                onClick={(e) => {
                  if (!isOnline) {
                    e.preventDefault();
                  }
                }}
              >
                <Card className="h-full hover:shadow-lg transition-all duration-300 group cursor-pointer">
                  <CardHeader>
                    <div className="flex items-start gap-4 mb-4">
                      <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 relative">
                        <img
                          src={iconPath}
                          alt={tool.name}
                          className="w-8 h-8 object-contain"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            const parent = target.parentElement;
                            if (parent) {
                              const existingFallback = parent.querySelector('.fallback-icon');
                              if (!existingFallback) {
                                const fallback = document.createElement('div');
                                fallback.className = 'fallback-icon';
                                fallback.innerHTML = '<svg class="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>';
                                parent.appendChild(fallback);
                              }
                            }
                          }}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-xl mb-2 group-hover:text-primary transition-colors line-clamp-2">
                          {tool.name}
                        </CardTitle>
                        <Badge 
                          variant={isOnline ? "default" : "secondary"}
                          className="mb-2"
                        >
                          {isOnline ? 'Online' : 'Offline'}
                        </Badge>
                      </div>
                    </div>
                    <CardDescription className="text-sm line-clamp-3">
                      {tool.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button 
                      variant="outline" 
                      className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                      disabled={!isOnline}
                    >
                      {isOnline ? 'Try Tool' : 'Coming Soon'}
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}

