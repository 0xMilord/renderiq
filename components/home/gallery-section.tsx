'use client';

import Link from 'next/link';
import Image from 'next/image';
import { RainbowButton } from '@/components/ui/rainbow-button';
import { DecoratedText } from '@/components/ui/decorated-text';
import { Highlighter } from '@/components/ui/highlighter';
import { VercelCard } from '@/components/ui/vercel-card';
import { ArrowRight } from 'lucide-react';
import { PinterestGallery } from './pinterest-gallery';
import type { GalleryItemWithDetails } from '@/lib/types';

interface GallerySectionProps {
  galleryItems: GalleryItemWithDetails[];
}

export function GallerySection({ galleryItems }: GallerySectionProps) {

  return (
    <section id="gallery" className="w-full overflow-x-hidden relative bg-[hsl(72,87%,62%)] py-8 px-8 border border-dotted border-black/[0.2] dark:border-white/[0.2] -mt-[1px]">
      <div className="w-full relative mb-8">
        <VercelCard className="w-full bg-[hsl(72,87%,62%)] overflow-visible border-2 border-black/[0.2] dark:border-black/[0.2] z-50" showIcons={true} bordered={true} iconClassName="text-black dark:text-black">
          <div className="px-8 py-8">
            <div className="text-left relative">
              <DecoratedText className="text-sm font-medium px-3 py-1.5 mb-4 text-neutral-800 dark:text-neutral-800">
                Gallery
              </DecoratedText>
              <h2 className="text-4xl md:text-5xl font-bold mb-6 text-[hsl(0,0%,7%)]">
                See what&apos;s possible with Renderiq
              </h2>
              <p className="text-xl max-w-3xl pb-6 text-[hsl(0,0%,20%)]">
                Explore{" "}
                <Highlighter action="highlight" color="#000000" textColor="#D1F24A">
                  stunning renders
                </Highlighter>{" "}
                created by architects, engineers, and visualizers using our architecture render software
              </p>
              <Link href="/gallery">
                <RainbowButton 
                  size="lg" 
                  variant="default" 
                  className="px-8 py-4 text-lg font-semibold !text-[hsl(72,87%,62%)] dark:!text-[hsl(72,87%,62%)] [&]:!bg-[hsl(0,0%,7%)] [&]:hover:!bg-[hsl(0,0%,15%)]"
                >
                  View Full Gallery
                  <ArrowRight className="h-5 w-5 ml-2" />
                </RainbowButton>
              </Link>
            </div>
          </div>
        </VercelCard>
      </div>

      <div className="w-full relative">
        {/* Black container behind gallery */}
        <div className="absolute inset-0 bg-black -z-10"></div>
        
        {/* Parent Container */}
        <div className="w-full relative h-[700px]">
          <div className="flex flex-col lg:flex-row w-full overflow-visible relative h-full gap-8">
            {/* Column 1 - Illustration */}
            <div className="w-full lg:w-[40%] flex items-center justify-start order-2 lg:order-1 lg:mr-auto lg:ml-0 lg:pl-0 lg:relative bg-[hsla(72, 86.60%, 62.00%, 0.00)] h-full overflow-visible">
              <VercelCard className="w-full h-full bg-[hsl(72,87%,62%)] overflow-visible border-2 border-black/[0.2] dark:border-black/[0.2] z-[60]" showIcons={true} bordered={true} iconClassName="text-black dark:text-black">
                <div className="relative w-full h-full p-8 overflow-hidden">
                  <Image
                    src="/home/gallery-section.svg"
                    alt="Gallery Illustration"
                    fill
                    className="object-contain object-left"
                    priority
                    sizes="(max-width: 768px) 100vw, 40vw"
                  />
                </div>
              </VercelCard>
            </div>

            {/* Column 2 - Marquee Gallery */}
            <div className="w-full lg:w-[60%] order-1 lg:order-2 relative flex flex-col bg-[hsla(72, 86.60%, 62.00%, 0.00)] h-full overflow-visible">
              <VercelCard className="w-full h-full bg-[hsl(72,87%,62%)] overflow-visible border-2 border-black/[0.2] dark:border-black/[0.2] z-[60]" showIcons={true} bordered={true} iconClassName="text-black dark:text-black">
                <div className="px-8 py-8 h-full overflow-hidden">
                  {/* Pinterest-style Vertical Marquee Gallery */}
                  <PinterestGallery items={galleryItems} />
                </div>
              </VercelCard>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
