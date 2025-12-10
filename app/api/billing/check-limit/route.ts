import { NextRequest, NextResponse } from 'next/server';
import { checkProjectLimit, checkRenderLimit, checkQualityLimit, checkVideoLimit } from '@/lib/actions/plan-limits.actions';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type');

    if (!type) {
      return NextResponse.json(
        { success: false, error: 'Limit type is required' },
        { status: 400 }
      );
    }

    let result;

    switch (type) {
      case 'projects':
        result = await checkProjectLimit();
        break;
      case 'renders_per_project':
        const projectId = searchParams.get('projectId');
        if (!projectId) {
          return NextResponse.json(
            { success: false, error: 'projectId is required for renders_per_project check' },
            { status: 400 }
          );
        }
        result = await checkRenderLimit(projectId);
        break;
      case 'quality':
        const quality = searchParams.get('quality') as 'standard' | 'high' | 'ultra';
        if (!quality) {
          return NextResponse.json(
            { success: false, error: 'quality is required for quality check' },
            { status: 400 }
          );
        }
        result = await checkQualityLimit(quality);
        break;
      case 'video':
        result = await checkVideoLimit();
        break;
      default:
        return NextResponse.json(
          { success: false, error: 'Invalid limit type' },
          { status: 400 }
        );
    }

    if (!result.success) {
      return NextResponse.json(result, { status: 401 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error checking limit:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to check limit' },
      { status: 500 }
    );
  }
}

