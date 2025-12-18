import { getCreditPackagesAction, getSubscriptionPlansAction } from '@/lib/actions/pricing.actions';
import { HomepagePricingClient } from './homepage-pricing-client';

export async function HomepagePricing() {
  // Fetch pricing data from database (server-side)
  const [plansResult, packagesResult] = await Promise.all([
    getSubscriptionPlansAction(),
    getCreditPackagesAction(),
  ]);

  const plans = plansResult.success ? plansResult.data || [] : [];
  const creditPackages = packagesResult.success ? packagesResult.data || [] : [];

  return <HomepagePricingClient plans={plans} creditPackages={creditPackages} />;
}


