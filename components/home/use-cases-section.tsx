'use client';

import { memo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { DecoratedText } from '@/components/ui/decorated-text';
import { Highlighter } from '@/components/ui/highlighter';
import { VercelCard } from '@/components/ui/vercel-card';
import { primaryUseCases } from '@/lib/data/use-cases';

const UseCasesSection = memo(function UseCasesSection() {
  const borderClass = 'border-[hsl(72,87%,62%)]';

  return (
    <section id="use-cases" className="w-full overflow-x-hidden relative bg-background/80 backdrop-blur-sm">
      {/* Header Section */}
      <div className={`w-full relative border-l-[5px] border-r-[5px] border-b-[5px] ${borderClass}`}>
        <div className="flex items-center justify-center">
          <div className="text-center p-8 flex flex-col items-center">
            <DecoratedText className="text-sm font-medium px-3 py-1.5 mb-4">
              Use Cases
            </DecoratedText>
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-foreground">
              Built for Architecture, Engineering & Construction
              <span className="block text-muted-foreground mt-2">Professional AEC Solutions</span>
            </h2>
<p className="text-xl max-w-3xl text-muted-foreground">
                              Transform your architectural projects with{" "}
                              <Highlighter action="highlight" color="#D1F24A" textColor="#000000">
                                AI-powered visualization tools
                              </Highlighter>{" "}
                              designed for AEC professionals
                            </p>
          </div>
        </div>
      </div>

      {/* Cards Grid */}
      <div className={`w-full relative border-l-[2px] border-b-[2px] ${borderClass}`}>
        <div className="w-full px-4 sm:px-6 lg:px-8 py-8 bg-background">
          <VercelCard className="overflow-visible" showIcons={true} bordered>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-0">
              {primaryUseCases.map((useCase) => {
                const isVideo = useCase.slug === 'rapid-concept-video';
                return (
                  <Link 
                    key={useCase.slug} 
                    href={`/use-cases/${useCase.slug}`} 
                    className="group block bg-card border-r border-b border-border hover:bg-muted/50 transition-all duration-300"
                  >
                    <div className="relative w-full aspect-video overflow-hidden bg-muted">
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
                    <div className="p-4">
                      <h3 className="text-base font-semibold text-card-foreground group-hover:text-primary transition-colors line-clamp-2">
                        {useCase.title}
                      </h3>
                      <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                        {useCase.description}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </VercelCard>
        </div>
      </div>
    </section>
  );
});

UseCasesSection.displayName = 'UseCasesSection';

export { UseCasesSection };
