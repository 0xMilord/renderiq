import { NextRequest, NextResponse } from 'next/server';
import { ToolsService } from '@/lib/services/tools.service';
import { getCachedUser } from '@/lib/services/auth-cache';

export async function GET(request: NextRequest) {
  try {
    const { user } = await getCachedUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const projectId = searchParams.get('projectId');
    const toolId = searchParams.get('toolId');
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined;

    let executions;
    if (projectId) {
      executions = await ToolsService.getExecutionsByProject(projectId, limit);
    } else if (toolId) {
      executions = await ToolsService.getExecutionsByTool(toolId, user.id, limit);
    } else {
      executions = await ToolsService.getExecutionsByUser(user.id, limit);
    }

    return NextResponse.json({
      success: true,
      executions,
    });
  } catch (error) {
    console.error('Error fetching tool executions:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch tool executions' },
      { status: 500 }
    );
  }
}

