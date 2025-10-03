'use client';

import { usePathname } from 'next/navigation';
import { Footer } from '@/components/footer';

export function ConditionalFooter() {
  const pathname = usePathname();
  
  // Hide footer on engine routes
  if (pathname.startsWith('/engine')) {
    return null;
  }
  
  return <Footer />;
}
