/**
 * Tests for get-user-from-action utility
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getUserFromAction } from '@/lib/utils/get-user-from-action';
import { getCachedUser } from '@/lib/services/auth-cache';

// Mock the auth cache service
vi.mock('@/lib/services/auth-cache', () => ({
  getCachedUser: vi.fn(),
}));

describe('getUserFromAction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return user when userId matches cached user', async () => {
    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
    };

    vi.mocked(getCachedUser).mockResolvedValue({
      user: mockUser as any,
      fromCache: true,
    });

    const result = await getUserFromAction('user-123');

    expect(result.user).toBeDefined();
    expect(result.userId).toBe('user-123');
    expect(result.fromCache).toBe(true);
  });

  it('should return null when userId does not match cached user', async () => {
    const mockUser = {
      id: 'user-456',
      email: 'test@example.com',
    };

    vi.mocked(getCachedUser).mockResolvedValue({
      user: mockUser as any,
      fromCache: true,
    });

    const result = await getUserFromAction('user-123');

    expect(result.user).toBeNull();
    expect(result.userId).toBeNull();
    expect(result.fromCache).toBe(false);
  });

  it('should use cached user when no userId provided', async () => {
    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
    };

    vi.mocked(getCachedUser).mockResolvedValue({
      user: mockUser as any,
      fromCache: false,
    });

    const result = await getUserFromAction();

    expect(result.user).toBeDefined();
    expect(result.userId).toBe('user-123');
    expect(result.fromCache).toBe(false);
  });

  it('should return null when no cached user and no userId', async () => {
    vi.mocked(getCachedUser).mockResolvedValue({
      user: null,
      fromCache: false,
    });

    const result = await getUserFromAction();

    expect(result.user).toBeNull();
    expect(result.userId).toBeNull();
    expect(result.fromCache).toBe(false);
  });

  it('should handle null userId from client', async () => {
    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
    };

    vi.mocked(getCachedUser).mockResolvedValue({
      user: mockUser as any,
      fromCache: true,
    });

    const result = await getUserFromAction(null);

    expect(result.user).toBeDefined();
    expect(result.userId).toBe('user-123');
  });
});

