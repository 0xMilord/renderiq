'use server';

import { Resend } from 'resend';
import { logger } from '@/lib/utils/logger';

// Initialize Resend client
const resend = new Resend(process.env.RESEND_API_KEY);

// Email configuration
// ✅ Use real email address (not noreply@) to avoid spam filters
// noreply@ addresses are flagged as suspicious by spam filters
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'Renderiq <team@renderiq.io>';
const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL || 'support@renderiq.io';

// Get app URL - use production URL in production, localhost only in development
function getAppUrl(): string {
  const isProduction = process.env.NODE_ENV === 'production';
  
  if (isProduction) {
    // Production: use configured site URL or fallback to production domain
    return process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://renderiq.io';
  }
  
  // Development: use localhost
  return process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
}

const APP_URL = getAppUrl();

// Types
export interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
  attachments?: Array<{
    filename: string;
    content: Buffer | string;
    contentType?: string;
  }>;
}

export interface AuthEmailData {
  name?: string;
  email: string;
  verificationLink?: string;
  resetLink?: string;
  expiresIn?: string;
}

export interface PaymentEmailData {
  name: string;
  email: string;
  amount: number;
  currency: string;
  orderId: string;
  receiptUrl?: string;
  invoiceUrl?: string;
  invoiceNumber?: string;
  paymentDate: Date;
  items?: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
}

export interface CreditsEmailData {
  name: string;
  email: string;
  credits: number;
  balance: number;
  reason: string;
  transactionId?: string;
}

export interface SubscriptionEmailData {
  name: string;
  email: string;
  planName: string;
  amount: number;
  currency: string;
  billingCycle: 'monthly' | 'yearly';
  nextBillingDate?: Date;
  subscriptionId?: string;
  invoiceUrl?: string;
}

export interface MarketingEmailData {
  name: string;
  email: string;
  subject: string;
  content: string;
  ctaText?: string;
  ctaLink?: string;
}

/**
 * Core email sending function
 */
async function sendEmail(options: EmailOptions): Promise<{ success: boolean; error?: string; messageId?: string }> {
  try {
    if (!process.env.RESEND_API_KEY) {
      logger.error('❌ EmailService: RESEND_API_KEY not configured');
      return { success: false, error: 'Email service not configured' };
    }

    const recipients = Array.isArray(options.to) ? options.to : [options.to];
    
    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: recipients,
      subject: options.subject,
      html: options.html,
      text: options.text,
      reply_to: options.replyTo || SUPPORT_EMAIL, // ✅ Always include reply-to for better deliverability
      // ✅ Disable click and open tracking for transactional emails to avoid spam filters
      // Tracking can make emails look suspicious and trigger spam filters
      // Note: Disable in Resend Dashboard → Settings → Email Settings
      headers: {
        'X-Entity-Ref-ID': options.subject, // For tracking in Resend dashboard
        'List-Unsubscribe': `<mailto:${SUPPORT_EMAIL}?subject=Unsubscribe>`, // ✅ Help with deliverability
        'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click', // ✅ One-click unsubscribe
      },
      attachments: options.attachments?.map(att => ({
        filename: att.filename,
        content: typeof att.content === 'string' 
          ? Buffer.from(att.content, 'base64').toString('base64')
          : att.content.toString('base64'),
        content_type: att.contentType,
      })),
    });

    if (result.error) {
      logger.error('❌ EmailService: Failed to send email:', result.error);
      return { success: false, error: result.error.message || 'Failed to send email' };
    }

    logger.log('✅ EmailService: Email sent successfully:', { 
      to: recipients, 
      subject: options.subject,
      messageId: result.data?.id 
    });

    return { success: true, messageId: result.data?.id };
  } catch (error) {
    logger.error('❌ EmailService: Error sending email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send email',
    };
  }
}

/**
 * Email Templates
 */

// Base HTML template - matches app theme with green/lime colors
function getBaseTemplate(content: string, title?: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title || 'Renderiq'}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #1a1a1a;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f5f5f5;
    }
    .container {
      background-color: #ffffff;
      border-radius: 16px;
      padding: 40px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    .header {
      text-align: center;
      margin-bottom: 40px;
      padding-bottom: 20px;
      border-bottom: 2px solid #e5e7eb;
    }
    .logo {
      font-size: 32px;
      font-weight: bold;
      background: linear-gradient(135deg, #22c55e 0%, #84cc16 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      margin-bottom: 8px;
      letter-spacing: -0.5px;
    }
    .content {
      margin-bottom: 30px;
      color: #1a1a1a;
    }
    .content h2 {
      color: #1a1a1a;
      margin-top: 0;
      margin-bottom: 20px;
      font-size: 24px;
      font-weight: 700;
    }
    .content p {
      color: #4a4a4a;
      margin-bottom: 16px;
      font-size: 16px;
    }
    .button {
      display: inline-block;
      padding: 14px 32px;
      background: linear-gradient(135deg, #22c55e 0%, #84cc16 100%);
      color: #ffffff;
      text-decoration: none;
      border-radius: 8px;
      margin: 24px 0;
      font-weight: 600;
      font-size: 16px;
      box-shadow: 0 2px 4px rgba(34, 197, 94, 0.3);
      transition: all 0.2s ease;
    }
    .button:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 8px rgba(34, 197, 94, 0.4);
    }
    .link-text {
      word-break: break-all;
      color: #22c55e;
      text-decoration: none;
      font-size: 14px;
      background-color: #f0fdf4;
      padding: 12px;
      border-radius: 6px;
      display: block;
      margin: 12px 0;
      border: 1px solid #bbf7d0;
    }
    .footer {
      margin-top: 40px;
      padding-top: 24px;
      border-top: 1px solid #e5e7eb;
      text-align: center;
      font-size: 13px;
      color: #6b7280;
    }
    .footer a {
      color: #22c55e;
      text-decoration: none;
      font-weight: 500;
    }
    .footer a:hover {
      text-decoration: underline;
    }
    .highlight {
      background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
      padding: 3px 8px;
      border-radius: 4px;
      font-weight: 600;
      color: #92400e;
    }
    @media (max-width: 600px) {
      body {
        padding: 10px;
      }
      .container {
        padding: 24px;
        border-radius: 12px;
      }
      .logo {
        font-size: 28px;
      }
      .button {
        padding: 12px 24px;
        font-size: 14px;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">Renderiq</div>
      <p style="color: #6b7280; font-size: 14px; margin: 0;">AI Architecture Render Software</p>
    </div>
    <div class="content">
      ${content}
    </div>
    <div class="footer">
      <p style="margin-bottom: 8px;">© ${new Date().getFullYear()} Renderiq. All rights reserved.</p>
      <p style="margin-bottom: 16px;">
        <a href="${APP_URL}">Visit our website</a> • 
        <a href="${APP_URL}/support">Support</a> • 
        <a href="${APP_URL}/privacy">Privacy Policy</a>
      </p>
      <p style="font-size: 12px; color: #9ca3af; margin: 0;">If you didn't request this email, you can safely ignore it.</p>
    </div>
  </div>
</body>
</html>
  `;
}

// Auth Email Templates

export async function sendVerificationEmail(data: AuthEmailData): Promise<{ success: boolean; error?: string }> {
  if (!data.verificationLink) {
    return { success: false, error: 'Verification link is required' };
  }

  const content = `
    <h2>Verify Your Email Address</h2>
    <p>Hi${data.name ? ` ${data.name}` : ''},</p>
    <p>Thank you for signing up for Renderiq! We're excited to have you on board. Please verify your email address to complete your registration and start creating amazing architectural renders.</p>
    <p style="text-align: center;">
      <a href="${data.verificationLink}" class="button">Verify Email Address</a>
    </p>
    <p style="text-align: center; color: #6b7280; font-size: 14px; margin-top: 8px;">Or copy and paste this link into your browser:</p>
    <a href="${data.verificationLink}" class="link-text">${data.verificationLink}</a>
    <p style="color: #6b7280; font-size: 14px; margin-top: 24px;">⏰ This verification link will expire in 24 hours.</p>
    <p style="color: #6b7280; font-size: 14px;">If you didn't create an account with Renderiq, you can safely ignore this email.</p>
  `;

  return sendEmail({
    to: data.email,
    subject: 'Verify Your Email Address - Renderiq',
    html: getBaseTemplate(content, 'Verify Your Email'),
    text: `Hi${data.name ? ` ${data.name}` : ''},\n\nThank you for signing up for Renderiq! Please verify your email address by clicking this link: ${data.verificationLink}\n\nThis link will expire in 24 hours.\n\nIf you didn't create an account with Renderiq, you can safely ignore this email.`,
    replyTo: SUPPORT_EMAIL, // ✅ Include reply-to for better deliverability
  });
}

export async function sendPasswordResetEmail(data: AuthEmailData): Promise<{ success: boolean; error?: string }> {
  if (!data.resetLink) {
    return { success: false, error: 'Reset link is required' };
  }

  const content = `
    <h2>Reset Your Password</h2>
    <p>Hi${data.name ? ` ${data.name}` : ''},</p>
    <p>We received a request to reset your password for your Renderiq account.</p>
    <p style="text-align: center;">
      <a href="${data.resetLink}" class="button">Reset Password</a>
    </p>
    <p>Or copy and paste this link into your browser:</p>
    <p style="word-break: break-all; color: #6366f1;">${data.resetLink}</p>
    <p>This link will expire in ${data.expiresIn || '1 hour'}.</p>
    <p>If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.</p>
  `;

  return sendEmail({
    to: data.email,
    subject: 'Reset Your Password - Renderiq',
    html: getBaseTemplate(content, 'Reset Your Password'),
    text: `Hi${data.name ? ` ${data.name}` : ''},\n\nWe received a request to reset your password. Click this link to reset it: ${data.resetLink}\n\nThis link will expire in ${data.expiresIn || '1 hour'}.\n\nIf you didn't request a password reset, you can safely ignore this email.`,
  });
}

export async function sendPasswordResetConfirmationEmail(data: AuthEmailData): Promise<{ success: boolean; error?: string }> {
  const content = `
    <h2>Password Reset Successful</h2>
    <p>Hi${data.name ? ` ${data.name}` : ''},</p>
    <p>Your password has been successfully reset.</p>
    <p>If you didn't make this change, please contact our support team immediately at <a href="mailto:${SUPPORT_EMAIL}">${SUPPORT_EMAIL}</a>.</p>
  `;

  return sendEmail({
    to: data.email,
    subject: 'Password Reset Successful - Renderiq',
    html: getBaseTemplate(content, 'Password Reset Successful'),
    text: `Hi${data.name ? ` ${data.name}` : ''},\n\nYour password has been successfully reset.\n\nIf you didn't make this change, please contact our support team immediately.`,
  });
}

// Payment Email Templates

export async function sendPaymentReceiptEmail(data: PaymentEmailData): Promise<{ success: boolean; error?: string }> {
  const formattedAmount = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: data.currency,
  }).format(data.amount);

  const content = `
    <h2>Payment Receipt</h2>
    <p>Hi ${data.name},</p>
    <p>Thank you for your payment! Your transaction has been processed successfully.</p>
    <div style="background-color: #f9fafb; padding: 20px; border-radius: 6px; margin: 20px 0;">
      <p><strong>Order ID:</strong> ${data.orderId}</p>
      <p><strong>Amount:</strong> <span class="highlight">${formattedAmount}</span></p>
      <p><strong>Payment Date:</strong> ${data.paymentDate.toLocaleDateString()}</p>
      ${data.items ? `
        <p><strong>Items:</strong></p>
        <ul>
          ${data.items.map(item => `<li>${item.name} (${item.quantity}x) - ${new Intl.NumberFormat('en-IN', { style: 'currency', currency: data.currency }).format(item.price)}</li>`).join('')}
        </ul>
      ` : ''}
    </div>
    ${data.receiptUrl ? `
      <p style="text-align: center;">
        <a href="${data.receiptUrl}" class="button">Download Receipt</a>
      </p>
    ` : ''}
    <p>If you have any questions about this payment, please contact our support team at <a href="mailto:${SUPPORT_EMAIL}">${SUPPORT_EMAIL}</a>.</p>
  `;

  return sendEmail({
    to: data.email,
    subject: `Payment Receipt - Order ${data.orderId}`,
    html: getBaseTemplate(content, 'Payment Receipt'),
    text: `Hi ${data.name},\n\nThank you for your payment! Your transaction has been processed successfully.\n\nOrder ID: ${data.orderId}\nAmount: ${formattedAmount}\nPayment Date: ${data.paymentDate.toLocaleDateString()}\n\n${data.receiptUrl ? `Download receipt: ${data.receiptUrl}\n` : ''}`,
  });
}

export async function sendInvoiceEmail(data: PaymentEmailData): Promise<{ success: boolean; error?: string }> {
  if (!data.invoiceNumber || !data.invoiceUrl) {
    return { success: false, error: 'Invoice number and URL are required' };
  }

  const formattedAmount = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: data.currency,
  }).format(data.amount);

  const content = `
    <h2>Invoice ${data.invoiceNumber}</h2>
    <p>Hi ${data.name},</p>
    <p>Please find your invoice attached below.</p>
    <div style="background-color: #f9fafb; padding: 20px; border-radius: 6px; margin: 20px 0;">
      <p><strong>Invoice Number:</strong> ${data.invoiceNumber}</p>
      <p><strong>Order ID:</strong> ${data.orderId}</p>
      <p><strong>Amount:</strong> <span class="highlight">${formattedAmount}</span></p>
      <p><strong>Invoice Date:</strong> ${data.paymentDate.toLocaleDateString()}</p>
      ${data.items ? `
        <p><strong>Items:</strong></p>
        <ul>
          ${data.items.map(item => `<li>${item.name} (${item.quantity}x) - ${new Intl.NumberFormat('en-IN', { style: 'currency', currency: data.currency }).format(item.price)}</li>`).join('')}
        </ul>
      ` : ''}
    </div>
    <p style="text-align: center;">
      <a href="${data.invoiceUrl}" class="button">View Invoice</a>
    </p>
    <p>If you have any questions about this invoice, please contact our support team at <a href="mailto:${SUPPORT_EMAIL}">${SUPPORT_EMAIL}</a>.</p>
  `;

  return sendEmail({
    to: data.email,
    subject: `Invoice ${data.invoiceNumber} - Renderiq`,
    html: getBaseTemplate(content, `Invoice ${data.invoiceNumber}`),
    text: `Hi ${data.name},\n\nPlease find your invoice below.\n\nInvoice Number: ${data.invoiceNumber}\nOrder ID: ${data.orderId}\nAmount: ${formattedAmount}\nInvoice Date: ${data.paymentDate.toLocaleDateString()}\n\nView invoice: ${data.invoiceUrl}`,
  });
}

// Credits Email Templates

export async function sendCreditsAddedEmail(data: CreditsEmailData): Promise<{ success: boolean; error?: string }> {
  const content = `
    <h2>Credits Added to Your Account</h2>
    <p>Hi ${data.name},</p>
    <p>Great news! <span class="highlight">${data.credits} credits</span> have been added to your Renderiq account.</p>
    <div style="background-color: #f9fafb; padding: 20px; border-radius: 6px; margin: 20px 0;">
      <p><strong>Credits Added:</strong> <span class="highlight">${data.credits}</span></p>
      <p><strong>New Balance:</strong> <span class="highlight">${data.balance} credits</span></p>
      <p><strong>Reason:</strong> ${data.reason}</p>
      ${data.transactionId ? `<p><strong>Transaction ID:</strong> ${data.transactionId}</p>` : ''}
    </div>
    <p style="text-align: center;">
      <a href="${APP_URL}/dashboard" class="button">Go to Dashboard</a>
    </p>
    <p>Start creating amazing renders with your new credits!</p>
  `;

  return sendEmail({
    to: data.email,
    subject: `${data.credits} Credits Added to Your Account - Renderiq`,
    html: getBaseTemplate(content, 'Credits Added'),
    text: `Hi ${data.name},\n\nGreat news! ${data.credits} credits have been added to your Renderiq account.\n\nCredits Added: ${data.credits}\nNew Balance: ${data.balance} credits\nReason: ${data.reason}\n\nStart creating amazing renders with your new credits!`,
  });
}

export async function sendCreditsFinishedEmail(data: CreditsEmailData): Promise<{ success: boolean; error?: string }> {
  const content = `
    <h2>Your Credits Are Running Low</h2>
    <p>Hi ${data.name},</p>
    <p>Your Renderiq account balance is now <span class="highlight">${data.balance} credits</span>.</p>
    <p>To continue creating amazing renders, consider purchasing more credits or subscribing to a plan.</p>
    <p style="text-align: center;">
      <a href="${APP_URL}/pricing" class="button">Buy Credits</a>
    </p>
    <p>Our subscription plans offer great value with monthly credits and exclusive features.</p>
  `;

  return sendEmail({
    to: data.email,
    subject: 'Your Credits Are Running Low - Renderiq',
    html: getBaseTemplate(content, 'Credits Running Low'),
    text: `Hi ${data.name},\n\nYour Renderiq account balance is now ${data.balance} credits.\n\nTo continue creating amazing renders, consider purchasing more credits or subscribing to a plan.\n\nVisit: ${APP_URL}/pricing`,
  });
}

// Subscription Email Templates

export async function sendSubscriptionActivatedEmail(data: SubscriptionEmailData): Promise<{ success: boolean; error?: string }> {
  const formattedAmount = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: data.currency,
  }).format(data.amount);

  const content = `
    <h2>Subscription Activated</h2>
    <p>Hi ${data.name},</p>
    <p>Your <strong>${data.planName}</strong> subscription has been activated!</p>
    <div style="background-color: #f9fafb; padding: 20px; border-radius: 6px; margin: 20px 0;">
      <p><strong>Plan:</strong> ${data.planName}</p>
      <p><strong>Billing Cycle:</strong> ${data.billingCycle === 'monthly' ? 'Monthly' : 'Yearly'}</p>
      <p><strong>Amount:</strong> <span class="highlight">${formattedAmount}</span> per ${data.billingCycle === 'monthly' ? 'month' : 'year'}</p>
      ${data.nextBillingDate ? `<p><strong>Next Billing Date:</strong> ${data.nextBillingDate.toLocaleDateString()}</p>` : ''}
    </div>
    <p style="text-align: center;">
      <a href="${APP_URL}/dashboard" class="button">Go to Dashboard</a>
    </p>
    <p>Thank you for subscribing! You now have access to all premium features.</p>
  `;

  return sendEmail({
    to: data.email,
    subject: `Subscription Activated - ${data.planName}`,
    html: getBaseTemplate(content, 'Subscription Activated'),
    text: `Hi ${data.name},\n\nYour ${data.planName} subscription has been activated!\n\nPlan: ${data.planName}\nBilling Cycle: ${data.billingCycle === 'monthly' ? 'Monthly' : 'Yearly'}\nAmount: ${formattedAmount} per ${data.billingCycle === 'monthly' ? 'month' : 'year'}\n\nThank you for subscribing!`,
  });
}

export async function sendSubscriptionRenewedEmail(data: SubscriptionEmailData): Promise<{ success: boolean; error?: string }> {
  const formattedAmount = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: data.currency,
  }).format(data.amount);

  const content = `
    <h2>Subscription Renewed</h2>
    <p>Hi ${data.name},</p>
    <p>Your <strong>${data.planName}</strong> subscription has been renewed successfully.</p>
    <div style="background-color: #f9fafb; padding: 20px; border-radius: 6px; margin: 20px 0;">
      <p><strong>Plan:</strong> ${data.planName}</p>
      <p><strong>Amount Charged:</strong> <span class="highlight">${formattedAmount}</span></p>
      ${data.nextBillingDate ? `<p><strong>Next Billing Date:</strong> ${data.nextBillingDate.toLocaleDateString()}</p>` : ''}
      ${data.invoiceUrl ? `<p><a href="${data.invoiceUrl}">View Invoice</a></p>` : ''}
    </div>
    <p>Your subscription will continue automatically. Thank you for being a valued customer!</p>
  `;

  return sendEmail({
    to: data.email,
    subject: `Subscription Renewed - ${data.planName}`,
    html: getBaseTemplate(content, 'Subscription Renewed'),
    text: `Hi ${data.name},\n\nYour ${data.planName} subscription has been renewed successfully.\n\nAmount Charged: ${formattedAmount}\n${data.nextBillingDate ? `Next Billing Date: ${data.nextBillingDate.toLocaleDateString()}\n` : ''}\nThank you for being a valued customer!`,
  });
}

export async function sendSubscriptionCancelledEmail(data: SubscriptionEmailData): Promise<{ success: boolean; error?: string }> {
  const content = `
    <h2>Subscription Cancelled</h2>
    <p>Hi ${data.name},</p>
    <p>Your <strong>${data.planName}</strong> subscription has been cancelled.</p>
    <p>You will continue to have access to premium features until the end of your current billing period.</p>
    <p style="text-align: center;">
      <a href="${APP_URL}/pricing" class="button">Reactivate Subscription</a>
    </p>
    <p>We're sorry to see you go! If you change your mind, you can reactivate your subscription anytime.</p>
    <p>If you have any feedback, please reach out to us at <a href="mailto:${SUPPORT_EMAIL}">${SUPPORT_EMAIL}</a>.</p>
  `;

  return sendEmail({
    to: data.email,
    subject: 'Subscription Cancelled - Renderiq',
    html: getBaseTemplate(content, 'Subscription Cancelled'),
    text: `Hi ${data.name},\n\nYour ${data.planName} subscription has been cancelled.\n\nYou will continue to have access to premium features until the end of your current billing period.\n\nWe're sorry to see you go! If you change your mind, you can reactivate your subscription anytime.`,
  });
}

export async function sendSubscriptionFailedEmail(data: SubscriptionEmailData): Promise<{ success: boolean; error?: string }> {
  const content = `
    <h2>Subscription Payment Failed</h2>
    <p>Hi ${data.name},</p>
    <p>We were unable to process the payment for your <strong>${data.planName}</strong> subscription.</p>
    <p>Please update your payment method to continue your subscription without interruption.</p>
    <p style="text-align: center;">
      <a href="${APP_URL}/dashboard/billing" class="button">Update Payment Method</a>
    </p>
    <p>If you need assistance, please contact our support team at <a href="mailto:${SUPPORT_EMAIL}">${SUPPORT_EMAIL}</a>.</p>
  `;

  return sendEmail({
    to: data.email,
    subject: 'Subscription Payment Failed - Renderiq',
    html: getBaseTemplate(content, 'Payment Failed'),
    text: `Hi ${data.name},\n\nWe were unable to process the payment for your ${data.planName} subscription.\n\nPlease update your payment method to continue your subscription without interruption.\n\nUpdate payment method: ${APP_URL}/dashboard/billing`,
  });
}

// Marketing Email Templates

export async function sendWelcomeEmail(data: MarketingEmailData): Promise<{ success: boolean; error?: string }> {
  const content = `
    <h2>Welcome to Renderiq! 🎉</h2>
    <p>Hi ${data.name},</p>
    <p>Thank you for joining Renderiq! We're excited to have you on board.</p>
    <p>As a welcome gift, you've received <span class="highlight">25 free credits</span> to get started!</p>
    <p style="text-align: center;">
      <a href="${APP_URL}/dashboard" class="button">Start Creating</a>
    </p>
    <p>Here's what you can do with Renderiq:</p>
    <ul>
      <li>Create stunning AI-generated images</li>
      <li>Transform your ideas into reality</li>
      <li>Access powerful rendering tools</li>
      <li>Build amazing projects</li>
    </ul>
    <p>If you have any questions, our support team is here to help at <a href="mailto:${SUPPORT_EMAIL}">${SUPPORT_EMAIL}</a>.</p>
    <p>Happy creating!</p>
  `;

  return sendEmail({
    to: data.email,
    subject: 'Welcome to Renderiq!',
    html: getBaseTemplate(content, 'Welcome to Renderiq'),
    text: `Hi ${data.name},\n\nThank you for joining Renderiq! We're excited to have you on board.\n\nAs a welcome gift, you've received 25 free credits to get started!\n\nStart creating: ${APP_URL}/dashboard\n\nIf you have any questions, our support team is here to help.`,
  });
}

export async function sendMarketingEmail(data: MarketingEmailData): Promise<{ success: boolean; error?: string }> {
  const content = `
    <h2>${data.subject}</h2>
    <p>Hi ${data.name},</p>
    ${data.content}
    ${data.ctaLink && data.ctaText ? `
      <p style="text-align: center;">
        <a href="${data.ctaLink}" class="button">${data.ctaText}</a>
      </p>
    ` : ''}
  `;

  return sendEmail({
    to: data.email,
    subject: data.subject,
    html: getBaseTemplate(content, data.subject),
    text: `Hi ${data.name},\n\n${data.content.replace(/<[^>]*>/g, '')}\n\n${data.ctaLink ? `${data.ctaText || 'Learn more'}: ${data.ctaLink}` : ''}`,
  });
}

// Contact Form Email (internal)
export async function sendContactFormEmail(
  fromEmail: string,
  fromName: string,
  subject: string,
  message: string,
  type: 'general' | 'sales' | 'support' | 'partnership'
): Promise<{ success: boolean; error?: string }> {
  const recipientEmail = type === 'sales' || type === 'partnership' 
    ? 'sales@renderiq.io' 
    : type === 'support' 
    ? 'support@renderiq.io' 
    : 'info@renderiq.io';

  const content = `
    <h2>New Contact Form Submission</h2>
    <div style="background-color: #f9fafb; padding: 20px; border-radius: 6px; margin: 20px 0;">
      <p><strong>From:</strong> ${fromName} (${fromEmail})</p>
      <p><strong>Type:</strong> ${type}</p>
      <p><strong>Subject:</strong> ${subject}</p>
    </div>
    <div style="margin: 20px 0;">
      <p><strong>Message:</strong></p>
      <p style="white-space: pre-wrap;">${message}</p>
    </div>
  `;

  return sendEmail({
    to: recipientEmail,
    subject: `[${type.toUpperCase()}] ${subject}`,
    html: getBaseTemplate(content, 'Contact Form Submission'),
    text: `New Contact Form Submission\n\nFrom: ${fromName} (${fromEmail})\nType: ${type}\nSubject: ${subject}\n\nMessage:\n${message}`,
    replyTo: fromEmail,
  });
}

