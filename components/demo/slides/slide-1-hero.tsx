'use client';

import Image from 'next/image';
import { Zap, Wand2 } from 'lucide-react';
import DotGrid from '@/components/ui/dot-grid';

export function Slide1Hero() {
  return (
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden bg-background">
      {/* DotGrid Background */}
      <div className="absolute inset-0 overflow-hidden -z-0 opacity-30">
        <DotGrid
          dotSize={10}
          gap={15}
          proximity={120}
          shockRadius={250}
          shockStrength={5}
          resistance={750}
          returnDuration={1.5}
          className="h-full w-full"
        />
      </div>
      <div className="relative z-10 text-center px-8 max-w-5xl">
        {/* Logo */}
        <div className="mb-8 relative">
          <div className="mx-auto flex items-center justify-center mb-6">
            <Image
              src="/logo.svg"
              alt="Renderiq Logo"
              width={128}
              height={128}
              className="w-32 h-32"
              priority
            />
          </div>
        </div>

        {/* Tagline */}
        <h1 className="text-6xl md:text-8xl font-extrabold text-foreground mb-6 leading-tight">
          <span className="block mb-2">
            Transform Sketches
          </span>
          <span className="block bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent relative">
            <span>
              into Photorealistic Renders
            </span>
            <div className="absolute -bottom-2 left-0 right-0 h-1 bg-gradient-to-r from-primary to-primary/80" />
          </span>
        </h1>

        {/* Subtitle with Icons */}
        <div className="flex items-center justify-center gap-3 text-xl md:text-2xl text-muted-foreground mb-8 flex-wrap">
          <Zap className="h-6 w-6 text-primary" />
          <span>
            Powered by <span className="font-bold text-foreground">Google Gemini 3 Pro</span> &{' '}
            <span className="font-bold text-foreground">Veo 3.1</span>
          </span>
          <Wand2 className="h-6 w-6 text-primary" />
        </div>

        {/* Stats Counter */}
        <div className="grid grid-cols-3 gap-8 mt-12">
          {[
            { value: '1000+', label: 'AEC Professionals' },
            { value: '50K+', label: 'Renders Created' },
            { value: '99%', label: 'Satisfaction Rate' },
          ].map((stat, index) => (
            <div key={index} className="text-center">
              <div className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
                {stat.value}
              </div>
              <div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

