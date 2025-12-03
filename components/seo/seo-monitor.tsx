'use client';

import { useEffect } from 'react';

export function SEOMonitor() {
  useEffect(() => {
    // Track page views for SEO monitoring
    const trackPageView = () => {
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'page_view', {
          page_title: document.title,
          page_location: window.location.href,
          page_path: window.location.pathname,
        });
      }
    };

    // Track AI crawler visits (if detectable)
    const trackAICrawler = () => {
      const userAgent = navigator.userAgent.toLowerCase();
      const aiCrawlers = ['gptbot', 'chatgpt-user', 'perplexitybot', 'claude-web', 'bard'];
      
      const isAICrawler = aiCrawlers.some(crawler => userAgent.includes(crawler));
      
      if (isAICrawler && window.gtag) {
        window.gtag('event', 'ai_crawler_visit', {
          crawler_type: aiCrawlers.find(crawler => userAgent.includes(crawler)),
          page_url: window.location.href,
        });
      }
    };

    // Track user engagement metrics
    const trackEngagement = () => {
      let startTime = Date.now();
      let hasScrolled = false;
      let hasClicked = false;

      const trackScroll = () => {
        if (!hasScrolled) {
          hasScrolled = true;
          if (window.gtag) {
            window.gtag('event', 'scroll', {
              page_url: window.location.href,
              scroll_depth: '25%',
            });
          }
        }
      };

      const trackClick = () => {
        if (!hasClicked) {
          hasClicked = true;
          if (window.gtag) {
            window.gtag('event', 'click', {
              page_url: window.location.href,
              engagement_time: Date.now() - startTime,
            });
          }
        }
      };

      const trackTimeOnPage = () => {
        const timeOnPage = Date.now() - startTime;
        if (timeOnPage > 30000 && window.gtag) { // 30 seconds
          window.gtag('event', 'engagement_time', {
            page_url: window.location.href,
            time_on_page: timeOnPage,
          });
        }
      };

      window.addEventListener('scroll', trackScroll, { once: true });
      document.addEventListener('click', trackClick, { once: true });
      
      // Track time on page
      setTimeout(trackTimeOnPage, 30000);
    };

    // Initialize tracking
    trackPageView();
    trackAICrawler();
    trackEngagement();

    // Track when user leaves page
    const handleBeforeUnload = () => {
      const timeOnPage = Date.now() - Date.now();
      if (window.gtag) {
        window.gtag('event', 'page_exit', {
          page_url: window.location.href,
          time_on_page: timeOnPage,
        });
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  return null; // This component doesn't render anything
}

// SEO Performance Monitoring
export function SEOAnalytics() {
  useEffect(() => {
    // Monitor Core Web Vitals
    const measureWebVitals = () => {
      // Largest Contentful Paint (LCP)
      new PerformanceObserver((entryList) => {
        for (const entry of entryList.getEntries()) {
          if (window.gtag) {
            window.gtag('event', 'web_vitals', {
              metric_name: 'LCP',
              metric_value: entry.startTime,
              page_url: window.location.href,
            });
          }
        }
      }).observe({ entryTypes: ['largest-contentful-paint'] });

      // First Input Delay (FID)
      new PerformanceObserver((entryList) => {
        for (const entry of entryList.getEntries()) {
          if (window.gtag) {
            const fidEntry = entry as PerformanceEventTiming;
            if (fidEntry.processingStart) {
              window.gtag('event', 'web_vitals', {
                metric_name: 'FID',
                metric_value: fidEntry.processingStart - fidEntry.startTime,
                page_url: window.location.href,
              });
            }
          }
        }
      }).observe({ entryTypes: ['first-input'] });

      // Cumulative Layout Shift (CLS)
      let clsValue = 0;
      new PerformanceObserver((entryList) => {
        for (const entry of entryList.getEntries()) {
          const layoutShiftEntry = entry as PerformanceEntry & { hadRecentInput?: boolean; value?: number };
          if (!layoutShiftEntry.hadRecentInput && layoutShiftEntry.value) {
            clsValue += layoutShiftEntry.value;
          }
        }
        if (window.gtag) {
          window.gtag('event', 'web_vitals', {
            metric_name: 'CLS',
            metric_value: clsValue,
            page_url: window.location.href,
          });
        }
      }).observe({ entryTypes: ['layout-shift'] });
    };

    // Monitor SEO-specific metrics
    const measureSEOMetrics = () => {
      // Page load time
      window.addEventListener('load', () => {
        const loadTime = performance.timing.loadEventEnd - performance.timing.navigationStart;
        if (window.gtag) {
          window.gtag('event', 'page_load_time', {
            load_time: loadTime,
            page_url: window.location.href,
          });
        }
      });

      // Image load performance
      const images = document.querySelectorAll('img');
      images.forEach((img) => {
        img.addEventListener('load', () => {
          if (window.gtag) {
            window.gtag('event', 'image_load', {
              image_src: img.src,
              load_time: performance.now(),
              page_url: window.location.href,
            });
          }
        });
      });
    };

    measureWebVitals();
    measureSEOMetrics();
  }, []);

  return null;
}

// Declare gtag for TypeScript
declare global {
  interface Window {
    gtag: (...args: any[]) => void;
  }
}
