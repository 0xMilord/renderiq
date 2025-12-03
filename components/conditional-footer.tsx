'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Footer } from '@/components/footer';

export function ConditionalFooter() {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return null;
  }
  
  // Hide footer on render routes and project/chain routes
  if (pathname?.includes('/render') || pathname?.startsWith('/project/')) {
    return null;
  }
  
  return <Footer />;
}

