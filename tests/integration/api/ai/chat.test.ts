/**
 * Integration tests for /api/ai/chat route
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '@/app/api/ai/chat/route';
import { AISDKService } from '@/lib/services/ai-sdk-service';

vi.mock('@/lib/services/ai-sdk-service', () => ({
  AISDKService: {
    getInstance: vi.fn(),
  },
}));

describe('POST /api/ai/chat', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should stream chat response', async () => {
    const mockStream = async function* () {
      yield 'Hello';
      yield ' World';
    };

    const mockAIService = {
      streamChat: vi.fn().mockReturnValue(mockStream()),
    };

    vi.mocked(AISDKService.getInstance).mockReturnValue(mockAIService as any);

    const request = new NextRequest('http://localhost:3000/api/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [
          { role: 'user', content: 'Hello' },
        ],
      }),
    });

    const response = await POST(request);

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toBe('text/event-stream');
    expect(mockAIService.streamChat).toHaveBeenCalled();
  });

  it('should require messages array', async () => {
    const request = new NextRequest('http://localhost:3000/api/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toContain('Messages array is required');
  });

  it('should handle streaming errors', async () => {
    const mockAIService = {
      streamChat: vi.fn().mockRejectedValue(new Error('Stream failed')),
    };

    vi.mocked(AISDKService.getInstance).mockReturnValue(mockAIService as any);

    const request = new NextRequest('http://localhost:3000/api/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [{ role: 'user', content: 'Hello' }],
      }),
    });

    const response = await POST(request);
    // Stream errors are handled in the stream itself
    expect(response.status).toBe(200);
  });
});

