import { AISDKService } from '@/lib/services/ai-sdk-service';
import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/utils/logger';
import { handleCORSPreflight, withCORS } from '@/lib/middleware/cors';

/**
 * Google Generative AI Completion API Route
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

    logger.log('📝 AI Completion: Starting completion via Google Generative AI', {
      prompt: prompt.substring(0, 100) + '...'
    });

    const aiService = AISDKService.getInstance();
    const result = await aiService.generateText(prompt, {
      temperature: 0.7,
      maxTokens: 1000,
    });

    logger.log('✅ AI Completion: Completion successful', {
      usage: result.usage
    });

    const successResponse = NextResponse.json({
      success: true,
      data: {
        text: result.text,
        usage: result.usage,
        provider: 'google-generative-ai'
      }
    });
    return withCORS(successResponse, request);

  } catch (error) {
    logger.error('❌ AI Completion: Completion failed', error);
    const errorResponse = NextResponse.json(
      { 
        success: false,
        error: 'Completion failed', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
    return withCORS(errorResponse, request);
  }
}