"use client";

import Link from 'next/link';
import { RainbowButton } from '@/components/ui/rainbow-button';
import { VercelCard } from '@/components/ui/vercel-card';
import { DecoratedText } from '@/components/ui/decorated-text';
import { Highlighter } from '@/components/ui/highlighter';
import { CheckCircle, ArrowRight } from 'lucide-react';
import { HomepageCreditPackageCard } from './homepage-credit-package-card';
import { useCurrency } from '@/lib/hooks/use-currency';

interface HomepagePricingClientProps {
  plans: any[];
  creditPackages: any[];
}

export function HomepagePricingClient({ plans, creditPackages }: HomepagePricingClientProps) {
  const { convert, format, loading } = useCurrency();

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/30">
      <div className="w-full">
        {/* Header */}
        <div className="text-center lg:text-left mb-12">
          <DecoratedText className="text-sm font-medium px-3 py-1.5 mb-4">
            Pricing
          </DecoratedText>
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Simple, Transparent Pricing
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl">
            <Highlighter action="highlight" color="#D1F24A" textColor="#000000">
              Start creating
            </Highlighter>{" "}
            professional renders today with flexible plans designed for every workflow
          </p>
        </div>

        {/* Pricing Layout: 1 row, 2 columns (1/4 credit packages, 3/4 subscription plans) */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Credit Packages Section - 1/4 width */}
          {creditPackages.length > 0 && (
            <div className="lg:col-span-1">
              {/* Show top 3 credit packages */}
              <div className="space-y-4">
                {creditPackages.slice(0, 3).map((pkg: any) => (
                  <HomepageCreditPackageCard key={pkg.id} package={pkg} />
                ))}
              </div>
            </div>
          )}

          {/* Subscription Plans Section - 3/4 width */}
          {plans.length > 0 && (
            <div className="lg:col-span-3 flex flex-col">
              {/* Show top 3 subscription plans */}
              <VercelCard className="flex-1" animateOnHover glowEffect>
                <div className="grid grid-cols-1 md:grid-cols-3 h-full">
                {plans
                  .filter((plan: any) => plan.interval === 'month') // Only show monthly plans on homepage
                  .slice(0, 3)
                  .map((plan: any) => (
                  <div
                    key={plan.id}
                    className="p-8 border-r border-b border-border bg-card hover:bg-muted/50 transition-all duration-300 flex flex-col h-full"
                  >
                    <div className="text-center mb-8">
                      <div className="mb-3 flex justify-center">
                        <DecoratedText className="text-xs font-medium px-3 py-1">
                          Monthly Subscription
                        </DecoratedText>
                      </div>
                      <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                      <div className="text-4xl font-bold mb-2">
                        {loading ? '...' : format(convert(Number(plan.price)))}
                      </div>
                      <p className="text-muted-foreground">
                        per {plan.interval === 'year' ? 'year' : 'month'}
                      </p>
                    </div>
                    <ul className="space-y-3 mb-8">
                      {plan.features && plan.features.length > 0 ? (
                        plan.features.slice(0, 6).map((feature: string, idx: number) => (
                          <li key={idx} className="flex items-center">
                            <CheckCircle className="h-5 w-5 mr-3 text-green-500" />
                            <span className="text-sm">{feature}</span>
                          </li>
                        ))
                      ) : (
                        <>
                          <li className="flex items-center">
                            <CheckCircle className="h-5 w-5 mr-3 text-green-500" />
                            <span className="text-sm">
                              {plan.creditsPerMonth || 'Unlimited'} credits per month
                            </span>
                          </li>
                          <li className="flex items-center">
                            <CheckCircle className="h-5 w-5 mr-3 text-green-500" />
                            <span className="text-sm">
                              {plan.maxProjects ? `${plan.maxProjects} projects` : 'Unlimited projects'}
                            </span>
                          </li>
                          {plan.maxRendersPerProject && (
                            <li className="flex items-center">
                              <CheckCircle className="h-5 w-5 mr-3 text-green-500" />
                              <span className="text-sm">
                                {plan.maxRendersPerProject} renders per project
                              </span>
                            </li>
                          )}
                        </>
                      )}
                    </ul>
                    <Link href="/pricing">
                      <RainbowButton className="w-full" variant="outline">
                        View Plan
                      </RainbowButton>
                    </Link>
                  </div>
                ))}
                </div>
              </VercelCard>
            </div>
          )}
        </div>

        {/* Pay-as-you-go message row - full width below both columns */}
        <VercelCard className="mt-8" showIcons={true} bordered>
          <div className="flex items-center gap-6 w-full p-6">
            {/* Text - 70% width */}
            <div className="flex-[0.7]">
              <p className="text-2xl md:text-3xl font-bold text-foreground leading-tight">
                <span className="text-primary">No strings attached.</span> Pay as you go with flexible credit packages. Start rendering with as little as a cup of coffee.
              </p>
            </div>
            
            {/* Separator */}
            <div className="h-16 w-px bg-border"></div>
            
            {/* SVG Illustration - 30% width */}
            <div className="flex-[0.3] flex items-center justify-center">
              <svg
                viewBox="0 0 200 200"
                className="w-full h-full max-w-[150px] max-h-[150px] text-primary/60"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                {/* Broken chain / cut string illustration */}
                <g stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                  {/* Left string segment */}
                  <path d="M 20 100 Q 40 70, 60 100 Q 80 130, 100 100" />
                  {/* Right string segment */}
                  <path d="M 100 100 Q 120 70, 140 100 Q 160 130, 180 100" />
                  {/* Scissors cutting the string */}
                  <g transform="translate(100, 100)">
                    {/* Left blade */}
                    <path d="M -20 -15 L 0 0 L -20 15" />
                    {/* Right blade */}
                    <path d="M 20 -15 L 0 0 L 20 15" />
                    {/* Scissors handle */}
                    <circle cx="-8" cy="0" r="4" fill="currentColor" />
                    <circle cx="8" cy="0" r="4" fill="currentColor" />
                  </g>
                </g>
              </svg>
            </div>
          </div>
        </VercelCard>

        {/* CTA */}
        <div className="text-center mt-12">
          <Link href="/pricing">
            <RainbowButton size="lg" variant="default" className="px-8">
              View All Pricing Options
              <ArrowRight className="h-5 w-5 ml-2" />
            </RainbowButton>
          </Link>
        </div>
      </div>
    </section>
  );
}

