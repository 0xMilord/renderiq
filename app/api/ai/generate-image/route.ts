import { AISDKService } from '@/lib/services/ai-sdk-service';
import { NextRequest } from 'next/server';

/**
 * Google Generative AI Image Generation API Route
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

    console.log('🎨 AI Image: Starting image generation via Google Generative AI', {
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

    if (!result.success || !result.data) {
      return Response.json(
        { success: false, error: result.error || 'Image generation failed' },
        { status: 500 }
      );
    }

    // Convert base64 to data URL if needed
    let imageUrl = result.data.imageUrl;
    if (imageUrl && !imageUrl.startsWith('http') && !imageUrl.startsWith('data:')) {
      imageUrl = `data:image/png;base64,${imageUrl}`;
    }

    console.log('✅ AI Image: Generation successful', {
      processingTime: result.data.processingTime,
      provider: result.data.provider
    });

    return Response.json({
      success: true,
      data: {
        imageUrl: imageUrl,
        url: imageUrl, // Alias for compatibility
        processingTime: result.data.processingTime,
        provider: result.data.provider,
        metadata: result.data.metadata
      }
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
