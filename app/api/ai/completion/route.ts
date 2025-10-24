import { google } from '@ai-sdk/google';
import { generateText } from 'ai';
import { NextRequest } from 'next/server';

/**
 * Vercel AI SDK Completion API Route
 * Replaces manual completion implementations
 */
export async function POST(request: NextRequest) {
  try {
    const { prompt } = await request.json();

    console.log('📝 AI Completion: Starting completion via Vercel AI SDK', {
      prompt: prompt?.substring(0, 100) + '...'
    });

    const result = await generateText({
      model: google('gemini-2.0-flash'),
      prompt,
      temperature: 0.7,
      maxTokens: 1000,
    });

    console.log('✅ AI Completion: Completion successful', {
      usage: result.usage,
      finishReason: result.finishReason
    });

    return Response.json({
      success: true,
      data: {
        text: result.text,
        usage: result.usage,
        finishReason: result.finishReason,
        provider: 'vercel-ai-sdk-google'
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
