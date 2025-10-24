import { AISDKService } from '@/lib/services/ai-sdk-service';
import { NextRequest } from 'next/server';

/**
 * Vercel AI SDK Video Generation API Route
 * Replaces manual video generation API
 */
export async function POST(request: NextRequest) {
  try {
    const { prompt, duration, style, aspectRatio } = await request.json();

    if (!prompt || typeof prompt !== 'string') {
      return Response.json(
        { success: false, error: 'Prompt is required' },
        { status: 400 }
      );
    }

    console.log('🎬 AI Video: Starting video generation via Vercel AI SDK', {
      prompt: prompt.substring(0, 100) + '...',
      duration,
      style,
      aspectRatio
    });

    const aiService = AISDKService.getInstance();
    const result = await aiService.generateVideo({
      prompt,
      duration: duration || 5,
      style: style || 'cinematic',
      aspectRatio: aspectRatio || '16:9'
    });

    console.log('✅ AI Video: Generation successful', {
      processingTime: result.processingTime,
      provider: result.provider
    });

    return Response.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('❌ AI Video: Generation failed', error);
    return Response.json(
      { 
        success: false,
        error: 'Video generation failed', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}
