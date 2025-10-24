import { google } from '@ai-sdk/google';
import { streamText } from 'ai';
import { NextRequest } from 'next/server';

/**
 * Vercel AI SDK Chat API Route
 * Replaces manual chat implementations
 */
export async function POST(request: NextRequest) {
  try {
    const { messages } = await request.json();

    console.log('💬 AI Chat: Starting chat via Vercel AI SDK', {
      messageCount: messages?.length || 0
    });

    const result = await streamText({
      model: google('gemini-2.0-flash'),
      messages,
      temperature: 0.7,
      maxTokens: 1000,
      onFinish: (result) => {
        console.log('✅ AI Chat: Chat completed', {
          usage: result.usage,
          finishReason: result.finishReason
        });
      },
    });

    return result.toDataStreamResponse();

  } catch (error) {
    console.error('❌ AI Chat: Chat failed', error);
    return new Response(
      JSON.stringify({ 
        error: 'Chat failed', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { 
        status: 500, 
        headers: { 'Content-Type': 'application/json' } 
      }
    );
  }
}
