/**
 * Unit tests for EmailService
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendWelcomeEmail,
  sendPaymentReceiptEmail,
  sendInvoiceEmail,
  sendCreditsAddedEmail,
  sendCreditsFinishedEmail,
  sendSubscriptionActivatedEmail,
  sendSubscriptionRenewedEmail,
  sendSubscriptionCancelledEmail,
  sendSubscriptionFailedEmail,
  sendContactFormEmail,
} from '@/lib/services/email.service';
import { Resend } from 'resend';

vi.mock('resend', () => ({
  Resend: vi.fn().mockImplementation(() => ({
    emails: {
      send: vi.fn(),
    },
  })),
}));

describe('EmailService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.RESEND_API_KEY = 'test-key';
  });

  describe('sendVerificationEmail', () => {
    it('should send verification email', async () => {
      const mockResend = new Resend('test-key');
      vi.mocked(mockResend.emails.send).mockResolvedValue({
        data: { id: 'email-id' },
        error: null,
      } as any);

      const result = await sendVerificationEmail({
        email: 'test@example.com',
        name: 'Test User',
        verificationLink: 'https://example.com/verify',
      });

      expect(result.success).toBe(true);
    });

    it('should require verification link', async () => {
      const result = await sendVerificationEmail({
        email: 'test@example.com',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Verification link');
    });
  });

  describe('sendPasswordResetEmail', () => {
    it('should send password reset email', async () => {
      const mockResend = new Resend('test-key');
      vi.mocked(mockResend.emails.send).mockResolvedValue({
        data: { id: 'email-id' },
        error: null,
      } as any);

      const result = await sendPasswordResetEmail({
        email: 'test@example.com',
        name: 'Test User',
        resetLink: 'https://example.com/reset',
      });

      expect(result.success).toBe(true);
    });
  });

  describe('sendWelcomeEmail', () => {
    it('should send welcome email', async () => {
      const mockResend = new Resend('test-key');
      vi.mocked(mockResend.emails.send).mockResolvedValue({
        data: { id: 'email-id' },
        error: null,
      } as any);

      const result = await sendWelcomeEmail({
        email: 'test@example.com',
        name: 'Test User',
        credits: 25,
      });

      expect(result.success).toBe(true);
    });
  });

  describe('sendPaymentReceiptEmail', () => {
    it('should send payment receipt email', async () => {
      const mockResend = new Resend('test-key');
      vi.mocked(mockResend.emails.send).mockResolvedValue({
        data: { id: 'email-id' },
        error: null,
      } as any);

      const result = await sendPaymentReceiptEmail({
        email: 'test@example.com',
        name: 'Test User',
        amount: 1000,
        currency: 'INR',
        orderId: 'order-123',
        paymentDate: new Date(),
        receiptUrl: 'https://example.com/receipt.pdf',
      });

      expect(result.success).toBe(true);
    });
  });

  describe('sendInvoiceEmail', () => {
    it('should send invoice email', async () => {
      const mockResend = new Resend('test-key');
      vi.mocked(mockResend.emails.send).mockResolvedValue({
        data: { id: 'email-id' },
        error: null,
      } as any);

      const result = await sendInvoiceEmail({
        email: 'test@example.com',
        name: 'Test User',
        amount: 1000,
        currency: 'INR',
        orderId: 'order-123',
        invoiceNumber: 'INV-001',
        paymentDate: new Date(),
        invoiceUrl: 'https://example.com/invoice.pdf',
      });

      expect(result.success).toBe(true);
    });
  });

  describe('sendCreditsAddedEmail', () => {
    it('should send credits added email', async () => {
      const mockResend = new Resend('test-key');
      vi.mocked(mockResend.emails.send).mockResolvedValue({
        data: { id: 'email-id' },
        error: null,
      } as any);

      const result = await sendCreditsAddedEmail({
        email: 'test@example.com',
        name: 'Test User',
        credits: 1000,
        balance: 1500,
        reason: 'Payment completed',
      });

      expect(result.success).toBe(true);
    });
  });

  describe('sendCreditsFinishedEmail', () => {
    it('should send credits finished email', async () => {
      const mockResend = new Resend('test-key');
      vi.mocked(mockResend.emails.send).mockResolvedValue({
        data: { id: 'email-id' },
        error: null,
      } as any);

      const result = await sendCreditsFinishedEmail({
        email: 'test@example.com',
        name: 'Test User',
      });

      expect(result.success).toBe(true);
    });
  });

  describe('sendSubscriptionActivatedEmail', () => {
    it('should send subscription activated email', async () => {
      const mockResend = new Resend('test-key');
      vi.mocked(mockResend.emails.send).mockResolvedValue({
        data: { id: 'email-id' },
        error: null,
      } as any);

      const result = await sendSubscriptionActivatedEmail({
        email: 'test@example.com',
        name: 'Test User',
        planName: 'Pro Plan',
        amount: 999,
        currency: 'INR',
        billingCycle: 'monthly',
      });

      expect(result.success).toBe(true);
    });
  });

  describe('sendContactFormEmail', () => {
    it('should send contact form email', async () => {
      const mockResend = new Resend('test-key');
      vi.mocked(mockResend.emails.send).mockResolvedValue({
        data: { id: 'email-id' },
        error: null,
      } as any);

      const result = await sendContactFormEmail(
        'test@example.com',
        'Test User',
        'Test Subject',
        'Test message',
        'general'
      );

      expect(result.success).toBe(true);
    });
  });

  describe('error handling', () => {
    it('should handle missing API key', async () => {
      delete process.env.RESEND_API_KEY;

      const result = await sendVerificationEmail({
        email: 'test@example.com',
        verificationLink: 'https://example.com/verify',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('not configured');
    });

    it('should handle Resend API errors', async () => {
      const mockResend = new Resend('test-key');
      vi.mocked(mockResend.emails.send).mockResolvedValue({
        data: null,
        error: { message: 'API error' },
      } as any);

      const result = await sendVerificationEmail({
        email: 'test@example.com',
        verificationLink: 'https://example.com/verify',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });
});

