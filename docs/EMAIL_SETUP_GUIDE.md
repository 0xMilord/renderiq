# Email Infrastructure - Complete Setup Guide

**Date:** 2025-01-XX  
**Status:** ✅ PRODUCTION READY

---

## 🚀 Quick Start

This guide will help you set up the complete email infrastructure with Resend and Supabase integration.

---

## 📋 Prerequisites

1. **Resend Account**
   - Sign up at [resend.com](https://resend.com)
   - Verify your domain (e.g., `renderiq.io`)
   - Get your API key from the dashboard

2. **Supabase Project**
   - Access to Supabase Dashboard
   - Service Role Key (for webhooks)

3. **Environment Variables**
   - `RESEND_API_KEY` - Your Resend API key
   - `SUPABASE_SERVICE_ROLE_KEY` - Your Supabase service role key
   - `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
   - `NEXT_PUBLIC_APP_URL` - Your production domain (e.g., `https://renderiq.io`)

---

## 🔧 Step 1: Environment Variables

Add these to your `.env` file (or Vercel environment variables):

```env
# Resend Configuration (REQUIRED)
RESEND_API_KEY=re_xxxxxxxxxxxxx
RESEND_FROM_EMAIL=Renderiq <noreply@renderiq.io>
SUPPORT_EMAIL=support@renderiq.io

# App URL (REQUIRED for production)
NEXT_PUBLIC_APP_URL=https://renderiq.io

# Supabase Configuration (REQUIRED for webhooks)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Credits Threshold (OPTIONAL - defaults to 10)
CREDITS_LOW_THRESHOLD=10
```

---

## 📧 Step 2: Resend Domain Setup

### 2.1 Verify Your Domain

1. Go to [Resend Dashboard](https://resend.com/domains)
2. Click "Add Domain"
3. Enter your domain (e.g., `renderiq.io`)
4. Add the DNS records provided by Resend:

   **SPF Record:**
   ```
   Type: TXT
   Name: @
   Value: v=spf1 include:resend.com ~all
   ```

   **DKIM Records:**
   ```
   Type: CNAME
   Name: resend._domainkey
   Value: [provided by Resend]
   ```

   **DMARC Record (Recommended):**
   ```
   Type: TXT
   Name: _dmarc
   Value: v=DMARC1; p=quarantine; rua=mailto:dmarc@renderiq.io
   ```

5. Wait for DNS propagation (usually 5-15 minutes)
6. Verify domain status in Resend dashboard

### 2.2 Resend Webhook Configuration (Optional - for email events)

**Webhook URL:**
```
https://renderiq.io/api/webhooks/resend
```

**Events to Subscribe:**
- `email.sent` - Email was successfully sent
- `email.delivered` - Email was delivered to recipient
- `email.delivery_delayed` - Email delivery was delayed
- `email.complained` - Recipient marked email as spam
- `email.bounced` - Email bounced
- `email.opened` - Recipient opened email
- `email.clicked` - Recipient clicked a link

**Webhook Secret:**
- Generate a secret in Resend dashboard
- Store in `RESEND_WEBHOOK_SECRET` environment variable

---

## 🔐 Step 3: Supabase SMTP Configuration

### 3.1 Configure Supabase to Use Resend SMTP

1. Go to **Supabase Dashboard** → **Authentication** → **Email Templates**
2. Scroll down to **SMTP Settings**
3. Enable **Custom SMTP**
4. Fill in the following:

   **SMTP Host:**
   ```
   smtp.resend.com
   ```

   **SMTP Port:**
   ```
   465 (SSL) or 587 (TLS)
   ```

   **SMTP User:**
   ```
   resend
   ```

   **SMTP Password:**
   ```
   [Your Resend API Key]
   ```

   **Sender Email:**
   ```
   noreply@renderiq.io (or your verified domain)
   ```

   **Sender Name:**
   ```
   Renderiq
   ```

5. Click **Save**
6. Test by sending a test email

### 3.2 Supabase Webhook Configuration (Alternative to SMTP)

If you prefer to handle all emails via Resend (not using Supabase SMTP):

1. Go to **Supabase Dashboard** → **Database** → **Webhooks**
2. Click **Create a new webhook**
3. Configure:

   **Name:**
   ```
   Auth Email Webhook
   ```

   **Table:**
   ```
   auth.users
   ```

   **Events:**
   - ✅ INSERT (new user signup)
   - ✅ UPDATE (email verification, password reset)

   **HTTP Request:**
   - **URL:** `https://renderiq.io/api/webhooks/supabase-auth`
   - **Method:** `POST`
   - **HTTP Headers:**
     ```
     Authorization: Bearer YOUR_SUPABASE_SERVICE_ROLE_KEY
     Content-Type: application/json
     ```

   **Enable Retries:**
   - ✅ Yes
   - **Retry Count:** 3
   - **Retry Interval:** 1 second

4. Click **Save**

**Note:** If using this webhook, you can disable Supabase's email sending in Authentication → Settings → "Enable email confirmations" (keep enabled, but emails will be sent via Resend).

---

## 🎯 Step 4: Webhook Endpoints

### 4.1 Resend Webhook Handler (Optional)

**Endpoint:** `POST /api/webhooks/resend`

**Purpose:** Track email delivery, opens, clicks, bounces, etc.

**Setup:**
1. Create the webhook handler (already created in codebase)
2. Add `RESEND_WEBHOOK_SECRET` to environment variables
3. Configure in Resend dashboard (see Step 2.2)

### 4.2 Supabase Auth Webhook Handler

**Endpoint:** `POST /api/webhooks/supabase-auth`

**Purpose:** Send custom emails via Resend when auth events occur

**Setup:**
1. Already created: `app/api/webhooks/supabase-auth/route.ts`
2. Configure in Supabase dashboard (see Step 3.2)
3. Requires `SUPABASE_SERVICE_ROLE_KEY` environment variable

**Events Handled:**
- **INSERT:** Sends verification email when user signs up
- **UPDATE:** Sends welcome email when email is verified

---

## ✅ Step 5: Testing

### 5.1 Test Email Sending

1. **Signup Flow:**
   ```
   1. Go to /signup
   2. Create a new account
   3. Check email inbox for verification email
   4. Click verification link
   5. Check for welcome email
   ```

2. **Password Reset:**
   ```
   1. Go to /login
   2. Click "Forgot Password"
   3. Enter email
   4. Check email inbox for reset link
   ```

3. **Payment Flow:**
   ```
   1. Purchase credits or subscription
   2. Check email for:
      - Receipt email
      - Invoice email
      - Credits added email
   ```

4. **Credits Low:**
   ```
   1. Use credits until balance drops below threshold (default: 10)
   2. Check email for "Credits Running Low" notification
   ```

### 5.2 Check Resend Dashboard

1. Go to [Resend Dashboard](https://resend.com/emails)
2. View sent emails
3. Check delivery status
4. Monitor bounce/complaint rates

### 5.3 Check Application Logs

Look for these log messages:
- `✅ EmailService: Email sent successfully`
- `✅ ResendVerification: Verification email sent via Resend`
- `✅ BillingService: Credits finished email sent`

---

## 🔍 Step 6: Monitoring & Alerts

### 6.1 Resend Dashboard

Monitor:
- **Delivery Rate:** Should be > 95%
- **Bounce Rate:** Should be < 5%
- **Complaint Rate:** Should be < 0.1%
- **Open Rate:** Track engagement

### 6.2 Application Logs

Set up alerts for:
- Email sending failures
- Webhook failures
- SMTP connection errors

### 6.3 Email Health Checks

Create a cron job or scheduled task to:
- Test email sending daily
- Verify webhook endpoints are responding
- Check domain reputation

---

## 🐛 Troubleshooting

### Emails Not Sending

**Check 1: API Key**
```bash
# Verify RESEND_API_KEY is set
echo $RESEND_API_KEY
```

**Check 2: Domain Verification**
- Go to Resend dashboard
- Verify domain status is "Verified"
- Check DNS records are correct

**Check 3: Application Logs**
```bash
# Look for email errors
grep "EmailService" logs.txt | grep "error"
```

**Check 4: Resend Dashboard**
- Check "Emails" section for sent emails
- Look for error messages
- Check rate limits

### Supabase Emails Not Using Resend

**If using SMTP:**
1. Verify SMTP settings in Supabase dashboard
2. Test SMTP connection
3. Check sender email is verified in Resend

**If using Webhook:**
1. Verify webhook is active in Supabase dashboard
2. Check webhook logs in Supabase
3. Verify `SUPABASE_SERVICE_ROLE_KEY` is correct
4. Check application logs for webhook errors

### Webhook Not Receiving Events

1. **Check Webhook URL:**
   - Must be publicly accessible
   - Must use HTTPS in production
   - Must return 200 status code

2. **Check Authorization:**
   - Verify `Authorization` header is set correctly
   - Check `SUPABASE_SERVICE_ROLE_KEY` matches

3. **Check Webhook Logs:**
   - Supabase Dashboard → Database → Webhooks → View Logs
   - Look for error responses

---

## 📊 Production Checklist

- [ ] Resend API key configured
- [ ] Domain verified in Resend
- [ ] DNS records (SPF, DKIM, DMARC) configured
- [ ] Supabase SMTP configured OR webhook configured
- [ ] All environment variables set
- [ ] Test signup flow - verification email received
- [ ] Test password reset - reset email received
- [ ] Test payment flow - receipt/invoice emails received
- [ ] Test credits low - notification email received
- [ ] Monitor Resend dashboard for delivery rates
- [ ] Set up email monitoring/alerts
- [ ] Review email templates for branding
- [ ] Test email deliverability
- [ ] Configure email analytics (optional)

---

## 🔗 Quick Reference

### Webhook URLs

**Resend Webhook:**
```
https://renderiq.io/api/webhooks/resend
```

**Supabase Auth Webhook:**
```
https://renderiq.io/api/webhooks/supabase-auth
```

### API Endpoints

**Resend Verification Email:**
```
POST /api/auth/resend-verification
Body: { "email": "user@example.com" }
```

**Forgot Password:**
```
POST /api/auth/forgot-password
Body: { "email": "user@example.com" }
```

### Environment Variables

```env
RESEND_API_KEY=re_xxx
RESEND_FROM_EMAIL=Renderiq <noreply@renderiq.io>
SUPPORT_EMAIL=support@renderiq.io
NEXT_PUBLIC_APP_URL=https://renderiq.io
SUPABASE_SERVICE_ROLE_KEY=eyJxxx
CREDITS_LOW_THRESHOLD=10
```

---

## 📚 Additional Resources

- [Resend Documentation](https://resend.com/docs)
- [Resend API Reference](https://resend.com/docs/api-reference)
- [Supabase SMTP Configuration](https://supabase.com/docs/guides/auth/auth-smtp)
- [Supabase Webhooks](https://supabase.com/docs/guides/database/webhooks)

---

## 🆘 Support

If you encounter issues:
1. Check application logs
2. Check Resend dashboard
3. Check Supabase webhook logs
4. Review this guide's troubleshooting section
5. Contact support with error logs

---

**Last Updated:** 2025-01-XX  
**Version:** 1.0.0

