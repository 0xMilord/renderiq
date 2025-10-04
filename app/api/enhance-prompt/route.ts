import { NextRequest, NextResponse } from 'next/server';
import { PromptEnhancementService } from '@/lib/services/prompt-enhancement';

const enhancementService = PromptEnhancementService.getInstance();

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Starting prompt enhancement API call');
    
    const formData = await request.formData();
    const prompt = formData.get('prompt') as string;

    if (!prompt || !prompt.trim()) {
      console.log('❌ Missing prompt parameter');
      return NextResponse.json({ success: false, error: 'Prompt is required' }, { status: 400 });
    }

    console.log('🔍 Enhancing prompt:', prompt.substring(0, 100) + '...');

    // Enhance the prompt
    const result = await enhancementService.enhancePrompt(prompt);

    if (!result.success || !result.data) {
      console.log('❌ Enhancement failed:', result.error);
      return NextResponse.json({ success: false, error: result.error }, { status: 500 });
    }

    console.log('✅ Enhancement successful:', {
      originalLength: result.data.originalPrompt.length,
      enhancedLength: result.data.enhancedPrompt.length,
      processingTime: result.data.processingTime
    });

    return NextResponse.json({ 
      success: true, 
      data: result.data 
    });

  } catch (error) {
    console.error('❌ Prompt enhancement API error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Internal server error' 
    }, { status: 500 });
  }
}
