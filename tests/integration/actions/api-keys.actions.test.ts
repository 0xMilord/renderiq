/**
 * Integration tests for API keys actions
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  createApiKeyAction,
  getApiKeysAction,
  revokeApiKeyAction,
  updateApiKeyAction,
} from '@/lib/actions/api-keys.actions';
import { setupTestDB, teardownTestDB, createTestUser } from '../../fixtures/database';
import { getUserFromAction } from '@/lib/utils/get-user-from-action';
import { ApiKeysDAL } from '@/lib/dal/api-keys';

vi.mock('@/lib/utils/get-user-from-action');
vi.mock('@/lib/dal/api-keys', () => ({
  ApiKeysDAL: {
    create: vi.fn(),
    getByUserId: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('API Keys Actions', () => {
  let testUser: any;

  beforeEach(async () => {
    await setupTestDB();
    testUser = await createTestUser();

    vi.mocked(getUserFromAction).mockResolvedValue({
      user: testUser as any,
      userId: testUser.id,
      fromCache: false,
    });
  });

  afterEach(async () => {
    await teardownTestDB();
    vi.clearAllMocks();
  });

  describe('createApiKeyAction', () => {
    it('should create API key', async () => {
      const mockApiKey = {
        id: 'key-id',
        name: 'Test Key',
        key: 'rk_test_1234567890',
        keyPrefix: 'rk_test_',
        scopes: ['renders:create'],
        expiresAt: null,
        isActive: true,
        createdAt: new Date(),
      };

      vi.mocked(ApiKeysDAL.create).mockResolvedValue(mockApiKey as any);

      const result = await createApiKeyAction({
        name: 'Test Key',
        scopes: ['renders:create'],
      });

      expect(result.success).toBe(true);
      expect(result.data?.key).toBeDefined();
      expect(result.data?.keyPrefix).toBe('rk_test_');
    });

    it('should validate name', async () => {
      const result = await createApiKeyAction({
        name: '',
        scopes: ['renders:create'],
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('name is required');
    });

    it('should validate scopes', async () => {
      const result = await createApiKeyAction({
        name: 'Test Key',
        scopes: [],
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('scope is required');
    });

    it('should reject invalid scopes', async () => {
      const result = await createApiKeyAction({
        name: 'Test Key',
        scopes: ['invalid:scope'],
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid scopes');
    });
  });

  describe('getApiKeysAction', () => {
    it('should get user API keys', async () => {
      const mockKeys = [
        { id: 'key-1', name: 'Key 1', keyPrefix: 'rk_test_' },
      ];

      vi.mocked(ApiKeysDAL.getByUserId).mockResolvedValue(mockKeys as any);

      const result = await getApiKeysAction();

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });
  });

  describe('revokeApiKeyAction', () => {
    it('should revoke API key', async () => {
      vi.mocked(ApiKeysDAL.delete).mockResolvedValue(undefined);

      const result = await revokeApiKeyAction('key-id');

      expect(result.success).toBe(true);
      expect(ApiKeysDAL.delete).toHaveBeenCalledWith('key-id', testUser.id);
    });
  });
});

