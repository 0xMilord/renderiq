/**
 * Integration tests for payment actions
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  getPaymentHistoryAction,
  getInvoicesAction,
  getInvoiceByNumberAction,
  createPaymentOrderAction,
  createPaymentSubscriptionAction,
  getPaymentOrderAction,
  getPaymentOrderBySubscriptionAction,
  getReceiptAction,
  generateReceiptAction,
  cancelPaymentOrderAction,
  cancelPaymentSubscriptionAction,
} from '@/lib/actions/payment.actions';
import { setupTestDB, teardownTestDB, createTestUser, createTestProject } from '../../fixtures/database';
import { getCachedUser } from '@/lib/services/auth-cache';
import { PaymentHistoryService } from '@/lib/services/payment-history.service';
import { InvoiceService } from '@/lib/services/invoice.service';
import { ReceiptService } from '@/lib/services/receipt.service';
import { PaymentProviderFactory } from '@/lib/services/payment-provider.factory';
import { db } from '@/lib/db';
import { paymentOrders, creditPackages, subscriptionPlans } from '@/lib/db/schema';

vi.mock('@/lib/services/auth-cache');
vi.mock('@/lib/services/payment-history.service');
vi.mock('@/lib/services/invoice.service');
vi.mock('@/lib/services/receipt.service');
vi.mock('@/lib/services/payment-provider.factory');
vi.mock('@/lib/utils/country-detection', () => ({
  detectUserCountry: vi.fn().mockResolvedValue('US'),
}));

describe('Payment Actions', () => {
  let testUser: any;
  let testProject: any;

  beforeEach(async () => {
    await setupTestDB();
    testUser = await createTestUser();
    testProject = await createTestProject(testUser.id);

    vi.mocked(getCachedUser).mockResolvedValue({
      user: testUser as any,
      fromCache: false,
    });
  });

  afterEach(async () => {
    await teardownTestDB();
    vi.clearAllMocks();
  });

  describe('getPaymentHistoryAction', () => {
    it('should get payment history', async () => {
      vi.mocked(PaymentHistoryService.getPaymentHistory).mockResolvedValue({
        success: true,
        data: {
          payments: [],
          total: 0,
          limit: 20,
          offset: 0,
        },
      });

      const result = await getPaymentHistoryAction();

      expect(result.success).toBe(true);
      expect(PaymentHistoryService.getPaymentHistory).toHaveBeenCalled();
    });

    it('should require authentication', async () => {
      vi.mocked(getCachedUser).mockResolvedValue({
        user: null,
        fromCache: false,
      });

      const result = await getPaymentHistoryAction();

      expect(result.success).toBe(false);
      expect(result.error).toContain('Authentication');
    });

    it('should filter by type', async () => {
      vi.mocked(PaymentHistoryService.getPaymentHistory).mockResolvedValue({
        success: true,
        data: {
          payments: [],
          total: 0,
          limit: 20,
          offset: 0,
        },
      });

      await getPaymentHistoryAction({ type: 'credit_package' });

      expect(PaymentHistoryService.getPaymentHistory).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'credit_package' })
      );
    });
  });

  describe('getInvoicesAction', () => {
    it('should get invoices', async () => {
      vi.mocked(InvoiceService.getUserInvoices).mockResolvedValue({
        success: true,
        data: [],
      });

      const result = await getInvoicesAction();

      expect(result.success).toBe(true);
    });

    it('should require authentication', async () => {
      vi.mocked(getCachedUser).mockResolvedValue({
        user: null,
        fromCache: false,
      });

      const result = await getInvoicesAction();

      expect(result.success).toBe(false);
    });
  });

  describe('getInvoiceByNumberAction', () => {
    it('should get invoice by number', async () => {
      vi.mocked(InvoiceService.getInvoiceByNumber).mockResolvedValue({
        success: true,
        data: {
          id: 'invoice-123',
          invoiceNumber: 'INV-123',
          userId: testUser.id,
        } as any,
      });

      const result = await getInvoiceByNumberAction('INV-123');

      expect(result.success).toBe(true);
    });

    it('should reject unauthorized access', async () => {
      vi.mocked(InvoiceService.getInvoiceByNumber).mockResolvedValue({
        success: true,
        data: {
          id: 'invoice-123',
          invoiceNumber: 'INV-123',
          userId: 'other-user-id',
        } as any,
      });

      const result = await getInvoiceByNumberAction('INV-123');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Unauthorized');
    });
  });

  describe('createPaymentOrderAction', () => {
    it('should create payment order', async () => {
      const mockPackage = {
        id: 'package-123',
        price: '1000',
        currency: 'INR',
        isActive: true,
      };

      vi.mocked(db.select).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([mockPackage]),
          }),
        }),
      } as any);

      const mockProvider = {
        getProviderType: vi.fn().mockReturnValue('paddle'),
        createOrder: vi.fn().mockResolvedValue({
          success: true,
          data: { orderId: 'order-123' },
        }),
      };

      vi.mocked(PaymentProviderFactory.getProviderForUser).mockResolvedValue(mockProvider as any);

      const result = await createPaymentOrderAction('package-123');

      expect(result.success).toBe(true);
    });

    it('should reject inactive packages', async () => {
      const mockPackage = {
        id: 'package-123',
        price: '1000',
        currency: 'INR',
        isActive: false,
      };

      vi.mocked(db.select).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([mockPackage]),
          }),
        }),
      } as any);

      const result = await createPaymentOrderAction('package-123');

      expect(result.success).toBe(false);
      expect(result.error).toContain('not available');
    });

    it('should enforce rate limiting', async () => {
      // Mock rate limit check to fail
      vi.spyOn(require('@/lib/utils/payment-security'), 'checkRateLimit').mockReturnValue({
        allowed: false,
        remaining: 0,
      });

      const result = await createPaymentOrderAction('package-123');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Too many requests');
    });
  });

  describe('createPaymentSubscriptionAction', () => {
    it('should create subscription', async () => {
      const mockPlan = {
        id: 'plan-123',
        name: 'Pro Plan',
        price: '999',
        currency: 'INR',
      };

      vi.mocked(db.select).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([mockPlan]),
          }),
        }),
      } as any);

      const mockProvider = {
        getProviderType: vi.fn().mockReturnValue('paddle'),
        createSubscription: vi.fn().mockResolvedValue({
          success: true,
          data: { subscriptionId: 'sub-123' },
        }),
      };

      vi.mocked(PaymentProviderFactory.getProviderForUser).mockResolvedValue(mockProvider as any);
      vi.spyOn(require('@/lib/dal/billing'), 'BillingDAL').mockImplementation(() => ({
        getUserSubscription: vi.fn().mockResolvedValue(null),
      }));

      const result = await createPaymentSubscriptionAction('plan-123');

      expect(result.success).toBe(true);
    });

    it('should prevent duplicate subscriptions', async () => {
      vi.spyOn(require('@/lib/dal/billing'), 'BillingDAL').mockImplementation(() => ({
        getUserSubscription: vi.fn().mockResolvedValue({
          subscription: {
            planId: 'plan-123',
            status: 'active',
          },
        }),
      }));

      const result = await createPaymentSubscriptionAction('plan-123', false);

      expect(result.success).toBe(false);
      expect(result.error).toContain('already subscribed');
    });
  });

  describe('getPaymentOrderAction', () => {
    it('should get payment order with details', async () => {
      const mockOrder = {
        id: 'order-123',
        userId: testUser.id,
        type: 'credit_package',
        referenceId: 'package-123',
      };

      vi.mocked(db.select).mockReturnValue({
        from: vi.fn().mockReturnValue({
          leftJoin: vi.fn().mockReturnValue({
            leftJoin: vi.fn().mockReturnValue({
              where: vi.fn().mockReturnValue({
                limit: vi.fn().mockResolvedValue([{
                  payment: mockOrder,
                  package: { id: 'package-123', name: 'Test Package' },
                  plan: null,
                }]),
              }),
            }),
          }),
        }),
      } as any);

      const result = await getPaymentOrderAction('order-123');

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });
  });

  describe('getReceiptAction', () => {
    it('should get receipt URL', async () => {
      const mockOrder = {
        id: 'order-123',
        userId: testUser.id,
        receiptPdfUrl: 'https://example.com/receipt.pdf',
        invoiceNumber: 'INV-123',
      };

      vi.mocked(db.select).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([mockOrder]),
          }),
        }),
      } as any);

      const result = await getReceiptAction('order-123');

      expect(result.success).toBe(true);
      expect(result.data?.receiptUrl).toBeDefined();
    });

    it('should generate receipt if not exists', async () => {
      const mockOrder = {
        id: 'order-123',
        userId: testUser.id,
        receiptPdfUrl: null,
        invoiceNumber: 'INV-123',
      };

      vi.mocked(db.select).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn()
              .mockResolvedValueOnce([mockOrder])
              .mockResolvedValueOnce([{ ...mockOrder, receiptPdfUrl: 'https://example.com/receipt.pdf' }]),
          }),
        }),
      } as any);

      vi.mocked(ReceiptService.generateReceiptPdf).mockResolvedValue({
        success: true,
        pdfUrl: 'https://example.com/receipt.pdf',
      });

      const result = await getReceiptAction('order-123');

      expect(result.success).toBe(true);
      expect(ReceiptService.generateReceiptPdf).toHaveBeenCalled();
    });
  });

  describe('cancelPaymentOrderAction', () => {
    it('should cancel pending order', async () => {
      const mockOrder = {
        id: 'order-123',
        userId: testUser.id,
        status: 'pending',
      };

      vi.mocked(db.select).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([mockOrder]),
          }),
        }),
      } as any);

      vi.mocked(db.update).mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue(undefined),
        }),
      } as any);

      const result = await cancelPaymentOrderAction(undefined, 'order-123');

      expect(result.success).toBe(true);
    });

    it('should not cancel completed orders', async () => {
      const mockOrder = {
        id: 'order-123',
        userId: testUser.id,
        status: 'completed',
      };

      vi.mocked(db.select).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([mockOrder]),
          }),
        }),
      } as any);

      const result = await cancelPaymentOrderAction(undefined, 'order-123');

      expect(result.success).toBe(false);
      expect(result.error).toContain('cannot cancel');
    });
  });
});

