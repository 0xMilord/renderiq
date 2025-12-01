import { AISDKService } from '@/lib/services/ai-sdk-service';
import { NextRequest } from 'next/server';

/**
 * Google Generative AI Video Generation API Route
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

    console.log('🎬 AI Video: Starting video generation via Google Generative AI', {
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

    if (!result.success || !result.data) {
      return Response.json(
        { success: false, error: result.error || 'Video generation failed' },
        { status: 500 }
      );
    }

    console.log('✅ AI Video: Generation successful', {
      processingTime: result.data.processingTime,
      provider: result.data.provider
    });

    return Response.json({
      success: true,
      data: result.data
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
