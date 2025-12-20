'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

// ✅ FIX: Dynamically import ClientProviders with ssr: false
// This prevents it from being loaded during SSR where React context is null
// Must be a client component to use dynamic with ssr: false
const ClientProviders = dynamic(
  () => import('./client-providers').then((mod) => ({ default: mod.ClientProviders })),
  { 
    ssr: false,
    loading: () => null // Don't show loading state during SSR
  }
);

interface ClientProvidersWrapperProps {
  children: React.ReactNode;
}

// ✅ FIX: Add mounted check to ensure component only renders on client
// This prevents any SSR evaluation even if dynamic import somehow runs
export function ClientProvidersWrapper({ children }: ClientProvidersWrapperProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Don't render anything during SSR - return children directly
  if (!mounted) {
    return <>{children}</>;
  }

  return <ClientProviders>{children}</ClientProviders>;
}

