'use client';

import { memo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { primaryUseCases } from '@/lib/data/use-cases';

const UseCasesSection = memo(function UseCasesSection() {
  // Primary color (lime green) for strokes in both light and dark mode
  const borderClass = 'border-[hsl(72,87%,62%)]';

  return (
    <section id="use-cases" className="w-full overflow-x-hidden relative bg-background/80 backdrop-blur-sm">
      {/* Header Section - Two Column Layout */}
      <div className={`w-full relative border-l-[5px] border-r-[5px] border-b-[5px] ${borderClass}`}>
        <div className="w-full">
          <div className="grid grid-cols-1 lg:grid-cols-[30%_70%] gap-0 relative items-center">
            {/* Column 1 - Illustration (30%) */}
            <div className="relative w-full h-full min-h-[200px] lg:min-h-[400px] m-0 p-0">
              <Image
                src="/home/use-cases-section.svg"
                alt="Use Cases Illustration"
                fill
                className="object-contain"
                priority
              />
            </div>

            {/* Column 2 - Text, Title, and Description (70%) */}
            <div className="text-right p-8 flex flex-col items-end">
              <Badge className="mb-4 bg-muted text-muted-foreground px-4 py-2">
                Use Cases
              </Badge>
              <h2 className="text-4xl md:text-5xl font-bold mb-6 text-foreground">
                Built for Architecture, Engineering & Construction
                <span className="block text-muted-foreground mt-2">Professional AEC Solutions</span>
              </h2>
              <p className="text-xl max-w-3xl text-muted-foreground">
                Transform your architectural projects with AI-powered visualization tools designed for AEC professionals
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content Section - Full Width Cards */}
      <div className={`w-full relative border-l-[5px] border-b-[5px] ${borderClass}`}>
        <div className="w-full px-4 sm:px-6 lg:px-8 py-8 bg-background">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
            {primaryUseCases.map((useCase) => {
              const isVideo = useCase.slug === 'rapid-concept-video';
              return (
                <Link key={useCase.slug} href={`/use-cases/${useCase.slug}`} className="block h-full">
                  <Card className="hover:shadow-lg transition-all duration-300 group cursor-pointer overflow-hidden flex flex-col h-full">
                    <div className="relative w-full aspect-video overflow-hidden bg-muted flex-shrink-0">
                      {isVideo ? (
                        <video
                          src={`/use-cases/${useCase.slug}.mp4`}
                          autoPlay
                          loop
                          muted
                          playsInline
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <Image
                          src={`/use-cases/${useCase.slug}.webp`}
                          alt={useCase.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 20vw"
                        />
                      )}
                    </div>
                    <CardHeader className="p-6 flex flex-col flex-1">
                      <CardTitle className="text-xl group-hover:text-primary transition-colors mb-2 line-clamp-2 min-h-[3.5rem]">
                        {useCase.title}
                      </CardTitle>
                      <CardDescription className="mt-2 line-clamp-3 flex-1">
                        {useCase.description}
                      </CardDescription>
                    </CardHeader>
                  </Card>
                </Link>
                  );
                })}
              </div>
        </div>
      </div>
    </section>
  );
});

UseCasesSection.displayName = 'UseCasesSection';

export { UseCasesSection };
