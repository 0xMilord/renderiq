'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Check, Sparkles, Zap, Building2, CreditCard } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { LimitType } from '@/lib/services/plan-limits.service';

interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price: string;
  currency: string;
  interval: 'month' | 'year';
  creditsPerMonth: number;
  maxProjects: number | null;
  maxRendersPerProject: number | null;
  features: string[];
  isPopular?: boolean;
}

interface CreditPackage {
  id: string;
  name: string;
  description: string;
  credits: number;
  price: string;
  currency: string;
  bonusCredits?: number;
  isPopular?: boolean;
}

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  limitType: LimitType;
  currentPlan?: string;
  onUpgrade?: (planId: string) => void;
  onPurchaseCredits?: (packageId: string) => void;
}

export function UpgradeModal({
  isOpen,
  onClose,
  limitType,
  currentPlan = 'Free',
  onUpgrade,
  onPurchaseCredits,
}: UpgradeModalProps) {
  const [subscriptionPlans, setSubscriptionPlans] = useState<SubscriptionPlan[]>([]);
  const [creditPackages, setCreditPackages] = useState<CreditPackage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      fetchPlans();
    }
  }, [isOpen]);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      // ✅ OPTIMIZED: Use server actions instead of API routes
      const { getSubscriptionPlansAction, getCreditPackagesAction } = await import('@/lib/actions/pricing.actions');
      const [plansResult, packagesResult] = await Promise.all([
        getSubscriptionPlansAction(),
        getCreditPackagesAction(),
      ]);

      if (plansResult.success && plansResult.data) {
        setSubscriptionPlans(plansResult.data);
      }

      if (packagesResult.success && packagesResult.data) {
        setCreditPackages(packagesResult.data);
      }
    } catch (error) {
      console.error('Failed to fetch plans:', error);
    } finally {
      setLoading(false);
    }
  };

  const getLimitMessage = () => {
    switch (limitType) {
      case 'projects':
        return 'You\'ve reached your project limit';
      case 'renders_per_project':
        return 'You\'ve reached your renders per project limit';
      case 'credits':
        return 'You\'ve run out of credits';
      case 'quality':
        return 'This quality level requires an upgrade';
      case 'video':
        return 'Video generation requires an upgrade';
      case 'api':
        return 'API access requires an upgrade';
      default:
        return 'Upgrade to unlock this feature';
    }
  };

  const getRecommendedTab = () => {
    // For credits, show credit packages first
    if (limitType === 'credits') return 'credits';
    // For other limits, show subscription plans first
    return 'plans';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Upgrade Your Plan</DialogTitle>
          <DialogDescription className="text-base">
            {getLimitMessage()}. Choose a plan that fits your needs.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue={getRecommendedTab()} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="plans" className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              Subscription Plans
            </TabsTrigger>
            <TabsTrigger value="credits" className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Credit Packages
            </TabsTrigger>
          </TabsList>

          <TabsContent value="plans" className="mt-6">
            {loading ? (
              <div className="text-center py-8">Loading plans...</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {subscriptionPlans
                  .filter(plan => plan.name !== 'Free' && !plan.name.includes('Annual'))
                  .map((plan) => (
                    <div
                      key={plan.id}
                      className={cn(
                        "relative border rounded-lg p-6 transition-all",
                        plan.isPopular
                          ? "border-primary shadow-lg scale-105"
                          : "border-border hover:border-primary/50"
                      )}
                    >
                      {plan.isPopular && (
                        <Badge className="absolute top-4 right-4 bg-primary text-primary-foreground">
                          Popular
                        </Badge>
                      )}
                      <div className="mb-4">
                        <h3 className="text-xl font-bold mb-1">{plan.name}</h3>
                        <p className="text-sm text-muted-foreground mb-3">{plan.description}</p>
                        <div className="flex items-baseline gap-1">
                          <span className="text-3xl font-bold">
                            {plan.currency === 'INR' ? '₹' : '$'}
                            {parseFloat(plan.price).toLocaleString()}
                          </span>
                          <span className="text-muted-foreground">/{plan.interval}</span>
                        </div>
                      </div>
                      <ul className="space-y-2 mb-6">
                        <li className="flex items-center gap-2 text-sm">
                          <Check className="h-4 w-4 text-primary" />
                          {plan.creditsPerMonth} credits/month
                        </li>
                        <li className="flex items-center gap-2 text-sm">
                          <Check className="h-4 w-4 text-primary" />
                          {plan.maxProjects === null ? 'Unlimited' : plan.maxProjects} projects
                        </li>
                        <li className="flex items-center gap-2 text-sm">
                          <Check className="h-4 w-4 text-primary" />
                          {plan.maxRendersPerProject === null ? 'Unlimited' : plan.maxRendersPerProject} renders/project
                        </li>
                        {plan.features.slice(0, 3).map((feature, idx) => (
                          <li key={idx} className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Check className="h-4 w-4" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                      <Button
                        className="w-full"
                        variant={plan.isPopular ? 'default' : 'outline'}
                        onClick={() => {
                          onUpgrade?.(plan.id);
                          onClose();
                        }}
                      >
                        {currentPlan === plan.name ? 'Current Plan' : 'Upgrade'}
                      </Button>
                    </div>
                  ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="credits" className="mt-6">
            {loading ? (
              <div className="text-center py-8">Loading packages...</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {creditPackages
                  .filter(pkg => pkg.credits >= 50) // Show mid-level packages (50+ credits)
                  .slice(0, 3)
                  .map((pkg) => (
                    <div
                      key={pkg.id}
                      className={cn(
                        "relative border rounded-lg p-6 transition-all",
                        pkg.isPopular
                          ? "border-primary shadow-lg scale-105"
                          : "border-border hover:border-primary/50"
                      )}
                    >
                      {pkg.isPopular && (
                        <Badge className="absolute top-4 right-4 bg-primary text-primary-foreground">
                          Popular
                        </Badge>
                      )}
                      <div className="mb-4">
                        <h3 className="text-xl font-bold mb-1">{pkg.name}</h3>
                        <p className="text-sm text-muted-foreground mb-3">{pkg.description}</p>
                        <div className="flex items-baseline gap-1">
                          <span className="text-3xl font-bold">
                            {pkg.currency === 'INR' ? '₹' : '$'}
                            {parseFloat(pkg.price).toLocaleString()}
                          </span>
                        </div>
                      </div>
                      <ul className="space-y-2 mb-6">
                        <li className="flex items-center gap-2 text-sm">
                          <Check className="h-4 w-4 text-primary" />
                          {pkg.credits} credits
                        </li>
                        {pkg.bonusCredits && pkg.bonusCredits > 0 && (
                          <li className="flex items-center gap-2 text-sm text-primary">
                            <Zap className="h-4 w-4" />
                            +{pkg.bonusCredits} bonus credits
                          </li>
                        )}
                      </ul>
                      <Button
                        className="w-full"
                        variant={pkg.isPopular ? 'default' : 'outline'}
                        onClick={() => {
                          onPurchaseCredits?.(pkg.id);
                          onClose();
                        }}
                      >
                        Purchase Credits
                      </Button>
                    </div>
                  ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

