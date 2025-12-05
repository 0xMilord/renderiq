'use client';

import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PricingPlans } from '@/components/pricing/pricing-plans';
import { CreditPackages } from '@/components/pricing/credit-packages';
import { getCreditPackagesAction, getSubscriptionPlansAction, getUserCreditsAction } from '@/lib/actions/pricing.actions';
import { getUserSubscriptionAction } from '@/lib/actions/billing.actions';
import { createClient } from '@/lib/supabase/client';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { resetCurrencyToINR } from '@/lib/utils/reset-currency-to-inr';

export default function PricingPage() {
  const [activeTab, setActiveTab] = useState<'plans' | 'credits'>('plans');
  const [plans, setPlans] = useState<any[]>([]);
  const [creditPackages, setCreditPackages] = useState<any[]>([]);
  const [userCredits, setUserCredits] = useState<any>(null);
  const [userSubscription, setUserSubscription] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Reset currency to INR on pricing page load (Razorpay default)
    resetCurrencyToINR();
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Get user ID first
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      const [plansResult, packagesResult, creditsResult, subscriptionResult] = await Promise.all([
        getSubscriptionPlansAction(),
        getCreditPackagesAction(),
        getUserCreditsAction(),
        user ? getUserSubscriptionAction(user.id) : Promise.resolve({ success: true, data: null }),
      ]);

      if (plansResult.success) {
        setPlans(plansResult.data || []);
      }

      if (packagesResult.success) {
        setCreditPackages(packagesResult.data || []);
      }

      if (creditsResult.success) {
        setUserCredits(creditsResult.data);
      }

      if (subscriptionResult.success) {
        setUserSubscription(subscriptionResult.data);
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
    <div className="min-h-screen bg-background">
      <div className="w-full max-w-full px-4 sm:px-6 lg:px-8 pt-[calc(1rem+2.75rem+1.5rem+3rem)] pb-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold tracking-tight mb-4">
            Pricing & Credits
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Choose a subscription plan for unlimited renders or purchase credits for pay-as-you-go usage.
            {userCredits && (
              <span className="block mt-2 text-lg font-semibold text-foreground">
                Your Credits: {userCredits.balance || 0}
              </span>
            )}
          </p>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'plans' | 'credits')} className="w-full">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-8">
            <TabsTrigger value="plans">Subscription Plans</TabsTrigger>
            <TabsTrigger value="credits">Credit Packages</TabsTrigger>
          </TabsList>

          <TabsContent value="plans" className="mt-8">
            <PricingPlans plans={plans} userCredits={userCredits} userSubscription={userSubscription} />
          </TabsContent>

          <TabsContent value="credits" className="mt-8">
            <CreditPackages packages={creditPackages} userCredits={userCredits} onPurchaseComplete={loadData} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

