/**
 * Unit tests for PaymentHistoryService
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PaymentHistoryService } from '@/lib/services/payment-history.service';
import { db } from '@/lib/db';
import { paymentOrders, creditPackages, subscriptionPlans } from '@/lib/db/schema';

vi.mock('@/lib/db', () => ({
  db: {
    select: vi.fn(),
  },
}));

describe('PaymentHistoryService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getPaymentHistory', () => {
    it('should get payment history with filters', async () => {
      const mockPayments = [
        {
          payment: { id: '1', type: 'credit_package', status: 'completed' },
          package: { id: 'pkg-1', name: 'Package 1' },
          plan: null,
        },
      ];

      vi.mocked(db.select).mockReturnValue({
        from: vi.fn().mockReturnValue({
          leftJoin: vi.fn().mockReturnValue({
            leftJoin: vi.fn().mockReturnValue({
              where: vi.fn().mockReturnValue({
                orderBy: vi.fn().mockReturnValue({
                  limit: vi.fn().mockReturnValue({
                    offset: vi.fn().mockResolvedValue(mockPayments),
                  }),
                }),
              }),
            }),
          }),
        }),
      } as any);

      // Mock count query
      const mockCount = [{ count: 1 }];
      vi.mocked(db.select).mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue(mockCount),
        }),
      } as any);

      const result = await PaymentHistoryService.getPaymentHistory({
        userId: 'user-123',
        type: 'credit_package',
        status: 'completed',
        limit: 20,
        offset: 0,
      });

      expect(result.success).toBe(true);
      expect(result.data?.payments).toBeDefined();
    });

    it('should handle date filters', async () => {
      const startDate = new Date('2025-01-01');
      const endDate = new Date('2025-01-31');

      vi.mocked(db.select).mockReturnValue({
        from: vi.fn().mockReturnValue({
          leftJoin: vi.fn().mockReturnValue({
            leftJoin: vi.fn().mockReturnValue({
              where: vi.fn().mockReturnValue({
                orderBy: vi.fn().mockReturnValue({
                  limit: vi.fn().mockReturnValue({
                    offset: vi.fn().mockResolvedValue([]),
                  }),
                }),
              }),
            }),
          }),
        }),
      } as any);

      vi.mocked(db.select).mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([{ count: 0 }]),
        }),
      } as any);

      const result = await PaymentHistoryService.getPaymentHistory({
        userId: 'user-123',
        startDate,
        endDate,
      });

      expect(result.success).toBe(true);
    });

    it('should handle empty results', async () => {
      vi.mocked(db.select).mockReturnValue({
        from: vi.fn().mockReturnValue({
          leftJoin: vi.fn().mockReturnValue({
            leftJoin: vi.fn().mockReturnValue({
              where: vi.fn().mockReturnValue({
                orderBy: vi.fn().mockReturnValue({
                  limit: vi.fn().mockReturnValue({
                    offset: vi.fn().mockResolvedValue([]),
                  }),
                }),
              }),
            }),
          }),
        }),
      } as any);

      vi.mocked(db.select).mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([{ count: 0 }]),
        }),
      } as any);

      const result = await PaymentHistoryService.getPaymentHistory({
        userId: 'user-123',
      });

      expect(result.success).toBe(true);
      expect(result.data?.payments).toEqual([]);
      expect(result.data?.total).toBe(0);
    });
  });
});

