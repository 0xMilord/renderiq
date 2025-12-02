'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface Heading {
  id: string;
  text: string;
  level: number;
}

export function TableOfContents() {
  const [headings, setHeadings] = useState<Heading[]>([]);
  const [activeId, setActiveId] = useState<string>('');

  useEffect(() => {
    const elements = Array.from(document.querySelectorAll('h2, h3'))
      .map((el, index) => ({
        id: el.id || `heading-${index}`,
        text: el.textContent || '',
        level: Number(el.tagName[1]),
      }))
      .filter((heading) => heading.text.trim().length > 0); // Filter out empty headings

    setHeadings(elements);

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
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
  }, []);

  if (headings.length === 0) return null;

  return (
    <div className="hidden xl:block">
      <div className="sticky top-20">
        <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          On this page
        </h3>
        <nav className="space-y-2">
          {headings.map((heading, index) => (
            <a
              key={heading.id || `heading-${index}`}
              href={`#${heading.id}`}
              className={cn(
                'block text-sm transition-colors',
                heading.level === 3 && 'pl-4',
                activeId === heading.id
                  ? 'text-primary font-medium'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {heading.text}
            </a>
          ))}
        </nav>
      </div>
    </div>
  );
}

