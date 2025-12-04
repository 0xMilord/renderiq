'use client';

import { useEffect, useState, memo } from 'react';
import { cn } from '@/lib/utils';
import { Copy, Check, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

interface Heading {
  id: string;
  text: string;
  level: number;
}

interface GroupedHeading extends Heading {
  children: Heading[];
}

const BlogTableOfContents = memo(function BlogTableOfContents() {
  const [groupedHeadings, setGroupedHeadings] = useState<GroupedHeading[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    // Wait for content to render
    const timer = setTimeout(() => {
      // Only select H1 and H2 headings
      const elements = Array.from(document.querySelectorAll('.prose h1, .prose h2'))
        .map((el, index) => {
          // Generate ID if not present
          if (!el.id) {
            // Get text from span (which contains the actual heading text, excluding button)
            const span = el.querySelector('span');
            const text = span?.textContent || el.textContent || '';
            const id = text
              .toLowerCase()
              .replace(/[^\w\s-]/g, '')
              .replace(/\s+/g, '-')
              .replace(/-+/g, '-');
            el.id = id || `heading-${index}`;
          }
          // Get text from span (which contains the actual heading text, excluding button)
          const span = el.querySelector('span');
          const text = span?.textContent || el.textContent || '';
          return {
            id: el.id,
            text: text.trim(),
            level: Number(el.tagName[1]),
          };
        })
        .filter((heading) => heading.text.trim().length > 0);

      // Group headings: H1s are top-level, H2s nest under their parent H1
      const grouped: GroupedHeading[] = [];
      let currentH1: GroupedHeading | null = null;

      elements.forEach((heading) => {
        if (heading.level === 1) {
          // New H1 - create new group
          currentH1 = {
            ...heading,
            children: [],
          };
          grouped.push(currentH1);
        } else if (currentH1 && heading.level === 2) {
          // H2 - add to current H1's children
          currentH1.children.push(heading);
        }
      });

      setGroupedHeadings(grouped);

      // Set up intersection observer for active heading
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              // You could highlight the active heading here if needed
            }
          });
        },
        { rootMargin: '-100px 0% -66%' }
      );

      elements.forEach(({ id }) => {
        const element = document.getElementById(id);
        if (element) observer.observe(element);
      });

      return () => observer.disconnect();
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  const copyAnchorLink = async (headingId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const anchorUrl = typeof window !== 'undefined' 
      ? `${window.location.origin}${window.location.pathname}#${headingId}`
      : `#${headingId}`;

    try {
      await navigator.clipboard.writeText(anchorUrl);
      setCopiedId(headingId);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (error) {
      console.error('Failed to copy link:', error);
    }
  };

  if (groupedHeadings.length === 0) return null;

  return (
    <div className="hidden lg:block w-80 flex-shrink-0 self-start">
      <div className="sticky top-4 max-h-[calc(100vh-2rem)] overflow-y-auto">
        <div className="bg-card border border-border rounded-lg p-4 w-full">
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Table of Contents
          </h3>
          <div>
            <Accordion type="multiple" className="w-full" defaultValue={groupedHeadings.map((_, i) => `item-${i}`)}>
              {groupedHeadings.map((h1, h1Index) => (
                <AccordionItem key={h1.id || `h1-${h1Index}`} value={`item-${h1Index}`} className="border-none">
                  <AccordionTrigger className="py-2 text-sm font-medium hover:no-underline group/item">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <a
                        href={`#${h1.id}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          const element = document.getElementById(h1.id);
                          if (element) {
                            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                          }
                        }}
                        className="text-left hover:text-primary transition-colors flex-1 min-w-0 truncate"
                      >
                        {h1.text}
                      </a>
                      <div
                        className={cn(
                          'opacity-0 group-hover/item:opacity-100 transition-opacity h-6 w-6 p-0 shrink-0',
                          'hover:bg-muted rounded-md cursor-pointer flex items-center justify-center',
                          'flex-shrink-0'
                        )}
                        onClick={(e) => copyAnchorLink(h1.id, e)}
                        title="Copy link to this section"
                        aria-label="Copy link to this section"
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            copyAnchorLink(h1.id, e as any);
                          }
                        }}
                      >
                        {copiedId === h1.id ? (
                          <Check className="h-3 w-3 text-primary" />
                        ) : (
                          <Copy className="h-3 w-3 text-muted-foreground" />
                        )}
                      </div>
                    </div>
                  </AccordionTrigger>
                  {h1.children.length > 0 && (
                    <AccordionContent className="pb-2">
                      <nav className="space-y-1 pl-2">
                        {h1.children.map((child, childIndex) => (
                          <div
                            key={child.id || `child-${childIndex}`}
                            className="group/item flex items-center gap-2"
                          >
                            <a
                              href={`#${child.id}`}
                              className={cn(
                                'flex-1 text-sm transition-colors rounded px-2 py-1 min-w-0 truncate',
                                'pl-4',
                                'text-muted-foreground hover:text-foreground hover:bg-muted'
                              )}
                              onClick={(e) => {
                                e.preventDefault();
                                const element = document.getElementById(child.id);
                                if (element) {
                                  element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                }
                              }}
                            >
                              {child.text}
                            </a>
                          <div
                            className={cn(
                              'opacity-0 group-hover/item:opacity-100 transition-opacity h-6 w-6 p-0 shrink-0',
                              'hover:bg-muted rounded-md cursor-pointer flex items-center justify-center',
                              'flex-shrink-0'
                            )}
                            onClick={(e) => copyAnchorLink(child.id, e)}
                            title="Copy link to this section"
                            aria-label="Copy link to this section"
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                copyAnchorLink(child.id, e as any);
                              }
                            }}
                          >
                            {copiedId === child.id ? (
                              <Check className="h-3 w-3 text-primary" />
                            ) : (
                              <Copy className="h-3 w-3 text-muted-foreground" />
                            )}
                          </div>
                          </div>
                        ))}
                      </nav>
                    </AccordionContent>
                  )}
                </AccordionItem>
              ))}
            </Accordion>
          </div>

          {/* Separator */}
          <div className="my-4 h-px bg-border" />

          {/* Premium CTA */}
          <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 space-y-3">
            <div className="flex items-start gap-2">
              <div className="relative h-5 w-5 shrink-0 mt-0.5">
                <Image
                  src="/logo.svg"
                  alt="Renderiq Logo"
                  fill
                  className="object-contain"
                  sizes="20px"
                />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-semibold text-foreground mb-1">
                  World-Class AI Render Engine
                </h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Transform your AEC projects with Renderiq's premium AI rendering platform. Generate photorealistic renders and videos in seconds.
                </p>
              </div>
            </div>
            <Link
              href="/pricing"
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90 rounded-md px-3 py-2 text-sm font-medium flex items-center justify-center gap-2 transition-colors"
            >
              Upgrade to Premium
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
});

export { BlogTableOfContents };
