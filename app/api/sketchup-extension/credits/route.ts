import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { BillingDAL } from '@/lib/dal/billing';
import { logger } from '@/lib/utils/logger';
import { securityLog } from '@/lib/utils/security';

/**
 * GET /api/sketchup-extension/credits
 * Get user credits balance for SketchUp extension
 */
export async function GET(request: NextRequest) {
  try {
    // Get Bearer token from Authorization header
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      securityLog('sketchup_credits_missing_token', {}, 'warn');
      return NextResponse.json(
        { success: false, error: 'Authorization token required' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Create Supabase client and get user
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      securityLog('sketchup_credits_invalid_token', { error: userError?.message }, 'warn');
      return NextResponse.json(
        { success: false, error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    // Get user credits
    const creditsResult = await BillingDAL.getUserCredits(user.id);

    if (!creditsResult.success || !creditsResult.credits) {
      logger.warn('❌ SketchUp Extension: Credits not found for user:', user.id);
      return NextResponse.json({
        success: true,
        credits: {
          balance: 0,
          totalEarned: 0,
          totalSpent: 0,
        },
      });
    }

    const credits = creditsResult.credits;

    logger.log('✅ SketchUp Extension: Credits retrieved', {
      userId: user.id,
      balance: credits.balance,
    });

    return NextResponse.json({
      success: true,
      credits: {
        balance: credits.balance,
        totalEarned: credits.totalEarned,
        totalSpent: credits.totalSpent,
      },
    });
  } catch (error) {
    logger.error('❌ SketchUp Extension: Get credits error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

