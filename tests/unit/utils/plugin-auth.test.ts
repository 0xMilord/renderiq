/**
 * Tests for plugin authentication utility
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import {
  authenticatePluginRequest,
  hasRequiredScope,
} from '@/lib/utils/plugin-auth';
import { createClient } from '@/lib/supabase/server';
import { ApiKeysDAL } from '@/lib/dal/api-keys';

// Mock dependencies
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

vi.mock('@/lib/dal/api-keys', () => ({
  ApiKeysDAL: {
    verifyKey: vi.fn(),
    hasScope: vi.fn(),
  },
}));

describe('Plugin Auth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('authenticatePluginRequest', () => {
    it('should authenticate with Bearer token', async () => {
      const mockUser = { id: 'user-123' };
      const mockSupabase = {
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: mockUser },
            error: null,
          }),
        },
      };

      vi.mocked(createClient).mockResolvedValue(mockSupabase as any);

      const request = new NextRequest('https://example.com', {
        headers: {
          'Authorization': 'Bearer valid-token',
        },
      });

      const result = await authenticatePluginRequest(request);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.auth.user.id).toBe('user-123');
        expect(result.auth.authType).toBe('bearer');
      }
    });

    it('should authenticate with API key', async () => {
      const mockApiKey = {
        id: 'key-123',
        scopes: ['renders:read', 'renders:write'],
      };
      const mockUser = { id: 'user-123' };

      vi.mocked(ApiKeysDAL.verifyKey).mockResolvedValue({
        user: mockUser as any,
        apiKey: mockApiKey as any,
      });

      const request = new NextRequest('https://example.com', {
        headers: {
          'x-api-key': 'valid-api-key',
        },
      });

      const result = await authenticatePluginRequest(request);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.auth.user.id).toBe('user-123');
        expect(result.auth.authType).toBe('api_key');
        expect(result.auth.apiKey?.id).toBe('key-123');
      }
    });

    it('should reject request without auth', async () => {
      const request = new NextRequest('https://example.com');

      const result = await authenticatePluginRequest(request);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Authentication required');
      }
    });

    it('should reject invalid Bearer token', async () => {
      const mockSupabase = {
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: null },
            error: new Error('Invalid token'),
          }),
        },
      };

      vi.mocked(createClient).mockResolvedValue(mockSupabase as any);

      const request = new NextRequest('https://example.com', {
        headers: {
          'Authorization': 'Bearer invalid-token',
        },
      });

      const result = await authenticatePluginRequest(request);

      expect(result.success).toBe(false);
    });
  });

  describe('hasRequiredScope', () => {
    it('should return true for Bearer token auth', () => {
      const auth = {
        user: { id: 'user-123' },
        authType: 'bearer' as const,
      };

      expect(hasRequiredScope(auth, 'renders:write')).toBe(true);
    });

    it('should check scope for API key auth', () => {
      const auth = {
        user: { id: 'user-123' },
        authType: 'api_key' as const,
        apiKey: {
          id: 'key-123',
          scopes: ['renders:read', 'renders:write'],
        },
      };

      vi.mocked(ApiKeysDAL.hasScope).mockReturnValue(true);

      expect(hasRequiredScope(auth, 'renders:write')).toBe(true);
      expect(ApiKeysDAL.hasScope).toHaveBeenCalled();
    });

    it('should return false for API key without scope', () => {
      const auth = {
        user: { id: 'user-123' },
        authType: 'api_key' as const,
        apiKey: {
          id: 'key-123',
          scopes: ['renders:read'],
        },
      };

      vi.mocked(ApiKeysDAL.hasScope).mockReturnValue(false);

      expect(hasRequiredScope(auth, 'renders:write')).toBe(false);
    });
  });
});

