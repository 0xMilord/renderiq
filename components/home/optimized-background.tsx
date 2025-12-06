'use client';

import { memo } from 'react';
import { InteractiveGridPattern } from '@/components/ui/interactive-grid-pattern';

const OptimizedBackground = memo(function OptimizedBackground() {
  return (
    <div className="fixed inset-0 w-full h-full z-0 pointer-events-none" style={{ opacity: 0.1 }}>
      <InteractiveGridPattern
        width={20}
        height={20}
        squares={[80, 80]}
        className="w-full h-full"
      />
    </div>
  );
});

OptimizedBackground.displayName = 'OptimizedBackground';

export default OptimizedBackground;

