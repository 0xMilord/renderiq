import { NextRequest, NextResponse } from 'next/server';
import { getCachedUser } from '@/lib/services/auth-cache';
import { AISDKService } from '@/lib/services/ai-sdk-service';
import { addCredits, deductCredits } from '@/lib/actions/billing.actions';
import { BillingDAL } from '@/lib/dal/billing';
import { ProjectsDAL } from '@/lib/dal/projects';
import { RendersDAL } from '@/lib/dal/renders';
import { RenderChainsDAL } from '@/lib/dal/render-chains';
import { RenderChainService } from '@/lib/services/render-chain';
import { ProjectRulesDAL } from '@/lib/dal/project-rules';
import { StorageService } from '@/lib/services/storage';
import { PlanLimitsService } from '@/lib/services/plan-limits.service';
import { logger } from '@/lib/utils/logger';
import * as Sentry from '@sentry/nextjs';
import { setTransactionName, withDatabaseSpan, withAIOperationSpan, withFileOperationSpan } from '@/lib/utils/sentry-performance';
import { trackRenderStarted, trackRenderCompleted, trackRenderFailed, trackRenderCreditsCost, trackApiResponseTime, trackApiError } from '@/lib/utils/sentry-metrics';
import { 
  validatePrompt, 
  sanitizeInput, 
  isAllowedOrigin, 
  getSafeErrorMessage, 
  securityLog,
  isValidUUID,
  isValidImageType,
  isValidFileSize,
  redactSensitive
} from '@/lib/utils/security';
import { rateLimitMiddleware } from '@/lib/utils/rate-limit';

const aiService = AISDKService.getInstance();

// Configure route to handle large body sizes (for image uploads)
export const runtime = 'nodejs';
export const maxDuration = 300; // 5 minutes for video generation

// ✅ FIXED: Top-level error handler wrapper to ensure we always return a response
export async function handleRenderRequest(request: NextRequest) {
  let creditsCost: number | undefined;
  let user: { id: string } | null = null;
  const startTime = Date.now();
  let renderType: 'image' | 'video' = 'image';
  let renderStyle: string = '';
  let renderQuality: string = '';
  
  // Set transaction name for better organization in Sentry
  setTransactionName('POST /api/renders');
  
  try {
    // Rate limiting
    const rateLimit = rateLimitMiddleware(request, { maxRequests: 30, windowMs: 60000 });
    if (!rateLimit.allowed) {
      return rateLimit.response!;
    }

    // Check origin (only if provided - optimized for performance)
    const origin = request.headers.get('origin');
    if (origin && !isAllowedOrigin(origin)) {
      securityLog('unauthorized_origin', { origin }, 'warn');
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }
    // Note: Requests without origin header are allowed (same-origin or direct API calls)

    logger.log('🚀 Starting render generation API call');
    
    // ✅ FIXED: Check request size before parsing to prevent 413 errors
    const contentLength = request.headers.get('content-length');
    if (contentLength) {
      const sizeInBytes = parseInt(contentLength, 10);
      const maxSizeBytes = 4.5 * 1024 * 1024; // 4.5MB (Vercel Hobby limit) - adjust for your plan
      
      if (sizeInBytes > maxSizeBytes) {
        const sizeInMB = (sizeInBytes / (1024 * 1024)).toFixed(2);
        logger.error(`❌ Request too large: ${sizeInMB}MB (max: ${(maxSizeBytes / (1024 * 1024)).toFixed(2)}MB)`);
        return NextResponse.json({ 
          success: false, 
          error: `Request payload too large (${sizeInMB}MB). Maximum allowed size is ${(maxSizeBytes / (1024 * 1024)).toFixed(2)}MB. Please reduce image size or use image compression.`,
          code: 'PAYLOAD_TOO_LARGE'
        }, { status: 413 });
      }
    }
    
    // ✅ FIXED: Wrap auth and formData parsing in try-catch to handle early errors
    // Support Bearer token auth for plugins
    try {
      // Check for Bearer token in Authorization header
      const authHeader = request.headers.get('authorization');
      let bearerToken: string | undefined;
      
      if (authHeader && authHeader.startsWith('Bearer ')) {
        bearerToken = authHeader.substring(7);
      }
      
      const { user: authUser } = await getCachedUser(bearerToken);
      
      if (!authUser) {
        securityLog('auth_failed', { error: 'Authentication required' }, 'warn');
        return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
      }
      
      user = authUser;
      
      // Redact user ID in logs
      logger.log('✅ User authenticated');
    } catch (authError) {
      logger.error('❌ Auth error:', authError);
      return NextResponse.json({ 
        success: false, 
        error: 'Authentication failed' 
      }, { status: 401 });
    }

    // ✅ FIXED: Wrap formData parsing in try-catch with better error handling for 413
    let formData: FormData;
    try {
      formData = await request.formData();
    } catch (formDataError: any) {
      const errorMessage = formDataError?.message || String(formDataError);
      
      // Handle 413 Payload Too Large specifically
      if (errorMessage.includes('413') || errorMessage.includes('Payload Too Large') || errorMessage.includes('FUNCTION_PAYLOAD_TOO_LARGE')) {
        logger.error('❌ Request payload too large (413):', errorMessage);
        return NextResponse.json({ 
          success: false, 
          error: 'Request payload too large. Maximum allowed size is 4.5MB. Please reduce image size or use image compression.',
          code: 'PAYLOAD_TOO_LARGE'
        }, { status: 413 });
      }
      
      logger.error('❌ FormData parsing error:', formDataError);
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid request format' 
      }, { status: 400 });
    }
    
    // Validate and sanitize all inputs
    const promptRaw = formData.get('prompt') as string;
    const promptValidation = validatePrompt(promptRaw);
    if (!promptValidation.valid) {
      securityLog('invalid_prompt', { error: promptValidation.error }, 'warn');
      return NextResponse.json({ success: false, error: promptValidation.error || 'Invalid prompt' }, { status: 400 });
    }
    const prompt = promptValidation.sanitized!;
    
    const style = sanitizeInput(formData.get('style') as string);
    const quality = sanitizeInput(formData.get('quality') as string) as 'standard' | 'high' | 'ultra';
    const aspectRatio = sanitizeInput(formData.get('aspectRatio') as string);
    
    // Validate type
    const typeParam = sanitizeInput(formData.get('type') as string);
    const type = (typeParam === 'video' ? 'video' : 'image') as 'image' | 'video';
    
    // Store for metrics tracking
    renderType = type;
    renderStyle = style;
    renderQuality = quality;
    
    const uploadedImageData = formData.get('uploadedImageData') as string | null;
    const uploadedImageType = formData.get('uploadedImageType') as string | null;
    // ✅ FIX CORS: Support uploadedImageUrl for gallery images (fetched server-side to avoid CORS)
    const uploadedImageUrlParam = formData.get('uploadedImageUrl') as string | null;
    
    // Validate image type if provided
    if (uploadedImageType && !isValidImageType(uploadedImageType)) {
      securityLog('invalid_image_type', { type: uploadedImageType }, 'warn');
      return NextResponse.json({ success: false, error: 'Invalid image type' }, { status: 400 });
    }
    
    const projectIdRaw = formData.get('projectId') as string;
    if (!projectIdRaw || !isValidUUID(projectIdRaw)) {
      securityLog('invalid_project_id', {}, 'warn');
      return NextResponse.json({ success: false, error: 'Invalid project ID' }, { status: 400 });
    }
    const projectId = projectIdRaw;
    
    const chainIdRaw = formData.get('chainId') as string | null;
    const chainId = chainIdRaw && isValidUUID(chainIdRaw) ? chainIdRaw : null;
    
    const referenceRenderIdRaw = formData.get('referenceRenderId') as string | null;
    const referenceRenderId = referenceRenderIdRaw && isValidUUID(referenceRenderIdRaw) ? referenceRenderIdRaw : null;
    
    const negativePromptRaw = formData.get('negativePrompt') as string | null;
    const negativePrompt = negativePromptRaw ? sanitizeInput(negativePromptRaw) : null;
    
    const imageType = sanitizeInput(formData.get('imageType') as string | null);
    
    // Extract telemetry metadata for plugin tracking
    const sourcePlatform = sanitizeInput(formData.get('sourcePlatform') as string | null);
    const pluginVersion = sanitizeInput(formData.get('pluginVersion') as string | null);
    const userAgent = sanitizeInput(formData.get('userAgent') as string | null);
    const callbackUrl = sanitizeInput(formData.get('callback_url') as string | null);
    
    // Build metadata object if any telemetry fields present
    const metadata = (sourcePlatform || pluginVersion || userAgent || callbackUrl) ? {
      ...(sourcePlatform && { sourcePlatform }),
      ...(pluginVersion && { pluginVersion }),
      ...(userAgent && { userAgent }),
      ...(callbackUrl && { callbackUrl }),
    } : undefined;
    
    // Check if user has pro subscription
    const isPro = await BillingDAL.isUserPro(user.id);
    
    // Get privacy preference from formData (user's choice from UI)
    const isPublicParam = formData.get('isPublic') as string | null;
    let isPublic: boolean;
    
    if (isPro) {
      // Pro users can choose: respect their choice from UI
      isPublic = isPublicParam === 'true' || isPublicParam === null; // Default to public if not specified
    } else {
      // Free users: always public (can't make private)
      isPublic = true;
    }
    
    logger.log(`📸 Render visibility: ${isPublic ? 'PUBLIC' : 'PRIVATE'} (User is ${isPro ? 'PRO' : 'FREE'}, Choice: ${isPublicParam})`);
    
    const seedParam = formData.get('seed') as string | null;
    const seed = seedParam ? parseInt(seedParam) : undefined;
    if (seed && (isNaN(seed) || seed < 0 || seed > 2147483647)) {
      return NextResponse.json({ success: false, error: 'Invalid seed value' }, { status: 400 });
    }
    
    const versionContextData = formData.get('versionContext') as string | null;
    const environment = sanitizeInput(formData.get('environment') as string | null);
    const effect = sanitizeInput(formData.get('effect') as string | null);
    // Support both styleTransferImageData (from chat) and styleReferenceImageData (from tools)
    const styleTransferImageData = formData.get('styleTransferImageData') as string | null || formData.get('styleReferenceImageData') as string | null;
    const styleTransferImageType = formData.get('styleTransferImageType') as string | null || formData.get('styleReferenceImageType') as string | null;
    
    if (styleTransferImageType && !isValidImageType(styleTransferImageType)) {
      securityLog('invalid_style_image_type', { type: styleTransferImageType }, 'warn');
      return NextResponse.json({ success: false, error: 'Invalid style image type' }, { status: 400 });
    }
    
    const temperatureParam = formData.get('temperature') as string | null;
    const model = sanitizeInput(formData.get('model') as string | null);
    const temperature = temperatureParam ? parseFloat(temperatureParam) : 0.7;
    if (isNaN(temperature) || temperature < 0 || temperature > 2) {
      return NextResponse.json({ success: false, error: 'Invalid temperature value' }, { status: 400 });
    }
    
    // Validate model + quality combination if model is specified
    if (model && type === 'image') {
      const { getModelConfig, modelSupportsQuality, getMaxQuality } = await import('@/lib/config/models');
      const modelConfig = getModelConfig(model as any);
      if (modelConfig && modelConfig.type === 'image') {
        if (!modelSupportsQuality(model as any, quality)) {
          const maxQuality = getMaxQuality(model as any);
          return NextResponse.json({ 
            success: false, 
            error: `Quality "${quality}" is not supported by model "${model}". Maximum supported quality: ${maxQuality}` 
          }, { status: 400 });
        }
      }
    }
    
    const durationParam = formData.get('duration') as string | null;
    const duration = durationParam ? parseInt(durationParam) : (type === 'video' ? 8 : undefined);
    if (duration && (isNaN(duration) || duration < 1 || duration > 60)) {
      return NextResponse.json({ success: false, error: 'Invalid duration value' }, { status: 400 });
    }
    const videoDuration = type === 'video' ? (duration || 8) : undefined;

    // Log parameters with redacted sensitive info
    logger.log('📝 Render parameters:', redactSensitive({ 
      prompt: prompt.substring(0, 50) + '...',
      style, 
      quality, 
      aspectRatio, 
      type, 
      imageType,
      negativePrompt: negativePrompt ? 'provided' : 'none',
      hasImage: !!uploadedImageData, 
      projectId: projectId.substring(0, 8) + '...',
      hasChainId: !!chainId,
      hasReferenceRenderId: !!referenceRenderId,
      isPublic,
      hasSeed: !!seed,
      duration: duration || 'N/A'
    }));

    if (!prompt || !style || !quality || !aspectRatio || !type || !projectId) {
      logger.warn('❌ Missing required parameters');
      return NextResponse.json({ success: false, error: 'Missing required parameters' }, { status: 400 });
    }

    // Check if this is a batch request (for images only)
    const useBatchAPI = type === 'image' ? formData.get('useBatchAPI') === 'true' : false;
    let batchRequests: Array<{ key: string; prompt: string; drawingType?: string; elevationSide?: string; floorPlanType?: string; sectionCutDirection?: string }> = [];
    
    if (useBatchAPI) {
      const batchRequestsStr = formData.get('batchRequests') as string | null;
      logger.log('📦 Batch API flag detected, parsing batchRequests:', { 
        hasBatchRequestsStr: !!batchRequestsStr,
        batchRequestsStrLength: batchRequestsStr?.length || 0
      });
      if (batchRequestsStr) {
        try {
          batchRequests = JSON.parse(batchRequestsStr);
          logger.log('📦 Batch request parsed successfully:', { 
            numberOfRequests: batchRequests.length, 
            batchKeys: batchRequests.map((r: any) => r.key),
            isArray: Array.isArray(batchRequests)
          });
        } catch (e) {
          logger.warn('❌ Failed to parse batchRequests:', e);
          logger.warn('Batch requests string:', batchRequestsStr.substring(0, 200));
        }
      } else {
        logger.warn('⚠️ useBatchAPI is true but batchRequests is missing from formData');
      }
    } else {
      logger.log('📝 Single request mode (useBatchAPI=false or type!=image)');
    }

    // Calculate credits cost FIRST using model-based pricing
    // Import model config for credit calculation
    const { getModelConfig, getDefaultModel } = await import('@/lib/config/models');
    
    if (type === 'video') {
      // Get model config or use default
      const videoModelId = model || getDefaultModel('video').id;
      const modelConfig = getModelConfig(videoModelId as any);
      
      if (!modelConfig || modelConfig.type !== 'video') {
        logger.warn('⚠️ Invalid video model, using default');
        const defaultModel = getDefaultModel('video');
        creditsCost = defaultModel.calculateCredits({ duration: videoDuration });
      } else {
        creditsCost = modelConfig.calculateCredits({ duration: videoDuration });
      }
      
      logger.log('💰 Video credits cost calculation:', {
        model: videoModelId,
        duration: videoDuration,
        totalCredits: creditsCost
      });
    } else {
      // Image generation: Use model-based pricing
      const imageModelId = model || getDefaultModel('image').id;
      const modelConfig = getModelConfig(imageModelId as any);
      
      if (!modelConfig || modelConfig.type !== 'image') {
        logger.warn('⚠️ Invalid image model, using default');
        const defaultModel = getDefaultModel('image');
        const imageSize = quality === 'ultra' ? '4K' : quality === 'high' ? '2K' : '1K';
        creditsCost = defaultModel.calculateCredits({ quality, imageSize });
      } else {
        const imageSize = quality === 'ultra' ? '4K' : quality === 'high' ? '2K' : '1K';
        creditsCost = modelConfig.calculateCredits({ quality, imageSize });
      }
      
      // For batch: multiply by number of requests
      const numberOfRequests = useBatchAPI && batchRequests.length > 0 ? batchRequests.length : 1;
      creditsCost = creditsCost * numberOfRequests;
      
      logger.log('💰 Image credits cost calculation:', {
        model: imageModelId,
        quality,
        imageSize: quality === 'ultra' ? '4K' : quality === 'high' ? '2K' : '1K',
        numberOfRequests: useBatchAPI ? numberOfRequests : 1,
        isBatch: useBatchAPI,
        totalCredits: creditsCost
      });
    }
    
    // Track render started and credits cost
    if (creditsCost) {
      trackRenderStarted(renderType, renderStyle, renderQuality);
      trackRenderCreditsCost(renderType, renderQuality, creditsCost);
    }

    // ✅ CHECK LIMIT: Verify user can use this quality level
    if (quality !== 'standard') {
      const qualityLimitCheck = await PlanLimitsService.checkQualityLimit(user.id, quality);
      if (!qualityLimitCheck.allowed) {
        logger.warn('❌ Quality limit check failed:', qualityLimitCheck);
        return NextResponse.json({
          success: false,
          error: qualityLimitCheck.error || 'Quality level not available',
          limitReached: true,
          limitType: qualityLimitCheck.limitType,
          current: qualityLimitCheck.current,
          limit: qualityLimitCheck.limit,
          planName: qualityLimitCheck.planName,
        }, { status: 403 });
      }
    }

    // ✅ CHECK LIMIT: Verify user can generate videos
    if (type === 'video') {
      const videoLimitCheck = await PlanLimitsService.checkVideoLimit(user.id);
      if (!videoLimitCheck.allowed) {
        logger.warn('❌ Video limit check failed:', videoLimitCheck);
        return NextResponse.json({
          success: false,
          error: videoLimitCheck.error || 'Video generation not available',
          limitReached: true,
          limitType: videoLimitCheck.limitType,
          current: videoLimitCheck.current,
          limit: videoLimitCheck.limit,
          planName: videoLimitCheck.planName,
        }, { status: 403 });
      }
    }

    // ✅ CHECK LIMIT: Verify user can create more renders in this project
    const renderLimitCheck = await PlanLimitsService.checkRenderLimit(user.id, projectId);
    if (!renderLimitCheck.allowed) {
      logger.warn('❌ Render limit check failed:', renderLimitCheck);
      return NextResponse.json({
        success: false,
        error: renderLimitCheck.error || 'Render limit reached',
        limitReached: true,
        limitType: renderLimitCheck.limitType,
        current: renderLimitCheck.current,
        limit: renderLimitCheck.limit,
        planName: renderLimitCheck.planName,
      }, { status: 403 });
    }

    // ✅ CHECK LIMIT: Verify user has enough credits
    const creditsLimitCheck = await PlanLimitsService.checkCreditsLimit(user.id, creditsCost);
    if (!creditsLimitCheck.allowed) {
      logger.warn('❌ Credits limit check failed:', creditsLimitCheck);
      return NextResponse.json({
        success: false,
        error: creditsLimitCheck.error || 'Insufficient credits',
        limitReached: true,
        limitType: creditsLimitCheck.limitType,
        current: creditsLimitCheck.current,
        limit: creditsLimitCheck.limit,
        planName: creditsLimitCheck.planName,
      }, { status: 402 });
    }

    // Only proceed with deduction if balance check passes
    const deductResult = await deductCredits(
      creditsCost,
      `Generated ${type} - ${style} style`,
      undefined,
      'render'
    );

    if (!deductResult.success) {
      const errorMessage = 'error' in deductResult ? deductResult.error : 'Failed to deduct credits';
      logger.warn('❌ Credit deduction failed after balance check:', errorMessage);
      return NextResponse.json({ success: false, error: errorMessage }, { status: 402 });
    }

    // ✅ OPTIMIZED: Verify project exists and belongs to user
    const project = await ProjectsDAL.getById(projectId);
    if (!project || project.userId !== user.id) {
      logger.warn('❌ Project not found or access denied');
      return NextResponse.json({ success: false, error: 'Project not found or access denied' }, { status: 403 });
    }

    // ✅ CENTRALIZED: Get or create chain for this project using centralized service
    let finalChainId = chainId;
    
    if (!finalChainId) {
      logger.log('🔗 No chain specified, getting or creating default chain');
      const defaultChain = await RenderChainService.getOrCreateDefaultChain(
        projectId,
        project?.name
      );
      finalChainId = defaultChain.id;
    } else {
      logger.log('🔗 Using chain from request:', finalChainId);
    }

    // ✅ OPTIMIZED: Parallelize chain position and project rules fetching (they're independent)
    const [chainPosition, activeRules] = await Promise.all([
      RenderChainService.getNextChainPosition(finalChainId),
      finalChainId ? ProjectRulesDAL.getActiveRulesByChainId(finalChainId).catch(() => []) : Promise.resolve([])
    ]);

    logger.log('📍 Chain position:', chainPosition);

    // Validate reference render ID if provided and fetch its image for context
    let validatedReferenceRenderId: string | undefined = undefined;
    let referenceRenderImageData: string | undefined = undefined;
    let referenceRenderImageType: string | undefined = undefined;
    let referenceRenderPrompt: string | undefined = undefined;
    
    if (referenceRenderId) {
      // Handle temporary render IDs (generated by frontend before DB persistence)
      if (referenceRenderId.startsWith('temp-')) {
        logger.log('⚠️ Temporary reference render ID detected, using most recent render in chain:', referenceRenderId);
        // Use the most recent completed render in the chain as reference
        const chainRenders = await RendersDAL.getByChainId(finalChainId);
        if (chainRenders.length > 0) {
          const mostRecentRender = chainRenders
            .filter(r => r.status === 'completed')
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
          
          if (mostRecentRender) {
            validatedReferenceRenderId = mostRecentRender.id;
            logger.log('✅ Using most recent completed render as reference:', validatedReferenceRenderId);
            // Fetch the reference render's image with timeout
            if (mostRecentRender.outputUrl) {
              try {
                logger.log('📥 Fetching reference render image:', mostRecentRender.outputUrl);
                let imageUrl = mostRecentRender.outputUrl;
                
                // ✅ OPTIMIZED: Add timeout to prevent blocking (5 seconds max)
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 5000);
                
                try {
                  let imageResponse = await fetch(imageUrl, { signal: controller.signal });
                  
                  // Check if response is valid (not an error XML)
                  const contentType = imageResponse.headers.get('content-type') || '';
                  const isErrorResponse = !imageResponse.ok || 
                                         contentType.includes('xml') || 
                                         contentType.includes('text/html') ||
                                         (await imageResponse.clone().text()).trim().startsWith('<');
                  
                  // If CDN fails, try direct GCS fallback (with timeout)
                  if (isErrorResponse && imageUrl.includes('cdn.renderiq.io')) {
                    logger.log('⚠️ CDN fetch failed, trying direct GCS fallback...');
                    imageUrl = imageUrl.replace('cdn.renderiq.io', 'storage.googleapis.com');
                    clearTimeout(timeoutId);
                    const fallbackController = new AbortController();
                    const fallbackTimeout = setTimeout(() => fallbackController.abort(), 5000);
                    try {
                      imageResponse = await fetch(imageUrl, { signal: fallbackController.signal });
                    } finally {
                      clearTimeout(fallbackTimeout);
                    }
                  }
                  
                  if (!imageResponse.ok) {
                    throw new Error(`HTTP ${imageResponse.status}: ${imageResponse.statusText}`);
                  }
                  
                  const imageBuffer = await imageResponse.arrayBuffer();
                  const imageSize = imageBuffer.byteLength;
                  
                  // Validate it's actually an image (not error XML - should be > 1KB for real images)
                  if (imageSize < 1024) {
                    const text = new TextDecoder().decode(imageBuffer);
                    if (text.trim().startsWith('<') || text.includes('<Error>')) {
                      throw new Error('Received error XML instead of image');
                    }
                  }
                  
                  referenceRenderImageData = Buffer.from(imageBuffer).toString('base64');
                  referenceRenderImageType = mostRecentRender.outputUrl.includes('.png') ? 'image/png' : 
                                            mostRecentRender.outputUrl.includes('.jpg') || mostRecentRender.outputUrl.includes('.jpeg') ? 'image/jpeg' : 
                                            'image/png';
                  referenceRenderPrompt = mostRecentRender.prompt;
                  logger.log('✅ Reference render image fetched, size:', imageSize, 'bytes, from:', imageUrl.includes('cdn.renderiq.io') ? 'CDN' : 'Direct GCS');
                } catch (fetchError: any) {
                  if (fetchError.name === 'AbortError') {
                    logger.warn('⚠️ Image fetch timeout (5s), continuing without reference image');
                  } else {
                    throw fetchError;
                  }
                } finally {
                  clearTimeout(timeoutId);
                }
              } catch (error) {
                logger.error('❌ Failed to fetch reference render image:', error);
                logger.log('⚠️ Continuing without reference image - generation may not use reference');
              }
            }
          } else {
            logger.log('⚠️ No completed renders found in chain, will generate new image');
          }
        }
      } else {
        logger.log('🔍 Validating reference render ID:', referenceRenderId);
        try {
          const referenceRender = await RendersDAL.getById(referenceRenderId);
          if (referenceRender && referenceRender.status === 'completed') {
            validatedReferenceRenderId = referenceRenderId;
            logger.log('✅ Reference render validated:', referenceRenderId);
                // Fetch the reference render's image with timeout
                if (referenceRender.outputUrl) {
              try {
                logger.log('📥 Fetching reference render image:', referenceRender.outputUrl);
                let imageUrl = referenceRender.outputUrl;
                
                // ✅ OPTIMIZED: Add timeout to prevent blocking (5 seconds max)
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 5000);
                
                try {
                  let imageResponse = await fetch(imageUrl, { signal: controller.signal });
                  
                  // Check if response is valid (not an error XML)
                  const contentType = imageResponse.headers.get('content-type') || '';
                  const isErrorResponse = !imageResponse.ok || 
                                         contentType.includes('xml') || 
                                         contentType.includes('text/html') ||
                                         (await imageResponse.clone().text()).trim().startsWith('<');
                  
                  // If CDN fails, try direct GCS fallback (with timeout)
                  if (isErrorResponse && imageUrl.includes('cdn.renderiq.io')) {
                    logger.log('⚠️ CDN fetch failed, trying direct GCS fallback...');
                    imageUrl = imageUrl.replace('cdn.renderiq.io', 'storage.googleapis.com');
                    clearTimeout(timeoutId);
                    const fallbackController = new AbortController();
                    const fallbackTimeout = setTimeout(() => fallbackController.abort(), 5000);
                    try {
                      imageResponse = await fetch(imageUrl, { signal: fallbackController.signal });
                    } finally {
                      clearTimeout(fallbackTimeout);
                    }
                  }
                  
                  if (!imageResponse.ok) {
                    throw new Error(`HTTP ${imageResponse.status}: ${imageResponse.statusText}`);
                  }
                  
                  const imageBuffer = await imageResponse.arrayBuffer();
                  const imageSize = imageBuffer.byteLength;
                  
                  // Validate it's actually an image (not error XML - should be > 1KB for real images)
                  if (imageSize < 1024) {
                    const text = new TextDecoder().decode(imageBuffer);
                    if (text.trim().startsWith('<') || text.includes('<Error>')) {
                      throw new Error('Received error XML instead of image');
                    }
                  }
                  
                  referenceRenderImageData = Buffer.from(imageBuffer).toString('base64');
                  referenceRenderImageType = referenceRender.outputUrl.includes('.png') ? 'image/png' : 
                                            referenceRender.outputUrl.includes('.jpg') || referenceRender.outputUrl.includes('.jpeg') ? 'image/jpeg' : 
                                            'image/png';
                  referenceRenderPrompt = referenceRender.prompt;
                  logger.log('✅ Reference render image fetched, size:', imageSize, 'bytes, from:', imageUrl.includes('cdn.renderiq.io') ? 'CDN' : 'Direct GCS');
                } catch (fetchError: any) {
                  if (fetchError.name === 'AbortError') {
                    logger.warn('⚠️ Image fetch timeout (5s), continuing without reference image');
                  } else {
                    throw fetchError;
                  }
                } finally {
                  clearTimeout(timeoutId);
                }
              } catch (error) {
                logger.error('❌ Failed to fetch reference render image:', error);
                logger.log('⚠️ Continuing without reference image - generation may not use reference');
              }
            }
          } else {
            logger.log('⚠️ Reference render not found or not completed, ignoring reference');
          }
        } catch (error) {
          logger.log('⚠️ Error validating reference render, ignoring reference:', error);
        }
      }
    }

    // ✅ OPTIMIZED: Project rules already fetched in parallel above, append to prompt if available
    let finalPrompt = prompt;
    if (activeRules.length > 0) {
      const rulesText = activeRules.map(r => r.rule).join('. ');
      finalPrompt = `${prompt}. Project rules: ${rulesText}`;
      logger.log('📋 Project rules appended to prompt:', {
        rulesCount: activeRules.length,
        promptLength: finalPrompt.length
      });
    }

    // Upload original image if provided
    let uploadedImageUrl: string | undefined = undefined;
    let uploadedImageKey: string | undefined = undefined;
    let uploadedImageId: string | undefined = undefined;

    // ✅ FIX CORS: If uploadedImageUrl is provided (from gallery), fetch it server-side and convert to base64
    let finalUploadedImageData = uploadedImageData;
    let finalUploadedImageType = uploadedImageType;
    
    if (uploadedImageUrlParam && !uploadedImageData) {
      logger.log('📥 Fetching image from URL (server-side to avoid CORS):', uploadedImageUrlParam);
      try {
        const imageResponse = await fetch(uploadedImageUrlParam);
        if (!imageResponse.ok) {
          throw new Error(`Failed to fetch image: ${imageResponse.status} ${imageResponse.statusText}`);
        }
        const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());
        const contentType = imageResponse.headers.get('content-type') || 'image/png';
        finalUploadedImageData = imageBuffer.toString('base64');
        finalUploadedImageType = contentType;
        logger.log('✅ Image fetched and converted to base64:', {
          size: imageBuffer.length,
          type: contentType
        });
      } catch (error) {
        logger.error('❌ Failed to fetch image from URL:', error);
        // Continue without uploaded image rather than failing the entire request
        finalUploadedImageData = null;
        finalUploadedImageType = null;
      }
    }

    if (finalUploadedImageData && finalUploadedImageType) {
      logger.log('📤 Uploading original image to storage');
      try {
        const buffer = Buffer.from(finalUploadedImageData, 'base64');
        const uploadedImageFile = new File([buffer], `upload_${Date.now()}.${finalUploadedImageType.split('/')[1] || 'png'}`, { type: finalUploadedImageType });
        
        const uploadResult = await StorageService.uploadFile(
          uploadedImageFile,
          'uploads',
          user.id,
          undefined,
          project.slug
        );

        uploadedImageUrl = uploadResult.url;
        uploadedImageKey = uploadResult.key;
        uploadedImageId = uploadResult.id;
        
        logger.log('✅ Original image uploaded:', uploadResult.url);
      } catch (error) {
        logger.error('❌ Failed to upload original image:', error);
        // Continue without uploaded image rather than failing the entire request
      }
    } else if (uploadedImageUrlParam) {
      // If URL was provided but we couldn't fetch it, use the URL directly
      // This handles cases where the image is already in our storage
      logger.log('📎 Using provided image URL directly:', uploadedImageUrlParam);
      uploadedImageUrl = uploadedImageUrlParam;
    }

    // Handle batch requests - process multiple renders
    // CRITICAL: This check must happen BEFORE single render creation
    // CRITICAL: Each batch request has its own isolated, specific prompt - do NOT modify or combine them
    // Supports unlimited batch size (tested with 8+ drawings: 2 floor plans + 4 elevations + 2 sections)
    // Sequential processing ensures stability, maxDuration (5 min) should accommodate 8+ requests
    if (useBatchAPI && batchRequests.length > 0 && type === 'image') {
      logger.log('📦 Processing batch request - ENTERING BATCH MODE:', { 
        count: batchRequests.length,
        batchKeys: batchRequests.map(r => r.key),
        batchDrawingTypes: batchRequests.map(r => `${r.drawingType}${r.elevationSide ? `-${r.elevationSide}` : ''}`),
        type,
        useBatchAPI
      });
      
      // Verify each batch request has its own unique, isolated prompt
      batchRequests.forEach((req, idx) => {
        logger.log(`📋 Batch request ${idx + 1}/${batchRequests.length} - VERIFYING ISOLATION:`, {
          key: req.key,
          drawingType: req.drawingType,
          elevationSide: req.elevationSide,
          promptLength: req.prompt.length,
          promptStartsWith: req.prompt.substring(0, 100),
          // Verify prompt contains only the specific drawing type
          containsFloorPlan: req.prompt.includes('floor plan') && req.drawingType === 'floor-plan',
          containsSection: req.prompt.includes('section') && req.drawingType === 'section',
          containsElevation: req.prompt.includes('elevation') && req.drawingType === 'elevation',
        });
      });
      
      const batchResults: Array<{ renderId: string; outputUrl: string; label?: string }> = [];
      let currentChainPosition = chainPosition;
      
      // Process each batch request sequentially - each with its OWN isolated prompt
      // DO NOT modify, combine, or append to batchRequest.prompt - use it AS IS
      for (const batchRequest of batchRequests) {
        try {
          // CRITICAL: Use ONLY batchRequest.prompt - this is already specific to this drawing type/elevation side
          // DO NOT use finalPrompt, DO NOT append project rules, DO NOT combine with other prompts
          const isolatedPrompt = batchRequest.prompt; // This is the ONLY prompt for this specific request
          
          // Create render record for this batch item
          const batchRender = await RendersDAL.create({
            projectId,
            userId: user.id,
            type,
            prompt: isolatedPrompt, // Use the isolated, specific prompt
            settings: {
              style,
              quality,
              aspectRatio,
              ...(imageType && { imageType }),
              ...(negativePrompt && { negativePrompt }),
              ...(environment && { environment }),
              ...(effect && { effect }),
              ...(batchRequest.drawingType && { drawingType: batchRequest.drawingType }),
              ...(batchRequest.elevationSide && { elevationSide: batchRequest.elevationSide }),
              ...(batchRequest.floorPlanType && { floorPlanType: batchRequest.floorPlanType }),
              ...(batchRequest.sectionCutDirection && { sectionCutDirection: batchRequest.sectionCutDirection }),
            },
            status: 'pending',
            metadata,
            chainId: finalChainId,
            chainPosition: currentChainPosition++,
            referenceRenderId: validatedReferenceRenderId,
            uploadedImageUrl,
            uploadedImageKey,
            uploadedImageId,
          });

          logger.log('✅ Batch render record created:', {
            renderId: batchRender.id,
            key: batchRequest.key,
            drawingType: batchRequest.drawingType,
            elevationSide: batchRequest.elevationSide
          });

          // Update render status to processing
          await RendersDAL.updateStatus(batchRender.id, 'processing');

          // Generate image for this batch item
          const imageDataToUse = uploadedImageData || referenceRenderImageData;
          const imageTypeToUse = uploadedImageType || referenceRenderImageType;
          
          // CRITICAL: Use ONLY the isolated prompt from batchRequest - this is already specific to this drawing type/elevation side
          // DO NOT append project rules, DO NOT use finalPrompt, DO NOT combine with other prompts
          // Each batch request has its own complete, isolated prompt (floor-plan, section, or elevation-specific)
          let contextualPrompt = isolatedPrompt; // Use the isolated prompt we stored above
          const isUsingReferenceRender = !uploadedImageData && referenceRenderImageData && referenceRenderPrompt;
          
          if (isUsingReferenceRender) {
            // Only prepend reference context - do NOT modify the core prompt
            contextualPrompt = `Based on the previous render (${referenceRenderPrompt}), ${isolatedPrompt}`;
          }

          // Log the prompt to verify it's specific and isolated (not bloated with other drawing types)
          logger.log('🎨 Generating batch item with ISOLATED prompt:', { 
            key: batchRequest.key, 
            drawingType: batchRequest.drawingType,
            elevationSide: batchRequest.elevationSide,
            promptLength: contextualPrompt.length,
            promptPreview: contextualPrompt.substring(0, 150),
            // Verify prompt is specific to this drawing type only
            isIsolated: contextualPrompt.includes(batchRequest.drawingType === 'floor-plan' ? 'floor plan' : 
                                                  batchRequest.drawingType === 'section' ? 'section' : 
                                                  'elevation'),
            hasStyleReference: !!styleTransferImageData
          });

          // For batch processing, use ONLY the isolated prompt (already specific to this drawing type)
          // DO NOT use finalPrompt, DO NOT append project rules, DO NOT combine prompts
          // The style reference is passed as styleTransferImageData (inline base64 per Gemini docs)
          const batchResult = await aiService.generateImage({
            prompt: contextualPrompt, // This is the isolated, specific prompt for THIS drawing type only
            aspectRatio,
            uploadedImageData: imageDataToUse || undefined,
            uploadedImageType: imageTypeToUse || undefined,
            negativePrompt: negativePrompt || undefined,
            seed,
            environment: environment || undefined,
            effect: effect || undefined,
            styleTransferImageData: styleTransferImageData || undefined,
            styleTransferImageType: styleTransferImageType || undefined,
            temperature,
            model: model || undefined,
            imageSize: quality === 'ultra' ? '4K' : quality === 'high' ? '2K' : '1K',
          });

          if (!batchResult.success || !batchResult.data) {
            logger.error('❌ Batch item generation failed:', { key: batchRequest.key, error: batchResult.error });
            await RendersDAL.updateStatus(batchRender.id, 'failed', batchResult.error || 'Generation failed');
            continue; // Skip this item but continue with others
          }

          // Process image with watermark for free users
          let processedImageData: string | undefined = undefined;
          if (batchResult.data.imageData) {
            if (!isPro) {
              const { WatermarkService } = await import('@/lib/services/watermark');
              processedImageData = await WatermarkService.addWatermark(batchResult.data.imageData, {
                text: 'Renderiq',
                position: 'bottom-right',
                opacity: 0.5,
                useLogo: true
              });
            } else {
              processedImageData = batchResult.data.imageData;
            }
          }

          // Upload generated image
          const buffer = Buffer.from(processedImageData || batchResult.data.imageData || '', 'base64');
          const uploadResult = await StorageService.uploadFile(
            buffer,
            'renders',
            user.id,
            `render_${batchRender.id}.png`,
            project.slug
          );

          // Update render with output URL
          await RendersDAL.updateOutput(batchRender.id, uploadResult.url, uploadResult.key, 'completed', Math.round(batchResult.data.processingTime || 0));

          // Add to gallery if public
          if (isPublic) {
            await RendersDAL.addToGallery(batchRender.id, user.id, isPublic);
          }

          // Create label for this batch item
          let label = batchRequest.key;
          if (batchRequest.drawingType === 'floor-plan' && batchRequest.floorPlanType) {
            label = batchRequest.floorPlanType === 'normal-floor-plan' ? 'Normal Floor Plan' : 'Reflected Ceiling Plan';
          } else if (batchRequest.drawingType === 'elevation' && batchRequest.elevationSide) {
            label = `${batchRequest.elevationSide.charAt(0).toUpperCase() + batchRequest.elevationSide.slice(1)} Elevation`;
          } else if (batchRequest.drawingType === 'section' && batchRequest.sectionCutDirection) {
            label = `${batchRequest.sectionCutDirection.charAt(0).toUpperCase() + batchRequest.sectionCutDirection.slice(1)} Section`;
          }

          batchResults.push({
            renderId: batchRender.id,
            outputUrl: uploadResult.url,
            label
          });

          logger.log('✅ Batch item completed:', { key: batchRequest.key, renderId: batchRender.id });
        } catch (error) {
          logger.error('❌ Error processing batch item:', { key: batchRequest.key, error });
          // Continue with next item
        }
      }

      logger.log('🎉 Batch processing completed:', { successCount: batchResults.length, totalCount: batchRequests.length });

      return NextResponse.json({
        success: true,
        data: batchResults,
      });
    }

    // Single render processing (existing logic)
    // Create render record in database
    logger.log('💾 Creating render record in database', {
      projectId,
      userId: user.id,
      type,
      prompt: prompt.substring(0, 50) + '...',
      chainId: finalChainId,
      chainPosition
    });
    const render = await RendersDAL.create({
      projectId,
      userId: user.id,
      type,
      prompt,
      settings: {
        style,
        quality,
        aspectRatio,
        ...(imageType && { imageType }),
        ...(negativePrompt && { negativePrompt }),
        ...(environment && { environment }),
        ...(effect && { effect }),
      },
      status: 'pending',
      chainId: finalChainId,
      chainPosition,
      referenceRenderId: validatedReferenceRenderId,
      uploadedImageUrl,
      uploadedImageKey,
      uploadedImageId,
      metadata,
    });

    logger.log('✅ Render record created in database', {
      renderId: render.id,
      chainId: finalChainId,
      chainPosition,
      prompt: render.prompt?.substring(0, 50) + '...',
      status: render.status,
      type: render.type,
      createdAt: render.createdAt
    });

    // Update render status to processing
    await RendersDAL.updateStatus(render.id, 'processing');

    try {
      // Generate image/video
      logger.log('🎨 Starting AI generation', {
        type,
        renderId: render.id,
        prompt: prompt.substring(0, 50) + '...',
        aspectRatio,
        quality,
        hasUploadedImage: !!uploadedImageData,
        model: model || 'default'
      });
      
      let result;
      
      // Branch based on type
      if (type === 'video') {
        logger.log('🎬 Using Veo 3.1 for video generation');
        
        // Get video-specific parameters (duration already parsed above for credit calculation)
        const resolution = (formData.get('resolution') as '720p' | '1080p') || '720p';
        
        // Parse keyframes/reference images (up to 3)
        const keyframesData = formData.get('keyframes') as string | null;
        let referenceImages: Array<{ imageData: string; imageType: string }> | undefined;
        if (keyframesData) {
          try {
            const keyframes = JSON.parse(keyframesData);
            referenceImages = keyframes.slice(0, 3); // Max 3 for Veo 3.1
            logger.log('🎬 Video keyframes:', { count: referenceImages.length });
          } catch (error) {
            logger.warn('⚠️ Failed to parse keyframes:', error);
          }
        }
        
        // Parse last frame for interpolation
        const lastFrameData = formData.get('lastFrame') as string | null;
        let lastFrame: { imageData: string; imageType: string } | undefined;
        if (lastFrameData) {
          try {
            lastFrame = JSON.parse(lastFrameData);
            logger.log('🎬 Video last frame provided for interpolation');
          } catch (error) {
            logger.warn('⚠️ Failed to parse last frame:', error);
          }
        }
        
        // Use Veo 3.1 for video generation
        // videoDuration is guaranteed to be a number here since we're in the video type block
        const finalVideoDuration = videoDuration || 8;
        logger.log('🎬 Veo 3.1 parameters:', { 
          duration: finalVideoDuration, 
          aspectRatio, 
          resolution,
          hasFirstFrame: !!uploadedImageData,
          referenceImagesCount: referenceImages?.length || 0,
          hasLastFrame: !!lastFrame
        });
        const videoResult = await aiService.generateVideo({
          prompt: finalPrompt,
          duration: finalVideoDuration as 4 | 6 | 8, // Veo 3.1 supports 4, 6, or 8 seconds
          aspectRatio: (aspectRatio as '16:9' | '9:16' | '1:1') || '16:9',
          uploadedImageData: uploadedImageData || undefined,
          uploadedImageType: uploadedImageType || undefined,
          model: model || undefined,
        });
        
        if (!videoResult.success || !videoResult.data) {
          logger.error('❌ Video generation failed:', videoResult.error);
          result = {
            success: false,
            error: videoResult.error || 'Video generation failed'
          };
        } else {
          // Use videoData (base64) if available, otherwise use videoUrl
          const videoData = videoResult.data.videoData || videoResult.data.videoUrl;
          result = {
            success: true,
            data: {
              imageData: videoData, // Store as imageData for compatibility
              imageUrl: videoResult.data.videoUrl, // Also store URL
              processingTime: videoResult.data.processingTime || 60,
              provider: videoResult.data.provider || 'veo-3.1'
            }
          };
        }
        
      } else {
        // Image generation
        logger.log('🎨 Using AISDKService for image generation', {
          prompt: finalPrompt.substring(0, 100) + '...',
          aspectRatio,
          quality,
          hasUploadedImage: !!uploadedImageData,
          hasReferenceImage: !!referenceRenderImageData,
          hasStyleTransfer: !!styleTransferImageData,
          model: model || 'default',
          imageSize: quality === 'ultra' ? '4K' : quality === 'high' ? '2K' : '1K'
        });
        
        // Parse version context if provided
        let versionContext = undefined;
        if (versionContextData) {
          try {
            versionContext = JSON.parse(versionContextData);
            logger.log('🔍 Using version context for generation');
          } catch (error) {
            logger.log('⚠️ Failed to parse version context, ignoring:', error);
          }
        }

        // Smart image selection logic:
        // 1. If user uploaded a NEW image -> use it (fresh start, no reference context)
        // 2. If NO uploaded image but reference render exists -> use reference render (iterative edit)
        // 3. If neither -> generate from scratch
        const imageDataToUse = uploadedImageData || referenceRenderImageData;
        const imageTypeToUse = uploadedImageType || referenceRenderImageType;
        
        // Enhance prompt with context ONLY when using reference render (iterative edit)
        // Don't add context when user uploaded a new image (fresh start)
        let contextualPrompt = finalPrompt;
        const isUsingReferenceRender = !uploadedImageData && referenceRenderImageData && referenceRenderPrompt;
        
        if (isUsingReferenceRender) {
          // Add context about what we're editing (iterative edit scenario)
          contextualPrompt = `Based on the previous render (${referenceRenderPrompt}), ${finalPrompt}`;
          logger.log('🔗 Using contextual prompt with reference render for iterative edit:', contextualPrompt.substring(0, 100));
        } else if (uploadedImageData) {
          // User uploaded a new image - use fresh prompt without reference context
          logger.log('🆕 Using fresh prompt with new uploaded image (no reference context)');
        } else {
          // No image at all - generate from scratch
          logger.log('🎨 Generating from scratch (no image input)');
        }
        
        logger.log('🎨 Calling aiService.generateImage with parameters:', {
          promptLength: contextualPrompt.length,
          aspectRatio,
          hasUploadedImage: !!imageDataToUse,
          hasStyleTransfer: !!styleTransferImageData,
          model: model || 'default',
          imageSize: quality === 'ultra' ? '4K' : quality === 'high' ? '2K' : '1K'
        });
        
        result = await aiService.generateImage({
          prompt: contextualPrompt,
          aspectRatio,
          uploadedImageData: imageDataToUse || undefined,
          uploadedImageType: imageTypeToUse || undefined,
          negativePrompt: negativePrompt || undefined,
          seed,
          environment: environment || undefined,
          effect: effect || undefined,
          styleTransferImageData: styleTransferImageData || undefined,
          styleTransferImageType: styleTransferImageType || undefined,
          temperature,
          model: model || undefined,
          imageSize: quality === 'ultra' ? '4K' : quality === 'high' ? '2K' : '1K',
        });
        
        logger.log('🎨 aiService.generateImage completed', {
          success: result.success,
          hasData: !!result.data,
          hasError: !!result.error,
          error: result.error?.substring(0, 100)
        });
      }

      if (!result.success || !result.data) {
        logger.error('❌ Generation failed:', result.error);
        
        // Determine if this is a Google API error (should always refund)
        const errorString = (result.error || '').toLowerCase();
        const isApiKeyError = errorString.includes('api key') && 
                             (errorString.includes('expired') || 
                              errorString.includes('invalid') || 
                              errorString.includes('not found'));
        const isQuotaError = errorString.includes('quota') || 
                            errorString.includes('rate limit');
        const isGoogleError = errorString.includes('google') || 
                             errorString.includes('gemini') ||
                             errorString.includes('veo') ||
                             isApiKeyError ||
                             isQuotaError;
        
        // Always refund on failure - user should never lose credits due to our errors
        await addCredits(creditsCost, 'refund', 'Refund for failed generation', user.id, 'refund');
        await RendersDAL.updateStatus(render.id, 'failed', result.error);
        
        // Return user-friendly error messages
        let userErrorMessage = result.error || 'Generation failed';
        let statusCode = 500;
        
        if (isApiKeyError) {
          userErrorMessage = 'AI service configuration error. Our team has been notified.';
          statusCode = 503; // Service unavailable
        } else if (isQuotaError) {
          userErrorMessage = 'AI service is currently at capacity. Please try again in a moment.';
          statusCode = 503;
        } else if (isGoogleError) {
          userErrorMessage = 'AI service temporarily unavailable. Please try again in a moment.';
          statusCode = 503;
        }
        
        return NextResponse.json({ 
          success: false, 
          error: userErrorMessage,
          refunded: true // Inform client that credits were refunded
        }, { status: statusCode });
      }

      logger.log('✅ Generation successful, processing and uploading to storage');

      // Process image with watermark for free users, no watermark for paid users
      let processedImageData: string | undefined = undefined;
      
      if (type === 'image' && result.data.imageData) {
        // Only watermark images, not videos
        if (!isPro) {
          // Free users: Add watermark
          logger.log('🎨 Adding watermark for free user');
          const { WatermarkService } = await import('@/lib/services/watermark');
          processedImageData = await WatermarkService.addWatermark(result.data.imageData, {
            text: 'Renderiq',
            position: 'bottom-right',
            opacity: 0.5,
            useLogo: true // Use logo SVG instead of text
          });
        } else {
          // Paid users: No watermark
          logger.log('✅ Paid user - no watermark applied');
          processedImageData = result.data.imageData;
        }
      }

      // Upload generated image/video to storage
      let uploadResult;
      if (processedImageData) {
        // Use processed base64 data (with or without watermark)
        const fileExtension = 'png';
        logger.log(`📤 Uploading processed ${type} data to storage`);
        const buffer = Buffer.from(processedImageData, 'base64');
        uploadResult = await StorageService.uploadFile(
          buffer,
          'renders',
          user.id,
          `render_${render.id}.${fileExtension}`,
          project.slug
        );
      } else if (result.data.imageData) {
        // Use base64 data directly (for videos or if processing skipped)
        const fileExtension = type === 'video' ? 'mp4' : 'png';
        logger.log(`📤 Uploading base64 ${type} data to storage`);
        const buffer = Buffer.from(result.data.imageData, 'base64');
        uploadResult = await StorageService.uploadFile(
          buffer,
          'renders',
          user.id,
          `render_${render.id}.${fileExtension}`,
          project.slug
        );
      } else if (result.data.imageUrl) {
        // Fallback to URL fetch (for video or other cases)
        logger.log(`📤 Fetching ${type} from URL for storage`);
        const response = await fetch(result.data.imageUrl);
        const blob = await response.blob();
        const fileExtension = type === 'video' ? 'mp4' : 'png';
        const outputFile = new File([blob], `render_${render.id}.${fileExtension}`, {
          type: type === 'video' ? 'video/mp4' : 'image/png'
        });
        uploadResult = await StorageService.uploadFile(
          outputFile,
          'renders',
          user.id,
          undefined,
          project.slug
        );
      } else {
        logger.error('❌ No data available:', { 
          hasImageData: !!result.data.imageData, 
          hasImageUrl: !!result.data.imageUrl,
          dataKeys: Object.keys(result.data)
        });
        throw new Error('No data or URL received from generation service');
      }

      logger.log('✅ File uploaded to storage:', uploadResult.url);

      // Update render with output URL
      await RendersDAL.updateOutput(render.id, uploadResult.url, uploadResult.key, 'completed', Math.round(result.data.processingTime));

      // Add to gallery if public
      if (isPublic) {
        logger.log('📸 Adding render to public gallery');
        await RendersDAL.addToGallery(render.id, user.id, isPublic);
      }

      logger.log('🎉 Render completed successfully');

      // Track render completed
      const duration = Date.now() - startTime;
      trackRenderCompleted(renderType, renderStyle, renderQuality, duration);
      trackApiResponseTime('/api/renders', 'POST', 200, duration);

      // ✅ FIX: Fetch updated render to include all fields (uploadedImageUrl, chainPosition, etc.)
      const updatedRender = await RendersDAL.getById(render.id);

      return NextResponse.json({
        success: true,
        data: {
          id: render.id,
          renderId: render.id, // Include renderId for frontend use
          status: 'completed',
          outputUrl: uploadResult.url,
          processingTime: result.data.processingTime,
          provider: result.data.provider,
          type: type, // Include type (image/video) for frontend
          uploadedImageUrl: updatedRender?.uploadedImageUrl || null,
          uploadedImageKey: updatedRender?.uploadedImageKey || null,
          uploadedImageId: updatedRender?.uploadedImageId || null,
          chainPosition: updatedRender?.chainPosition ?? null,
          chainId: updatedRender?.chainId || null,
        },
      });

    } catch (error) {
      logger.error('❌ Generation error:', error);
      
      // Add Sentry context for render generation errors
      Sentry.setContext('render_generation', {
        renderId: render?.id,
        projectId: render?.projectId,
        chainId: render?.chainId,
        generationType: render?.type,
        userId: user?.id,
        creditsCost,
      });
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorString = errorMessage.toLowerCase();
      
      // Detect specific error types
      const isApiKeyError = errorString.includes('api key') && 
                           (errorString.includes('expired') || 
                            errorString.includes('invalid') || 
                            errorString.includes('not found'));
      const isQuotaError = errorString.includes('quota') || 
                          errorString.includes('rate limit');
      const isGoogleError = errorString.includes('google') || 
                           errorString.includes('gemini') ||
                           errorString.includes('veo') ||
                           isApiKeyError ||
                           isQuotaError;
      
      // CRITICAL: Always refund credits on failure - user should never lose credits
      try {
        await addCredits(creditsCost, 'refund', 'Refund for failed generation', user.id, 'refund');
        logger.log('✅ Credits refunded after generation failure');
      } catch (refundError) {
        logger.error('❌ CRITICAL: Failed to refund credits after generation failure:', refundError);
        // This is critical - log but don't fail the response
      }
      
      await RendersDAL.updateStatus(render.id, 'failed', errorMessage);
      
      // Return user-friendly error messages
      let userErrorMessage = 'Generation failed';
      let statusCode = 500;
      
      if (isApiKeyError) {
        userErrorMessage = 'AI service configuration error. Our team has been notified.';
        statusCode = 503; // Service unavailable
      } else if (isQuotaError) {
        userErrorMessage = 'AI service is currently at capacity. Please try again in a moment.';
        statusCode = 503;
      } else if (isGoogleError) {
        userErrorMessage = 'AI service temporarily unavailable. Please try again in a moment.';
        statusCode = 503;
      }
      
      return NextResponse.json({ 
        success: false, 
        error: userErrorMessage,
        refunded: true
      }, { status: statusCode });
    }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    securityLog('render_api_error', { error: getSafeErrorMessage(error) }, 'error');
    logger.error('❌ API error:', {
      error: errorMessage,
      stack: errorStack,
      userId: user?.id,
      creditsCost,
      renderType,
      renderStyle,
      renderQuality,
    });
    
    // Add Sentry context for top-level API errors
    try {
    Sentry.setContext('render_api', {
      userId: user?.id,
      creditsCost,
      hasUser: !!user,
        renderType,
        renderStyle,
        renderQuality,
        errorMessage,
      });
      
      // Capture exception to Sentry with full context
      Sentry.captureException(error, {
        tags: {
          api_route: '/api/renders',
          method: 'POST',
          render_type: renderType,
        },
        extra: {
          userId: user?.id,
          creditsCost,
          renderType,
          renderStyle,
          renderQuality,
        },
      });
    } catch (sentryError) {
      // Don't let Sentry errors break the error response
      logger.error('❌ Failed to send error to Sentry:', sentryError);
    }
    
    // For top-level errors, try to refund if we have the necessary data
    try {
      if (typeof creditsCost !== 'undefined' && user?.id) {
        await addCredits(creditsCost, 'refund', 'Refund for API error', user.id, 'refund');
        logger.log('✅ Credits refunded after API error');
      }
    } catch (refundError) {
      logger.error('❌ CRITICAL: Failed to refund credits after API error:', refundError);
      try {
      Sentry.captureException(refundError, {
        tags: {
          critical: true,
          refund_failure: true,
        },
      });
      } catch {
        // Ignore Sentry errors in error handling
      }
    }
    
    const duration = Date.now() - startTime;
    try {
      trackApiError('/api/renders', 'POST', 500, errorMessage);
    trackApiResponseTime('/api/renders', 'POST', 500, duration);
    } catch (trackingError) {
      // Don't let tracking errors break the error response
      logger.error('❌ Failed to track API error:', trackingError);
    }
    
    // ✅ FIXED: Always return a proper JSON response, even if error occurs during response creation
    // This prevents empty 500 responses
    try {
      const isDevelopment = process.env.NODE_ENV === 'development';
      const userFacingError = isDevelopment 
        ? `Internal server error: ${errorMessage}` 
        : 'Internal server error. Please try again or contact support if the issue persists.';
    
    return NextResponse.json({ 
        success: false, 
        error: userFacingError,
        refunded: typeof creditsCost !== 'undefined' && user?.id,
        // Only include detailed error in development
        ...(isDevelopment && { details: errorMessage, stack: errorStack })
      }, { 
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        }
      });
    } catch (responseError) {
      // ✅ FIXED: If even creating the response fails, return a minimal safe response
      logger.error('❌ CRITICAL: Failed to create error response:', responseError);
      return new NextResponse(
        JSON.stringify({ 
      success: false, 
      error: 'Internal server error',
          refunded: false
        }),
        { 
          status: 500,
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );
    }
  } finally {
    // Track API response time for successful requests
    const duration = Date.now() - startTime;
    // Only track if we haven't already tracked an error
    // This will be handled by the success path or error path above
  }
}

// ✅ FIXED: Export wrapper that ensures we always return a response, even if handler crashes
export async function POST(request: NextRequest) {
  try {
    return await handleRenderRequest(request);
  } catch (error) {
    // ✅ FIXED: Ultimate fallback - if even the error handler fails, return a safe response
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error('❌ CRITICAL: Top-level POST handler caught exception:', errorMessage);
    
    try {
      return NextResponse.json({ 
        success: false, 
        error: 'Internal server error. Please try again.',
        refunded: false
      }, { 
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        }
      });
    } catch {
      // If even creating a JSON response fails, return a minimal text response
      return new NextResponse('Internal Server Error', { 
        status: 500,
        headers: {
          'Content-Type': 'text/plain',
        }
      });
    }
  }
}

export async function GET(request: NextRequest) {
  try {
    const { user } = await getCachedUser();
    
    if (!user) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');

    const renders = await RendersDAL.getByUser(user.id, projectId);
    
    return NextResponse.json({ success: true, data: renders });
  } catch (error) {
    logger.error('❌ Get renders error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch renders' }, { status: 500 });
  }
}
