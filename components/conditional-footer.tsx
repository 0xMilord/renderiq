'use client';

import { usePathname } from 'next/navigation';
import { Footer } from '@/components/footer';

export function ConditionalFooter() {
  const pathname = usePathname();
  
  // Hide footer on chat routes
  if (pathname.includes('/chat')) {
    return null;
  }
  
  return <Footer />;
}

