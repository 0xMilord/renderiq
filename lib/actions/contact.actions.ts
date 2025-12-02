'use server';

import { z } from 'zod';
import { logger } from '@/lib/utils/logger';

const contactFormSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  email: z.string().email('Invalid email address'),
  subject: z.string().min(1, 'Subject is required').max(200),
  message: z.string().min(10, 'Message must be at least 10 characters').max(2000),
  type: z.enum(['general', 'sales', 'support', 'partnership']),
});

export async function submitContactForm(formData: {
  name: string;
  email: string;
  subject: string;
  message: string;
  type: 'general' | 'sales' | 'support' | 'partnership';
}) {
  logger.log('📧 [ContactForm] Received contact form submission:', {
    email: formData.email,
    type: formData.type,
    subject: formData.subject.substring(0, 50) + '...'
  });

  try {
    // Validate form data
    const validatedData = contactFormSchema.parse(formData);

    // TODO: Implement actual email sending
    // Options:
    // 1. Use Resend API (recommended)
    // 2. Use SendGrid
    // 3. Use Nodemailer with SMTP
    // 4. Create a support ticket in a ticketing system
    
    // For now, log the submission (in production, you'd send an email)
    logger.log('✅ [ContactForm] Form validated successfully');
    
    // Simulate email sending delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // In production, implement something like:
    /*
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: 'Renderiq <contact@renderiq.io>',
      to: getEmailForType(validatedData.type),
      replyTo: validatedData.email,
      subject: `[${validatedData.type.toUpperCase()}] ${validatedData.subject}`,
      html: `
        <h2>New Contact Form Submission</h2>
        <p><strong>From:</strong> ${validatedData.name} (${validatedData.email})</p>
        <p><strong>Type:</strong> ${validatedData.type}</p>
        <p><strong>Subject:</strong> ${validatedData.subject}</p>
        <hr>
        <p>${validatedData.message.replace(/\n/g, '<br>')}</p>
      `
    });
    */

    return {
      success: true,
      message: 'Thank you for your message! We\'ll get back to you within 24 hours.',
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      logger.warn('❌ [ContactForm] Validation error:', error.errors);
      return {
        success: false,
        error: error.errors[0]?.message || 'Invalid form data',
      };
    }

    logger.error('❌ [ContactForm] Error submitting form:', error);
    return {
      success: false,
      error: 'Failed to submit form. Please try again or email us directly.',
    };
  }
}

// Helper function to determine recipient email based on inquiry type
function getEmailForType(type: 'general' | 'sales' | 'support' | 'partnership'): string {
  switch (type) {
    case 'sales':
    case 'partnership':
      return 'sales@renderiq.io';
    case 'support':
      return 'support@renderiq.io';
    default:
      return 'info@renderiq.io';
  }
}

