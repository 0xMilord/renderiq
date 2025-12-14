/**
 * Integration tests for /api/ai/enhance-prompt route
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '@/app/api/ai/enhance-prompt/route';
import { AISDKService } from '@/lib/services/ai-sdk-service';

vi.mock('@/lib/services/ai-sdk-service', () => ({
  AISDKService: {
    getInstance: vi.fn(),
  },
}));

describe('POST /api/ai/enhance-prompt', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should enhance prompt', async () => {
    const mockAIService = {
      enhancePrompt: vi.fn().mockResolvedValue({
        enhancedPrompt: 'Enhanced prompt',
        clarity: 85,
        processingTime: 500,
        provider: 'google-generative-ai',
      }),
    };

    vi.mocked(AISDKService.getInstance).mockReturnValue(mockAIService as any);

    const request = new NextRequest('http://localhost:3000/api/ai/enhance-prompt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: 'A house',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toBeDefined();
    expect(mockAIService.enhancePrompt).toHaveBeenCalledWith('A house');
  });

  it('should require prompt', async () => {
    const request = new NextRequest('http://localhost:3000/api/ai/enhance-prompt', {
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

  it('should handle enhancement errors', async () => {
    const mockAIService = {
      enhancePrompt: vi.fn().mockRejectedValue(new Error('Enhancement failed')),
    };

    vi.mocked(AISDKService.getInstance).mockReturnValue(mockAIService as any);

    const request = new NextRequest('http://localhost:3000/api/ai/enhance-prompt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: 'A house',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
  });
});

