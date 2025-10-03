import { db } from './index';
import { subscriptionPlans } from './schema';

export async function seedSubscriptionPlans() {
  const plans = [
    {
      name: 'Free',
      description: 'Perfect for getting started with AI architectural visualization',
      price: '0.00',
      currency: 'USD',
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
      name: 'Pro',
      description: 'For professionals who need more credits and advanced features',
      price: '15.00',
      currency: 'USD',
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
      price: '144.00',
      currency: 'USD',
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
      price: '99.00',
      currency: 'USD',
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
      price: '891.00',
      currency: 'USD',
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

  console.log('✅ Subscription plans seeded successfully');
}

export async function seedDatabase() {
  try {
    await seedSubscriptionPlans();
    console.log('🎉 Database seeding completed successfully');
  } catch (error) {
    console.error('❌ Database seeding failed:', error);
    throw error;
  }
}
