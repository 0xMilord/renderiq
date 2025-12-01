import { AISDKService } from '@/lib/services/ai-sdk-service';
import { NextRequest } from 'next/server';
import { logger } from '@/lib/utils/logger';

/**
 * Google Generative AI Chat API Route with streaming support
 */
export async function POST(request: NextRequest) {
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
    const formattedMessages = messages.map((msg: any) => ({
      role: msg.role === 'user' ? 'user' : 'assistant',
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

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error) {
    logger.error('❌ AI Chat: Chat failed', error);
    return Response.json(
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
  }
}