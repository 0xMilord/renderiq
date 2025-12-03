'use client';

import { ArrowRight, Clock, Zap, CheckCircle2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import type { GalleryItemWithDetails } from '@/lib/types';

interface Slide2ProblemProps {
  galleryRenders?: GalleryItemWithDetails[];
}

export function Slide2Problem({ galleryRenders = [] }: Slide2ProblemProps) {
  const [timeElapsed, setTimeElapsed] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeElapsed((prev) => (prev < 180 ? prev + 1 : prev));
    }, 100);
    return () => clearInterval(interval);
  }, []);

  const minutes = Math.floor(timeElapsed / 60);
  const seconds = timeElapsed % 60;

  // Get a render with uploaded image (before) and completed render (after)
  const beforeRender = galleryRenders.find(r => r.render.uploadedImageUrl && r.render.status === 'completed');
  const afterRender = galleryRenders.find(r => r.render.status === 'completed' && r.render.outputUrl) || beforeRender;

  return (
    <div className="relative w-full h-full flex items-center justify-center bg-gradient-to-r from-background via-primary/5 to-background overflow-hidden">
      <div className="container mx-auto px-8 relative z-10">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Before */}
          <div className="text-center">
            <div className="bg-muted rounded-xl p-4 mb-4 aspect-video flex items-center justify-center border-2 border-dashed border-border relative overflow-hidden">
              {beforeRender?.render.uploadedImageUrl ? (
                <Image
                  src={beforeRender.render.uploadedImageUrl}
                  alt={beforeRender.render.prompt || 'Original sketch'}
                  fill
                  className="object-contain opacity-50"
                />
              ) : (
                <div className="text-center relative z-10">
                  <div className="text-5xl mb-3">✏️</div>
                  <p className="text-muted-foreground text-lg font-medium">Hand-drawn Sketch</p>
                  <p className="text-muted-foreground text-sm mt-2">Basic 3D Model</p>
                </div>
              )}
            </div>
            <h3 className="text-2xl font-semibold text-muted-foreground">Before</h3>
            {beforeRender?.user && (
              <p className="text-xs text-muted-foreground mt-2">by {beforeRender.user.name || 'User'}</p>
            )}
          </div>

          {/* Arrow */}
          <div className="hidden md:flex items-center justify-center relative">
            <ArrowRight className="h-16 w-16 text-primary drop-shadow-lg" />
          </div>

          {/* After */}
          <div className="text-center">
            <div className="bg-card rounded-xl p-4 mb-4 aspect-video flex items-center justify-center border-2 border-primary relative overflow-hidden shadow-2xl">
              {afterRender?.render.outputUrl ? (
                <Image
                  src={afterRender.render.outputUrl}
                  alt={afterRender.render.prompt || 'Generated render'}
                  fill
                  className="object-contain"
                />
              ) : (
                <div className="text-center z-10">
                  <div className="text-6xl mb-3">🏢</div>
                  <p className="text-foreground text-xl font-bold">Photorealistic Render</p>
                  <p className="text-foreground text-sm mt-2">Professional Quality</p>
                </div>
              )}
            </div>
            <h3 className="text-2xl font-semibold text-foreground">After</h3>
            {afterRender?.user && (
              <p className="text-xs text-muted-foreground mt-2">by {afterRender.user.name || 'User'}</p>
            )}
          </div>
        </div>

        {/* Main Message with Timer */}
        <div className="text-center mt-12">
          <h2 className="text-5xl md:text-6xl font-extrabold text-foreground mb-6">
            From Sketch to Reality in{' '}
            <span className="text-primary inline-block">
              {minutes}:{seconds.toString().padStart(2, '0')}
            </span>
          </h2>
          
          {/* Feature Pills */}
          <div className="flex items-center justify-center gap-4 flex-wrap mt-8">
            {[
              { icon: Clock, text: 'No 3D Modeling', color: 'text-blue-500' },
              { icon: Zap, text: 'Instant Results', color: 'text-primary' },
              { icon: CheckCircle2, text: 'No Technical Skills', color: 'text-green-500' },
            ].map((feature, index) => (
              <div
                key={index}
                className="flex items-center gap-2 bg-card backdrop-blur-sm px-4 py-2 rounded-full border border-border"
              >
                <feature.icon className={`h-5 w-5 ${feature.color}`} />
                <span className="text-sm font-medium text-foreground">{feature.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
