'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { BlogMobileSidebar } from './blog-mobile-sidebar';

export function BlogHeaderMobile() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [navbarHeight, setNavbarHeight] = useState(44); // Default navbar height (h-11 = 44px)
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    // Calculate navbar height including AlphaBanner if present
    const calculateNavbarHeight = () => {
      // Look for fixed navbar (new transparent design)
      const navbar = document.querySelector('nav[class*="fixed"]');
      const alphaBanner = document.querySelector('.bg-destructive\\/10');
      
      let height = 0;
      if (alphaBanner && (alphaBanner as HTMLElement).offsetParent !== null) {
        // Only count if banner is visible
        height += (alphaBanner as HTMLElement).clientHeight;
      }
      if (navbar) {
        height += navbar.clientHeight;
      }
      
      setNavbarHeight(height || 44); // Fallback to 44px if not found
    };

    // Check if navbar is scrolled out of view
    const handleScroll = () => {
      const navbar = document.querySelector('nav[class*="fixed"]');
      if (navbar) {
        const navbarRect = navbar.getBoundingClientRect();
        // If navbar is scrolled out of view (above viewport), set height to 0
        if (navbarRect.bottom < 0) {
          setNavbarHeight(0);
        } else {
          calculateNavbarHeight();
        }
      } else {
        calculateNavbarHeight();
      }
    };

    // Wait for DOM to be ready
    const timer = setTimeout(() => {
      calculateNavbarHeight();
      handleScroll();
    }, 100);
    
    window.addEventListener('resize', calculateNavbarHeight);
    window.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', calculateNavbarHeight);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <>
      <div 
        className="border-b lg:hidden fixed left-0 right-0 z-40 transition-all duration-200 pointer-events-none"
        style={mounted ? { top: `${navbarHeight}px` } : undefined}
      >
        <div className="px-4 py-2 h-10 flex items-center pointer-events-auto">
          <div className="p-[3px] border-[0.25px] border-primary rounded-lg bg-background flex-1">
            <Button variant="ghost" asChild className="w-full justify-start h-8">
              <Link href="/blog" className="inline-flex items-center text-sm w-full">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Blog
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Desktop Header */}
      <div className="border-b hidden lg:block">
        <div className="px-4 py-2">
          <Button variant="ghost" asChild>
            <Link href="/blog" className="inline-flex items-center text-sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Blog
            </Link>
          </Button>
        </div>
      </div>

      <BlogMobileSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(!isSidebarOpen)} navbarHeight={navbarHeight} />
    </>
  );
}

