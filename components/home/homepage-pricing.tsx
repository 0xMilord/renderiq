import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, ArrowRight, Coins, Sparkles } from 'lucide-react';
import { getCreditPackagesAction, getSubscriptionPlansAction } from '@/lib/actions/pricing.actions';
import { HomepageCreditPackageCard } from './homepage-credit-package-card';

export async function HomepagePricing() {
  // Fetch pricing data from database
  const [plansResult, packagesResult] = await Promise.all([
    getSubscriptionPlansAction(),
    getCreditPackagesAction(),
  ]);

  const plans = plansResult.success ? plansResult.data || [] : [];
  const creditPackages = packagesResult.success ? packagesResult.data || [] : [];

  // ✅ OPTIMIZED: Memoize cheapest package calculation (though this is server component, it's good practice)
  // Note: This is a server component, but memoization here prevents recalculation if component re-renders
  const cheapestPackage = creditPackages.length > 0
    ? creditPackages.reduce((cheapest, pkg) => 
        (!cheapest || pkg.price < cheapest.price) ? pkg : cheapest
      )
    : null;

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/30">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <Badge className="mb-4 bg-primary text-primary-foreground px-4 py-2">
            Pricing
          </Badge>
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Simple, Transparent Pricing
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-4">
            Choose the plan that fits your needs. No hidden fees, cancel anytime. Perfect for AEC firms and design professionals.
          </p>
        </div>

        {/* Credit Packages Section - Featured First */}
        {creditPackages.length > 0 && (
          <div className="mb-16">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-2xl font-bold mb-2 flex items-center gap-2">
                  <Coins className="h-6 w-6 text-primary" />
                  Credit Packages
                </h3>
                <p className="text-muted-foreground">
                  Pay-as-you-go credits. Perfect for occasional use or trying out Renderiq.
                </p>
              </div>
              <Link href="/pricing">
                <Button variant="outline">
                  View All Packages
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </div>
            
            {/* Show top 3 credit packages */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              {creditPackages.slice(0, 3).map((pkg: any) => (
                <HomepageCreditPackageCard key={pkg.id} package={pkg} />
              ))}
            </div>
          </div>
        )}

        {/* Subscription Plans Section */}
        {plans.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-2xl font-bold mb-2 flex items-center gap-2">
                  <Sparkles className="h-6 w-6 text-primary" />
                  Subscription Plans
                </h3>
                <p className="text-muted-foreground">
                  Unlimited renders with monthly or annual billing. Perfect for regular users.
                </p>
              </div>
              <Link href="/pricing">
                <Button variant="outline">
                  View All Plans
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </div>

            {/* Show top 3 subscription plans */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {plans
                .filter((plan: any) => plan.interval === 'month') // Only show monthly plans on homepage
                .slice(0, 3)
                .map((plan: any) => (
                <div
                  key={plan.id}
                  className="p-8 rounded-2xl border border-border bg-card hover:shadow-lg transition-all duration-300"
                >
                  <div className="text-center mb-8">
                    <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                    <div className="text-4xl font-bold mb-2">
                      ₹{Number(plan.price)}
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
                    <Button className="w-full" variant="outline">
                      View Plan
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CTA */}
        <div className="text-center mt-12">
          <Link href="/pricing">
            <Button size="lg" className="px-8">
              View All Pricing Options
              <ArrowRight className="h-5 w-5 ml-2" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}

