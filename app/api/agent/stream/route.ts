import { NextRequest } from 'next/server';
import { AgentService } from '@/agent-kit/worker/do/AgentService';
import type { AgentPrompt } from '@/agent-kit/shared/types/AgentPrompt';
import { logger } from '@/lib/utils/logger';

// Ensure this route runs on Node.js runtime for streaming
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Agent streaming endpoint
 * Handles agent prompts and streams actions back to the client
 * Uses AgentService from agent-kit with Google Gemini integration
 */
export async function POST(req: NextRequest) {
  try {
    const prompt = (await req.json()) as AgentPrompt;

    logger.log('🤖 Agent: Received prompt request', {
      modelName: prompt.modelName?.type,
      messageCount: prompt.messages?.length || 0,
    });

    // Initialize AgentService with environment variables
    const service = new AgentService({
      GOOGLE_API_KEY: process.env.GEMINI_API_KEY || 
                     process.env.GOOGLE_GENERATIVE_AI_API_KEY || 
                     process.env.GOOGLE_AI_API_KEY || '',
      // AGENT_DURABLE_OBJECT is not used in AgentService.stream(), can be stubbed
      // @ts-expect-error - DurableObjectNamespace not needed for Next.js
      AGENT_DURABLE_OBJECT: {} as any,
    });

    // Create a readable stream for SSE
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          let actionCount = 0;
          
          // Stream actions from AgentService
          for await (const action of service.stream(prompt)) {
            actionCount++;
            
            // Format as SSE data line
            const chunk = `data: ${JSON.stringify(action)}\n\n`;
            controller.enqueue(encoder.encode(chunk));
          }

          logger.log('✅ Agent: Stream completed', {
            actionCount,
            modelName: prompt.modelName?.type,
          });

          controller.close();
        } catch (err) {
          logger.error('❌ Agent: Stream error', err);
          
          // Send error as SSE data
          const errorChunk = `data: ${JSON.stringify({ 
            error: err instanceof Error ? err.message : 'Unknown error',
            complete: true 
          })}\n\n`;
          controller.enqueue(encoder.encode(errorChunk));
          controller.close();
        }
      },
    });

    // Return SSE response
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no',
        'Transfer-Encoding': 'chunked',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  } catch (error) {
    logger.error('❌ Agent: Route error', error);
    
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
}

// Handle OPTIONS for CORS
export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

