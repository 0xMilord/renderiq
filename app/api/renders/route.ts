import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { ImageGenerationService } from '@/lib/services/image-generation';
import { addCredits, deductCredits } from '@/lib/actions/billing.actions';
import { ProjectsDAL } from '@/lib/dal/projects';
import { RendersDAL } from '@/lib/dal/renders';
import { RenderChainsDAL } from '@/lib/dal/render-chains';
import { StorageService } from '@/lib/services/storage';

const imageService = ImageGenerationService.getInstance();

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Starting render generation API call');
    
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.log('❌ Authentication failed:', authError?.message);
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
    }
    
    console.log('✅ User authenticated:', user.id);

    const formData = await request.formData();
    const prompt = formData.get('prompt') as string;
    const style = formData.get('style') as string;
    const quality = formData.get('quality') as 'standard' | 'high' | 'ultra';
    const aspectRatio = formData.get('aspectRatio') as string;
    const type = formData.get('type') as 'image' | 'video';
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

    console.log('📝 Render parameters:', { 
      prompt, 
      style, 
      quality, 
      aspectRatio, 
      type, 
      hasImage: !!uploadedImageData, 
      projectId, 
      chainId,
      referenceRenderId,
      isPublic,
      seed
    });

    if (!prompt || !style || !quality || !aspectRatio || !type || !projectId) {
      console.log('❌ Missing required parameters');
      return NextResponse.json({ success: false, error: 'Missing required parameters (prompt, style, quality, aspectRatio, type, projectId)' }, { status: 400 });
    }

    // Calculate credits cost
    const baseCost = type === 'video' ? 5 : 1;
    const qualityMultiplier = quality === 'high' ? 2 : quality === 'ultra' ? 3 : 1;
    const creditsCost = baseCost * qualityMultiplier;

    console.log('💰 Credits cost:', creditsCost);

    // Check if user has enough credits
    const deductResult = await deductCredits(
      creditsCost,
      `Generated ${type} - ${style} style`,
      undefined,
      'render'
    );

    if (!deductResult.success) {
      console.log('❌ Insufficient credits:', deductResult.error);
      return NextResponse.json({ success: false, error: deductResult.error || 'Insufficient credits' }, { status: 402 });
    }

    // Verify project exists and belongs to user
    const project = await ProjectsDAL.getById(projectId);
    if (!project || project.userId !== user.id) {
      console.log('❌ Project not found or access denied');
      return NextResponse.json({ success: false, error: 'Project not found or access denied' }, { status: 403 });
    }

    // Get or create chain for this project
    let finalChainId = chainId;
    
    if (!finalChainId) {
      console.log('🔗 No chain specified, finding or creating default chain');
      
      // Check if project already has a default chain
      const existingChains = await RenderChainsDAL.getByProjectId(projectId);
      
      if (existingChains.length > 0) {
        // Use the most recent chain
        finalChainId = existingChains[0].id;
        console.log('✅ Using existing chain:', finalChainId);
      } else {
        // Create a new default chain
        const chainName = project ? `${project.name} - Iterations` : 'Default Chain';
        const newChain = await RenderChainsDAL.create({
          projectId,
          name: chainName,
          description: 'Automatic chain for render iterations',
        });
        finalChainId = newChain.id;
        console.log('✅ Created new chain:', finalChainId);
      }
    } else {
      console.log('🔗 Using chain from request:', finalChainId);
    }

    // Get chain position
    const chainRenders = await RendersDAL.getByChainId(finalChainId);
    const chainPosition = chainRenders.length;

    console.log('📍 Chain position:', chainPosition);

    // Create render record in database
    console.log('💾 Creating render record in database');
    const render = await RendersDAL.create({
      projectId,
      userId: user.id,
      type,
      prompt,
      settings: {
        style,
        quality,
        aspectRatio,
      },
      status: 'pending',
      chainId: finalChainId,
      chainPosition,
      referenceRenderId: referenceRenderId || undefined,
    });

    console.log('✅ Render record created:', render.id, 'in chain:', finalChainId, 'at position:', chainPosition);

    // Update render status to processing
    await RendersDAL.updateStatus(render.id, 'processing');

    try {
      // Generate image/video
      console.log('🎨 Starting AI generation');
      const result = await imageService.generateImage({
        prompt,
        style,
        quality,
        aspectRatio,
        type,
        uploadedImageData: uploadedImageData || undefined,
        uploadedImageType: uploadedImageType || undefined,
        negativePrompt: negativePrompt || undefined,
        imageType: imageType || undefined,
        seed,
      });

      if (!result.success || !result.data) {
        console.log('❌ Generation failed:', result.error);
        await RendersDAL.updateStatus(render.id, 'failed', result.error);
        // Refund credits
        await addCredits(creditsCost, 'refund', 'Refund for failed generation', user.id, 'refund');
        return NextResponse.json({ success: false, error: result.error }, { status: 500 });
      }

      console.log('✅ Generation successful, uploading to storage');

      // Upload generated image/video to storage
      let uploadResult;
      if (result.data.imageData) {
        // Use base64 data directly
        console.log('📤 Uploading base64 image data to storage');
        const buffer = Buffer.from(result.data.imageData, 'base64');
        uploadResult = await StorageService.uploadFile(
          buffer,
          'renders',
          user.id,
          `render_${render.id}.png`,
          project.slug
        );
      } else if (result.data.imageUrl) {
        // Fallback to URL fetch (for video or other cases)
        console.log('📤 Fetching image from URL for storage');
        const response = await fetch(result.data.imageUrl);
        const blob = await response.blob();
        const outputFile = new File([blob], `render_${render.id}.${type === 'video' ? 'mp4' : 'png'}`);
        uploadResult = await StorageService.uploadFile(
          outputFile,
          'renders',
          user.id,
          undefined,
          project.slug
        );
      } else {
        console.error('❌ No image data available:', { 
          hasImageData: !!result.data.imageData, 
          hasImageUrl: !!result.data.imageUrl,
          dataKeys: Object.keys(result.data)
        });
        throw new Error('No image data or URL received from generation service');
      }

      console.log('✅ File uploaded to storage:', uploadResult.url);

      // Update render with output URL
      await RendersDAL.updateOutput(render.id, uploadResult.url, uploadResult.key, 'completed', Math.round(result.data.processingTime));

      // Add to gallery if public
      if (isPublic) {
        console.log('📸 Adding render to public gallery');
        await RendersDAL.addToGallery(render.id, user.id, true);
      }

      console.log('🎉 Render completed successfully');

      return NextResponse.json({
        success: true,
        data: {
          id: render.id,
          status: 'completed',
          outputUrl: uploadResult.url,
          processingTime: result.data.processingTime,
          provider: result.data.provider,
        },
      });

    } catch (error) {
      console.error('❌ Generation error:', error);
      await RendersDAL.updateStatus(render.id, 'failed', error instanceof Error ? error.message : 'Unknown error');
      // Refund credits
      await addCredits(creditsCost, 'refund', 'Refund for failed generation', user.id, 'refund');
      return NextResponse.json({ success: false, error: 'Generation failed' }, { status: 500 });
    }

  } catch (error) {
    console.error('❌ API error:', error);
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
    console.error('❌ Get renders error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch renders' }, { status: 500 });
  }
}
