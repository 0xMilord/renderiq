'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, X, Clock, Image as ImageIcon, Video } from 'lucide-react';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { useUserRenders } from '@/lib/hooks/use-user-renders';
import type { Render } from '@/lib/types/render';

interface GalleryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImageSelect: (image: { url: string; file?: File; render?: Render }) => void;
}

interface GalleryItem {
  id: string;
  url: string;
  prompt: string;
  type: 'image' | 'video';
  createdAt: Date;
  render?: Render;
  source: 'render' | 'upload';
}

export function GalleryModal({ isOpen, onClose, onImageSelect }: GalleryModalProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<'all' | 'image' | 'video'>('all');
  const [filteredItems, setFilteredItems] = useState<GalleryItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<GalleryItem | null>(null);
  
  const { renders, loading, error } = useUserRenders();

  // Convert renders to gallery items
  useEffect(() => {
    if (renders) {
      const items: GalleryItem[] = renders
        .filter(render => render.outputUrl && render.status === 'completed')
        .map(render => ({
          id: render.id,
          url: render.outputUrl!,
          prompt: render.prompt || 'Untitled',
          type: render.type,
          createdAt: render.createdAt,
          render,
          source: 'render' as const
        }));

      setFilteredItems(items);
    }
  }, [renders]);

  // Filter items based on search and type
  useEffect(() => {
    if (!renders) return;

    let filtered = renders
      .filter(render => render.outputUrl && render.status === 'completed')
      .map(render => ({
        id: render.id,
        url: render.outputUrl!,
        prompt: render.prompt || 'Untitled',
        type: render.type,
        createdAt: render.createdAt,
        render,
        source: 'render' as const
      }));

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(item =>
        item.prompt.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by type
    if (selectedType !== 'all') {
      filtered = filtered.filter(item => item.type === selectedType);
    }

    // Sort by creation date (newest first)
    filtered.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    setFilteredItems(filtered);
  }, [renders, searchTerm, selectedType]);

  const handleImageSelect = (item: GalleryItem) => {
    setSelectedItem(item);
  };

  const handleConfirm = () => {
    if (selectedItem) {
      onImageSelect({
        url: selectedItem.url,
        render: selectedItem.render
      });
      onClose();
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>My Gallery</span>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search and Filters */}
          <div className="flex space-x-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by prompt..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex space-x-1">
              <Button
                variant={selectedType === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedType('all')}
              >
                All
              </Button>
              <Button
                variant={selectedType === 'image' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedType('image')}
              >
                <ImageIcon className="h-4 w-4 mr-1" />
                Images
              </Button>
              <Button
                variant={selectedType === 'video' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedType('video')}
              >
                <Video className="h-4 w-4 mr-1" />
                Videos
              </Button>
            </div>
          </div>

          {/* Gallery Grid */}
          <ScrollArea className="h-[400px]">
            {loading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : error ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Failed to load gallery</p>
                <p className="text-sm text-muted-foreground">{error}</p>
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="text-center py-8">
                <ImageIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">No images found</p>
                <p className="text-sm text-muted-foreground">
                  {searchTerm ? 'Try adjusting your search' : 'Start creating renders to see them here'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredItems.map((item) => (
                  <div
                    key={item.id}
                    className={cn(
                      "relative group cursor-pointer rounded-lg overflow-hidden border-2 transition-all",
                      selectedItem?.id === item.id
                        ? "border-primary ring-2 ring-primary/20"
                        : "border-border hover:border-primary/50"
                    )}
                    onClick={() => handleImageSelect(item)}
                  >
                    <div className="aspect-square relative bg-muted">
                      {/* Use regular img tag for external storage URLs to avoid Next.js 16 private IP blocking */}
                      {(item.url?.includes('supabase.co') || item.url?.includes('storage.googleapis.com') || item.url?.includes(process.env.NEXT_PUBLIC_GCS_CDN_DOMAIN || '')) ? (
                        <img
                          src={item.url}
                          alt={item.prompt}
                          className="absolute inset-0 w-full h-full object-cover"
                        />
                      ) : (
                        <Image
                          src={item.url}
                          alt={item.prompt}
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                        />
                      )}
                      
                      {/* Overlay */}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                      
                      {/* Type Badge */}
                      <div className="absolute top-2 left-2">
                        <Badge variant="secondary" className="text-xs">
                          {item.type === 'video' ? (
                            <Video className="h-3 w-3 mr-1" />
                          ) : (
                            <ImageIcon className="h-3 w-3 mr-1" />
                          )}
                          {item.type}
                        </Badge>
                      </div>

                      {/* Selection Indicator */}
                      {selectedItem?.id === item.id && (
                        <div className="absolute inset-0 bg-primary/10 flex items-center justify-center">
                          <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                            <div className="w-2 h-2 bg-white rounded-full" />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Item Info */}
                    <div className="p-2 space-y-1">
                      <p className="text-xs font-medium line-clamp-2">
                        {item.prompt}
                      </p>
                      <div className="flex items-center text-xs text-muted-foreground">
                        <Clock className="h-3 w-3 mr-1" />
                        {formatDate(item.createdAt)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>

          {/* Selected Item Preview */}
          {selectedItem && (
            <div className="border-t pt-4">
              <div className="flex items-start space-x-4">
                <div className="relative w-16 h-16 bg-muted rounded-lg overflow-hidden flex-shrink-0">
                  {/* Use regular img tag for external storage URLs to avoid Next.js 16 private IP blocking */}
                  {(selectedItem.url?.includes('supabase.co') || selectedItem.url?.includes('storage.googleapis.com') || selectedItem.url?.includes(process.env.NEXT_PUBLIC_GCS_CDN_DOMAIN || '')) ? (
                    <img
                      src={selectedItem.url}
                      alt={selectedItem.prompt}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Image
                      src={selectedItem.url}
                      alt={selectedItem.prompt}
                      fill
                      className="object-cover"
                    />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-sm line-clamp-2">
                    {selectedItem.prompt}
                  </h4>
                  <div className="flex items-center space-x-2 mt-1">
                    <Badge variant="outline" className="text-xs">
                      {selectedItem.type}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {formatDate(selectedItem.createdAt)}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    This image will be used as context for your new generation
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleConfirm}
            disabled={!selectedItem}
          >
            Use Selected Image
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
