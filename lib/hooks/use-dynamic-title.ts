'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

/**
 * Hook for dynamic title updates based on route and context
 */
export function useDynamicTitle(title?: string, projectName?: string, chainName?: string) {
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window === 'undefined') return;

    let pageTitle = 'Renderiq';

    // Custom title takes precedence
    if (title) {
      pageTitle = title;
    } else if (chainName) {
      pageTitle = `${chainName} - Renderiq`;
    } else if (projectName) {
      pageTitle = `${projectName} - Renderiq`;
    } else {
      // Route-based titles
      if (pathname.startsWith('/render')) {
        pageTitle = 'Render - Renderiq';
      } else if (pathname.startsWith('/dashboard')) {
        pageTitle = 'Dashboard - Renderiq';
      } else if (pathname.startsWith('/gallery')) {
        pageTitle = 'Gallery - Renderiq';
      } else if (pathname.startsWith('/project/')) {
        pageTitle = 'Project - Renderiq';
      } else if (pathname.startsWith('/apps/')) {
        pageTitle = 'Apps - Renderiq';
      } else if (pathname.startsWith('/pricing')) {
        pageTitle = 'Pricing - Renderiq';
      }
    }

    document.title = pageTitle;
  }, [pathname, title, projectName, chainName]);
}

