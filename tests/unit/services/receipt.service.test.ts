/**
 * Unit tests for ReceiptService
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ReceiptService } from '@/lib/services/receipt.service';
import { InvoiceService } from '@/lib/services/invoice.service';
import { StorageService } from '@/lib/services/storage';
import { db } from '@/lib/db';
import { paymentOrders, users, creditPackages } from '@/lib/db/schema';

vi.mock('@/lib/db', () => ({
  db: {
    select: vi.fn(),
  },
}));

vi.mock('@/lib/services/invoice.service', () => ({
  InvoiceService: {
    getInvoiceByNumber: vi.fn(),
    createInvoice: vi.fn(),
  },
}));

vi.mock('@/lib/services/storage', () => ({
  StorageService: {
    uploadFile: vi.fn(),
  },
}));

vi.mock('pdf-lib', () => ({
  PDFDocument: {
    create: vi.fn().mockResolvedValue({
      addPage: vi.fn().mockReturnValue({
        getSize: vi.fn().mockReturnValue({ width: 595, height: 842 }),
        drawText: vi.fn(),
        drawRectangle: vi.fn(),
      }),
      embedFont: vi.fn().mockResolvedValue({
        widthOfTextAtSize: vi.fn().mockReturnValue(100),
      }),
      save: vi.fn().mockResolvedValue(new Uint8Array([1, 2, 3])),
    }),
  },
  StandardFonts: {
    Helvetica: 'Helvetica',
    HelveticaBold: 'HelveticaBold',
  },
  rgb: vi.fn((r, g, b) => ({ r, g, b })),
}));

describe('ReceiptService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('generateReceiptPdf', () => {
    it('should generate receipt PDF', async () => {
      const mockOrder = {
        id: 'order-123',
        userId: 'user-123',
        type: 'credit_package',
        referenceId: 'pkg-123',
        amount: '1000',
        invoiceNumber: 'INV-001',
      };

      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
      };

      const mockPackage = {
        id: 'pkg-123',
        name: 'Test Package',
        credits: 1000,
        bonusCredits: 100,
      };

      vi.mocked(db.select).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn()
              .mockResolvedValueOnce([mockOrder])
              .mockResolvedValueOnce([mockUser])
              .mockResolvedValueOnce([mockPackage]),
          }),
        }),
      } as any);

      vi.mocked(InvoiceService.getInvoiceByNumber).mockResolvedValue({
        success: true,
        data: {
          id: 'invoice-123',
          invoiceNumber: 'INV-001',
        } as any,
      });

      vi.mocked(StorageService.uploadFile).mockResolvedValue({
        success: true,
        url: 'https://example.com/receipt.pdf',
        key: 'receipts/receipt.pdf',
      } as any);

      const result = await ReceiptService.generateReceiptPdf('order-123');

      expect(result.success).toBe(true);
      expect(result.pdfUrl).toBeDefined();
    });

    it('should create invoice if not exists', async () => {
      const mockOrder = {
        id: 'order-123',
        userId: 'user-123',
        type: 'credit_package',
        invoiceNumber: null,
      };

      vi.mocked(db.select).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn()
              .mockResolvedValueOnce([mockOrder])
              .mockResolvedValueOnce([{ id: 'user-123' }])
              .mockResolvedValueOnce([{ id: 'pkg-123' }]),
          }),
        }),
      } as any);

      vi.mocked(InvoiceService.getInvoiceByNumber).mockResolvedValue({
        success: false,
        error: 'Not found',
      });

      vi.mocked(InvoiceService.createInvoice).mockResolvedValue({
        success: true,
        data: {
          id: 'invoice-123',
          invoiceNumber: 'INV-001',
        } as any,
      });

      vi.mocked(StorageService.uploadFile).mockResolvedValue({
        success: true,
        url: 'https://example.com/receipt.pdf',
      } as any);

      const result = await ReceiptService.generateReceiptPdf('order-123');

      expect(InvoiceService.createInvoice).toHaveBeenCalled();
      expect(result.success).toBe(true);
    });

    it('should handle missing payment order', async () => {
      vi.mocked(db.select).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([]),
          }),
        }),
      } as any);

      const result = await ReceiptService.generateReceiptPdf('non-existent');

      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
    });
  });
});

