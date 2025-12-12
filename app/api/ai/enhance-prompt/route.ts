import { AISDKService } from '@/lib/services/ai-sdk-service';
import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/utils/logger';
import { handleCORSPreflight, withCORS } from '@/lib/middleware/cors';

/**
 * Google Generative AI Prompt Enhancement API Route
 */
export async function POST(request: NextRequest) {
  // ⚡ Fast path: Handle CORS preflight immediately
  const preflight = handleCORSPreflight(request);
  if (preflight) return preflight;

  try {
    const { prompt } = await request.json();

    if (!prompt || typeof prompt !== 'string') {
      return Response.json(
        { success: false, error: 'Prompt is required' },
        { status: 400 }
      );
    }

    logger.log('🔍 AI Enhancement: Starting prompt enhancement via Google Generative AI', {
      prompt: prompt.substring(0, 100) + '...'
    });

    const aiService = AISDKService.getInstance();
    const result = await aiService.enhancePrompt(prompt);

    logger.log('✅ AI Enhancement: Enhancement successful', {
      processingTime: result.processingTime,
      clarity: result.clarity,
      provider: result.provider
    });

    const successResponse = NextResponse.json({
      success: true,
      data: result
    });
    return withCORS(successResponse, request);

  } catch (error) {
    logger.error('❌ AI Enhancement: Enhancement failed', error);
    const errorResponse = NextResponse.json(
      { 
        success: false,
        error: 'Enhancement failed', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
    return withCORS(errorResponse, request);
  }
}
