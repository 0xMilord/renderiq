'use client';

import { useState, useEffect } from 'react';
import { PricingPlans } from '@/components/pricing/pricing-plans';
import { CreditPackages } from '@/components/pricing/credit-packages';
import { CurrencyToggle } from '@/components/pricing/currency-toggle';
import { getPricingPageDataAction } from '@/lib/actions/pricing.actions';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import OptimizedBackground from '@/components/home/optimized-background';

export default function PricingPage() {
  const [plans, setPlans] = useState<any[]>([]);
  const [creditPackages, setCreditPackages] = useState<any[]>([]);
  const [userCredits, setUserCredits] = useState<any>(null);
  const [userSubscription, setUserSubscription] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // ✅ OPTIMIZED: Single batched action fetches all data in parallel
      // Public data (plans/packages) loads first, user data loads separately (non-blocking)
      const result = await getPricingPageDataAction();

      if (result.success && result.data) {
        // Set public data immediately (plans/packages)
        setPlans(result.data.plans || []);
        setCreditPackages(result.data.creditPackages || []);
        
        // Set user data (may be null if not authenticated or if fetch failed)
        setUserCredits(result.data.userCredits);
        setUserSubscription(result.data.userSubscription);
        
        // ✅ OPTIMIZED: Show page immediately even if user data is still loading
        // Components can handle null user data gracefully
      } else {
        toast.error(result.error || 'Failed to load pricing information');
      }
    } catch (error) {
      console.error('Error loading pricing data:', error);
      toast.error('Failed to load pricing information');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background relative">
      {/* Grid Background */}
      <OptimizedBackground />
      
      {/* Full Width Container - Like Gallery Section */}
      <div className="w-full px-4 sm:px-6 lg:px-8 pt-[calc(1rem+2.75rem+1.5rem+3rem)] pb-12 relative z-10">
        {/* Header - Full Width */}
        <div className="w-full text-center mb-12">
          <div className="flex items-center justify-center gap-4 mb-4">
            <h1 className="text-6xl font-bold tracking-tight">
              Pricing
            </h1>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Currency:</span>
              <CurrencyToggle />
            </div>
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Choose a subscription plan for unlimited usage or purchase credits for pay-as-you-go.
            {userCredits && (
              <span className="block mt-2 text-base font-semibold text-foreground">
                Your Credits: {userCredits.balance || 0}
              </span>
            )}
          </p>
        </div>

        {/* Main Content Section - Full Width */}
        <div className="w-full">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Left Column: Subscription Plans (3/4 width) */}
            <div className="lg:col-span-3 order-1">
              <PricingPlans plans={plans} userCredits={userCredits} userSubscription={userSubscription} />
            </div>

            {/* Right Column: Credit Packages (1/4 width) */}
            <div className="lg:col-span-1 order-2">
              <div className="lg:sticky lg:top-24">
                <div className="text-right mb-6">
                  <h2 className="text-xl font-bold mb-1">Pay As You Go</h2>
                  <p className="text-xs text-muted-foreground">
                    Purchase credits for flexible usage
                  </p>
                </div>
                <CreditPackages packages={creditPackages} userCredits={userCredits} onPurchaseComplete={loadData} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
