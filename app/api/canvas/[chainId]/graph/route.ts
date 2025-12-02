import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { CanvasDAL } from '@/lib/dal/canvas';
import { CanvasState } from '@/lib/types/canvas';
import { logger } from '@/lib/utils/logger';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ chainId: string }> }
) {
  try {
    const { chainId } = await params;
    const supabase = await createClient();

    if (!supabase) {
      return NextResponse.json(
        { success: false, error: 'Failed to initialize database connection' },
        { status: 500 }
      );
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const graph = await CanvasDAL.getByChainId(chainId);

    if (!graph) {
      // Return empty graph if none exists
      return NextResponse.json({
        success: true,
        data: {
          nodes: [],
          connections: [],
          viewport: { x: 0, y: 0, zoom: 1 },
        },
      });
    }

    // Verify ownership
    if (graph.userId !== user.id) {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      );
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
    logger.error('Error fetching canvas graph:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch canvas graph',
      },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ chainId: string }> }
) {
  try {
    const { chainId } = await params;
    const supabase = await createClient();

    if (!supabase) {
      return NextResponse.json(
        { success: false, error: 'Failed to initialize database connection' },
        { status: 500 }
      );
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body: CanvasState = await request.json();

    const result = await CanvasDAL.saveGraph(chainId, user.id, body);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: result.data?.id,
        updatedAt: result.data?.updatedAt,
      },
    });
  } catch (error) {
    logger.error('Error saving canvas graph:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to save canvas graph',
      },
      { status: 500 }
    );
  }
}

