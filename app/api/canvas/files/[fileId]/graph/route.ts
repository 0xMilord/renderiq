import { NextRequest, NextResponse } from 'next/server';
import { getCachedUser } from '@/lib/services/auth-cache';
import { CanvasFilesService } from '@/lib/services/canvas-files.service';
import { CanvasState } from '@/lib/types/canvas';
import { logger } from '@/lib/utils/logger';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ fileId: string }> }
) {
  try {
    const { fileId } = await params;
    const { user } = await getCachedUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get file to verify ownership
    const file = await CanvasFilesService.getFileById(fileId);
    
    if (!file) {
      return NextResponse.json(
        { success: false, error: 'Canvas file not found' },
        { status: 404 }
      );
    }

    if (file.userId !== user.id) {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      );
    }

    // Get graph
    const graph = await CanvasFilesService.getGraphByFileId(fileId);

    if (!graph) {
      // Return empty graph if none exists - canvas will create it on first save
      return NextResponse.json({
        success: true,
        data: {
          nodes: [],
          connections: [],
          viewport: { x: 0, y: 0, zoom: 1 },
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        nodes: graph.nodes,
        connections: graph.connections,
        viewport: graph.viewport || { x: 0, y: 0, zoom: 1 },
      },
    });
  } catch (error) {
    logger.error('Error getting canvas graph:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get canvas graph' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ fileId: string }> }
) {
  try {
    const { fileId } = await params;
    const { user } = await getCachedUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get file to verify ownership
    const file = await CanvasFilesService.getFileById(fileId);
    
    if (!file) {
      return NextResponse.json(
        { success: false, error: 'Canvas file not found' },
        { status: 404 }
      );
    }

    if (file.userId !== user.id) {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const state: CanvasState = {
      nodes: body.nodes || [],
      connections: body.connections || [],
      viewport: body.viewport || { x: 0, y: 0, zoom: 1 },
    };

    const result = await CanvasFilesService.saveGraph(fileId, user.id, state);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.data,
    });
  } catch (error) {
    logger.error('Error saving canvas graph:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to save canvas graph' },
      { status: 500 }
    );
  }
}

