import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { creditPackages } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import { logger } from '@/lib/utils/logger';
import * as Sentry from '@sentry/nextjs';

export async function GET() {
  try {
    const packages = await db
      .select()
      .from(creditPackages)
      .where(eq(creditPackages.isActive, true))
      .orderBy(desc(creditPackages.credits));

    const formattedPackages = packages.map(pkg => ({
      id: pkg.id,
      name: pkg.name,
      description: pkg.description,
      credits: pkg.credits,
      price: pkg.price,
      currency: pkg.currency,
      bonusCredits: pkg.bonusCredits || 0,
      isPopular: pkg.isPopular || false,
    }));

    return NextResponse.json({ success: true, packages: formattedPackages });
  } catch (error) {
    logger.error('❌ Billing API: Error fetching credit packages:', error);
    
    Sentry.setContext('billing_api', {
      route: '/api/billing/credit-packages',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    
    return NextResponse.json(
      { success: false, error: 'Failed to fetch credit packages' },
      { status: 500 }
    );
  }
}

