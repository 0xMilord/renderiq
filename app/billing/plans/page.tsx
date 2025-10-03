import { Suspense } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Zap, Crown, Building2 } from 'lucide-react';
import { PricingPlans } from '@/components/billing/pricing-plans';
import { PlanComparison } from '@/components/billing/plan-comparison';

const plans = [
  {
    id: 'free',
    name: 'Free',
    description: 'Perfect for getting started',
    price: 0,
    interval: 'month',
    credits: 10,
    maxProjects: 3,
    maxRendersPerProject: 5,
    features: [
      '10 credits per month',
      '3 projects maximum',
      '5 renders per project',
      'Basic support',
      'Standard quality renders'
    ],
    icon: Zap,
    popular: false,
  },
  {
    id: 'pro',
    name: 'Pro',
    description: 'For professional architects',
    price: 15,
    interval: 'month',
    credits: 100,
    maxProjects: 25,
    maxRendersPerProject: 20,
    features: [
      '100 credits per month',
      '25 projects maximum',
      '20 renders per project',
      'Priority support',
      'High quality renders',
      'Video rendering',
      'API access',
      'Custom styles'
    ],
    icon: Crown,
    popular: true,
  },
  {
    id: 'pro-annual',
    name: 'Pro Annual',
    description: 'Pro plan with 20% savings',
    price: 144,
    interval: 'year',
    credits: 100,
    maxProjects: 25,
    maxRendersPerProject: 20,
    features: [
      '100 credits per month',
      '25 projects maximum',
      '20 renders per project',
      'Priority support',
      'High quality renders',
      'Video rendering',
      'API access',
      'Custom styles',
      '20% savings'
    ],
    icon: Crown,
    popular: false,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'For large teams and organizations',
    price: 99,
    interval: 'month',
    credits: 1000,
    maxProjects: null,
    maxRendersPerProject: null,
    features: [
      '1000 credits per month',
      'Unlimited projects',
      'Unlimited renders per project',
      '24/7 priority support',
      'Ultra quality renders',
      'Video rendering',
      'Full API access',
      'Custom styles',
      'Team management',
      'SSO integration',
      'Custom integrations'
    ],
    icon: Building2,
    popular: false,
  },
  {
    id: 'enterprise-annual',
    name: 'Enterprise Annual',
    description: 'Enterprise plan with 25% savings',
    price: 891,
    interval: 'year',
    credits: 1000,
    maxProjects: null,
    maxRendersPerProject: null,
    features: [
      '1000 credits per month',
      'Unlimited projects',
      'Unlimited renders per project',
      '24/7 priority support',
      'Ultra quality renders',
      'Video rendering',
      'Full API access',
      'Custom styles',
      'Team management',
      'SSO integration',
      'Custom integrations',
      '25% savings'
    ],
    icon: Building2,
    popular: false,
  },
];

export default function PlansPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Choose Your Plan
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Select the perfect plan for your architectural visualization needs. 
            Upgrade or downgrade at any time.
          </p>
        </div>

        <Suspense fallback={<div>Loading plans...</div>}>
          <PricingPlans plans={plans} />
        </Suspense>

        <div className="mt-16">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">
            Compare Plans
          </h2>
          <Suspense fallback={<div>Loading comparison...</div>}>
            <PlanComparison plans={plans} />
          </Suspense>
        </div>

        <div className="mt-16 bg-blue-50 rounded-2xl p-8 text-center">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">
            Need a Custom Plan?
          </h3>
          <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
            We offer custom enterprise solutions for large organizations with specific needs. 
            Contact our sales team to discuss your requirements.
          </p>
          <Button size="lg" variant="outline">
            Contact Sales
          </Button>
        </div>
      </div>
    </div>
  );
}
