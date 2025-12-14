/**
 * Integration tests for useApiKeys hook
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useApiKeys } from '@/lib/hooks/use-api-keys';
import { createApiKeyAction, listApiKeysAction, revokeApiKeyAction } from '@/lib/actions/api-keys.actions';
import { useAuthStore } from '@/lib/stores/auth-store';

vi.mock('@/lib/actions/api-keys.actions', () => ({
  createApiKeyAction: vi.fn(),
  listApiKeysAction: vi.fn(),
  revokeApiKeyAction: vi.fn(),
}));

vi.mock('@/lib/stores/auth-store', () => ({
  useAuthStore: vi.fn(),
}));

describe('useApiKeys', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAuthStore).mockReturnValue({
      user: { id: 'user-id' },
    } as any);
  });

  it('should initialize with loading state', () => {
    vi.mocked(listApiKeysAction).mockResolvedValue({
      success: true,
      data: [],
    });

    const { result } = renderHook(() => useApiKeys());

    expect(result.current.loading).toBe(true);
    expect(result.current.keys).toEqual([]);
  });

  it('should fetch API keys on mount', async () => {
    const mockKeys = [
      { id: 'key-1', name: 'Key 1', keyPrefix: 'rk_test_' },
    ];

    vi.mocked(listApiKeysAction).mockResolvedValue({
      success: true,
      data: mockKeys,
    });

    const { result } = renderHook(() => useApiKeys());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.keys).toEqual(mockKeys);
  });

  it('should create API key', async () => {
    vi.mocked(listApiKeysAction).mockResolvedValue({
      success: true,
      data: [],
    });

    const mockNewKey = {
      id: 'key-2',
      name: 'New Key',
      key: 'rk_test_1234567890',
      keyPrefix: 'rk_test_',
    };

    vi.mocked(createApiKeyAction).mockResolvedValue({
      success: true,
      data: mockNewKey,
    });

    const { result } = renderHook(() => useApiKeys());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const createResult = await result.current.createKey({
      name: 'New Key',
      scopes: ['renders:create'],
    });

    expect(createResult.success).toBe(true);
    expect(result.current.keys.length).toBeGreaterThan(0);
  });

  it('should revoke API key', async () => {
    const mockKeys = [
      { id: 'key-1', name: 'Key 1', keyPrefix: 'rk_test_' },
    ];

    vi.mocked(listApiKeysAction).mockResolvedValue({
      success: true,
      data: mockKeys,
    });

    vi.mocked(revokeApiKeyAction).mockResolvedValue({
      success: true,
    });

    const { result } = renderHook(() => useApiKeys());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const revokeResult = await result.current.revokeKey('key-1');

    expect(revokeResult).toBe(true);
    expect(result.current.keys.find(k => k.id === 'key-1')).toBeUndefined();
  });
});

