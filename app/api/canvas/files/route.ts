import { NextRequest, NextResponse } from 'next/server';
import { CanvasFilesService } from '@/lib/services/canvas-files.service';
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
    const userId = searchParams.get('userId');
    const includeArchived = searchParams.get('includeArchived') === 'true';

    let files;
    if (projectId) {
      files = await CanvasFilesService.getFilesByProject(projectId, includeArchived);
    } else if (userId) {
      files = await CanvasFilesService.getFilesByUser(userId, includeArchived);
    } else {
      // Default to current user's files
      files = await CanvasFilesService.getFilesByUser(user.id, includeArchived);
    }

    return NextResponse.json({
      success: true,
      files,
    });
  } catch (error) {
    console.error('Error fetching canvas files:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch canvas files' },
      { status: 500 }
    );
  }
}

