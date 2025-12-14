/**
 * Integration tests for /api/payments/receipt/[id] route
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from '@/app/api/payments/receipt/[id]/route';
import { setupTestDB, teardownTestDB, createTestUser } from '../../../fixtures/database';
import { getCachedUser } from '@/lib/services/auth-cache';
import { ReceiptService } from '@/lib/services/receipt.service';
import { db } from '@/lib/db';
import { paymentOrders } from '@/lib/db/schema';

vi.mock('@/lib/services/auth-cache');
vi.mock('@/lib/services/receipt.service');
vi.mock('@/lib/db', () => ({
  db: {
    select: vi.fn(),
  },
}));

describe('GET /api/payments/receipt/[id]', () => {
  let testUser: any;

  beforeEach(async () => {
    await setupTestDB();
    testUser = await createTestUser();

    vi.mocked(getCachedUser).mockResolvedValue({
      user: testUser as any,
      fromCache: false,
    });
  });

  afterEach(async () => {
    await teardownTestDB();
    vi.clearAllMocks();
  });

  it('should get receipt PDF', async () => {
    const mockOrder = {
      id: 'order-123',
      userId: testUser.id,
      receiptPdfUrl: 'https://example.com/receipt.pdf',
    };

    vi.mocked(db.select).mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([mockOrder]),
        }),
      }),
    } as any);

    const request = new NextRequest('http://localhost:3000/api/payments/receipt/order-123');
    const response = await GET(request, { params: Promise.resolve({ id: 'order-123' }) });

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('application/pdf');
  });

  it('should generate receipt if not exists', async () => {
    const mockOrder = {
      id: 'order-123',
      userId: testUser.id,
      receiptPdfUrl: null,
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

    const request = new NextRequest('http://localhost:3000/api/payments/receipt/order-123');
    const response = await GET(request, { params: Promise.resolve({ id: 'order-123' }) });

    expect(ReceiptService.generateReceiptPdf).toHaveBeenCalled();
    expect(response.status).toBe(200);
  });

  it('should reject unauthenticated requests', async () => {
    vi.mocked(getCachedUser).mockResolvedValue({
      user: null,
      fromCache: false,
    });

    const request = new NextRequest('http://localhost:3000/api/payments/receipt/order-123');
    const response = await GET(request, { params: Promise.resolve({ id: 'order-123' }) });
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.success).toBe(false);
  });
});

