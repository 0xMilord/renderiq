/**
 * Integration tests for useInvoices hook
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useInvoices } from '@/lib/hooks/use-invoices';
import { getInvoicesAction } from '@/lib/actions/payment.actions';

vi.mock('@/lib/actions/payment.actions', () => ({
  getInvoicesAction: vi.fn(),
}));

describe('useInvoices', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with loading state', () => {
    vi.mocked(getInvoicesAction).mockResolvedValue({
      success: true,
      data: [],
    });

    const { result } = renderHook(() => useInvoices());

    expect(result.current.loading).toBe(true);
    expect(result.current.invoices).toEqual([]);
  });

  it('should fetch invoices on mount', async () => {
    const mockInvoices = [
      {
        id: 'invoice-1',
        invoiceNumber: 'INV-001',
        amount: '1000',
        status: 'paid',
      },
    ];

    vi.mocked(getInvoicesAction).mockResolvedValue({
      success: true,
      data: mockInvoices as any,
    });

    const { result } = renderHook(() => useInvoices());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.invoices).toEqual(mockInvoices);
  });

  it('should handle errors', async () => {
    vi.mocked(getInvoicesAction).mockResolvedValue({
      success: false,
      error: 'Failed to fetch',
    });

    const { result } = renderHook(() => useInvoices());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBeDefined();
  });

  it('should refresh invoices', async () => {
    vi.mocked(getInvoicesAction).mockResolvedValue({
      success: true,
      data: [],
    });

    const { result } = renderHook(() => useInvoices());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await result.current.refresh();

    expect(getInvoicesAction).toHaveBeenCalledTimes(2);
  });

  it('should filter by status', async () => {
    vi.mocked(getInvoicesAction).mockResolvedValue({
      success: true,
      data: [],
    });

    renderHook(() => useInvoices({ status: 'paid' }));

    await waitFor(() => {
      expect(getInvoicesAction).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'paid' })
      );
    });
  });
});

