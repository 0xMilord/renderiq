# Email Infrastructure - Webhooks & SMTP Configuration

**Quick Reference Guide for Production Setup**

---

## 🔗 Webhook URLs

### 1. Resend Webhook (Email Events)

**URL:**
```
https://renderiq.io/api/webhooks/resend
```

**Events to Subscribe:**
- ✅ `email.sent` - Email was successfully sent
- ✅ `email.delivered` - Email was delivered to recipient
- ✅ `email.delivery_delayed` - Email delivery was delayed
- ✅ `email.complained` - Recipient marked email as spam
- ✅ `email.bounced` - Email bounced
- ✅ `email.opened` - Recipient opened email
- ✅ `email.clicked` - Recipient clicked a link

**Setup Steps:**
1. Go to [Resend Dashboard](https://resend.com/webhooks)
2. Click "Add Webhook"
3. Enter URL: `https://renderiq.io/api/webhooks/resend`
4. Select all events listed above
5. Copy the webhook secret
6. Add to environment: `RESEND_WEBHOOK_SECRET=xxx`

---

### 2. Supabase Auth Webhook (Auth Events)

**URL:**
```
https://renderiq.io/api/webhooks/supabase-auth
```

**Table:** `auth.users`

**Events:**
- ✅ `INSERT` - New user signup (sends verification email)
- ✅ `UPDATE` - Email verified, password reset (sends welcome email)

**HTTP Headers:**
```
Authorization: Bearer YOUR_SUPABASE_SERVICE_ROLE_KEY
Content-Type: application/json
```

**Setup Steps:**
1. Go to **Supabase Dashboard** → **Database** → **Webhooks**
2. Click **Create a new webhook**
3. Configure:
   - **Name:** `Auth Email Webhook`
   - **Table:** `auth.users`
   - **Events:** INSERT, UPDATE
   - **URL:** `https://renderiq.io/api/webhooks/supabase-auth`
   - **Method:** POST
   - **HTTP Headers:**
     ```
     Authorization: Bearer YOUR_SUPABASE_SERVICE_ROLE_KEY
     ```
   - **Enable Retries:** Yes (3 retries, 1 second interval)
4. Click **Save**

---

## 📧 SMTP Configuration for Supabase

### Option 1: Use Resend SMTP (Recommended)

**Location:** Supabase Dashboard → Authentication → Email Templates → SMTP Settings

**Configuration:**
```
SMTP Host: smtp.resend.com
SMTP Port: 465 (SSL) or 587 (TLS)
SMTP User: resend
SMTP Password: [Your Resend API Key]
Sender Email: noreply@renderiq.io
Sender Name: Renderiq
```

**Steps:**
1. Go to **Supabase Dashboard** → **Authentication** → **Email Templates**
2. Scroll to **SMTP Settings**
3. Enable **Custom SMTP**
4. Fill in the values above
5. Click **Save**
6. Test by sending a test email

---

## 🔑 Environment Variables Required

```env
# Resend Configuration
RESEND_API_KEY=re_xxxxxxxxxxxxx
RESEND_FROM_EMAIL=Renderiq <noreply@renderiq.io>
SUPPORT_EMAIL=support@renderiq.io
RESEND_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx  # Optional, for webhook verification

# Supabase Configuration
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# App Configuration
NEXT_PUBLIC_APP_URL=https://renderiq.io

# Credits Threshold (Optional)
CREDITS_LOW_THRESHOLD=10
```

---

## ✅ Quick Setup Checklist

### Resend Setup
- [ ] Create Resend account
- [ ] Verify domain (renderiq.io)
- [ ] Add DNS records (SPF, DKIM, DMARC)
- [ ] Get API key
- [ ] Configure webhook (optional)
- [ ] Test email sending

### Supabase Setup
- [ ] Get Service Role Key
- [ ] Configure SMTP OR set up webhook
- [ ] Test auth email flow

### Application Setup
- [ ] Add all environment variables
- [ ] Deploy to production
- [ ] Test signup flow
- [ ] Test password reset
- [ ] Test payment emails
- [ ] Monitor Resend dashboard

---

## 🧪 Testing

### Test Signup Flow
1. Go to `/signup`
2. Create account
3. Check email for verification link
4. Click link
5. Check for welcome email

### Test Password Reset
1. Go to `/login`
2. Click "Forgot Password"
3. Enter email
4. Check email for reset link

### Test Payment Emails
1. Purchase credits
2. Check for:
   - Receipt email
   - Invoice email
   - Credits added email

### Test Credits Low
1. Use credits until balance < 10
2. Check for "Credits Running Low" email

---

## 📊 Monitoring

### Resend Dashboard
- Monitor delivery rates
- Check bounce/complaint rates
- Track opens/clicks
- View webhook events

### Application Logs
Look for:
- `✅ EmailService: Email sent successfully`
- `✅ ResendWebhook: Email delivered`
- `⚠️ ResendWebhook: Email bounced`

---

## 🆘 Troubleshooting

### Emails Not Sending
1. Check `RESEND_API_KEY` is set
2. Verify domain in Resend dashboard
3. Check DNS records
4. Review application logs

### Webhook Not Working
1. Verify webhook URL is publicly accessible
2. Check authorization header
3. Review webhook logs in Resend/Supabase
4. Check application logs

### SMTP Not Working
1. Verify SMTP credentials
2. Test SMTP connection in Supabase
3. Check sender email is verified
4. Review Supabase logs

---

## 📚 Full Documentation

For complete setup instructions, see:
- `docs/EMAIL_SETUP_GUIDE.md` - Detailed setup guide
- `docs/EMAIL_INFRASTRUCTURE.md` - Technical documentation

---

**Last Updated:** 2025-01-XX

