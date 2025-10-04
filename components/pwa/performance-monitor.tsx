'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface PerformanceMetrics {
  lcp: number | null;
  fid: number | null;
  cls: number | null;
  fcp: number | null;
  ttfb: number | null;
  fmp: number | null;
}

export function PerformanceMonitor() {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    lcp: null,
    fid: null,
    cls: null,
    fcp: null,
    ttfb: null,
    fmp: null,
  });
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Only run in development or when explicitly enabled
    if (process.env.NODE_ENV !== 'development' && !window.location.search.includes('debug=perf')) {
      return;
    }

    const measurePerformance = () => {
      if (!('performance' in window)) return;

      // Get Web Vitals
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          switch (entry.entryType) {
            case 'largest-contentful-paint':
              setMetrics(prev => ({ ...prev, lcp: entry.startTime }));
              break;
            case 'first-input':
              setMetrics(prev => ({ ...prev, fid: (entry as any).processingStart - entry.startTime }));
              break;
            case 'layout-shift':
              if (!(entry as any).hadRecentInput) {
                setMetrics(prev => ({ ...prev, cls: (prev.cls || 0) + (entry as any).value }));
              }
              break;
            case 'paint':
              if (entry.name === 'first-contentful-paint') {
                setMetrics(prev => ({ ...prev, fcp: entry.startTime }));
              }
              break;
          }
        }
      });

      observer.observe({ entryTypes: ['largest-contentful-paint', 'first-input', 'layout-shift', 'paint'] });

      // Get TTFB
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      if (navigation) {
        setMetrics(prev => ({ ...prev, ttfb: navigation.responseStart - navigation.requestStart }));
      }

      // Get FMP (First Meaningful Paint)
      const paintEntries = performance.getEntriesByType('paint');
      const fmpEntry = paintEntries.find(entry => entry.name === 'first-meaningful-paint');
      if (fmpEntry) {
        setMetrics(prev => ({ ...prev, fmp: fmpEntry.startTime }));
      }

      // Show metrics after 3 seconds
      setTimeout(() => setIsVisible(true), 3000);

      return () => observer.disconnect();
    };

    measurePerformance();
  }, []);

  if (!isVisible) return null;

  const getScore = (value: number | null, thresholds: { good: number; poor: number }) => {
    if (value === null) return 'unknown';
    if (value <= thresholds.good) return 'good';
    if (value <= thresholds.poor) return 'needs-improvement';
    return 'poor';
  };

  const lcpScore = getScore(metrics.lcp, { good: 2500, poor: 4000 });
  const fidScore = getScore(metrics.fid, { good: 100, poor: 300 });
  const clsScore = getScore(metrics.cls, { good: 0.1, poor: 0.25 });
  const fcpScore = getScore(metrics.fcp, { good: 1800, poor: 3000 });
  const ttfbScore = getScore(metrics.ttfb, { good: 800, poor: 1800 });

  return (
    <div className="fixed bottom-4 left-4 z-50 bg-background border border-border rounded-lg shadow-lg p-4 max-w-sm">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold">Performance Metrics</h3>
        <button
          onClick={() => setIsVisible(false)}
          className="text-muted-foreground hover:text-foreground"
        >
          ×
        </button>
      </div>
      
      <div className="space-y-2 text-xs">
        <div className="flex justify-between items-center">
          <span>LCP</span>
          <div className="flex items-center space-x-2">
            <span>{metrics.lcp ? `${Math.round(metrics.lcp)}ms` : 'N/A'}</span>
            <div
              className={cn(
                'w-2 h-2 rounded-full',
                lcpScore === 'good' && 'bg-green-500',
                lcpScore === 'needs-improvement' && 'bg-yellow-500',
                lcpScore === 'poor' && 'bg-red-500',
                lcpScore === 'unknown' && 'bg-gray-500'
              )}
            />
          </div>
        </div>
        
        <div className="flex justify-between items-center">
          <span>FID</span>
          <div className="flex items-center space-x-2">
            <span>{metrics.fid ? `${Math.round(metrics.fid)}ms` : 'N/A'}</span>
            <div
              className={cn(
                'w-2 h-2 rounded-full',
                fidScore === 'good' && 'bg-green-500',
                fidScore === 'needs-improvement' && 'bg-yellow-500',
                fidScore === 'poor' && 'bg-red-500',
                fidScore === 'unknown' && 'bg-gray-500'
              )}
            />
          </div>
        </div>
        
        <div className="flex justify-between items-center">
          <span>CLS</span>
          <div className="flex items-center space-x-2">
            <span>{metrics.cls ? metrics.cls.toFixed(3) : 'N/A'}</span>
            <div
              className={cn(
                'w-2 h-2 rounded-full',
                clsScore === 'good' && 'bg-green-500',
                clsScore === 'needs-improvement' && 'bg-yellow-500',
                clsScore === 'poor' && 'bg-red-500',
                clsScore === 'unknown' && 'bg-gray-500'
              )}
            />
          </div>
        </div>
        
        <div className="flex justify-between items-center">
          <span>FCP</span>
          <div className="flex items-center space-x-2">
            <span>{metrics.fcp ? `${Math.round(metrics.fcp)}ms` : 'N/A'}</span>
            <div
              className={cn(
                'w-2 h-2 rounded-full',
                fcpScore === 'good' && 'bg-green-500',
                fcpScore === 'needs-improvement' && 'bg-yellow-500',
                fcpScore === 'poor' && 'bg-red-500',
                fcpScore === 'unknown' && 'bg-gray-500'
              )}
            />
          </div>
        </div>
        
        <div className="flex justify-between items-center">
          <span>TTFB</span>
          <div className="flex items-center space-x-2">
            <span>{metrics.ttfb ? `${Math.round(metrics.ttfb)}ms` : 'N/A'}</span>
            <div
              className={cn(
                'w-2 h-2 rounded-full',
                ttfbScore === 'good' && 'bg-green-500',
                ttfbScore === 'needs-improvement' && 'bg-yellow-500',
                ttfbScore === 'poor' && 'bg-red-500',
                ttfbScore === 'unknown' && 'bg-gray-500'
              )}
            />
          </div>
        </div>
      </div>
      
      <div className="mt-3 pt-2 border-t border-border">
        <div className="text-xs text-muted-foreground">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span>Good</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 rounded-full bg-yellow-500" />
              <span>Needs Work</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 rounded-full bg-red-500" />
              <span>Poor</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
