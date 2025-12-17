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
  getSafeErrorMessage, 
  securityLog,
  isValidUUID,
  isValidImageType,
  isValidFileSize,
  redactSensitive
} from '@/lib/utils/security';
import { handleCORSPreflight, withCORS } from '@/lib/middleware/cors';
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
  
  // Handle CORS preflight
  const preflight = handleCORSPreflight(request);
  if (preflight) return preflight;
  
  try {
    // Rate limiting
    const rateLimit = rateLimitMiddleware(request, { maxRequests: 30, windowMs: 60000 });
    if (!rateLimit.allowed) {
      // Convert Response to NextResponse for CORS
      const rateLimitResponse = NextResponse.json(
        { success: false, error: 'Rate limit exceeded. Please try again later.' },
        { 
          status: 429,
          headers: rateLimit.response?.headers ? Object.fromEntries(rateLimit.response.headers) : {}
        }
      );
      return withCORS(rateLimitResponse, request);
    }

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
    
    // Extract tool settings (if coming from tools)
    const imageType = sanitizeInput(formData.get('imageType') as string | null);
    
    // Extract telemetry metadata for plugin tracking
    const sourcePlatform = sanitizeInput(formData.get('sourcePlatform') as string | null);
    const pluginVersion = sanitizeInput(formData.get('pluginVersion') as string | null);
    const userAgent = sanitizeInput(formData.get('userAgent') as string | null);
    const callbackUrl = sanitizeInput(formData.get('callback_url') as string | null);
    const toolSettings: Record<string, string> = {};
    
    // Extract common tool settings that tools append to FormData
    const toolSettingKeys = [
      'lighting', 'cameraAngle', 'focalLength', 'environment', 'depthOfField',
      'furnitureStyle', 'roomType', 'presentationStyle', 'lod', 'decorativeDetails', 'shadows',
      'cameraPathStyle', 'sceneType', 'lightingTypes', 'timeOfDay', 'lightingTemp', 'sunlightDirection',
      'detailLevel', 'windows', 'style', 'includeText'
    ];
    
    for (const key of toolSettingKeys) {
      const value = formData.get(key) as string | null;
      if (value) {
        toolSettings[key] = sanitizeInput(value);
      }
    }
    
    // Build metadata object if any telemetry fields present
    const metadata = (sourcePlatform || pluginVersion || userAgent || callbackUrl || imageType) ? {
      ...(sourcePlatform && { sourcePlatform }),
      ...(pluginVersion && { pluginVersion }),
      ...(userAgent && { userAgent }),
      ...(callbackUrl && { callbackUrl }),
      ...(imageType && { toolId: imageType, toolName: imageType }), // Use imageType as toolId/toolName
      ...(Object.keys(toolSettings).length > 0 && { toolSettings }), // Include tool settings in metadata
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
    
    // Add effect and environment to toolSettings if they exist
    if (effect && effect !== 'none') {
      toolSettings['effect'] = effect;
    }
    if (environment && environment !== 'none') {
      toolSettings['environment'] = environment;
    }
    
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
    
    // Validate model + quality combination if model is specified (skip validation for "auto" mode)
    // "auto" mode uses ModelRouter to automatically select the best model, so no validation needed
    if (model && model !== 'auto' && type === 'image') {
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
      const imageSize = quality === 'ultra' ? '4K' : quality === 'high' ? '2K' : '1K';
      
      // ✅ FIX: For "auto" mode, use maximum possible cost (Gemini 3 Pro Image)
      // This ensures users have enough credits before generation starts
      // We'll refund the difference if a cheaper model is selected by the pipeline
      if (imageModelId === 'auto') {
        const maxCostModel = getModelConfig('gemini-3-pro-image-preview' as any);
        if (maxCostModel && maxCostModel.type === 'image') {
          creditsCost = maxCostModel.calculateCredits({ quality, imageSize });
          logger.log('💰 Image credits cost calculation (auto mode - using max cost):', {
            model: 'auto',
            estimatedModel: 'gemini-3-pro-image-preview',
            quality,
            imageSize,
            totalCredits: creditsCost,
            note: 'Will refund difference if cheaper model is selected'
          });
        } else {
          // Fallback: use default model if max cost model not found
          const defaultModel = getDefaultModel('image');
          creditsCost = defaultModel.calculateCredits({ quality, imageSize });
          logger.warn('⚠️ Max cost model not found for auto mode, using default');
        }
      } else if (!modelConfig || modelConfig.type !== 'image') {
        logger.warn('⚠️ Invalid image model, using default');
        const defaultModel = getDefaultModel('image');
        creditsCost = defaultModel.calculateCredits({ quality, imageSize });
      } else {
        creditsCost = modelConfig.calculateCredits({ quality, imageSize });
      }
      
      // For batch: multiply by number of requests
      const numberOfRequests = useBatchAPI && batchRequests.length > 0 ? batchRequests.length : 1;
      creditsCost = creditsCost * numberOfRequests;
      
      if (imageModelId !== 'auto') {
        logger.log('💰 Image credits cost calculation:', {
          model: imageModelId,
          quality,
          imageSize,
          numberOfRequests: useBatchAPI ? numberOfRequests : 1,
          isBatch: useBatchAPI,
          totalCredits: creditsCost
        });
      }
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

    // ✅ CHECK LIMIT: Verify user can create more renders in this project/chain
    // ✅ FIXED: Pass chainId to count renders per chain instead of per project
    const renderLimitCheck = await PlanLimitsService.checkRenderLimit(user.id, projectId, chainId);
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
      
      const batchResults: Array<{ renderId: string; outputUrl: string; label?: string; status?: string }> = [];
      let currentChainPosition = chainPosition;
      
      // ✅ FIXED: Calculate version number for this batch (all variants share same version)
      // Get completed renders count to determine next version number
      const { getCompletedRenders } = await import('@/lib/utils/chain-helpers');
      const chainRenders = await RendersDAL.getByChainId(finalChainId);
      const completedRenders = getCompletedRenders(chainRenders);
      const versionNumber = completedRenders.length + 1; // Next version number
      
      logger.log('📊 Version calculation for batch:', {
        completedRendersCount: completedRenders.length,
        versionNumber,
        totalVariants: batchRequests.length
      });
      
      // ✅ FIXED: Track previously generated variants for context
      const previousVariants: Array<{ variantIndex: number; key: string; prompt: string }> = [];
      
      // ✅ FIXED: Create all render records FIRST to return IDs immediately for placeholders
      const pendingRenders: Array<{ renderId: string; batchRequest: any; label: string }> = [];
      for (let batchIndex = 0; batchIndex < batchRequests.length; batchIndex++) {
        const batchRequest = batchRequests[batchIndex];
        const isolatedPrompt = batchRequest.prompt;
          
        // Create render record immediately (for placeholder display)
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

          // ✅ FIXED: Create label with version number
          // For variants: "Variant X of Version Y"
          // For other batch items (CAD drawings): Use existing label logic
          const variantIndex = (batchRequest as any).variantIndex ?? batchIndex;
          let label: string;
          
          if (batchRequest.drawingType) {
            // CAD drawing batch - use existing label logic
            if (batchRequest.drawingType === 'floor-plan' && batchRequest.floorPlanType) {
              label = batchRequest.floorPlanType === 'normal-floor-plan' ? 'Normal Floor Plan' : 'Reflected Ceiling Plan';
            } else if (batchRequest.drawingType === 'elevation' && batchRequest.elevationSide) {
              label = `${batchRequest.elevationSide.charAt(0).toUpperCase() + batchRequest.elevationSide.slice(1)} Elevation`;
            } else if (batchRequest.drawingType === 'section' && batchRequest.sectionCutDirection) {
              label = `${batchRequest.sectionCutDirection.charAt(0).toUpperCase() + batchRequest.sectionCutDirection.slice(1)} Section`;
            } else {
              label = batchRequest.key || `Drawing ${variantIndex + 1}`;
            }
          } else {
            // Variant generation - use "Variant X of Version Y" format
            label = `Variant ${variantIndex + 1} of Version ${versionNumber}`;
          }
          
          pendingRenders.push({
            renderId: batchRender.id,
            batchRequest: { ...batchRequest, variantIndex }, // Ensure variantIndex is included
            label
          });

          logger.log('✅ Batch render record created:', {
            renderId: batchRender.id,
            key: batchRequest.key,
            drawingType: batchRequest.drawingType,
            elevationSide: batchRequest.elevationSide,
            variantIndex
          });
      }
      
      // ✅ FIXED: Initialize batchResults with pending renders so they're returned immediately
      // This allows UI to show 4 placeholder shapes while generation happens
      batchResults.push(...pendingRenders.map(pr => ({
        renderId: pr.renderId,
        outputUrl: undefined as any, // Will be updated when generation completes
        label: pr.label,
        status: 'processing' as const
      })));
      
      // Now process each render sequentially with variant context
      for (let batchIndex = 0; batchIndex < pendingRenders.length; batchIndex++) {
        const { renderId, batchRequest, label } = pendingRenders[batchIndex];
        try {
          const isolatedPrompt = batchRequest.prompt;

          // Update render status to processing
          await RendersDAL.updateStatus(renderId, 'processing');

          // Generate image for this batch item
          const imageDataToUse = uploadedImageData || referenceRenderImageData;
          const imageTypeToUse = uploadedImageType || referenceRenderImageType;
          
          // ✅ FIXED: Build contextual prompt with awareness of previous variants
          // This ensures each variant knows what was already generated and creates actual variations
          let contextualPrompt = isolatedPrompt;
          const isUsingReferenceRender = !uploadedImageData && referenceRenderImageData && referenceRenderPrompt;
          const currentVariantNumber = ((batchRequest as any).variantIndex ?? batchIndex) + 1;
          const totalVariants = batchRequests.length;
          
          // Build context about previous variants - CRITICAL for creating distinct variations
          let variantContext = '';
          if (previousVariants.length > 0) {
            const previousVariantNumbers = previousVariants.map(v => v.variantIndex + 1).join(', ');
            variantContext = ` CRITICAL INSTRUCTIONS: This is variant ${currentVariantNumber} of ${totalVariants}. Variants ${previousVariantNumbers} have already been generated. You MUST create a DISTINCT and UNIQUE variation that is visually different from variants ${previousVariantNumbers}. While maintaining the same base design and style, ensure this variant shows different composition, perspective, lighting, or details. Do NOT create a duplicate or near-duplicate of the previous variants.`;
          } else if (totalVariants > 1) {
            variantContext = ` CRITICAL INSTRUCTIONS: This is variant ${currentVariantNumber} of ${totalVariants}. Create a distinct and unique variation that will be part of a set of ${totalVariants} variants. Each variant should be visually different while maintaining the same base design.`;
          }
          
          if (isUsingReferenceRender && referenceRenderPrompt) {
            // Include reference render context + variant context
            // ✅ FIXED: Use full prompt, ensure it's not truncated
            const fullReferencePrompt = referenceRenderPrompt.length > 100 
              ? referenceRenderPrompt.substring(0, 100) + '...' 
              : referenceRenderPrompt;
            contextualPrompt = `Based on the previous render (${fullReferencePrompt}), ${isolatedPrompt}${variantContext}`;
          } else if (variantContext) {
            // Add variant context even without reference render
            contextualPrompt = `${isolatedPrompt}${variantContext}`;
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
            logger.error('❌ Batch item generation failed:', { key: batchRequest.key, renderId, error: batchResult.error });
            await RendersDAL.updateStatus(renderId, 'failed', batchResult.error || 'Generation failed');
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
            `render_${renderId}.png`,
            project.slug
          );

          // Update render with output URL
          await RendersDAL.updateOutput(renderId, uploadResult.url, uploadResult.key, 'completed', Math.round(batchResult.data.processingTime || 0));

          // ✅ FIXED: Store label and version in contextData for persistence
          const updatedRenderForContext = await RendersDAL.getById(renderId);
          await RendersDAL.updateContext(renderId, {
            ...(updatedRenderForContext?.contextData || {}),
            label,
            versionNumber,
            variantIndex: (batchRequest as any).variantIndex ?? batchIndex
          } as any);

          // ✅ FIXED: Track this variant for future variants' context
          const variantIndex = (batchRequest as any).variantIndex ?? batchIndex;
          previousVariants.push({
            variantIndex,
            key: batchRequest.key,
            prompt: isolatedPrompt
          });

          // Add to gallery if public
          if (isPublic) {
            await RendersDAL.addToGallery(renderId, user.id, isPublic);
          }

          // ✅ FIXED: Update result with completed status and label
          const resultIndex = batchResults.findIndex(r => r.renderId === renderId);
          if (resultIndex >= 0) {
            batchResults[resultIndex].outputUrl = uploadResult.url;
            batchResults[resultIndex].status = 'completed';
            batchResults[resultIndex].label = label; // Ensure label is set
          } else {
          batchResults.push({
              renderId,
            outputUrl: uploadResult.url,
              label,
              status: 'completed'
          });
          }

          logger.log('✅ Batch item completed:', { key: batchRequest.key, renderId });
        } catch (error) {
          logger.error('❌ Error processing batch item:', { key: batchRequest.key, renderId, error });
          // Mark as failed
          await RendersDAL.updateStatus(renderId, 'failed', error instanceof Error ? error.message : 'Generation failed');
          const resultIndex = batchResults.findIndex(r => r.renderId === renderId);
          if (resultIndex >= 0) {
            batchResults[resultIndex].status = 'failed';
          }
          // Continue with next item
        }
      }

      logger.log('🎉 Batch processing completed:', { 
        successCount: batchResults.filter(r => r.status === 'completed').length, 
        totalCount: batchRequests.length,
        pendingCount: batchResults.filter(r => r.status === 'processing').length
      });

      // ✅ FIXED: Return all results including pending ones (for placeholder display)
      return NextResponse.json({
        success: true,
        data: batchResults,
        // Include pending render IDs so client can show placeholders
        pendingRenders: pendingRenders.map(pr => pr.renderId)
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

    // Record usage tracking (non-blocking)
    if (creditsCost) {
      try {
        const { AnalyticsService } = await import('@/lib/services/analytics-service');
        const isApiCall = !!(metadata as any)?.sourcePlatform;
        await AnalyticsService.recordRenderCreation(user.id, creditsCost, isApiCall);
      } catch (error) {
        logger.error('⚠️ Failed to record usage tracking (non-critical)', error);
      }
    }

    // ✅ Trigger automatic task: Create Render or Refine Render
    try {
      const { TaskAutomationService } = await import('@/lib/services/task-automation.service');
      if (validatedReferenceRenderId) {
        // This is a refinement (has reference render)
        await TaskAutomationService.onRenderRefined(user.id, render.id, validatedReferenceRenderId);
      } else {
        // This is a new render
        await TaskAutomationService.onRenderCreated(user.id, render.id);
      }
    } catch (error) {
      logger.error('⚠️ Failed to trigger render task (non-critical)', error);
    }

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
        
        // ✅ CENTRALIZED: Use CentralizedContextService as single source of truth
        const { CentralizedContextService } = await import('@/lib/services/centralized-context-service');
        
        // Build unified context (handles version context, context prompt, pipeline memory)
        const unifiedContext = await CentralizedContextService.buildUnifiedContext({
          prompt: finalPrompt,
          chainId: finalChainId || undefined,
          referenceRenderId: validatedReferenceRenderId || undefined,
          projectId: projectId || undefined,
          useVersionContext: !!versionContextData || finalPrompt.includes('@'), // Parse @mentions if present
          useContextPrompt: true, // Enhance with chain context
          usePipelineMemory: true, // Load pipeline memory
        });

        // Get final prompt from unified context
        let contextualPrompt = CentralizedContextService.getFinalPrompt(unifiedContext, finalPrompt);
        
        // Smart image selection logic:
        // 1. If user uploaded a NEW image -> use it (fresh start, no reference context)
        // 2. If NO uploaded image but reference render exists -> use reference render (iterative edit)
        // 3. If neither -> generate from scratch
        const imageDataToUse = uploadedImageData || referenceRenderImageData;
        const imageTypeToUse = uploadedImageType || referenceRenderImageType;
        
        // Determine if using reference render for context enhancement
        const isUsingReferenceRender = !uploadedImageData && referenceRenderImageData && referenceRenderPrompt;
        
        // Enhance prompt with reference context if using reference render (for chat API compatibility)
        if (isUsingReferenceRender && contextualPrompt === finalPrompt) {
          // Only add reference context if context service didn't already enhance it
          contextualPrompt = `Based on the previous render (${referenceRenderPrompt}), ${finalPrompt}`;
          logger.log('🔗 Using contextual prompt with reference render for iterative edit:', contextualPrompt.substring(0, 100));
        } else if (uploadedImageData) {
          // User uploaded a new image - use fresh prompt without reference context
          logger.log('🆕 Using fresh prompt with new uploaded image (no reference context)');
        } else if (contextualPrompt !== finalPrompt) {
          // Context service enhanced the prompt
          logger.log('✅ Using enhanced prompt from CentralizedContextService:', contextualPrompt.substring(0, 100));
        } else {
          // No image at all - generate from scratch
          logger.log('🎨 Generating from scratch (no image input)');
        }

        // 🧠 PROMPT REFINEMENT: Analyze system-generated prompt + image and refine before generation
        // This is a "thinking" stage that improves quality by aligning prompt intent with image content
        // Enabled for tool-generated prompts (system-generated) or when refinement is explicitly requested
        const shouldRefinePrompt = metadata?.sourcePlatform === 'tools' || 
                                   request.nextUrl.searchParams.get('refinePrompt') === 'true' ||
                                   process.env.ENABLE_PROMPT_REFINEMENT === 'true';
        
        if (shouldRefinePrompt && contextualPrompt) {
          try {
            logger.log('🧠 PromptRefinement: Refining system-generated prompt', {
              originalLength: contextualPrompt.length,
              hasReferenceImage: !!imageDataToUse,
              hasStyleReference: !!styleTransferImageData
            });
            
            const { PromptRefinementService } = await import('@/lib/services/prompt-refinement');
            
            // Build tool context for refinement
            const meta = metadata as any;
            const toolContext = (metadata?.sourcePlatform === 'tools' || imageType) ? {
              toolId: meta?.toolId || imageType || 'unknown',
              toolName: meta?.toolName || imageType || 'Unknown Tool',
              quality: quality,
              aspectRatio: aspectRatio,
              ...(meta?.toolSettings || {})
            } : {
              quality: quality,
              aspectRatio: aspectRatio
            };
            
            // Refine the prompt
            contextualPrompt = await PromptRefinementService.refinePrompt(
              contextualPrompt,
              imageDataToUse || undefined,
              imageTypeToUse || undefined,
              styleTransferImageData || undefined,
              styleTransferImageType || undefined,
              toolContext
            );
            
            logger.log('✅ PromptRefinement: Prompt refined successfully', {
              refinedLength: contextualPrompt.length,
              improvement: contextualPrompt.length > (finalPrompt.length * 0.9) // At least 90% of original length
            });
          } catch (error) {
            logger.error('⚠️ PromptRefinement: Failed, using original prompt', error);
            // Continue with original contextualPrompt if refinement fails
          }
        }

        // ✅ MULTI-TURN CHAT API: Check if we should use chat API for iterative edits
        // This provides 20-30% faster iterative edits and better context preservation
        // Aligned with MULTI_TURN_IMAGE_EDITING_ALIGNMENT.md
        const { ChatSessionManager } = await import('@/lib/services/chat-session-manager');
        const shouldUseChat = await ChatSessionManager.shouldUseChatAPI(finalChainId, validatedReferenceRenderId);
        
        // 🚀 TECHNICAL MOAT: Full Pipeline (optional - can be enabled via feature flag)
        // Check if full pipeline is enabled (via query param or env var)
        const useFullPipeline = process.env.ENABLE_FULL_PIPELINE === 'true' || 
                                 request.nextUrl.searchParams.get('fullPipeline') === 'true';
        
        // Initialize selectedModel variable
        let selectedModel: string | undefined = model || undefined;

        // CRITICAL: Always resolve "auto" to a real model ID before using it
        // ModelRouter must be called to convert "auto" to an actual model ID
        if (!selectedModel || selectedModel === 'auto') {
          try {
            const { ModelRouter } = await import('@/lib/services/model-router');
            // Build tool context for model routing
            const meta = metadata as any;
            const hasToolSettings = toolSettings && Object.keys(toolSettings).length > 0;
            const toolContext = (metadata?.sourcePlatform === 'tools' || imageType || hasToolSettings) ? {
              toolId: meta?.toolId || imageType || 'unknown',
              toolName: meta?.toolName || imageType || 'Unknown Tool',
              toolSettings: meta?.toolSettings || toolSettings || {}
            } : undefined;
            
            selectedModel = ModelRouter.selectImageModel(
              quality,
              toolContext,
              undefined // Complexity can be added later from semantic parsing
            );
            logger.log('🎯 ModelRouter: Selected model (auto mode):', selectedModel);
          } catch (error) {
            logger.error('⚠️ Model routing failed, using default:', error);
            // Fallback to default model selection logic
            const { getDefaultModel } = await import('@/lib/config/models');
            selectedModel = getDefaultModel('image').id;
          }
        }

        // Ensure selectedModel is never "auto" or undefined at this point
        if (!selectedModel || selectedModel === 'auto') {
          const { getDefaultModel } = await import('@/lib/config/models');
          selectedModel = getDefaultModel('image').id;
          logger.warn('⚠️ ModelRouter failed, using default model:', selectedModel);
        }

        if (useFullPipeline) {
          try {
            logger.log('🚀 Using FULL Technical Moat Pipeline (all 7 stages)');
            const { RenderPipeline } = await import('@/lib/services/render-pipeline');
            
            // Build tool context from metadata, imageType, or toolSettings
            // Always create toolContext if toolSettings exist (for effect, environment, etc.)
            const meta = metadata as any;
            const hasToolSettings = toolSettings && Object.keys(toolSettings).length > 0;
            const toolContext = (metadata?.sourcePlatform === 'tools' || imageType || hasToolSettings) ? {
              toolId: meta?.toolId || imageType || 'unknown',
              toolName: meta?.toolName || imageType || 'Unknown Tool',
              toolSettings: meta?.toolSettings || toolSettings || {} // Pass tool settings to pipeline (effect, environment, etc.)
            } : undefined;

            // CRITICAL: Pass uploaded image as referenceImageData if it exists
            // Priority: uploadedImageData > referenceRenderImageData
            const imageDataForPipeline = uploadedImageData || referenceRenderImageData;
            const imageTypeForPipeline = uploadedImageType || referenceRenderImageType;
            
            logger.log('🖼️ Pipeline image input:', {
              hasImageData: !!imageDataForPipeline,
              imageType: imageTypeForPipeline,
            });
            
            // ✅ FIXED: Actually call the pipeline!
            result = await RenderPipeline.generateRender({
              prompt: contextualPrompt,
              referenceImageData: imageDataForPipeline || undefined,
              referenceImageType: imageTypeForPipeline || undefined,
              styleReferenceData: styleTransferImageData || undefined,
              styleReferenceType: styleTransferImageType || undefined,
              toolContext: toolContext,
              quality: quality,
              aspectRatio: aspectRatio,
              chainId: finalChainId || undefined,
              forceModel: selectedModel as any, // Use already-resolved model
              skipStages: {
                // Skip validation and memory for standard quality (faster)
                validation: quality === 'standard',
                memoryExtraction: quality === 'standard'
              }
            });

            if (result.success && result.data) {
              logger.log('✅ Full pipeline generation completed successfully');
            } else {
              logger.error('❌ Full pipeline generation failed:', result.error);
              // Fall through to regular generation
              result = undefined;
            }
          } catch (error) {
            logger.error('⚠️ Full pipeline setup failed:', error);
            // Continue with regular generation using selectedModel
            result = undefined;
          }
        }
        
        // ✅ MULTI-TURN CHAT API: Use chat session for iterative edits (if not using full pipeline)
        // This provides automatic context preservation and faster iterative edits
        if (!result && shouldUseChat && type === 'image' && finalChainId) {
          try {
            logger.log('💬 Using chat API for multi-turn image editing', {
              chainId: finalChainId,
              hasReferenceRender: !!validatedReferenceRenderId
            });
            
            // Get or create chat session
            const chatSessionId = await ChatSessionManager.getOrCreateChatSession(
              finalChainId,
              selectedModel || 'gemini-2.5-flash-image',
              {
                aspectRatio,
                imageSize: quality === 'ultra' ? '4K' : quality === 'high' ? '2K' : '1K'
              }
            );

            // Send message in chat session (Google maintains conversation history automatically)
            // For iterative edits, we can use a simpler prompt since context is preserved
            const chatPrompt = isUsingReferenceRender 
              ? finalPrompt // Simpler prompt - context is in chat history
              : contextualPrompt; // Full prompt for first message in session
            
            result = await aiService.sendChatMessage(
              chatSessionId,
              chatPrompt,
              imageDataToUse || undefined,
              imageTypeToUse || undefined,
              {
                aspectRatio,
                imageSize: quality === 'ultra' ? '4K' : quality === 'high' ? '2K' : '1K'
              }
            );

            // Update chain's last chat turn
            await ChatSessionManager.incrementChatTurn(finalChainId);
            
            logger.log('✅ Chat API generation completed', {
              success: result.success,
              hasData: !!result.data
            });
          } catch (chatError) {
            logger.error('⚠️ Chat API failed, falling back to generateContent()', chatError);
            // Fall through to regular generateImage() call
          }
        }
        
        // Only proceed with regular generation if full pipeline wasn't used or failed
        if (!result) {
          logger.log('🎨 Calling aiService.generateImage with parameters:', {
            promptLength: contextualPrompt.length,
            aspectRatio,
            hasUploadedImage: !!imageDataToUse,
            hasStyleTransfer: !!styleTransferImageData,
            model: selectedModel,
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
            model: selectedModel,
            imageSize: quality === 'ultra' ? '4K' : quality === 'high' ? '2K' : '1K',
          });
          
          logger.log('🎨 aiService.generateImage completed', {
            success: result.success,
            hasData: !!result.data,
            hasError: !!result.error,
            error: result.error?.substring(0, 100)
          });

          // 🚀 TECHNICAL MOAT: Extract and save pipeline memory after generation (if not using full pipeline)
          // This enables consistency for future renders in the same chain
          if (result.success && result.data?.imageData && finalChainId && quality !== 'standard') {
            try {
              const { PipelineMemoryService } = await import('@/lib/services/pipeline-memory');
              const memory = await PipelineMemoryService.extractMemory(
                result.data.imageData,
                'image/png'
              );
              await PipelineMemoryService.saveMemory(render.id, memory);
              logger.log('✅ Pipeline memory extracted and saved');
            } catch (error) {
              logger.error('⚠️ Failed to extract/save pipeline memory:', error);
              // Non-critical, continue
            }
          }
        }
      } // Close the else block for image generation

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
      const typeString = String(type);
      const isVideo = typeString === 'video';

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
        const fileExtension = isVideo ? 'mp4' : 'png';
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
        const fileExtension = isVideo ? 'mp4' : 'png';
        const outputFile = new File([blob], `render_${render.id}.${fileExtension}`, {
          type: isVideo ? 'video/mp4' : 'image/png'
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

      // ✅ FIXED: Link tool execution to render if this is a tool-generated render
      // Check if render platform is 'tools' or has tool metadata
      if (render.platform === 'tools' || (metadata as any)?.sourcePlatform === 'tools' || imageType) {
        try {
          const { ToolsDAL, ToolsService } = await import('@/lib/dal/tools');
          const { ToolsService: ToolsServiceInstance } = await import('@/lib/services/tools.service');
          
          // Try to find tool by imageType or metadata toolId
          let toolId: string | null = null;
          if (imageType) {
            // Try to find tool by slug (imageType is often the tool slug)
            const tools = await ToolsServiceInstance.getActiveTools();
            const tool = tools.find(t => t.slug === imageType || t.name.toLowerCase().replace(/\s+/g, '-') === imageType);
            if (tool) {
              toolId = tool.id;
            }
          } else if ((metadata as any)?.toolId) {
            // Try to find tool by toolId from metadata
            const tools = await ToolsServiceInstance.getActiveTools();
            const tool = tools.find(t => t.id === (metadata as any).toolId || t.slug === (metadata as any).toolId);
            if (tool) {
              toolId = tool.id;
            }
          }
          
          if (toolId) {
            // Find pending/processing tool execution for this tool/project/user that doesn't have outputRenderId yet
            const executions = await ToolsDAL.getExecutionsByTool(toolId, user.id, 10);
            const pendingExecution = executions.find(
              exec => 
                exec.projectId === projectId &&
                exec.userId === user.id && 
                !exec.outputRenderId && 
                (exec.status === 'pending' || exec.status === 'processing')
            );
            
            if (pendingExecution) {
              // Update tool execution with render ID and output URL
              await ToolsDAL.updateExecution(pendingExecution.id, {
                outputRenderId: render.id,
                outputUrl: uploadResult.url,
                outputKey: uploadResult.key,
                status: 'completed',
                processingTime: Math.round(result.data.processingTime),
                completedAt: new Date(),
              });
              logger.log('✅ Linked tool execution to render:', { 
                executionId: pendingExecution.id, 
                renderId: render.id,
                toolId: toolId 
              });
            } else {
              // Fallback: try to find by project only (less precise but better than nothing)
              const projectExecutions = await ToolsDAL.getExecutionsByProject(projectId, 10);
              const fallbackExecution = projectExecutions.find(
                exec => 
                  exec.userId === user.id && 
                  !exec.outputRenderId && 
                  (exec.status === 'pending' || exec.status === 'processing')
              );
              
              if (fallbackExecution) {
                await ToolsDAL.updateExecution(fallbackExecution.id, {
                  outputRenderId: render.id,
                  outputUrl: uploadResult.url,
                  outputKey: uploadResult.key,
                  status: 'completed',
                  processingTime: Math.round(result.data.processingTime),
                  completedAt: new Date(),
                });
                logger.log('✅ Linked tool execution to render (fallback):', { 
                  executionId: fallbackExecution.id, 
                  renderId: render.id 
                });
              }
            }
          } else {
            // Fallback: try to find by project only if we can't identify the tool
            const { ToolsDAL } = await import('@/lib/dal/tools');
            const projectExecutions = await ToolsDAL.getExecutionsByProject(projectId, 10);
            const fallbackExecution = projectExecutions.find(
              exec => 
                exec.userId === user.id && 
                !exec.outputRenderId && 
                (exec.status === 'pending' || exec.status === 'processing')
            );
            
            if (fallbackExecution) {
              await ToolsDAL.updateExecution(fallbackExecution.id, {
                outputRenderId: render.id,
                outputUrl: uploadResult.url,
                outputKey: uploadResult.key,
                status: 'completed',
                processingTime: Math.round(result.data.processingTime),
                completedAt: new Date(),
              });
              logger.log('✅ Linked tool execution to render (fallback by project):', { 
                executionId: fallbackExecution.id, 
                renderId: render.id 
              });
            }
          }
        } catch (error) {
          // Non-critical - log but don't fail render
          logger.warn('⚠️ Failed to link tool execution to render (non-critical):', error);
        }
      }

      // ✅ FIXED: Calculate version number for normal render (not batch)
      // Get completed renders count AFTER this render is marked as completed
      const { getCompletedRenders } = await import('@/lib/utils/chain-helpers');
      const chainRenders = await RendersDAL.getByChainId(finalChainId);
      const completedRenders = getCompletedRenders(chainRenders);
      const versionNumber = completedRenders.length; // This render's version number
      
      // ✅ FIXED: Store label in contextData for persistence
      const label = `Version ${versionNumber}`;
      const updatedRenderForContext = await RendersDAL.getById(render.id);
      await RendersDAL.updateContext(render.id, {
        ...(updatedRenderForContext?.contextData || {}),
        label,
        versionNumber
      } as any);
      
      logger.log('📊 Version calculation for normal render:', {
        completedRendersCount: completedRenders.length,
        versionNumber,
        label
      });

      // Add to gallery if public
      if (isPublic) {
        logger.log('📸 Adding render to public gallery');
        await RendersDAL.addToGallery(render.id, user.id, isPublic);
        
        // ✅ Trigger automatic task: Share to Gallery (if task exists)
        try {
          const { TaskAutomationService } = await import('@/lib/services/task-automation.service');
          // Note: Gallery share task removed for MVP, keeping hook for future
        } catch (error) {
          logger.error('⚠️ Failed to trigger gallery share task (non-critical)', error);
        }
      }

      logger.log('🎉 Render completed successfully');

      // Track render completed
      const duration = Date.now() - startTime;
      trackRenderCompleted(renderType, renderStyle, renderQuality, duration);
      trackApiResponseTime('/api/renders', 'POST', 200, duration);

      // ✅ FIX: Fetch updated render to include all fields (uploadedImageUrl, chainPosition, etc.)
      const updatedRender = await RendersDAL.getById(render.id);

      // ✅ FIXED: Include version number and label in response
      const successResponse = NextResponse.json({
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
          // ✅ FIXED: Include version number and label
          versionNumber: versionNumber,
          label: `Version ${versionNumber}`, // Normal render label
        },
      });
      return withCORS(successResponse, request);

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
    // End of generation try-catch block

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
      
      const errorResponse = NextResponse.json({ 
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
      return withCORS(errorResponse, request);
    } catch (responseError) {
      // ✅ FIXED: If even creating the response fails, return a minimal safe response
      logger.error('❌ CRITICAL: Failed to create error response:', responseError);
      const fallbackResponse = new NextResponse(
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
      return withCORS(fallbackResponse, request);
    }
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
      const topLevelErrorResponse = NextResponse.json({ 
        success: false, 
        error: 'Internal server error. Please try again.',
        refunded: false
      }, { 
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        }
      });
      return withCORS(topLevelErrorResponse, request);
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
