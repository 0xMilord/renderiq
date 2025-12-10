import { NextResponse } from 'next/server';
import { BillingDAL } from '@/lib/dal/billing';
import { logger } from '@/lib/utils/logger';
import * as Sentry from '@sentry/nextjs';

export async function GET() {
  try {
    const plans = await BillingDAL.getSubscriptionPlans();
    
    // Filter out Free plan and Annual plans, keep only monthly paid plans
    const paidPlans = plans
      .filter(plan => plan.name !== 'Free' && plan.interval === 'month')
      .map(plan => ({
        id: plan.id,
        name: plan.name,
        description: plan.description,
        price: plan.price,
        currency: plan.currency,
        interval: plan.interval,
        creditsPerMonth: plan.creditsPerMonth,
        maxProjects: plan.maxProjects,
        maxRendersPerProject: plan.maxRendersPerProject,
        features: plan.features || [],
        isPopular: plan.name === 'Pro', // Mark Pro as popular
      }));

    return NextResponse.json({ success: true, plans: paidPlans });
  } catch (error) {
    logger.error('❌ Billing API: Error fetching plans:', error);
    
    Sentry.setContext('billing_api', {
      route: '/api/billing/plans',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    
    return NextResponse.json(
      { success: false, error: 'Failed to fetch plans' },
      { status: 500 }
    );
  }
}

