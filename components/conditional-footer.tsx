'use client';

import { usePathname } from 'next/navigation';
import { Footer } from '@/components/footer';

export function ConditionalFooter() {
  const pathname = usePathname();
  
  // Hide footer on render routes
  if (pathname.includes('/render')) {
    return null;
  }
  
  return <Footer />;
}

