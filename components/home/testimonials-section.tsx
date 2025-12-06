'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useTheme } from 'next-themes';
import { Badge } from '@/components/ui/badge';
import { TwitterTestimonialsGrid } from './twitter-testimonials-grid';

interface TwitterTestimonial {
  url: string;
  fallback?: {
    text: string;
    author: string;
    username: string;
  };
}

interface TestimonialsSectionProps {
  testimonials: TwitterTestimonial[];
}

export function TestimonialsSection({ testimonials }: TestimonialsSectionProps) {
  const { theme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDarkMode = mounted && (resolvedTheme === 'dark' || theme === 'dark');
  const borderClass = isDarkMode ? 'border-[hsl(0,0%,3%)]' : 'border-[hsl(0,0%,100%)]';

  return (
    <section id="testimonials" className="w-full overflow-x-hidden relative bg-[hsl(72,87%,62%)]">
      <div className={`w-full px-4 sm:px-6 lg:px-8 relative border-l-[5px] border-r-[5px] border-b-[5px] ${borderClass}`}>
        <div className="w-full relative">
          <div className="text-left relative pt-8">
            <Badge className="mb-4 bg-background text-foreground px-4 py-2">
              Testimonials
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-[hsl(0,0%,7%)]">
              Trusted by AEC Professionals
            </h2>
            <p className="text-xl max-w-3xl pb-6 text-[hsl(0,0%,20%)]">
              Join thousands of architects, engineers, and designers who trust Renderiq for their visualization needs
            </p>
          </div>
        </div>
      </div>

      <div className={`w-full relative border-l-[5px] border-b-[5px] ${borderClass}`}>
        {/* Black container behind testimonials */}
        <div className="absolute inset-0 bg-black -z-10"></div>
        
        <div className="flex flex-col lg:flex-row w-full overflow-hidden relative">
          {/* Left Column - 100% on mobile, 60% on desktop - Testimonials Content */}
          <div className={`w-full lg:w-[60%] order-1 lg:order-1 px-4 sm:px-6 lg:px-8 py-8 relative flex flex-col border-r-[5px] ${borderClass} bg-[hsl(72,87%,62%)]`}>
            <div className={`w-full relative px-4 sm:px-6 lg:px-8 py-6 rounded-2xl bg-background flex-1 border-[5px] ${borderClass}`}>
              {/* Twitter Testimonials - Masonry Layout */}
              <div>
                <TwitterTestimonialsGrid testimonials={testimonials} />
              </div>
            </div>
          </div>

          {/* Right Column - 40% - Testimonials Image - Extended to extreme right edge */}
          <div className={`w-full lg:w-[40%] flex items-center justify-end order-2 lg:order-2 lg:ml-auto lg:mr-0 lg:pr-0 lg:relative border-r-[5px] ${borderClass} bg-[hsl(72,87%,62%)]`} style={{ marginRight: 'calc((100vw - 100%) / -2)' }}>
            <div className="relative w-full h-full min-h-[400px] lg:min-h-[600px]">
              <Image
                src="/home/testimonials-section.svg"
                alt="Testimonials Illustration"
                fill
                className="object-contain object-right"
                priority
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
