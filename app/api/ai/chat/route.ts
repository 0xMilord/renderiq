import { AISDKService } from '@/lib/services/ai-sdk-service';
import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/utils/logger';
import { handleCORSPreflight, withCORS } from '@/lib/middleware/cors';

/**
 * Google Generative AI Chat API Route with streaming support
 */
export async function POST(request: NextRequest) {
  // ⚡ Fast path: Handle CORS preflight immediately
  const preflight = handleCORSPreflight(request);
  if (preflight) return preflight;

  try {
    const { messages } = await request.json();

    if (!messages || !Array.isArray(messages)) {
      return Response.json(
        { success: false, error: 'Messages array is required' },
        { status: 400 }
      );
    }

    logger.log('💬 AI Chat: Starting chat via Google Generative AI', {
      messageCount: messages.length
    });

    // Convert messages to the format expected by our service
    const formattedMessages: { role: 'user' | 'assistant'; content: string }[] = messages.map((msg: any) => ({
      role: (msg.role === 'user' ? 'user' : 'assistant') as 'user' | 'assistant',
      content: typeof msg.content === 'string' ? msg.content : msg.content?.text || JSON.stringify(msg.content),
    }));

    const aiService = AISDKService.getInstance();

    // Create a readable stream for the response
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const encoder = new TextEncoder();
          
          // Stream the chat response
          for await (const chunk of aiService.streamChat(formattedMessages)) {
            // Format as Server-Sent Events
            const data = encoder.encode(`data: ${JSON.stringify({ content: chunk })}\n\n`);
            controller.enqueue(data);
          }

          // Send done signal
          const done = encoder.encode('data: [DONE]\n\n');
          controller.enqueue(done);
          controller.close();
        } catch (error) {
          logger.error('❌ Stream error:', error);
          const encoder = new TextEncoder();
          const errorData = encoder.encode(
            `data: ${JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' })}\n\n`
          );
          controller.enqueue(errorData);
          controller.close();
        }
      },
    });

    // For streaming responses, add CORS headers manually
    const origin = request.headers.get('origin');
    const headers = new Headers({
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    });
    
    // Add CORS headers for streaming response
    if (origin) {
      const { isAllowedOrigin } = await import('@/lib/utils/security');
      if (isAllowedOrigin(origin)) {
        headers.set('Access-Control-Allow-Origin', origin);
        headers.set('Access-Control-Allow-Credentials', 'true');
      }
    }
    headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
    headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    return new Response(stream, { headers });

  } catch (error) {
    logger.error('❌ AI Chat: Chat failed', error);
    const errorResponse = NextResponse.json(
      { 
        success: false,
        error: 'Chat failed', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
    return withCORS(errorResponse, request);
  }
}