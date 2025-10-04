'use server';

import { UpscalingService } from '@/lib/services/upscaling';

const upscalingService = UpscalingService.getInstance();

export async function upscaleImageAction(request: {
  imageUrl: string;
  scale: 2 | 4 | 10;
  quality: 'standard' | 'high' | 'ultra';
}) {
  try {
    console.log('🔍 UpscalingAction: Starting server-side upscaling', request);
    
    const result = await upscalingService.upscaleImage(request);
    
    if (result.success && result.data) {
      console.log('✅ UpscalingAction: Upscaling completed successfully');
      return {
        success: true,
        data: result.data
      };
    } else {
      console.error('❌ UpscalingAction: Upscaling failed', result.error);
      return {
        success: false,
        error: result.error || 'Upscaling failed'
      };
    }
  } catch (error) {
    console.error('❌ UpscalingAction: Exception during upscaling', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Upscaling failed'
    };
  }
}
