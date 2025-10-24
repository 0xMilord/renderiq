import { AISDKService } from '@/lib/services/ai-sdk-service';
import { NextRequest } from 'next/server';

/**
 * Vercel AI SDK Image Generation API Route
 * Replaces manual image generation API
 */
export async function POST(request: NextRequest) {
  try {
    const { prompt, style, quality, aspectRatio, negativePrompt, seed } = await request.json();

    if (!prompt || typeof prompt !== 'string') {
      return Response.json(
        { success: false, error: 'Prompt is required' },
        { status: 400 }
      );
    }

    console.log('🎨 AI Image: Starting image generation via Vercel AI SDK', {
      prompt: prompt.substring(0, 100) + '...',
      style,
      quality,
      aspectRatio
    });

    const aiService = AISDKService.getInstance();
    const result = await aiService.generateImage({
      prompt,
      style: style || 'realistic',
      quality: quality || 'high',
      aspectRatio: aspectRatio || '16:9',
      negativePrompt,
      seed
    });

    console.log('✅ AI Image: Generation successful', {
      processingTime: result.processingTime,
      provider: result.provider
    });

    return Response.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('❌ AI Image: Generation failed', error);
    return Response.json(
      { 
        success: false,
        error: 'Image generation failed', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}
