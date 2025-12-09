import { NextRequest, NextResponse } from 'next/server';
import { ToolsService } from '@/lib/services/tools.service';
import { getCachedUser } from '@/lib/services/auth-cache';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get('category') as any;
    const outputType = searchParams.get('outputType') as any;
    const includeInactive = searchParams.get('includeInactive') === 'true';

    let tools;
    if (category) {
      tools = await ToolsService.getToolsByCategory(category);
    } else if (outputType) {
      tools = await ToolsService.getToolsByOutputType(outputType);
    } else {
      tools = await ToolsService.getActiveTools(includeInactive);
    }

    return NextResponse.json({
      success: true,
      tools,
    });
  } catch (error) {
    console.error('Error fetching tools:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch tools' },
      { status: 500 }
    );
  }
}

