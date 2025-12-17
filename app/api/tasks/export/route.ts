import { NextRequest, NextResponse } from 'next/server';
import { getCachedUser } from '@/lib/services/auth-cache';
import { TaskAutomationService } from '@/lib/services/task-automation.service';
import { logger } from '@/lib/utils/logger';

/**
 * Track render export for task completion
 * ✅ VC-SAFE: Only tracks product-native actions
 */
export async function POST(request: NextRequest) {
  try {
    const { user } = await getCachedUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { renderId } = body;

    if (!renderId) {
      return NextResponse.json(
        { success: false, error: 'renderId required' },
        { status: 400 }
      );
    }

    // Trigger export task (non-blocking)
    TaskAutomationService.onRenderExported(user.id, renderId).catch((error) => {
      logger.error('⚠️ Failed to trigger export task (non-critical):', error);
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('❌ Export tracking error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
