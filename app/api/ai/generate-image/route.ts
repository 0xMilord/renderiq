import { AISDKService } from '@/lib/services/ai-sdk-service';
import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/utils/logger';
import { validatePrompt, sanitizeInput, isAllowedOrigin, getSafeErrorMessage, securityLog } from '@/lib/utils/security';
import { rateLimitMiddleware } from '@/lib/utils/rate-limit';

/**
 * Google Generative AI Image Generation API Route
 * Security: Input validation, rate limiting, origin checking
 */
export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const rateLimit = rateLimitMiddleware(request, { maxRequests: 50, windowMs: 60000 });
    if (!rateLimit.allowed) {
      return rateLimit.response!;
    }

    // Check origin (if provided)
    const origin = request.headers.get('origin');
    if (origin && !isAllowedOrigin(origin)) {
      securityLog('unauthorized_origin', { origin }, 'warn');
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const { prompt, style, quality, aspectRatio, negativePrompt, seed } = body;

    // Validate prompt
    const promptValidation = validatePrompt(prompt);
    if (!promptValidation.valid) {
      securityLog('invalid_prompt', { error: promptValidation.error }, 'warn');
      return NextResponse.json(
        { success: false, error: promptValidation.error || 'Invalid prompt' },
        { status: 400 }
      );
    }

    const sanitizedPrompt = promptValidation.sanitized!;

    // Sanitize other inputs
    const sanitizedStyle = sanitizeInput(style || 'realistic');
    const sanitizedQuality = sanitizeInput(quality || 'high');
    const sanitizedAspectRatio = sanitizeInput(aspectRatio || '16:9');
    const sanitizedNegativePrompt = negativePrompt ? sanitizeInput(negativePrompt) : undefined;

    logger.log('🎨 AI Image: Starting image generation', {
      prompt: sanitizedPrompt.substring(0, 100) + '...',
      style: sanitizedStyle,
      quality: sanitizedQuality,
      aspectRatio: sanitizedAspectRatio
    });

    const aiService = AISDKService.getInstance();
    const result = await aiService.generateImage({
      prompt: sanitizedPrompt,
      aspectRatio: sanitizedAspectRatio,
      negativePrompt: sanitizedNegativePrompt,
      seed: typeof seed === 'number' ? seed : undefined
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

    logger.log('✅ AI Image: Generation successful', {
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
    securityLog('image_generation_error', { error: getSafeErrorMessage(error) }, 'error');
    logger.error('❌ AI Image: Generation failed', error);
    
    // Never expose internal errors
    return NextResponse.json(
      { 
        success: false,
        error: 'Image generation failed. Please try again.' 
      },
      { status: 500 }
    );
  }
}
