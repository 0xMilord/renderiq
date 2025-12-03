import { db } from './index';
import { subscriptionPlans, creditPackages } from './schema';
import { logger } from '@/lib/utils/logger';

export async function seedSubscriptionPlans() {
  const plans = [
    {
      name: 'Free',
      description: 'Perfect for getting started with AI architectural visualization',
      price: '0.00',
      currency: 'INR',
      interval: 'month' as const,
      creditsPerMonth: 10,
      maxProjects: 3,
      maxRendersPerProject: 5,
      features: [
        '10 credits per month',
        '3 projects maximum',
        '5 renders per project',
        'Standard quality renders',
        'Community support',
        'Public gallery access'
      ],
      isActive: true,
    },
    {
      name: 'Starter',
      description: 'Great for casual creators',
      price: '119.00',
      currency: 'INR',
      interval: 'month' as const,
      creditsPerMonth: 24,
      maxProjects: 10,
      maxRendersPerProject: 10,
      features: [
        '24 credits per month',
        '10 projects maximum',
        '10 renders per project',
        'Standard quality renders',
        'Community support',
        'Public gallery access'
      ],
      isActive: true,
    },
    {
      name: 'Pro',
      description: 'For professionals who need more credits and advanced features',
      price: '499.00',
      currency: 'INR',
      interval: 'month' as const,
      creditsPerMonth: 100,
      maxProjects: 25,
      maxRendersPerProject: 20,
      features: [
        '100 credits per month',
        '25 projects maximum',
        '20 renders per project',
        'High quality renders',
        'Priority support',
        'Private projects',
        'Advanced AI styles',
        'Video generation',
        'API access'
      ],
      isActive: true,
    },
    {
      name: 'Pro Annual',
      description: 'Save 20% with annual billing',
      price: '4790.00', // 100 credits/month × 12 = 1200 credits/year × 5 INR = 6000, with 20% discount = 4800, but offering at 4790
      currency: 'INR',
      interval: 'year' as const,
      creditsPerMonth: 100,
      maxProjects: 25,
      maxRendersPerProject: 20,
      features: [
        '100 credits per month',
        '25 projects maximum',
        '20 renders per project',
        'High quality renders',
        'Priority support',
        'Private projects',
        'Advanced AI styles',
        'Video generation',
        'API access',
        '20% savings'
      ],
      isActive: true,
    },
    {
      name: 'Enterprise',
      description: 'For teams and organizations with high-volume needs',
      price: '4999.00', // 1000 credits × 5 INR = 5000 INR, but offering at 4999 INR
      currency: 'INR',
      interval: 'month' as const,
      creditsPerMonth: 1000,
      maxProjects: null,
      maxRendersPerProject: null,
      features: [
        '1000 credits per month',
        'Unlimited projects',
        'Unlimited renders per project',
        'Ultra quality renders',
        'Dedicated support',
        'Team collaboration',
        'All AI styles',
        'Video generation',
        'Full API access',
        'Custom integrations',
        'Usage analytics',
        'SLA guarantee'
      ],
      isActive: true,
    },
    {
      name: 'Enterprise Annual',
      description: 'Save 25% with annual billing',
      price: '44999.00', // 1000 credits/month × 12 = 12000 credits/year × 5 INR = 60000, with 25% discount = 45000, but offering at 44999
      currency: 'INR',
      interval: 'year' as const,
      creditsPerMonth: 1000,
      maxProjects: null,
      maxRendersPerProject: null,
      features: [
        '1000 credits per month',
        'Unlimited projects',
        'Unlimited renders per project',
        'Ultra quality renders',
        'Dedicated support',
        'Team collaboration',
        'All AI styles',
        'Video generation',
        'Full API access',
        'Custom integrations',
        'Usage analytics',
        'SLA guarantee',
        '25% savings'
      ],
      isActive: true,
    },
  ];

  for (const plan of plans) {
    await db.insert(subscriptionPlans).values(plan).onConflictDoNothing();
  }

  logger.log('✅ Subscription plans seeded successfully');
}

export async function seedCreditPackages() {
  const packages = [
    {
      name: 'Starter Pack',
      description: 'Perfect for trying out Renderiq',
      credits: 50,
      price: '250.00', // 50 credits × 5 INR = 250 INR
      currency: 'INR',
      bonusCredits: 0,
      isPopular: false,
      isActive: true,
      displayOrder: 1,
    },
    {
      name: 'Professional Pack',
      description: 'Best value for regular users (matches Pro subscription)',
      credits: 100,
      price: '499.00', // 100 credits × 5 INR = 500 INR, but offering at 499 INR
      currency: 'INR',
      bonusCredits: 0,
      isPopular: true,
      isActive: true,
      displayOrder: 2,
    },
    {
      name: 'Power Pack',
      description: 'For power users who need more',
      credits: 500,
      price: '2499.00', // 500 credits × 5 INR = 2500 INR, but offering at 2499 INR
      currency: 'INR',
      bonusCredits: 0,
      isPopular: false,
      isActive: true,
      displayOrder: 3,
    },
    {
      name: 'Enterprise Pack',
      description: 'Maximum credits for heavy usage',
      credits: 1000,
      price: '4999.00', // 1000 credits × 5 INR = 5000 INR, but offering at 4999 INR
      currency: 'INR',
      bonusCredits: 0,
      isPopular: false,
      isActive: true,
      displayOrder: 4,
    },
  ];

  for (const pkg of packages) {
    await db.insert(creditPackages).values(pkg).onConflictDoNothing();
  }

  logger.log('✅ Credit packages seeded successfully');
}

export async function seedDatabase() {
  try {
    await seedSubscriptionPlans();
    await seedCreditPackages();
    logger.log('🎉 Database seeding completed successfully');
  } catch (error) {
    console.error('❌ Database seeding failed:', error);
    throw error;
  }
}
