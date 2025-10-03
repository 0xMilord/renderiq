import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { ImageGenerationService } from '@/lib/services/image-generation';
import { addCredits, deductCredits } from '@/lib/actions/billing.actions';
import { RendersDAL } from '@/lib/dal/renders';
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
    const uploadedImage = formData.get('uploadedImage') as File | null;
    const projectId = formData.get('projectId') as string;

    console.log('📝 Render parameters:', { prompt, style, quality, aspectRatio, type, hasImage: !!uploadedImage, projectId });

    if (!prompt || !style || !quality || !aspectRatio || !type) {
      console.log('❌ Missing required parameters');
      return NextResponse.json({ success: false, error: 'Missing required parameters' }, { status: 400 });
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

    // Create render record in database
    console.log('💾 Creating render record in database');
    const render = await RendersDAL.create({
      projectId: projectId || null,
      userId: user.id,
      type,
      prompt,
      settings: {
        style,
        quality,
        aspectRatio,
      },
      status: 'pending',
    });

    console.log('✅ Render record created:', render.id);

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
        uploadedImage: uploadedImage || undefined,
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
      const outputFile = new File([await fetch(result.data.imageUrl).then(r => r.blob())], `render_${render.id}.${type === 'video' ? 'mp4' : 'png'}`);
      const uploadResult = await StorageService.uploadFile(
        outputFile,
        'renders',
        user.id
      );

      console.log('✅ File uploaded to storage:', uploadResult.url);

      // Update render with output URL
      await RendersDAL.updateOutput(render.id, uploadResult.url, uploadResult.key, 'completed', result.data.processingTime);

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
