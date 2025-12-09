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
  
  // Hide footer on render routes, project/chain routes, dashboard routes, demo route, and auth routes
  if (
    pathname?.includes('/render') || 
    pathname?.startsWith('/project/') ||
    pathname?.startsWith('/dashboard') ||
    pathname?.startsWith('/demo') ||
    pathname === '/login' ||
    pathname === '/signup' ||
    pathname === '/verify-email' ||
    pathname === '/forgot-password' ||
    pathname === '/reset-password'
  ) {
    return null;
  }
  
  return <Footer />;
}

