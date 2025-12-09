# Email Infrastructure - Resend Integration

**Date:** 2025-01-XX  
**Status:** ✅ IMPLEMENTED

---

## Overview

The application now uses **Resend** as the primary email service for all transactional and marketing emails. This replaces Supabase's default email service for better control, branding, and deliverability.

---

## ✅ Implemented Features

### 1. Core Email Service (`lib/services/email.service.ts`)

A comprehensive email service module with:
- Resend client initialization
- Professional HTML email templates
- Type-safe email data interfaces
- Error handling and logging

### 2. Email Templates

#### Auth Emails
- ✅ **Verification Email** - Sent when user signs up
- ✅ **Password Reset Email** - Sent when user requests password reset
- ✅ **Password Reset Confirmation** - Sent after successful password reset

#### Payment Emails
- ✅ **Payment Receipt** - Sent after successful payment
- ✅ **Invoice Email** - Sent when invoice is generated

#### Credits Emails
- ✅ **Credits Added** - Sent when credits are added to account
- ✅ **Credits Finished** - Sent when credits are running low

#### Subscription Emails
- ✅ **Subscription Activated** - Sent when subscription is activated
- ✅ **Subscription Renewed** - Sent on recurring payment
- ✅ **Subscription Cancelled** - Sent when subscription is cancelled
- ✅ **Subscription Failed** - Sent when payment fails

#### Marketing Emails
- ✅ **Welcome Email** - Sent after user signs up and verifies email
- ✅ **Marketing Email** - Generic template for promotional emails

#### Contact Form
- ✅ **Contact Form Submission** - Internal email for contact form submissions

### 3. Integration Points

#### Auth Flow
- ✅ **Signup** - Verification email sent via Supabase (can be configured to use Resend)
- ✅ **Email Verification** - Resend verification email API route (`/api/auth/resend-verification`)
- ✅ **Password Reset** - Password reset email API route (`/api/auth/forgot-password`)
- ✅ **Welcome Email** - Sent after user profile creation (email verification)

#### Payment Flow
- ✅ **Receipt Service** - Sends receipt email after payment completion
- ✅ **Invoice Service** - Sends invoice email when invoice is generated

#### Credits System
- ✅ **Credits Added** - Email sent when credits are added (purchase or subscription)
- ✅ **Credits Finished** - Email sent when credits drop below threshold (default: 10 credits)

#### Subscription System
- ✅ **Subscription Activated** - Email sent in `handleSubscriptionActivated` webhook
- ✅ **Subscription Renewed** - Email sent in `handleSubscriptionCharged` webhook
- ✅ **Subscription Cancelled** - Email sent in `handleSubscriptionCancelled` webhook
- ✅ **Subscription Failed** - Email template ready (needs integration with payment failure handler)

#### Contact Form
- ✅ **Contact Form** - Sends internal email to appropriate team based on inquiry type

---

## 🔧 Configuration

### Environment Variables

Add these to your `.env` file:

```env
# Resend API Key (required)
RESEND_API_KEY=re_xxxxxxxxxxxxx

# From email address (optional, defaults to noreply@renderiq.io)
RESEND_FROM_EMAIL=Renderiq <noreply@renderiq.io>

# Support email (optional, defaults to support@renderiq.io)
SUPPORT_EMAIL=support@renderiq.io

# App URL (optional, auto-detected from Vercel or defaults to localhost)
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

### Supabase Configuration (Optional)

To use Resend for Supabase auth emails instead of Supabase's default service:

1. **Option 1: Configure Supabase SMTP (Recommended)**
   - Go to Supabase Dashboard → Authentication → Email Templates
   - Configure custom SMTP settings using Resend's SMTP credentials
   - SMTP Host: `smtp.resend.com`
   - SMTP Port: `465` (SSL) or `587` (TLS)
   - SMTP User: `resend`
   - SMTP Password: Your Resend API key
   - From Email: Your verified Resend domain

2. **Option 2: Use Supabase Webhooks**
   - Set up a webhook in Supabase Dashboard → Database → Webhooks
   - Listen to `auth.users` table changes
   - Send custom emails via Resend when auth events occur
   - See `app/api/webhooks/supabase-auth/route.ts` (to be created)

---

## 📧 Email Templates

All email templates use a consistent design with:
- Professional HTML layout
- Responsive design
- Brand colors and styling
- Clear call-to-action buttons
- Footer with links and unsubscribe info

### Template Structure

```typescript
// Base template wrapper
getBaseTemplate(content: string, title?: string)

// Example usage
sendVerificationEmail({
  email: 'user@example.com',
  name: 'John Doe',
  verificationLink: 'https://...',
})
```

---

## 🔄 Email Flow Examples

### 1. User Signup Flow

```
1. User signs up → Supabase sends verification email (via Supabase or Resend SMTP)
2. User clicks verification link → Profile created
3. Welcome email sent via Resend (with 10 free credits)
```

### 2. Payment Flow

```
1. User completes payment → Payment verified
2. Credits added → Credits added email sent
3. Invoice created → Invoice email sent
4. Receipt generated → Receipt email sent
```

### 3. Subscription Flow

```
1. User subscribes → Payment processed
2. Subscription activated → Activation email sent
3. Monthly renewal → Renewal email sent
4. Payment fails → Failure email sent
5. User cancels → Cancellation email sent
```

---

## 🚀 Usage Examples

### Sending a Custom Email

```typescript
import { sendMarketingEmail } from '@/lib/services/email.service';

await sendMarketingEmail({
  name: 'John Doe',
  email: 'john@example.com',
  subject: 'Special Offer!',
  content: '<p>Check out our new features!</p>',
  ctaText: 'Learn More',
  ctaLink: 'https://renderiq.io/features',
});
```

### Sending Credits Added Email

```typescript
import { sendCreditsAddedEmail } from '@/lib/services/email.service';

await sendCreditsAddedEmail({
  name: 'John Doe',
  email: 'john@example.com',
  credits: 100,
  balance: 150,
  reason: 'Purchased Starter Package',
  transactionId: 'txn_123',
});
```

---

## 📝 TODO / Future Enhancements

- [x] Implement credits finished threshold check (send email when credits < 10) ✅
- [x] Set up Supabase webhook for auth events ✅
- [x] Add Resend webhook for email events ✅
- [ ] Add email preferences/unsubscribe functionality
- [ ] Add email queue for better reliability
- [ ] Add email analytics and tracking
- [ ] Create email template editor in admin dashboard
- [ ] Add A/B testing for email templates
- [ ] Implement email retry logic for failed sends

---

## 🔍 Testing

### Test Email Sending

1. **Local Development:**
   - Set `RESEND_API_KEY` in `.env.local`
   - Use Resend's test mode or sandbox domain
   - Check Resend dashboard for sent emails

2. **Production:**
   - Verify domain in Resend dashboard
   - Test all email types
   - Monitor Resend dashboard for delivery status

### Test Email Templates

All email templates can be tested by calling the respective functions in the email service. Check the Resend dashboard to see rendered emails.

---

## 📚 Related Files

- `lib/services/email.service.ts` - Core email service
- `app/api/auth/resend-verification/route.ts` - Resend verification email API
- `app/api/auth/forgot-password/route.ts` - Password reset email API
- `app/api/webhooks/supabase-auth/route.ts` - Supabase auth webhook handler
- `app/api/webhooks/resend/route.ts` - Resend email events webhook handler
- `lib/services/receipt.service.ts` - Receipt email integration
- `lib/services/invoice.service.ts` - Invoice email integration
- `lib/services/billing.ts` - Credits finished email integration
- `lib/services/razorpay.service.ts` - Payment/subscription email integration
- `lib/services/user-onboarding.ts` - Welcome email integration
- `lib/actions/contact.actions.ts` - Contact form email integration
- `docs/EMAIL_SETUP_GUIDE.md` - Complete setup guide with webhook URLs and SMTP config

---

## 🐛 Troubleshooting

### Emails Not Sending

1. **Check API Key:**
   - Verify `RESEND_API_KEY` is set correctly
   - Check Resend dashboard for API key status

2. **Check Domain:**
   - Verify domain in Resend dashboard
   - Ensure DNS records are configured correctly

3. **Check Logs:**
   - Check application logs for email errors
   - Check Resend dashboard for delivery status

### Supabase Auth Emails Still Using Default Service

- Configure Supabase SMTP settings (see Configuration section)
- Or set up webhook to intercept auth events

---

## 📖 Resources

- [Resend Documentation](https://resend.com/docs)
- [Resend API Reference](https://resend.com/docs/api-reference)
- [Supabase SMTP Configuration](https://supabase.com/docs/guides/auth/auth-smtp)

---

## ✅ Checklist for Production

- [ ] Verify Resend API key is set
- [ ] Verify domain in Resend dashboard
- [ ] Configure DNS records (SPF, DKIM, DMARC)
- [ ] Test all email types
- [ ] Configure Supabase SMTP (if using for auth emails)
- [ ] Set up email monitoring/alerts
- [ ] Review email templates for branding
- [ ] Test email deliverability
- [ ] Set up email analytics

