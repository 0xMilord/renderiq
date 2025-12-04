'use client';

import { Button } from '@/components/ui/button';
import { CheckCircle, Sparkles, Users, Coins, Gift, Zap } from 'lucide-react';
import Link from 'next/link';
import dynamic from 'next/dynamic';

const QRCodeSVG = dynamic(() => import('qrcode.react').then((mod) => mod.QRCodeSVG), {
  ssr: false,
});

export function Slide7Pricing() {
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

          {/* Right Column: Trust Signals & QR Code */}
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

            {/* QR Code */}
            <div className="flex flex-col items-center justify-center bg-card/60 backdrop-blur-sm rounded-xl border border-border p-6">
              <div className="bg-white p-6 rounded-xl mb-3 shadow-lg border-2 border-primary/30">
                <QRCodeSVG
                  value={`${typeof window !== 'undefined' ? window.location.origin : ''}/signup`}
                  size={352}
                  level="H"
                  includeMargin={true}
                  fgColor="hsl(var(--primary))"
                  bgColor="transparent"
                  imageSettings={{
                    src: '/logo.svg',
                    height: 60,
                    width: 60,
                    excavate: true,
                  }}
                />
              </div>
              <p className="text-xs text-muted-foreground text-center font-medium">
                Scan to sign up instantly
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
