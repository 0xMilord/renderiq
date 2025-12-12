import { AISDKService } from '@/lib/services/ai-sdk-service';
import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/utils/logger';
import { handleCORSPreflight, withCORS } from '@/lib/middleware/cors';

/**
 * Google Generative AI Video Generation API Route
 */
export async function POST(request: NextRequest) {
  // ⚡ Fast path: Handle CORS preflight immediately
  const preflight = handleCORSPreflight(request);
  if (preflight) return preflight;

  try {
    const { prompt, duration, style, aspectRatio } = await request.json();

    if (!prompt || typeof prompt !== 'string') {
      const validationErrorResponse = NextResponse.json(
        { success: false, error: 'Prompt is required' },
        { status: 400 }
      );
      return withCORS(validationErrorResponse, request);
    }

    logger.log('🎬 AI Video: Starting video generation via Google Generative AI', {
      prompt: prompt.substring(0, 100) + '...',
      duration,
      style,
      aspectRatio
    });

    const aiService = AISDKService.getInstance();
    const result = await aiService.generateVideo({
      prompt,
      duration: duration || 5,
      aspectRatio: (aspectRatio || '16:9') as '16:9' | '9:16' | '1:1'
    });

    if (!result.success || !result.data) {
      const generationErrorResponse = NextResponse.json(
        { success: false, error: result.error || 'Video generation failed' },
        { status: 500 }
      );
      return withCORS(generationErrorResponse, request);
    }

    logger.log('✅ AI Video: Generation successful', {
      processingTime: result.data.processingTime,
      provider: result.data.provider
    });

    const successResponse = NextResponse.json({
      success: true,
      data: result.data
    });
    return withCORS(successResponse, request);

  } catch (error) {
    logger.error('❌ AI Video: Generation failed', error);
    const errorResponse = NextResponse.json(
      { 
        success: false,
        error: 'Video generation failed', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
    return withCORS(errorResponse, request);
  }
}
