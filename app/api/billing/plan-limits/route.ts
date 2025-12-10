import { NextResponse } from 'next/server';
import { getUserPlanLimits } from '@/lib/actions/plan-limits.actions';
import { logger } from '@/lib/utils/logger';
import * as Sentry from '@sentry/nextjs';

export async function GET() {
  try {
    const result = await getUserPlanLimits();
    if (!result.success) {
      return NextResponse.json(result, { status: 401 });
    }
    return NextResponse.json(result);
  } catch (error) {
    logger.error('❌ Billing API: Error fetching plan limits:', error);
    
    Sentry.setContext('billing_api', {
      route: '/api/billing/plan-limits',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    
    return NextResponse.json(
      { success: false, error: 'Failed to fetch plan limits' },
      { status: 500 }
    );
  }
}

