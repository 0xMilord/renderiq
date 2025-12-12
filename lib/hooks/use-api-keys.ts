'use client';

import { useState, useCallback, useEffect } from 'react';
import { createApiKeyAction, listApiKeysAction, revokeApiKeyAction, type ApiKeyResponse, type CreateApiKeyInput } from '@/lib/actions/api-keys.actions';
import { useAuthStore } from '@/lib/stores/auth-store';
import { toast } from 'sonner';

export function useApiKeys() {
  const { user } = useAuthStore();
  const [keys, setKeys] = useState<ApiKeyResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [revoking, setRevoking] = useState<string | null>(null);

  // Fetch API keys
  const refetch = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await listApiKeysAction(user.id);
      if (result.success && result.data) {
        setKeys(result.data);
      } else {
        setError(result.error || 'Failed to load API keys');
        toast.error(result.error || 'Failed to load API keys');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load API keys';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Initial fetch
  useEffect(() => {
    refetch();
  }, [refetch]);

  // Create API key
  const createKey = useCallback(async (input: CreateApiKeyInput): Promise<{ success: boolean; data?: ApiKeyResponse; error?: string }> => {
    if (!user?.id) {
      return { success: false, error: 'Authentication required' };
    }

    setCreating(true);
    setError(null);

    try {
      const result = await createApiKeyAction(input, user.id);
      if (result.success && result.data) {
        // Add to list (without the plain key for security)
        const keyWithoutPlain = { ...result.data };
        delete keyWithoutPlain.key;
        setKeys(prev => [keyWithoutPlain, ...prev]);
        toast.success('API key created successfully');
        return result;
      } else {
        setError(result.error || 'Failed to create API key');
        toast.error(result.error || 'Failed to create API key');
        return result;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create API key';
      setError(errorMessage);
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setCreating(false);
    }
  }, [user?.id]);

  // Revoke API key
  const revokeKey = useCallback(async (keyId: string): Promise<boolean> => {
    if (!user?.id) {
      toast.error('Authentication required');
      return false;
    }

    setRevoking(keyId);
    setError(null);

    try {
      const result = await revokeApiKeyAction(keyId, user.id);
      if (result.success) {
        // Remove from list
        setKeys(prev => prev.filter(k => k.id !== keyId));
        toast.success('API key revoked successfully');
        return true;
      } else {
        setError(result.error || 'Failed to revoke API key');
        toast.error(result.error || 'Failed to revoke API key');
        return false;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to revoke API key';
      setError(errorMessage);
      toast.error(errorMessage);
      return false;
    } finally {
      setRevoking(null);
    }
  }, [user?.id]);

  return {
    keys,
    loading,
    error,
    creating,
    revoking,
    createKey,
    revokeKey,
    refetch,
  };
}

