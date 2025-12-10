'use client';

import { Button } from '@/components/ui/button';
import { Grid3X3, List, LayoutGrid } from 'lucide-react';

interface ViewModeToggleProps {
  viewMode: 'default' | 'compact' | 'list';
  onViewModeChange: (mode: 'default' | 'compact' | 'list') => void;
}

export function ViewModeToggle({ viewMode, onViewModeChange }: ViewModeToggleProps) {
  return (
    <div className="flex items-center space-x-1 border rounded-lg p-0.5 h-8">
      <Button
        variant={viewMode === 'default' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => onViewModeChange('default')}
        className="h-7 w-7 p-0"
      >
        <LayoutGrid className="h-4 w-4" />
      </Button>
      <Button
        variant={viewMode === 'compact' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => onViewModeChange('compact')}
        className="h-7 w-7 p-0"
      >
        <Grid3X3 className="h-4 w-4" />
      </Button>
      <Button
        variant={viewMode === 'list' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => onViewModeChange('list')}
        className="h-7 w-7 p-0"
      >
        <List className="h-4 w-4" />
      </Button>
    </div>
  );
}
