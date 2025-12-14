/**
 * Integration tests for /api/ai/completion route
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '@/app/api/ai/completion/route';
import { AISDKService } from '@/lib/services/ai-sdk-service';

vi.mock('@/lib/services/ai-sdk-service', () => ({
  AISDKService: {
    getInstance: vi.fn(),
  },
}));

describe('POST /api/ai/completion', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should generate text completion', async () => {
    const mockAIService = {
      generateText: vi.fn().mockResolvedValue({
        text: 'Generated text',
        usage: { promptTokens: 10, completionTokens: 20 },
      }),
    };

    vi.mocked(AISDKService.getInstance).mockReturnValue(mockAIService as any);

    const request = new NextRequest('http://localhost:3000/api/ai/completion', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: 'Complete this sentence',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.text).toBe('Generated text');
    expect(data.data.usage).toBeDefined();
    expect(mockAIService.generateText).toHaveBeenCalled();
  });

  it('should require prompt', async () => {
    const request = new NextRequest('http://localhost:3000/api/ai/completion', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toContain('Prompt is required');
  });

  it('should handle completion errors', async () => {
    const mockAIService = {
      generateText: vi.fn().mockRejectedValue(new Error('Completion failed')),
    };

    vi.mocked(AISDKService.getInstance).mockReturnValue(mockAIService as any);

    const request = new NextRequest('http://localhost:3000/api/ai/completion', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: 'Complete this',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
  });
});

