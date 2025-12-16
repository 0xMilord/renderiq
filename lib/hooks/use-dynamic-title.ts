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
      } else if (pathname.startsWith('/apps')) {
        pageTitle = 'Apps - Renderiq';
      } else if (pathname !== '/' && !pathname.startsWith('/dashboard') && !pathname.startsWith('/api') && !pathname.startsWith('/_next') && !pathname.startsWith('/u/') && !pathname.startsWith('/gallery') && !pathname.startsWith('/pricing') && !pathname.startsWith('/use-cases') && !pathname.startsWith('/render') && !pathname.startsWith('/canvas') && !pathname.startsWith('/project') && !pathname.startsWith('/login') && !pathname.startsWith('/signup') && !pathname.startsWith('/auth') && !pathname.startsWith('/blog') && !pathname.startsWith('/docs') && !pathname.startsWith('/about') && !pathname.startsWith('/contact') && !pathname.startsWith('/privacy') && !pathname.startsWith('/terms')) {
        // This might be a tool slug at root level
        pageTitle = 'Tool - Renderiq';
      } else if (pathname.startsWith('/pricing')) {
        pageTitle = 'Pricing - Renderiq';
      }
    }

    document.title = pageTitle;
  }, [pathname, title, projectName, chainName]);
}

