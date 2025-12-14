/**
 * Unit tests for InvoiceService
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { InvoiceService } from '@/lib/services/invoice.service';
import { db } from '@/lib/db';
import { invoices, paymentOrders, users } from '@/lib/db/schema';

vi.mock('@/lib/db', () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
  },
}));

describe('InvoiceService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('generateInvoiceNumber', () => {
    it('should generate unique invoice number', async () => {
      vi.mocked(db.select).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([]),
          }),
        }),
      } as any);

      const invoiceNumber = await InvoiceService.generateInvoiceNumber();

      expect(invoiceNumber).toBeDefined();
      expect(invoiceNumber).toMatch(/^INV-/);
    });

    it('should handle collisions', async () => {
      const existingInvoice = { invoiceNumber: 'INV-20250127-12345' };
      
      vi.mocked(db.select).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn()
              .mockResolvedValueOnce([existingInvoice])
              .mockResolvedValueOnce([]),
          }),
        }),
      } as any);

      const invoiceNumber = await InvoiceService.generateInvoiceNumber();

      expect(invoiceNumber).toBeDefined();
      expect(invoiceNumber).not.toBe(existingInvoice.invoiceNumber);
    });
  });

  describe('createInvoice', () => {
    it('should create invoice for payment order', async () => {
      const mockOrder = {
        id: 'order-123',
        userId: 'user-123',
        amount: '1000',
        taxAmount: '180',
        discountAmount: '0',
        type: 'credit_package',
        referenceId: 'pkg-123',
      };

      vi.mocked(db.select).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn()
              .mockResolvedValueOnce([mockOrder])
              .mockResolvedValueOnce([])
              .mockResolvedValueOnce([{ id: 'user-123', email: 'test@example.com' }])
              .mockResolvedValueOnce([{ id: 'pkg-123', name: 'Package 1' }]),
        }),
      } as any);

      vi.mocked(db.insert).mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([{
            id: 'invoice-123',
            invoiceNumber: 'INV-001',
          }]),
        }),
      } as any);

      const result = await InvoiceService.createInvoice('order-123');

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });

    it('should return existing invoice if already created', async () => {
      const mockOrder = { id: 'order-123' };
      const existingInvoice = { id: 'invoice-123', invoiceNumber: 'INV-001' };

      vi.mocked(db.select).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn()
              .mockResolvedValueOnce([mockOrder])
              .mockResolvedValueOnce([existingInvoice]),
          }),
        }),
      } as any);

      const result = await InvoiceService.createInvoice('order-123');

      expect(result.success).toBe(true);
      expect(result.data).toEqual(existingInvoice);
    });

    it('should handle missing payment order', async () => {
      vi.mocked(db.select).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([]),
          }),
        }),
      } as any);

      const result = await InvoiceService.createInvoice('non-existent');

      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
    });
  });

  describe('getInvoiceByNumber', () => {
    it('should get invoice by number', async () => {
      const mockInvoice = {
        id: 'invoice-123',
        invoiceNumber: 'INV-001',
        userId: 'user-123',
      };

      vi.mocked(db.select).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([mockInvoice]),
          }),
        }),
      } as any);

      const result = await InvoiceService.getInvoiceByNumber('INV-001');

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockInvoice);
    });

    it('should return error for non-existent invoice', async () => {
      vi.mocked(db.select).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([]),
          }),
        }),
      } as any);

      const result = await InvoiceService.getInvoiceByNumber('INV-999');

      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
    });
  });
});

