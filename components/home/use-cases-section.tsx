'use client';

import { memo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { DecoratedText } from '@/components/ui/decorated-text';
import { Highlighter } from '@/components/ui/highlighter';
import { VercelCard } from '@/components/ui/vercel-card';
import { primaryUseCases } from '@/lib/data/use-cases';
import { cn } from '@/lib/utils';

const UseCasesSection = memo(function UseCasesSection() {
  return (
    <section id="use-cases" className="w-full overflow-x-hidden relative bg-background py-8 px-8 border border-dotted border-black/[0.2] dark:border-white/[0.2] -mt-[1px]">
      <VercelCard className="w-full bg-background overflow-visible" showIcons={true} bordered={true}>
        <div className="w-full">
          {/* Header Section */}
          <div className="w-full relative">
            <div className="flex items-center justify-center">
              <div className="text-center py-8 px-8 flex flex-col items-center">
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
          <div className="w-full relative">
            <div className="w-full px-8 py-8 bg-background">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                {primaryUseCases.map((useCase, index) => {
                  const isVideo = useCase.slug === 'rapid-concept-video';
                  const totalCols = 5; // xl:grid-cols-5
                  const row = Math.floor(index / totalCols);
                  const col = index % totalCols;
                  const isFirstInRow = col === 0;
                  const isLastInRow = col === totalCols - 1;
                  const isFirstRow = row === 0;
                  const isLastRow = row === Math.floor((primaryUseCases.length - 1) / totalCols);
                  
                  // Calculate negative margins to overlap borders
                  const marginLeft = isFirstInRow ? '0' : '-ml-[1px]';
                  const marginTop = isFirstRow ? '0' : '-mt-[1px]';
                  
                  return (
                    <VercelCard 
                      key={useCase.slug}
                      className={cn(
                        "overflow-visible rounded-none",
                        marginLeft,
                        marginTop
                      )} 
                      showIcons={false} 
                      bordered={true}
                    >
                      <Link 
                        href={`/use-cases/${useCase.slug}`} 
                        className="group block bg-card hover:bg-muted/50 transition-all duration-300 h-full"
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
                          <h3 className="text-base font-semibold text-card-foreground group-hover:text-primary transition-colors line-clamp-1">
                            {useCase.title}
                          </h3>
                          <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                            {useCase.description}
                          </p>
                        </div>
                      </Link>
                    </VercelCard>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </VercelCard>
    </section>
  );
});

UseCasesSection.displayName = 'UseCasesSection';

export { UseCasesSection };
