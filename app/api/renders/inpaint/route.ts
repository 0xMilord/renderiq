import { NextRequest, NextResponse } from 'next/server';
import { getCachedUser } from '@/lib/services/auth-cache';
import { MaskInpaintingService } from '@/lib/services/mask-inpainting';
import { RendersDAL } from '@/lib/dal/renders';
import { logger } from '@/lib/utils/logger';
import { FileStorageService } from '@/lib/services/file-storage';

/**
 * Inpainting API Endpoint
 * POST /api/renders/inpaint
 * 
 * Generates inpainted image from mask
 */
export async function POST(request: NextRequest) {
  try {
    const { user } = await getCachedUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { renderId, maskData, prompt, quality, chainId, toolContext } = body;

    // Validate required fields
    if (!renderId || !maskData || !prompt) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: renderId, maskData, prompt' },
        { status: 400 }
      );
    }

    // Get source render
    const render = await RendersDAL.getById(renderId);
    if (!render) {
      return NextResponse.json({ success: false, error: 'Render not found' }, { status: 404 });
    }

    // Verify ownership
    if (render.userId !== user.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    // Get source image
    if (!render.outputUrl) {
      return NextResponse.json(
        { success: false, error: 'Source render has no output image' },
        { status: 400 }
      );
    }

    logger.log('🎨 Inpaint API: Starting inpainting', {
      renderId,
      chainId,
      quality: quality || 'high',
    });

    // Fetch source image and convert to base64
    let imageBase64: string;
    try {
      const imageResponse = await fetch(render.outputUrl);
      if (!imageResponse.ok) {
        throw new Error(`Failed to fetch image: ${imageResponse.statusText}`);
      }
      const imageBlob = await imageResponse.blob();
      const arrayBuffer = await imageBlob.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      imageBase64 = buffer.toString('base64');
    } catch (error) {
      logger.error('❌ Inpaint API: Failed to fetch source image', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch source image' },
        { status: 500 }
      );
    }

    // Generate inpainted image
    const result = await MaskInpaintingService.generateInpainted({
      renderId,
      imageData: imageBase64,
      maskData,
      prompt,
      quality: quality || 'high',
      chainId: chainId || render.chainId || undefined,
      contextData: (render as any).contextData,
      toolContext,
    });

    if (!result.success || !result.imageUrl) {
      return NextResponse.json(
        { success: false, error: result.error || 'Inpainting failed' },
        { status: 500 }
      );
    }

    // Create new render record for the inpainted image
    const newRender = await RendersDAL.create({
      projectId: render.projectId || null,
      userId: user.id,
      type: 'image',
      prompt: `${render.prompt} + ${prompt} (inpainted)`,
      settings: render.settings || {
        style: 'photorealistic',
        quality: quality || 'high',
        aspectRatio: render.settings?.aspectRatio || '16:9',
      },
      status: 'completed',
      chainId: render.chainId || chainId || null,
      chainPosition: render.chainPosition ? render.chainPosition + 1 : 1,
      referenceRenderId: render.id,
      outputUrl: result.imageUrl,
      outputKey: result.imageUrl.split('/').pop() || null,
      platform: 'canvas', // Mark as canvas-generated
    });

    logger.log('✅ Inpaint API: Inpainting complete', {
      renderId: newRender.id,
      chainId: newRender.chainId,
    });

    return NextResponse.json({
      success: true,
      data: {
        id: newRender.id,
        outputUrl: result.imageUrl,
        status: 'completed',
        chainId: newRender.chainId,
        chainPosition: newRender.chainPosition,
      },
    });
  } catch (error) {
    logger.error('❌ Inpaint API: Error', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

