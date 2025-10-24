import { AISDKService } from '@/lib/services/ai-sdk-service';
import { NextRequest } from 'next/server';

/**
 * Vercel AI SDK Prompt Enhancement API Route
 * Replaces manual prompt enhancement API
 */
export async function POST(request: NextRequest) {
  try {
    const { prompt } = await request.json();

    if (!prompt || typeof prompt !== 'string') {
      return Response.json(
        { success: false, error: 'Prompt is required' },
        { status: 400 }
      );
    }

    console.log('🔍 AI Enhancement: Starting prompt enhancement via Vercel AI SDK', {
      prompt: prompt.substring(0, 100) + '...'
    });

    const aiService = AISDKService.getInstance();
    const result = await aiService.enhancePrompt(prompt);

    console.log('✅ AI Enhancement: Enhancement successful', {
      processingTime: result.processingTime,
      clarity: result.clarity,
      provider: result.provider
    });

    return Response.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('❌ AI Enhancement: Enhancement failed', error);
    return Response.json(
      { 
        success: false,
        error: 'Enhancement failed', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}
