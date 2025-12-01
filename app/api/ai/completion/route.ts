import { AISDKService } from '@/lib/services/ai-sdk-service';
import { NextRequest } from 'next/server';

/**
 * Google Generative AI Completion API Route
 */
export async function POST(request: NextRequest) {
  try {
    const { prompt } = await request.json();

    if (!prompt || typeof prompt !== 'string') {
      return Response.json(
        { success: false, error: 'Prompt is required' },
        { status: 400 }
      );
    }

    console.log('📝 AI Completion: Starting completion via Google Generative AI', {
      prompt: prompt.substring(0, 100) + '...'
    });

    const aiService = AISDKService.getInstance();
    const result = await aiService.generateText(prompt, {
      temperature: 0.7,
      maxTokens: 1000,
    });

    console.log('✅ AI Completion: Completion successful', {
      usage: result.usage
    });

    return Response.json({
      success: true,
      data: {
        text: result.text,
        usage: result.usage,
        provider: 'google-generative-ai'
      }
    });

  } catch (error) {
    console.error('❌ AI Completion: Completion failed', error);
    return Response.json(
      { 
        success: false,
        error: 'Completion failed', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}