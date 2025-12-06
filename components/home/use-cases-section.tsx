'use client';

import { memo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowRight } from 'lucide-react';
import { primaryUseCases } from '@/lib/data/use-cases';

const UseCasesSection = memo(function UseCasesSection() {
  return (
    <section id="use-cases" className="w-full py-20 px-4 sm:px-6 lg:px-8 bg-background">
      <div className="w-full">
        <div className="text-center mb-16">
          <Badge className="mb-4 bg-muted text-muted-foreground px-4 py-2">
            Use Cases
          </Badge>
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
            Built for Architecture, Engineering & Construction
            <span className="block text-muted-foreground mt-2">Professional AEC Solutions</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Transform your architectural projects with AI-powered visualization tools designed for AEC professionals
          </p>
        </div>

        {/* All Use Cases - Merged */}
        <div className="mb-20">
          <div className="flex items-center gap-3 mb-8">
            <h3 className="text-3xl font-bold text-foreground">AI Architecture Workflows</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {primaryUseCases.map((useCase) => {
              const isVideo = useCase.slug === 'rapid-concept-video';
              return (
                <Link key={useCase.slug} href={`/use-cases/${useCase.slug}`}>
                  <Card className="hover:shadow-lg transition-all duration-300 h-full group cursor-pointer overflow-hidden">
                    <div className="relative w-full aspect-square overflow-hidden bg-muted">
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
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                        />
                      )}
                    </div>
                    <CardHeader>
                      <CardTitle className="text-xl group-hover:text-primary transition-colors">
                        {useCase.title}
                      </CardTitle>
                      <CardDescription>{useCase.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2 mb-4">
                        {useCase.features.slice(0, 3).map((feature, idx) => (
                          <li key={idx} className="text-sm text-muted-foreground flex items-start">
                            <span className={`${useCase.color} mr-2`}>•</span>
                            {feature}
                          </li>
                        ))}
                      </ul>
                      <div className="flex items-center text-primary text-sm font-medium group-hover:underline">
                        Learn more
                        <ArrowRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Link to full use cases page */}
        <div className="text-center mt-12">
          <Link href="/use-cases">
            <span className="inline-flex items-center text-primary hover:underline text-lg font-medium">
              View all use cases
              <ArrowRight className="h-5 w-5 ml-2" />
            </span>
          </Link>
        </div>
      </div>
    </section>
  );
});

UseCasesSection.displayName = 'UseCasesSection';

export { UseCasesSection };
