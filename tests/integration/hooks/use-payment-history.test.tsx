/**
 * Integration tests for usePaymentHistory hook
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { usePaymentHistory } from '@/lib/hooks/use-payment-history';
import { getPaymentHistoryAction } from '@/lib/actions/payment.actions';

vi.mock('@/lib/actions/payment.actions', () => ({
  getPaymentHistoryAction: vi.fn(),
}));

describe('usePaymentHistory', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with loading state', () => {
    vi.mocked(getPaymentHistoryAction).mockResolvedValue({
      success: true,
      data: {
        payments: [],
        total: 0,
        limit: 20,
        offset: 0,
      },
    });

    const { result } = renderHook(() => usePaymentHistory());

    expect(result.current.loading).toBe(true);
    expect(result.current.payments).toEqual([]);
  });

  it('should fetch payment history on mount', async () => {
    const mockPayments = [
      { id: '1', type: 'credit_package', amount: '1000', status: 'completed' },
    ];

    vi.mocked(getPaymentHistoryAction).mockResolvedValue({
      success: true,
      data: {
        payments: mockPayments as any,
        total: 1,
        limit: 20,
        offset: 0,
      },
    });

    const { result } = renderHook(() => usePaymentHistory());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.payments).toEqual(mockPayments);
    expect(result.current.total).toBe(1);
  });

  it('should filter payments by type', async () => {
    vi.mocked(getPaymentHistoryAction).mockResolvedValue({
      success: true,
      data: {
        payments: [],
        total: 0,
        limit: 20,
        offset: 0,
      },
    });

    const { result } = renderHook(() => usePaymentHistory({ type: 'credit_package' }));

    await waitFor(() => {
      expect(getPaymentHistoryAction).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'credit_package' })
      );
    });
  });

  it('should support pagination', async () => {
    vi.mocked(getPaymentHistoryAction).mockResolvedValue({
      success: true,
      data: {
        payments: [],
        total: 50,
        limit: 20,
        offset: 0,
      },
    });

    const { result } = renderHook(() => usePaymentHistory());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.hasMore).toBe(true);
    expect(result.current.total).toBe(50);
  });

  it('should load more payments', async () => {
    vi.mocked(getPaymentHistoryAction)
      .mockResolvedValueOnce({
        success: true,
        data: {
          payments: Array(20).fill({ id: '1' }),
          total: 40,
          limit: 20,
          offset: 0,
        },
      })
      .mockResolvedValueOnce({
        success: true,
        data: {
          payments: Array(20).fill({ id: '2' }),
          total: 40,
          limit: 20,
          offset: 20,
        },
      });

    const { result } = renderHook(() => usePaymentHistory());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await result.current.loadMore();

    await waitFor(() => {
      expect(result.current.payments.length).toBe(40);
    });
  });

  it('should handle errors', async () => {
    vi.mocked(getPaymentHistoryAction).mockResolvedValue({
      success: false,
      error: 'Failed to fetch',
    });

    const { result } = renderHook(() => usePaymentHistory());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
  });

  it('should refresh payments', async () => {
    vi.mocked(getPaymentHistoryAction).mockResolvedValue({
      success: true,
      data: {
        payments: [],
        total: 0,
        limit: 20,
        offset: 0,
      },
    });

    const { result } = renderHook(() => usePaymentHistory());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await result.current.refresh();

    expect(getPaymentHistoryAction).toHaveBeenCalledTimes(2);
  });
});

