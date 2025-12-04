'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Navbar } from '@/components/navbar';

export function ConditionalNavbar() {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return null;
  }
  
  // Hide navbar on demo route
  if (pathname?.startsWith('/demo')) {
    return null;
  }
  
  return <Navbar />;
}

