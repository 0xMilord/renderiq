import { NextResponse } from 'next/server';
import { getUserPlanLimits } from '@/lib/actions/plan-limits.actions';

export async function GET() {
  try {
    const result = await getUserPlanLimits();
    if (!result.success) {
      return NextResponse.json(result, { status: 401 });
    }
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching plan limits:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch plan limits' },
      { status: 500 }
    );
  }
}

