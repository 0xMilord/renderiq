'use client';

import { TldrawImage } from '@tldraw/tldraw';
import type { TLStoreSnapshot } from '@tldraw/tldraw';
import { useTheme } from 'next-themes';
import { useEffect, useState, useMemo } from 'react';
import { cdnToDirectGCS, isCDNUrl } from '@/lib/utils/cdn-fallback';

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

  if (!mounted || !processedSnapshot) {
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

  return (
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
  );
}

