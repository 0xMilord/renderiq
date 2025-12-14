/**
 * Integration tests for contact actions
 */

import { describe, it, expect, vi } from 'vitest';
import { submitContactForm } from '@/lib/actions/contact.actions';

vi.mock('@/lib/services/email.service', () => ({
  sendContactFormEmail: vi.fn(),
}));

describe('Contact Actions', () => {
  describe('submitContactForm', () => {
    it('should submit contact form', async () => {
      const { sendContactFormEmail } = await import('@/lib/services/email.service');
      vi.mocked(sendContactFormEmail).mockResolvedValue({
        success: true,
      });

      const result = await submitContactForm({
        name: 'John Doe',
        email: 'john@example.com',
        subject: 'Test Subject',
        message: 'This is a test message with enough characters',
        type: 'general',
      });

      expect(result.success).toBe(true);
      expect(sendContactFormEmail).toHaveBeenCalled();
    });

    it('should validate name', async () => {
      const result = await submitContactForm({
        name: '',
        email: 'john@example.com',
        subject: 'Test',
        message: 'Test message',
        type: 'general',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should validate email', async () => {
      const result = await submitContactForm({
        name: 'John Doe',
        email: 'invalid-email',
        subject: 'Test',
        message: 'Test message',
        type: 'general',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('email');
    });

    it('should validate message length', async () => {
      const result = await submitContactForm({
        name: 'John Doe',
        email: 'john@example.com',
        subject: 'Test',
        message: 'Short',
        type: 'general',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should handle email service errors', async () => {
      const { sendContactFormEmail } = await import('@/lib/services/email.service');
      vi.mocked(sendContactFormEmail).mockResolvedValue({
        success: false,
        error: 'Email failed',
      });

      const result = await submitContactForm({
        name: 'John Doe',
        email: 'john@example.com',
        subject: 'Test Subject',
        message: 'This is a test message with enough characters',
        type: 'general',
      });

      // Should still succeed even if email fails
      expect(result.success).toBe(true);
    });
  });
});

