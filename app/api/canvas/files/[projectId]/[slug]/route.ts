import { NextRequest, NextResponse } from 'next/server';
import { CanvasFilesService } from '@/lib/services/canvas-files.service';
import { getCachedUser } from '@/lib/services/auth-cache';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string; slug: string }> }
) {
  try {
    const { user } = await getCachedUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { projectId, slug } = await params;
    const result = await CanvasFilesService.getFileWithGraphBySlug(projectId, slug);

    if (!result || !result.file) {
      return NextResponse.json(
        { success: false, error: 'Canvas file not found' },
        { status: 404 }
      );
    }

    // Verify ownership
    if (result.file.userId !== user.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      file: result.file,
      graph: result.graph,
    });
  } catch (error) {
    console.error('Error fetching canvas file:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch canvas file' },
      { status: 500 }
    );
  }
}

