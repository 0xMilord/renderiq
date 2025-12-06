'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRight } from 'lucide-react';
import { PinterestGallery } from './pinterest-gallery';
import type { GalleryItemWithDetails } from '@/lib/types';

interface GallerySectionProps {
  galleryItems: GalleryItemWithDetails[];
}

export function GallerySection({ galleryItems }: GallerySectionProps) {
  const { theme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDarkMode = mounted && (resolvedTheme === 'dark' || theme === 'dark');
  const borderClass = isDarkMode ? 'border-[hsl(0,0%,3%)]' : 'border-[hsl(0,0%,100%)]';

  return (
    <section id="gallery" className="w-full overflow-x-hidden relative bg-[hsl(72,87%,62%)]">
      <div className={`w-full px-4 sm:px-6 lg:px-8 relative border-l-[5px] border-r-[5px] border-b-[5px] ${borderClass}`}>
        <div className="w-full relative">
          <div className="text-left relative pt-8">
            <Badge className="mb-4 bg-background text-foreground px-4 py-2">
              Gallery
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-[hsl(0,0%,7%)]">
              See what&apos;s possible with Renderiq
            </h2>
            <p className="text-xl max-w-3xl pb-6 text-[hsl(0,0%,20%)]">
              Explore stunning renders created by architects, engineers, and visualizers using our architecture render software
            </p>
            <Link href="/gallery">
              <Button size="lg" variant="secondary" className="px-8 py-4 text-lg font-semibold mb-8">
                View Full Gallery
                <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className={`w-full relative border-l-[5px] border-b-[5px] ${borderClass}`}>
        {/* Black container behind gallery */}
        <div className="absolute inset-0 bg-black -z-10"></div>
        
        <div className="flex flex-col lg:flex-row w-full overflow-hidden relative">
          {/* Left Column - 40% - Gallery Illustration - Extended to extreme left edge */}
          <div className={`w-full lg:w-[40%] flex items-center justify-start order-2 lg:order-1 lg:mr-auto lg:ml-0 lg:pl-0 lg:relative border-r-[5px] lg:border-r-[5px] ${borderClass} bg-[hsl(72,87%,62%)]`} style={{ marginLeft: 'calc((100vw - 100%) / -2)' }}>
            <div className="relative w-full h-full min-h-[400px] lg:min-h-[600px]">
              <Image
                src="/home/gallery-section.svg"
                alt="Gallery Illustration"
                fill
                className="object-contain object-left"
                priority
              />
            </div>
          </div>

          {/* Right Column - 100% on mobile, 60% on desktop - Gallery Content */}
          <div className="w-full lg:w-[60%] order-1 lg:order-2 px-2 sm:px-4 lg:px-4 py-4 relative flex flex-col bg-[hsl(72,87%,62%)]">
            <div className={`w-full relative px-2 sm:px-4 lg:px-4 py-2 rounded-2xl bg-background flex-1 border-[5px] ${borderClass}`}>
              {/* Pinterest-style Vertical Marquee Gallery */}
              <PinterestGallery items={galleryItems} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
