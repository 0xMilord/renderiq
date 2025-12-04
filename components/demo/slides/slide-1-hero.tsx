'use client';

import Image from 'next/image';

export function Slide1Hero() {
  return (
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden bg-primary">
      <div className="relative z-10 w-full h-full px-8 md:px-12 lg:px-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 lg:gap-16 h-full items-center max-w-7xl mx-auto">
          {/* Left Column - Text Content */}
          <div className="flex flex-col justify-center items-start text-left space-y-6 md:space-y-8">
            {/* Main Title */}
            <h1 className="text-4xl md:text-6xl lg:text-7xl xl:text-8xl font-extrabold text-primary-foreground leading-tight">
              Your Fastest AI Visualization Tool
            </h1>

            {/* Subtitle Text */}
            <div className="text-xl md:text-2xl lg:text-3xl xl:text-4xl font-semibold text-primary-foreground italic">
              Visualize how Uniacoustics<sup>®</sup> beautifies your space
            </div>
          </div>

          {/* Right Column - Logo */}
          <div className="flex items-center justify-center md:justify-end">
            <div className="relative w-full max-w-md md:max-w-lg lg:max-w-xl">
              <Image
                src="/logo.svg"
                alt="Renderiq Logo"
                width={600}
                height={600}
                className="w-full h-auto"
                priority
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

