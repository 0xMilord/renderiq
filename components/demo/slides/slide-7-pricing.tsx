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
    <div className="relative w-full h-full bg-gradient-to-br from-background via-primary/10 to-primary/5 flex items-center justify-center p-8 overflow-hidden">
      <div className="container mx-auto max-w-5xl relative z-10">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="mb-4">
            <Sparkles className="h-12 w-12 text-primary mx-auto" />
          </div>
          <h2 className="text-5xl md:text-7xl font-extrabold text-foreground mb-4">
            Start Creating Today
          </h2>
          <p className="text-2xl text-muted-foreground">
            Try Renderiq for as low as{' '}
            <span className="font-bold text-primary inline-block">
              ₹500
            </span>
          </p>
        </div>

        {/* Pricing Card */}
        <div className="bg-card/90 backdrop-blur-md rounded-3xl p-10 border-2 border-primary/40 shadow-2xl relative overflow-hidden">
          <div className="grid md:grid-cols-2 gap-10 items-center relative z-10">
            {/* Left: Pricing Info */}
            <div>
              <div className="mb-8">
                <div className="inline-flex items-center gap-2 bg-gradient-to-r from-primary/30 to-primary/20 text-primary px-5 py-2.5 rounded-full text-sm font-bold mb-4 border border-primary/50">
                  <Coins className="h-4 w-4" />
                  Credit-Based System
                </div>
                <h3 className="text-4xl font-extrabold text-foreground mb-3">
                  Flexible Pricing
                </h3>
                <p className="text-muted-foreground text-lg mb-6">
                  Pay only for what you use. Credits never expire.
                </p>
              </div>

              {/* Features */}
              <div className="space-y-4 mb-8">
                {[
                  { icon: Gift, text: 'Free tier: 5 renders/month', color: 'text-green-500' },
                  { icon: Zap, text: 'Credits starting from ₹500', color: 'text-primary' },
                  { icon: Coins, text: 'No subscription required', color: 'text-primary' },
                  { icon: CheckCircle, text: 'Credits never expire', color: 'text-blue-500' },
                ].map((feature, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 bg-muted/50 rounded-lg px-4 py-3 border border-border"
                  >
                    <feature.icon className={`h-6 w-6 ${feature.color} shrink-0`} />
                    <span className="text-foreground font-medium">{feature.text}</span>
                  </div>
                ))}
              </div>

              {/* CTA Button */}
              <div>
                <Button asChild size="lg" className="w-full text-xl py-7 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80 shadow-2xl">
                  <Link href="/signup" className="flex items-center justify-center gap-2">
                    <Sparkles className="h-6 w-6" />
                    Start Free Trial
                  </Link>
                </Button>
              </div>
            </div>

            {/* Right: QR Code */}
            <div className="flex flex-col items-center justify-center">
              <div className="bg-white p-6 rounded-2xl mb-4 shadow-2xl border-4 border-primary/30">
                <QRCodeSVG
                  value={`${typeof window !== 'undefined' ? window.location.origin : ''}/signup`}
                  size={220}
                  level="H"
                  includeMargin={true}
                />
              </div>
              <p className="text-sm text-muted-foreground text-center font-medium">
                Scan to sign up instantly
              </p>
            </div>
          </div>
        </div>

        {/* Trust Signals */}
        <div className="grid md:grid-cols-2 gap-6 mt-10">
          <div className="text-center p-4 bg-card/60 backdrop-blur-sm rounded-xl border border-border">
            <Users className="h-6 w-6 text-primary mx-auto mb-2" />
            <p className="text-muted-foreground text-sm mb-1">Used by</p>
            <p className="text-2xl font-bold text-foreground">
              1000+ AEC Professionals
            </p>
          </div>
          <div className="text-center p-4 bg-card/60 backdrop-blur-sm rounded-xl border border-border">
            <Sparkles className="h-6 w-6 text-primary mx-auto mb-2" />
            <p className="text-muted-foreground text-sm mb-1">Over</p>
            <p className="text-2xl font-bold text-foreground">
              50,000+ Renders Created
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
