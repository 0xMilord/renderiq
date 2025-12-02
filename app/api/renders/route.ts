import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { AISDKService } from '@/lib/services/ai-sdk-service';
import { addCredits, deductCredits } from '@/lib/actions/billing.actions';
import { ProjectsDAL } from '@/lib/dal/projects';
import { RendersDAL } from '@/lib/dal/renders';
import { RenderChainsDAL } from '@/lib/dal/render-chains';
import { StorageService } from '@/lib/services/storage';
import { logger } from '@/lib/utils/logger';

const aiService = AISDKService.getInstance();

// Configure route to handle large body sizes (for image uploads)
export const runtime = 'nodejs';
export const maxDuration = 300; // 5 minutes for video generation

export async function POST(request: NextRequest) {
  try {
    logger.log('🚀 Starting render generation API call');
    
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      logger.error('❌ Authentication failed:', authError?.message);
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
    }
    
    logger.log('✅ User authenticated:', user.id);

    const formData = await request.formData();
    const prompt = formData.get('prompt') as string;
    const style = formData.get('style') as string;
    const quality = formData.get('quality') as 'standard' | 'high' | 'ultra';
    const aspectRatio = formData.get('aspectRatio') as string;
    // Ensure type is explicitly set - default to 'image' if not provided or invalid
    // Video generation should ONLY happen when explicitly requested via video button
    const typeParam = formData.get('type') as string;
    const type = (typeParam === 'video' ? 'video' : 'image') as 'image' | 'video';
    const uploadedImageData = formData.get('uploadedImageData') as string | null;
    const uploadedImageType = formData.get('uploadedImageType') as string | null;
    const projectId = formData.get('projectId') as string;
    const chainId = formData.get('chainId') as string | null;
    const referenceRenderId = formData.get('referenceRenderId') as string | null;
    const negativePrompt = formData.get('negativePrompt') as string | null;
    const imageType = formData.get('imageType') as string | null;
    const isPublic = formData.get('isPublic') === 'true';
    const seedParam = formData.get('seed') as string | null;
    const seed = seedParam ? parseInt(seedParam) : undefined;
    const versionContextData = formData.get('versionContext') as string | null;
    const environment = formData.get('environment') as string | null;
    const effect = formData.get('effect') as string | null;
    const styleTransferImageData = formData.get('styleTransferImageData') as string | null;
    const styleTransferImageType = formData.get('styleTransferImageType') as string | null;
    const temperatureParam = formData.get('temperature') as string | null;
    // Default temperature: 0.7 (balanced creativity/determinism)
    // Note: For Gemini 3, default is 1.0, but we use 0.7 for Gemini 2.5 compatibility
    const temperature = temperatureParam ? parseFloat(temperatureParam) : 0.7;

    logger.log('📝 Render parameters:', { 
      prompt, 
      style, 
      quality, 
      aspectRatio, 
      type, 
      imageType,
      negativePrompt: negativePrompt?.substring(0, 50) || 'none',
      hasImage: !!uploadedImageData, 
      projectId, 
      chainId,
      referenceRenderId,
      isPublic,
      seed
    });

    if (!prompt || !style || !quality || !aspectRatio || !type || !projectId) {
      logger.warn('❌ Missing required parameters');
      return NextResponse.json({ success: false, error: 'Missing required parameters (prompt, style, quality, aspectRatio, type, projectId)' }, { status: 400 });
    }

    // Calculate credits cost
    const baseCost = type === 'video' ? 5 : 1;
    const qualityMultiplier = quality === 'high' ? 2 : quality === 'ultra' ? 3 : 1;
    const creditsCost = baseCost * qualityMultiplier;

    logger.log('💰 Credits cost:', creditsCost);

    // Check if user has enough credits
    const deductResult = await deductCredits(
      creditsCost,
      `Generated ${type} - ${style} style`,
      undefined,
      'render'
    );

    if (!deductResult.success) {
      logger.warn('❌ Insufficient credits:', deductResult.error);
      return NextResponse.json({ success: false, error: deductResult.error || 'Insufficient credits' }, { status: 402 });
    }

    // Verify project exists and belongs to user
    const project = await ProjectsDAL.getById(projectId);
    if (!project || project.userId !== user.id) {
      logger.warn('❌ Project not found or access denied');
      return NextResponse.json({ success: false, error: 'Project not found or access denied' }, { status: 403 });
    }

    // Get or create chain for this project
    let finalChainId = chainId;
    
    if (!finalChainId) {
      logger.log('🔗 No chain specified, finding or creating default chain');
      
      // Check if project already has a default chain
      const existingChains = await RenderChainsDAL.getByProjectId(projectId);
      
      if (existingChains.length > 0) {
        // Use the most recent chain
        finalChainId = existingChains[0].id;
        logger.log('✅ Using existing chain:', finalChainId);
      } else {
        // Create a new default chain
        const chainName = project ? `${project.name} - Iterations` : 'Default Chain';
        const newChain = await RenderChainsDAL.create({
          projectId,
          name: chainName,
          description: 'Automatic chain for render iterations',
        });
        finalChainId = newChain.id;
        logger.log('✅ Created new chain:', finalChainId);
      }
    } else {
      logger.log('🔗 Using chain from request:', finalChainId);
    }

    // Get chain position
    const chainRenders = await RendersDAL.getByChainId(finalChainId);
    const chainPosition = chainRenders.length;

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
        if (chainRenders.length > 0) {
          const mostRecentRender = chainRenders
            .filter(r => r.status === 'completed')
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
          
          if (mostRecentRender) {
            validatedReferenceRenderId = mostRecentRender.id;
            logger.log('✅ Using most recent completed render as reference:', validatedReferenceRenderId);
            // Fetch the reference render's image
            if (mostRecentRender.outputUrl) {
              try {
                logger.log('📥 Fetching reference render image:', mostRecentRender.outputUrl);
                const imageResponse = await fetch(mostRecentRender.outputUrl);
                const imageBuffer = await imageResponse.arrayBuffer();
                referenceRenderImageData = Buffer.from(imageBuffer).toString('base64');
                referenceRenderImageType = mostRecentRender.outputUrl.includes('.png') ? 'image/png' : 
                                          mostRecentRender.outputUrl.includes('.jpg') || mostRecentRender.outputUrl.includes('.jpeg') ? 'image/jpeg' : 
                                          'image/png';
                referenceRenderPrompt = mostRecentRender.prompt;
                logger.log('✅ Reference render image fetched, size:', referenceRenderImageData.length);
              } catch (error) {
                logger.error('❌ Failed to fetch reference render image:', error);
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
            // Fetch the reference render's image
            if (referenceRender.outputUrl) {
              try {
                logger.log('📥 Fetching reference render image:', referenceRender.outputUrl);
                const imageResponse = await fetch(referenceRender.outputUrl);
                const imageBuffer = await imageResponse.arrayBuffer();
                referenceRenderImageData = Buffer.from(imageBuffer).toString('base64');
                referenceRenderImageType = referenceRender.outputUrl.includes('.png') ? 'image/png' : 
                                          referenceRender.outputUrl.includes('.jpg') || referenceRender.outputUrl.includes('.jpeg') ? 'image/jpeg' : 
                                          'image/png';
                referenceRenderPrompt = referenceRender.prompt;
                logger.log('✅ Reference render image fetched, size:', referenceRenderImageData.length);
              } catch (error) {
                logger.error('❌ Failed to fetch reference render image:', error);
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

    // Upload original image if provided
    let uploadedImageUrl: string | undefined = undefined;
    let uploadedImageKey: string | undefined = undefined;
    let uploadedImageId: string | undefined = undefined;

    if (uploadedImageData && uploadedImageType) {
      logger.log('📤 Uploading original image to storage');
      try {
        const buffer = Buffer.from(uploadedImageData, 'base64');
        const uploadedImageFile = new File([buffer], `upload_${Date.now()}.${uploadedImageType.split('/')[1] || 'png'}`, { type: uploadedImageType });
        
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
    }

    // Create render record in database
    logger.log('💾 Creating render record in database');
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
    });

    logger.log('✅ Render record created:', render.id, 'in chain:', finalChainId, 'at position:', chainPosition);

    // Update render status to processing
    await RendersDAL.updateStatus(render.id, 'processing');

    try {
      // Generate image/video
      logger.log('🎨 Starting AI generation');
      
      let result;
      
      // Branch based on type
      if (type === 'video') {
        logger.log('🎬 Using AISDKService for video generation');
        
        // Get video-specific parameters
        const model = (formData.get('model') as 'veo3' | 'veo3_fast') || 'veo3';
        const duration = parseInt(formData.get('duration') as string) || 5;
        const generationType = (formData.get('generationType') as 'text-to-video' | 'image-to-video' | 'keyframe-sequence') || 'text-to-video';
        
        logger.log('🎬 Video parameters:', { model, duration, generationType, aspectRatio });
        
        // Use Google Generative AI for video generation
        const videoResult = await aiService.generateVideo({
          prompt,
          duration: duration,
          aspectRatio: aspectRatio as '16:9' | '9:16',
          uploadedImageData: uploadedImageData || undefined,
        });
        
        if (!videoResult.success || !videoResult.data) {
          logger.error('❌ Video generation failed:', videoResult.error);
          result = {
            success: false,
            error: videoResult.error || 'Video generation failed'
          };
        } else {
          const videoBase64 = videoResult.data.toString('base64');
          result = {
            success: true,
            data: {
              imageData: videoBase64,
              processingTime: videoResult.processingTime || 60,
              provider: 'google-veo3'
            }
          };
        }
        
      } else {
        // Image generation
        logger.log('🎨 Using AISDKService for image generation');
        
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

        // Use reference render image if no uploaded image is provided
        // This allows iterative editing: "convert to photoreal" uses previous render as input
        const imageDataToUse = uploadedImageData || referenceRenderImageData;
        const imageTypeToUse = uploadedImageType || referenceRenderImageType;
        
        // Enhance prompt with context from previous render if available
        let contextualPrompt = prompt;
        if (referenceRenderPrompt && referenceRenderImageData) {
          // Add context about what we're editing
          contextualPrompt = `Based on the previous render (${referenceRenderPrompt}), ${prompt}`;
          logger.log('🔗 Using contextual prompt with reference render:', contextualPrompt.substring(0, 100));
        }
        
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
        });
      }

      if (!result.success || !result.data) {
        logger.error('❌ Generation failed:', result.error);
        await RendersDAL.updateStatus(render.id, 'failed', result.error);
        // Refund credits
        await addCredits(creditsCost, 'refund', 'Refund for failed generation', user.id, 'refund');
        return NextResponse.json({ success: false, error: result.error }, { status: 500 });
      }

      logger.log('✅ Generation successful, uploading to storage');

      // Upload generated image/video to storage
      let uploadResult;
      if (result.data.imageData) {
        // Use base64 data directly
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
        await RendersDAL.addToGallery(render.id, user.id, true);
      }

      logger.log('🎉 Render completed successfully');

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
        },
      });

    } catch (error) {
      logger.error('❌ Generation error:', error);
      await RendersDAL.updateStatus(render.id, 'failed', error instanceof Error ? error.message : 'Unknown error');
      // Refund credits
      await addCredits(creditsCost, 'refund', 'Refund for failed generation', user.id, 'refund');
      return NextResponse.json({ success: false, error: 'Generation failed' }, { status: 500 });
    }

  } catch (error) {
    logger.error('❌ API error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
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
