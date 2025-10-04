'use client';

import { usePathname } from 'next/navigation';
import { Footer } from '@/components/footer';

export function ConditionalFooter() {
  const pathname = usePathname();
  
  // Hide footer on engine routes and chat routes
  if (pathname.startsWith('/engine') || pathname.includes('/chat')) {
    return null;
  }
  
  return <Footer />;
}

