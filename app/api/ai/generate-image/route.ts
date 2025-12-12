import { AISDKService } from '@/lib/services/ai-sdk-service';
import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/utils/logger';
import { validatePrompt, sanitizeInput, getSafeErrorMessage, securityLog } from '@/lib/utils/security';
import { withPublicApiRoute } from '@/lib/middleware/api-route';
import * as Sentry from '@sentry/nextjs';

/**
 * Google Generative AI Image Generation API Route
 * Migrated to unified middleware: CORS, rate limiting, error handling
 */
export const POST = withPublicApiRoute(
  async ({ request }) => {
    const body = await request.json().catch(() => ({}));
    const { prompt, style, quality, aspectRatio, negativePrompt, seed, uploadedImageData, uploadedImageType } = body;

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
      seed: typeof seed === 'number' ? seed : undefined,
      uploadedImageData: uploadedImageData || undefined,
      uploadedImageType: uploadedImageType || undefined,
    });

    if (!result.success || !result.data) {
      return NextResponse.json(
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

    return NextResponse.json({
      success: true,
      data: {
        imageUrl: imageUrl,
        url: imageUrl, // Alias for compatibility
        processingTime: result.data.processingTime,
        provider: result.data.provider,
        metadata: result.data.metadata
      }
    });
  },
  {
    enableCORS: true,
    enableRateLimit: true,
    rateLimitConfig: { maxRequests: 50, windowMs: 60000 },
    routeName: 'POST /api/ai/generate-image',
    onError: (error, request) => {
      securityLog('image_generation_error', { error: getSafeErrorMessage(error) }, 'error');
      Sentry.setContext('ai_image_generation', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return null; // Use default error handler
    }
  }
);
