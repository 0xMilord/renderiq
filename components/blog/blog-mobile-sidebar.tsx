'use client';

import { useEffect, useState, memo } from 'react';
import { cn } from '@/lib/utils';
import { Copy, Check, ArrowRight, X, PanelLeftOpen } from 'lucide-react';
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

interface BlogMobileSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  navbarHeight?: number;
}

const BlogMobileSidebar = memo(function BlogMobileSidebar({ isOpen, onClose, navbarHeight = 44 }: BlogMobileSidebarProps) {
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

  // Generate numbering for headings
  const getHeadingNumber = (h1Index: number, h2Index?: number): string => {
    if (h2Index !== undefined) {
      return `${h1Index + 1}.${h2Index + 1}`;
    }
    return `${h1Index + 1}`;
  };

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          'fixed left-0 bg-card border-r z-50 transition-all duration-300 ease-in-out lg:hidden flex flex-col',
          isOpen ? 'w-[85vw] max-w-sm translate-x-0' : 'w-12 translate-x-0',
          'overflow-x-hidden' // Prevent horizontal scroll
        )}
        style={{
          top: `${navbarHeight + 40}px`,
          height: `calc(100vh - ${navbarHeight + 40}px - 56px)`
        }}
      >
        {/* Header */}
        <div className={cn(
          "border-b shrink-0 flex items-center",
          "px-4 py-2 h-10", // Match blog header exactly: px-4 py-2 h-10 flex items-center
          isOpen ? "justify-between" : "justify-center"
        )}>
          {isOpen ? (
            <>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground break-words min-w-0 flex-shrink">
                Table of Contents
              </h3>
              <div
                onClick={onClose}
                className="h-8 w-8 rounded-md hover:bg-muted cursor-pointer flex items-center justify-center transition-colors"
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onClose();
                  }
                }}
              >
                <X className="h-4 w-4" />
              </div>
            </>
          ) : (
            <div
              onClick={onClose}
              className="h-8 w-8 rounded-md hover:bg-muted cursor-pointer flex items-center justify-center transition-colors"
              title="Expand table of contents"
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onClose();
                }
              }}
            >
              <PanelLeftOpen className="h-4 w-4" />
            </div>
          )}
        </div>

        {/* Content */}
        <div className={cn(
          "flex-1 overflow-y-auto overflow-x-hidden",
          isOpen ? "p-4" : "p-2 flex flex-col items-center gap-1",
          "min-w-0 w-full" // Ensure proper width constraints
        )}>
          {!isOpen && (() => {
            // Collect all H2 headings from all H1 groups for sequential numbering
            const allH2Headings: Heading[] = [];
            groupedHeadings.forEach((h1) => {
              if (h1.children.length > 0) {
                // If H1 has H2 children, add all H2s
                allH2Headings.push(...h1.children);
              } else {
                // If H1 has no H2 children, add H1 as fallback
                allH2Headings.push(h1);
              }
            });

            return (
              <div className="flex flex-col items-center gap-1 w-full">
                {allH2Headings.map((heading, index) => {
                  const isLast = index === allH2Headings.length - 1;
                  
                  return (
                    <div key={heading.id || `heading-${index}`} className="flex flex-col items-center gap-0.5 w-full">
                      <a
                        href={`#${heading.id}`}
                        onClick={(e) => {
                          e.preventDefault();
                          const element = document.getElementById(heading.id);
                          if (element) {
                            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                          }
                        }}
                        className="text-xs font-medium text-muted-foreground hover:text-primary transition-colors py-1"
                        title={heading.text}
                      >
                        {index + 1}
                      </a>
                      {/* Horizontal separator after each major number (except the last) */}
                      {!isLast && (
                        <div className="w-6 h-px bg-border my-1" />
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })()}
          {isOpen && (
            <>
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
                          onClose(); // Close sidebar after navigation
                        }
                      }}
                      className="text-left hover:text-primary transition-colors flex-1 min-w-0 break-words"
                    >
                      {h1.text}
                    </a>
                    <div
                      className={cn(
                        'opacity-0 group-hover/item:opacity-100 transition-opacity h-6 w-6 p-0 shrink-0',
                        'hover:bg-muted rounded-md cursor-pointer flex items-center justify-center',
                        'flex-shrink-0'
                      )}
                      onClick={(e) => {
                        e.stopPropagation();
                        copyAnchorLink(h1.id, e);
                      }}
                      title="Copy link to this section"
                      aria-label="Copy link to this section"
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
                              'flex-1 text-sm transition-colors rounded px-2 py-1 min-w-0 break-words',
                              'pl-4',
                              'text-muted-foreground hover:text-foreground hover:bg-muted'
                            )}
                            onClick={(e) => {
                              e.preventDefault();
                              const element = document.getElementById(child.id);
                              if (element) {
                                element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                onClose(); // Close sidebar after navigation
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
                            onClick={(e) => {
                              e.stopPropagation();
                              copyAnchorLink(child.id, e);
                            }}
                            title="Copy link to this section"
                            aria-label="Copy link to this section"
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
                <h4 className="text-sm font-semibold text-foreground mb-1 break-words">
                  World-Class AI Render Engine
                </h4>
                <p className="text-xs text-muted-foreground leading-relaxed break-words">
                  Transform your AEC projects with Renderiq's premium AI rendering platform. Generate photorealistic renders and videos in seconds.
                </p>
              </div>
            </div>
            <Link
              href="/pricing"
              onClick={onClose}
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90 rounded-md px-3 py-2 text-sm font-medium flex items-center justify-center gap-2 transition-colors"
            >
              Upgrade to Premium
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          </>
          )}
        </div>
      </div>
    </>
  );
});

export { BlogMobileSidebar };

