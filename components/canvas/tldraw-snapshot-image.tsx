'use client';

import type { TLStoreSnapshot } from '@tldraw/tldraw';
import { useTheme } from 'next-themes';
import { useEffect, useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { cdnToDirectGCS, isCDNUrl } from '@/lib/utils/cdn-fallback';
import ErrorBoundary from '@/components/error-boundary';

// ✅ FIX: Dynamically import TldrawImage to prevent SSR issues with CDN fetches
// TldrawImage internally calls exportToSvg which tries to fetch fonts/images from CDN
const TldrawImage = dynamic(
  () => import('@tldraw/tldraw').then((mod) => mod.TldrawImage),
  { 
    ssr: false, // Disable SSR to prevent CDN fetch errors
    loading: () => (
      <div className="flex items-center justify-center w-full h-full bg-muted">
        <div className="text-muted-foreground text-xs">Loading...</div>
      </div>
    )
  }
);

interface TldrawSnapshotImageProps {
  snapshot: TLStoreSnapshot | null | undefined;
  width?: number;
  height?: number;
  className?: string;
  format?: 'svg' | 'png';
  background?: boolean;
  darkMode?: boolean;
}

/**
 * Pre-process snapshot to replace CDN URLs with direct GCS URLs
 * This prevents CORS errors when tldraw tries to fetch images for SVG/PNG export
 */
function preprocessSnapshot(snapshot: TLStoreSnapshot): TLStoreSnapshot {
  if (!snapshot) return snapshot;

  // Deep clone to avoid mutating original
  const processed = JSON.parse(JSON.stringify(snapshot));

  // Recursively find and replace CDN URLs in the snapshot
  function replaceCDNUrls(obj: any): any {
    if (!obj || typeof obj !== 'object') return obj;

    if (Array.isArray(obj)) {
      return obj.map(replaceCDNUrls);
    }

    const result: any = {};
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'string' && isCDNUrl(value)) {
        // Replace CDN URL with direct GCS URL
        result[key] = cdnToDirectGCS(value);
      } else if (typeof value === 'object' && value !== null) {
        result[key] = replaceCDNUrls(value);
      } else {
        result[key] = value;
      }
    }
    return result;
  }

  return replaceCDNUrls(processed) as TLStoreSnapshot;
}

/**
 * Component to display a tldraw snapshot as an image
 * Used for chain cards and project cards to show canvas previews
 * 
 * ✅ FIXED: Pre-processes snapshots to replace CDN URLs with direct GCS URLs
 * to prevent CORS errors when tldraw exports to SVG/PNG
 */
export function TldrawSnapshotImage({
  snapshot,
  width = 200,
  height = 150,
  className = '',
  format = 'png',
  background = true,
  darkMode: propDarkMode,
}: TldrawSnapshotImageProps) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  
  // Determine dark mode from prop or theme
  const isDarkMode = propDarkMode ?? (resolvedTheme === 'dark');

  // ✅ Pre-process snapshot to replace CDN URLs with direct GCS URLs
  const processedSnapshot = useMemo(() => {
    if (!snapshot) return null;
    return preprocessSnapshot(snapshot);
  }, [snapshot]);

  useEffect(() => {
    setMounted(true);
  }, []);

  // ✅ FIX: Ensure we're on the client side (prevent SSR errors)
  if (typeof window === 'undefined' || !mounted || !processedSnapshot) {
    return (
      <div 
        className={`bg-muted flex items-center justify-center ${className}`}
        style={{ width, height }}
      >
        <div className="text-muted-foreground text-xs">No snapshot</div>
      </div>
    );
  }

  // Extract document from snapshot (getSnapshot returns { document, session })
  const documentSnapshot = processedSnapshot.document || processedSnapshot;

  // ✅ FIX: Wrap in error boundary to catch CDN fetch errors during SVG export
  // These errors occur when tldraw tries to fetch fonts/images from CDN during SSR
  // Using dynamic import with ssr: false ensures TldrawImage only loads on client
  return (
    <ErrorBoundary
      onError={(error) => {
        // ✅ FIX: Log CDN fetch errors (likely during SSR) but don't crash the app
        if (error.message?.includes('Failed to fetch') || error.message?.includes('cdn')) {
          console.warn('TldrawImage CDN fetch error (likely SSR):', error.message);
          // Don't report to Sentry - these are expected during SSR
          return;
        }
      }}
    >
      <div 
        className={`overflow-hidden rounded-md ${className}`}
        style={{ width, height }}
      >
        <TldrawImage
          snapshot={documentSnapshot}
          background={background}
          darkMode={isDarkMode}
          format={format}
          padding={0}
          scale={1}
        />
      </div>
    </ErrorBoundary>
  );
}

