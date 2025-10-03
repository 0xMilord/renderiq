'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Zap, Crown, Building2 } from 'lucide-react';
import { useState } from 'react';

const planIcons = {
  free: Zap,
  pro: Crown,
  'pro-annual': Crown,
  enterprise: Building2,
  'enterprise-annual': Building2,
};

interface Plan {
  id: string;
  name: string;
  description: string;
  price: number;
  interval: string;
  credits: number;
  maxProjects: number | null;
  maxRendersPerProject: number | null;
  features: string[];
  icon: any;
  popular: boolean;
}

interface PricingPlansProps {
  plans: Plan[];
}

export function PricingPlans({ plans }: PricingPlansProps) {
  const [billingInterval, setBillingInterval] = useState<'month' | 'year'>('month');

  const filteredPlans = plans.filter(plan => 
    billingInterval === 'year' ? plan.interval === 'year' : plan.interval === 'month'
  );

  return (
    <div className="space-y-8">
      {/* Billing Toggle */}
      <div className="flex justify-center">
        <div className="bg-muted rounded-lg p-1">
          <button
            onClick={() => setBillingInterval('month')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              billingInterval === 'month'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingInterval('year')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              billingInterval === 'year'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Annual
          </button>
        </div>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPlans.map((plan) => {
          const Icon = planIcons[plan.id as keyof typeof planIcons] || Zap;
          const monthlyPrice = plan.interval === 'year' ? plan.price / 12 : plan.price;
          const savings = plan.interval === 'year' ? Math.round((1 - plan.price / (monthlyPrice * 12)) * 100) : 0;

          return (
            <Card key={plan.id} className={`relative ${plan.popular ? 'ring-2 ring-primary' : ''}`}>
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground">
                    Most Popular
                  </Badge>
                </div>
              )}

              <CardHeader className="text-center pb-4">
                <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Icon className="h-6 w-6 text-muted-foreground" />
                </div>
                <CardTitle className="text-xl">{plan.name}</CardTitle>
                <CardDescription className="text-sm">
                  {plan.description}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-6">
                {/* Pricing */}
                <div className="text-center">
                  <div className="flex items-baseline justify-center">
                    <span className="text-4xl font-bold text-foreground">
                      ${plan.price}
                    </span>
                    <span className="text-muted-foreground ml-1">
                      /{plan.interval}
                    </span>
                  </div>
                  {savings > 0 && (
                    <p className="text-sm text-green-500 mt-1">
                      Save {savings}% with annual billing
                    </p>
                  )}
                  <p className="text-sm text-muted-foreground mt-2">
                    ${monthlyPrice.toFixed(2)}/month
                  </p>
                </div>

                {/* Credits */}
                <div className="text-center p-4 bg-muted rounded-lg">
                  <div className="text-2xl font-bold text-foreground">
                    {plan.credits.toLocaleString()}
                  </div>
                  <div className="text-sm text-muted-foreground">credits per month</div>
                </div>

                {/* Features */}
                <div className="space-y-3">
                  {plan.features.map((feature, index) => (
                    <div key={index} className="flex items-start space-x-3">
                      <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-foreground">{feature}</span>
                    </div>
                  ))}
                </div>

                {/* Limits */}
                <div className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex justify-between">
                    <span>Max Projects:</span>
                    <span className="font-medium">
                      {plan.maxProjects ? plan.maxProjects.toLocaleString() : 'Unlimited'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Renders per Project:</span>
                    <span className="font-medium">
                      {plan.maxRendersPerProject ? plan.maxRendersPerProject.toLocaleString() : 'Unlimited'}
                    </span>
                  </div>
                </div>

                {/* CTA Button */}
                <Button 
                  className={`w-full ${
                    plan.popular 
                      ? 'bg-primary hover:bg-primary/90' 
                      : 'bg-foreground hover:bg-foreground/90'
                  }`}
                >
                  {plan.price === 0 ? 'Get Started' : 'Choose Plan'}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
