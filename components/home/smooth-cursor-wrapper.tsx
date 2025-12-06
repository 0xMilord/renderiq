'use client';

import { SmoothCursor } from '@/components/ui/smooth-cursor';
import { useEffect } from 'react';

export function SmoothCursorWrapper() {
  useEffect(() => {
    // Hide default cursor only on homepage where this component is used
    document.body.style.cursor = 'none';
    
    // Cleanup: restore default cursor when component unmounts
    return () => {
      document.body.style.cursor = 'auto';
    };
  }, []);

  return <SmoothCursor />;
}

