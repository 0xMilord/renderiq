import { NextRequest, NextResponse } from 'next/server';
import { ToolsService } from '@/lib/services/tools.service';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const tool = await ToolsService.getToolBySlug(slug);

    if (!tool) {
      return NextResponse.json(
        { success: false, error: 'Tool not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      tool,
    });
  } catch (error) {
    console.error('Error fetching tool:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch tool' },
      { status: 500 }
    );
  }
}

