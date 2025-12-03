'use client';

import { useState } from 'react';
import { Filter, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

export type SortOption = 'newest' | 'oldest' | 'most_liked' | 'most_viewed' | 'trending';
export type FilterOption = {
  style?: string[];
  quality?: string[];
  aspectRatio?: string[];
};

interface GalleryFiltersProps {
  sortBy: SortOption;
  filters: FilterOption;
  onSortChange: (sort: SortOption) => void;
  onFiltersChange: (filters: FilterOption) => void;
  onClearFilters: () => void;
}

const STYLE_OPTIONS = [
  { value: 'photorealistic', label: 'Photorealistic' },
  { value: 'architectural', label: 'Architectural' },
  { value: 'modern', label: 'Modern' },
  { value: 'classic', label: 'Classic' },
  { value: 'futuristic', label: 'Futuristic' },
];

const QUALITY_OPTIONS = [
  { value: 'standard', label: 'Standard' },
  { value: 'high', label: 'High' },
  { value: 'ultra', label: 'Ultra' },
];

const ASPECT_RATIO_OPTIONS = [
  { value: '16:9', label: '16:9 (Widescreen)' },
  { value: '4:3', label: '4:3 (Standard)' },
  { value: '1:1', label: '1:1 (Square)' },
  { value: '21:9', label: '21:9 (Ultrawide)' },
];

export function GalleryFilters({
  sortBy,
  filters,
  onSortChange,
  onFiltersChange,
  onClearFilters
}: GalleryFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleStyleToggle = (style: string) => {
    const currentStyles = filters.style || [];
    const newStyles = currentStyles.includes(style)
      ? currentStyles.filter(s => s !== style)
      : [...currentStyles, style];
    onFiltersChange({ ...filters, style: newStyles });
  };

  const handleQualityToggle = (quality: string) => {
    const currentQualities = filters.quality || [];
    const newQualities = currentQualities.includes(quality)
      ? currentQualities.filter(q => q !== quality)
      : [...currentQualities, quality];
    onFiltersChange({ ...filters, quality: newQualities });
  };

  const handleAspectRatioToggle = (aspectRatio: string) => {
    const currentRatios = filters.aspectRatio || [];
    const newRatios = currentRatios.includes(aspectRatio)
      ? currentRatios.filter(r => r !== aspectRatio)
      : [...currentRatios, aspectRatio];
    onFiltersChange({ ...filters, aspectRatio: newRatios });
  };

  const activeFilterCount = 
    (filters.style?.length || 0) + 
    (filters.quality?.length || 0) + 
    (filters.aspectRatio?.length || 0);

  const hasActiveFilters = activeFilterCount > 0;

  return (
    <>
      {/* Sort - Column 2 on mobile/tablet, Column 3 on desktop */}
      <div className="col-span-1 flex items-center gap-2">
        <Select value={sortBy} onValueChange={onSortChange}>
          <SelectTrigger className="w-full h-11">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest First</SelectItem>
            <SelectItem value="oldest">Oldest First</SelectItem>
            <SelectItem value="most_liked">Most Liked</SelectItem>
            <SelectItem value="most_viewed">Most Viewed</SelectItem>
            <SelectItem value="trending">Trending</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Filters Button - Column 3 on mobile/tablet, Column 4 on desktop */}
      <div className="col-span-1">
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="relative w-full h-11">
              <Filter className="h-4 w-4 mr-2" />
              Filters
              {hasActiveFilters && (
                <Badge 
                  variant="secondary" 
                  className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
                >
                  {activeFilterCount}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80" align="start" sideOffset={8}>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Filters</h3>
                {hasActiveFilters && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      onClearFilters();
                      setIsOpen(false);
                    }}
                    className="h-7 text-xs"
                  >
                    <X className="h-3 w-3 mr-1" />
                    Clear
                  </Button>
                )}
              </div>

              {/* Style Filter */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Style</Label>
                <div className="space-y-2">
                  {STYLE_OPTIONS.map((option) => (
                    <div key={option.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={`style-${option.value}`}
                        checked={filters.style?.includes(option.value) || false}
                        onCheckedChange={() => handleStyleToggle(option.value)}
                      />
                      <Label
                        htmlFor={`style-${option.value}`}
                        className="text-sm font-normal cursor-pointer"
                      >
                        {option.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quality Filter */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Quality</Label>
                <div className="space-y-2">
                  {QUALITY_OPTIONS.map((option) => (
                    <div key={option.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={`quality-${option.value}`}
                        checked={filters.quality?.includes(option.value) || false}
                        onCheckedChange={() => handleQualityToggle(option.value)}
                      />
                      <Label
                        htmlFor={`quality-${option.value}`}
                        className="text-sm font-normal cursor-pointer"
                      >
                        {option.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Aspect Ratio Filter */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Aspect Ratio</Label>
                <div className="space-y-2">
                  {ASPECT_RATIO_OPTIONS.map((option) => (
                    <div key={option.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={`ratio-${option.value}`}
                        checked={filters.aspectRatio?.includes(option.value) || false}
                        onCheckedChange={() => handleAspectRatioToggle(option.value)}
                      />
                      <Label
                        htmlFor={`ratio-${option.value}`}
                        className="text-sm font-normal cursor-pointer"
                      >
                        {option.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </>
  );
}

