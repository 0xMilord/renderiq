'use client';

import { Button } from '@/components/ui/button';
import { CheckCircle, Sparkles, Users, Coins, Gift, Zap } from 'lucide-react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { TwitterTestimonial } from '@/components/home/twitter-testimonial';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { useState } from 'react';
import Autoplay from 'embla-carousel-autoplay';

const QRCodeSVG = dynamic(() => import('qrcode.react').then((mod) => mod.QRCodeSVG), {
  ssr: false,
});

// Twitter testimonial URLs - Same as homepage
const twitterTestimonials = [
  {
    url: 'https://x.com/CasshyapSa79802/status/1995905411946611051',
    fallback: {
      text: 'Renderiq has completely transformed how we present designs to clients. The AI renders are incredibly realistic and save us hours of work.',
      author: 'CasshyapSa79802',
      username: 'CasshyapSa79802',
    },
  },
  {
    url: 'https://x.com/0xmilords/status/1995907216311025866',
    fallback: {
      text: 'Amazing AI rendering tool for architecture!',
      author: '0xmilords',
      username: '0xmilords',
    },
  },
  {
    url: 'https://x.com/titanidex/status/1995907578480787870',
    fallback: {
      text: 'Renderiq is a game-changer for architectural visualization.',
      author: 'titanidex',
      username: 'titanidex',
    },
  },
  {
    url: 'https://x.com/mogisterate/status/1995907751596490837',
    fallback: {
      text: 'Love using Renderiq for my design projects!',
      author: 'mogisterate',
      username: 'mogisterate',
    },
  },
  {
    url: 'https://x.com/retrobrah/status/1995908179365105973',
    fallback: {
      text: 'Best AI rendering tool I\'ve tried. Highly recommend!',
      author: 'retrobrah',
      username: 'retrobrah',
    },
  },
  {
    url: 'https://x.com/spymilking/status/1995908547490840802',
    fallback: {
      text: 'Renderiq makes architectural rendering so easy and fast.',
      author: 'spymilking',
      username: 'spymilking',
    },
  },
  {
    url: 'https://x.com/0xK4471L/status/1995908727111909851',
    fallback: {
      text: 'Incredible results with Renderiq! The quality is outstanding.',
      author: '0xK4471L',
      username: '0xK4471L',
    },
  },
];

export function Slide7Pricing() {
  const [autoplayPlugin] = useState(() => 
    Autoplay({ delay: 2000, stopOnInteraction: false, stopOnMouseEnter: false })
  );

  return (
    <div className="relative w-full h-full flex flex-col bg-gradient-to-br from-background via-primary/10 to-primary/5 overflow-hidden">
      {/* Header - Upper Left */}
      <div className="flex-shrink-0 px-4 pt-3 pb-3 border-b border-border">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <h2 className="text-xl sm:text-2xl font-extrabold text-foreground">
                Start Creating Today
              </h2>
            </div>
            <div className="h-6 w-px bg-border"></div>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-[400px]">
              Try Renderiq for as low as <span className="font-bold text-primary">₹500</span>. Pay only for what you use.
            </p>
          </div>
          {/* QR Code - Right Edge */}
          <div className="flex-shrink-0 flex flex-row items-center gap-2">
            <div className="p-0.5 bg-primary/10 rounded border border-primary/30 flex-shrink-0">
              <QRCodeSVG
                value="https://renderiq.io/api/qr-signup"
                size={50}
                level="M"
                includeMargin={false}
                className="rounded"
                fgColor="hsl(var(--primary))"
                bgColor="transparent"
              />
            </div>
            <p className="text-[14px] text-primary font-semibold leading-tight max-w-[100px]">
              Visualize UniAcoustics products on Renderiq!
            </p>
          </div>
        </div>
      </div>

      {/* Main Content - 2 Column Layout */}
      <div className="flex-1 container mx-auto px-8 py-6 flex flex-col min-h-0">
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-0">
          {/* Left Column: Pricing Card */}
          <div className="flex flex-col justify-center">
            <div className="bg-card/90 backdrop-blur-md rounded-2xl p-6 border-2 border-primary/40 shadow-xl h-full flex flex-col">
              <div className="mb-6">
                <div className="inline-flex items-center gap-2 bg-gradient-to-r from-primary/30 to-primary/20 text-primary px-4 py-2 rounded-full text-xs font-bold mb-3 border border-primary/50">
                  <Coins className="h-3 w-3" />
                  Credit-Based System
                </div>
                <h3 className="text-3xl font-extrabold text-foreground mb-2">
                  Flexible Pricing
                </h3>
                <p className="text-muted-foreground text-sm mb-4">
                  Pay only for what you use. Credits never expire.
                </p>
              </div>

              {/* Features Section */}
              <div className="mb-4">
                <h4 className="text-sm font-semibold text-foreground mb-3">Flexible Pricing Features</h4>
                <div className="space-y-2 flex-1">
                  {[
                    { icon: Gift, text: 'Free tier: 5 renders/month', color: 'text-green-500' },
                    { icon: Zap, text: 'Credits starting from ₹500', color: 'text-primary' },
                    { icon: Coins, text: 'No subscription required', color: 'text-primary' },
                    { icon: CheckCircle, text: 'Credits never expire', color: 'text-blue-500' },
                    { icon: Sparkles, text: 'Pay-as-you-go model', color: 'text-primary' },
                    { icon: CheckCircle, text: 'No hidden fees', color: 'text-green-500' },
                  ].map((feature, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-2 border border-border"
                    >
                      <feature.icon className={`h-4 w-4 ${feature.color} shrink-0`} />
                      <span className="text-foreground text-sm font-medium">{feature.text}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* CTA Button */}
              <div>
                <Button asChild size="lg" className="w-full text-base py-6 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80 shadow-xl">
                  <Link href="/signup" className="flex items-center justify-center gap-2">
                    <Sparkles className="h-5 w-5" />
                    Start Free Trial
                  </Link>
                </Button>
              </div>
            </div>
          </div>

          {/* Right Column: Trust Signals, QR Code & Testimonials */}
          <div className="flex flex-col justify-center gap-4">
            {/* Trust Signals */}
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-card/60 backdrop-blur-sm rounded-xl border border-border">
                <Users className="h-5 w-5 text-primary mx-auto mb-2" />
                <p className="text-muted-foreground text-xs mb-1">Used by</p>
                <p className="text-lg font-bold text-foreground">
                  1000+ AEC Professionals
                </p>
              </div>
              <div className="text-center p-4 bg-card/60 backdrop-blur-sm rounded-xl border border-border">
                <Sparkles className="h-5 w-5 text-primary mx-auto mb-2" />
                <p className="text-muted-foreground text-xs mb-1">Over</p>
                <p className="text-lg font-bold text-foreground">
                  50,000+ Renders Created
                </p>
              </div>
            </div>

            {/* QR Code and Testimonials - 2 columns, 1 row */}
            <div className="grid grid-cols-2 gap-4">
              {/* QR Code */}
              <div className="flex flex-col items-center justify-center bg-card/60 backdrop-blur-sm rounded-xl border border-border p-4">
                <div className="p-1 bg-primary/10 rounded border border-primary/30 flex-shrink-0 mb-3">
                  <QRCodeSVG
                    value={`${typeof window !== 'undefined' ? window.location.origin : ''}/signup`}
                    size={140}
                    level="M"
                    includeMargin={false}
                    className="rounded"
                    fgColor="hsl(var(--primary))"
                    bgColor="transparent"
                  />
                </div>
                <p className="text-xs text-muted-foreground text-center font-medium">
                  Scan to sign up instantly
                </p>
              </div>

              {/* Testimonials Carousel */}
              <div className="bg-card/60 backdrop-blur-sm rounded-xl border border-border p-4">
                <h4 className="text-sm font-semibold text-foreground mb-3 text-center">What Our Users Say</h4>
                <Carousel
                  opts={{
                    align: 'start',
                    loop: true,
                  }}
                  plugins={[autoplayPlugin]}
                  className="w-full"
                >
                  <CarouselContent className="-ml-2 md:-ml-4">
                    {twitterTestimonials.map((testimonial, index) => (
                      <CarouselItem key={index} className="pl-2 md:pl-4 basis-full">
                        <div className="h-full">
                          <TwitterTestimonial
                            tweetUrl={testimonial.url}
                            fallback={testimonial.fallback}
                          />
                        </div>
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                  <CarouselPrevious className="left-2" />
                  <CarouselNext className="right-2" />
                </Carousel>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
