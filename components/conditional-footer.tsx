'use client';

import { usePathname } from 'next/navigation';
import { Footer } from '@/components/footer';

export function ConditionalFooter() {
  const pathname = usePathname();
  
  // Hide footer on render routes and project/chain routes
  if (pathname.includes('/render') || pathname.startsWith('/project/')) {
    return null;
  }
  
  return <Footer />;
}

