'use client';

import { useState, useEffect, useRef } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { useUserRenders } from '@/lib/hooks/use-user-renders';
import type { Render } from '@/lib/types/render';
import { logger } from '@/lib/utils/logger';

interface MentionTaggerProps {
  isOpen: boolean;
  onClose: () => void;
  onMentionSelect: (mention: { text: string; render?: Render }) => void;
  searchTerm: string;
  renders?: Render[];
}

interface MentionItem {
  id: string;
  text: string;
  render?: Render;
  type: 'version' | 'render';
}

export function MentionTagger({ isOpen, onClose, onMentionSelect, searchTerm, renders }: MentionTaggerProps) {
  const [filteredItems, setFilteredItems] = useState<MentionItem[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);
  
  // Fallback to useUserRenders if no renders provided
  const { renders: fallbackRenders, loading } = useUserRenders();
  const actualRenders = renders || fallbackRenders;

  // Generate mention items from renders
  useEffect(() => {
    if (!actualRenders) return;

    const completedRenders = actualRenders
      .filter(render => render.outputUrl && render.status === 'completed')
      .sort((a, b) => (a.chainPosition || 0) - (b.chainPosition || 0));

    logger.log('🔍 MentionTagger: Renders debug', {
      allRenders: actualRenders.map(r => ({ id: r.id, chainPosition: r.chainPosition, status: r.status })),
      completedRenders: completedRenders.map(r => ({ id: r.id, chainPosition: r.chainPosition, status: r.status }))
    });

    const items: MentionItem[] = completedRenders.map((render, index) => ({
      id: render.id,
      text: `version ${index + 1}`,
      render,
      type: 'version' as const
    }));

    // Add generic mentions
    items.push(
      { id: 'latest', text: 'latest version', type: 'render' },
      { id: 'previous', text: 'previous version', type: 'render' },
      { id: 'first', text: 'first version', type: 'render' }
    );

    // Filter based on search term (if any)
    const filtered = searchTerm.trim() 
      ? items.filter(item => {
          const searchLower = searchTerm.toLowerCase().trim();
          const itemLower = item.text.toLowerCase();
          
          // Handle version number searches like "7", "version 7", etc.
          if (searchLower.match(/^\d+$/)) {
            return itemLower.includes(`version ${searchLower}`) || itemLower.includes(searchLower);
          }
          
          return itemLower.includes(searchLower);
        })
      : items;

    logger.log('🔍 MentionTagger: Debug info', {
      totalRenders: actualRenders.length,
      completedRenders: actualRenders.filter(r => r.outputUrl && r.status === 'completed').length,
      itemsCount: items.length,
      filteredCount: filtered.length,
      searchTerm
    });

    setFilteredItems(filtered);
    setSelectedIndex(0);
  }, [actualRenders, searchTerm]);

  // Handle keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev => 
            prev < filteredItems.length - 1 ? prev + 1 : 0
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => 
            prev > 0 ? prev - 1 : filteredItems.length - 1
          );
          break;
        case 'Enter':
          e.preventDefault();
          if (filteredItems[selectedIndex]) {
            handleSelect(filteredItems[selectedIndex]);
          }
          break;
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredItems, selectedIndex, onClose]);

  // Scroll selected item into view
  useEffect(() => {
    if (listRef.current && filteredItems.length > 0) {
      const selectedElement = listRef.current.children[selectedIndex] as HTMLElement;
      if (selectedElement) {
        selectedElement.scrollIntoView({
          block: 'nearest',
          behavior: 'smooth'
        });
      }
    }
  }, [selectedIndex, filteredItems.length]);

  const handleSelect = (item: MentionItem) => {
    onMentionSelect(item);
  };

  if (!isOpen || filteredItems.length === 0) return null;

  return (
    <div className="absolute bottom-full left-0 right-0 mb-2 z-50">
      <div className="bg-background border border-border rounded-lg shadow-lg max-h-64 overflow-hidden">
        <ScrollArea className="h-48 max-h-48">
          <div ref={listRef} className="p-2 space-y-1 max-h-48 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent">
            {filteredItems.map((item, index) => (
              <div
                key={item.id}
                className={cn(
                  "flex items-center space-x-3 p-2 rounded-md cursor-pointer transition-colors",
                  selectedIndex === index
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted"
                )}
                onClick={() => handleSelect(item)}
              >
                {item.render ? (
                  <>
                    <div className="relative w-11 h-11 bg-muted rounded overflow-hidden flex-shrink-0">
                      <Image
                        src={item.render.outputUrl!}
                        alt={item.text}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{item.text}</p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-11 h-11 bg-muted rounded flex items-center justify-center flex-shrink-0">
                      <Clock className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{item.text}</p>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
        
        {filteredItems.length === 0 && (
          <div className="p-4 text-center text-muted-foreground">
            <p className="text-sm">No versions found</p>
          </div>
        )}
      </div>
    </div>
  );
}
