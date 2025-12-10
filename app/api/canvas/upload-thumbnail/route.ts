'use server';

import { NextRequest, NextResponse } from 'next/server';
import { getCachedUser } from '@/lib/services/auth-cache';
import { StorageService } from '@/lib/services/storage';
import { updateCanvasFileAction } from '@/lib/actions/canvas-files.actions';
import { logger } from '@/lib/utils/logger';
import * as Sentry from '@sentry/nextjs';

export async function POST(request: NextRequest) {
  try {
    const { user } = await getCachedUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const fileId = formData.get('fileId') as string;

    if (!file || !fileId) {
      return NextResponse.json(
        { success: false, error: 'File and fileId are required' },
        { status: 400 }
      );
    }

    // Upload to storage (use uploads bucket for canvas thumbnails)
    const uploadResult = await StorageService.uploadFile(
      file,
      'uploads',
      user.id,
      `canvas-thumbnails/${fileId}-${Date.now()}.png`
    );

    // Update canvas file with thumbnail URL
    const updateFormData = new FormData();
    updateFormData.append('thumbnailUrl', uploadResult.url);
    updateFormData.append('thumbnailKey', uploadResult.key);

    const updateResult = await updateCanvasFileAction(fileId, updateFormData);

    if (!updateResult.success) {
      logger.error('Failed to update canvas file with thumbnail:', updateResult.error);
      return NextResponse.json(
        { success: false, error: 'Failed to update canvas file' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      url: uploadResult.url,
      key: uploadResult.key,
    });
  } catch (error) {
    logger.error('Error uploading canvas thumbnail:', error);
    
    Sentry.setContext('canvas_api', {
      route: '/api/canvas/upload-thumbnail',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    
    return NextResponse.json(
      { success: false, error: 'Failed to upload thumbnail' },
      { status: 500 }
    );
  }
}

