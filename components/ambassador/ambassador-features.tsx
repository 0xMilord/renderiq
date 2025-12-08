'use client';

import { 
  DollarSign, 
  Gift, 
  Link2, 
  BarChart3, 
  TrendingUp, 
  Users, 
  Calendar,
  Award,
  Zap
} from 'lucide-react';

const features = [
  {
    icon: DollarSign,
    title: 'Earn 25% Commission',
    description: 'Get 25% of subscription revenue for 6 months for every user you refer who subscribes. Commission calculated on original amount, not discounted.',
  },
  {
    icon: Gift,
    title: 'Give Discounts',
    description: 'Your referrals get 20% off (base). Discount increases with volume tiers: Silver (25%), Gold (30%), Platinum (35%).',
  },
  {
    icon: Link2,
    title: 'Custom Tracking Links',
    description: 'Create unlimited custom links for different campaigns. Track clicks, signups, and conversions in real-time.',
  },
  {
    icon: BarChart3,
    title: 'Real-time Dashboard',
    description: 'Comprehensive dashboard with stats: total referrals, active subscribers, earnings, conversion rates, and more.',
  },
  {
    icon: TrendingUp,
    title: 'Volume Tiers',
    description: 'Unlock higher discount tiers as you grow: Bronze (0-9), Silver (10-49), Gold (50-99), Platinum (100+).',
  },
  {
    icon: Users,
    title: 'Referral Tracking',
    description: 'Track every referral from signup to subscription. See who converted and monitor your commission months remaining.',
  },
  {
    icon: Calendar,
    title: 'Weekly Payouts',
    description: 'Commissions are tracked weekly. View payout history, pending earnings, and payment status all in one place.',
  },
  {
    icon: Award,
    title: 'Unique Ambassador Code',
    description: 'Get your unique referral code (e.g., ABC123). Share it anywhere - social media, blog, email, or website.',
  },
  {
    icon: Zap,
    title: 'Commission History',
    description: 'Detailed commission tracking for each referral. See subscription amounts, discounts applied, and commission earned.',
  },
];

export function AmbassadorFeatures() {
  return (
    <div className="bg-card border rounded-lg p-6 sticky top-4">
      <h3 className="text-xl font-semibold mb-4">Program Features</h3>
      <div className="space-y-4 max-h-[calc(100vh-8rem)] overflow-y-auto">
        {features.map((feature, index) => {
          const Icon = feature.icon;
          return (
            <div key={index} className="space-y-2">
              <div className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-md bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                  <Icon className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-sm text-foreground leading-tight">
                    {feature.title}
                  </h4>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
              {index < features.length - 1 && (
                <div className="h-px bg-border ml-11" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

