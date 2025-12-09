# Supabase Custom Email Templates Setup

**Date**: 2025-01-27  
**Status**: ✅ IMPLEMENTED

---

## Overview

We've created custom-styled email templates for Supabase authentication flows that match the Renderiq branding. These templates use Supabase's native email template system, eliminating the need for Resend for auth emails.

---

## Files Created

### Configuration
- ✅ `supabase/config.toml` - Email template configuration

### Authentication Templates
- ✅ `supabase/templates/confirmation.html` - Email verification
- ✅ `supabase/templates/recovery.html` - Password reset
- ✅ `supabase/templates/magic_link.html` - Magic link sign-in
- ✅ `supabase/templates/email_change.html` - Email change confirmation
- ✅ `supabase/templates/invite.html` - User invitation
- ✅ `supabase/templates/reauthentication.html` - Reauthentication OTP

### Security Notification Templates
- ✅ `supabase/templates/password_changed.html` - Password changed notification
- ✅ `supabase/templates/email_changed.html` - Email changed notification
- ✅ `supabase/templates/phone_changed.html` - Phone changed notification
- ✅ `supabase/templates/mfa_enrolled.html` - MFA added notification
- ✅ `supabase/templates/mfa_unenrolled.html` - MFA removed notification
- ✅ `supabase/templates/identity_linked.html` - OAuth account linked
- ✅ `supabase/templates/identity_unlinked.html` - OAuth account unlinked

---

## Deploying Templates

### Option 1: Via Supabase Dashboard (Recommended for Production)

1. **Go to Supabase Dashboard**
   - Navigate to: https://supabase.com/dashboard
   - Select your project
   - Go to **Authentication** → **Email Templates**

2. **Copy Template Content**
   - For each template type, open the corresponding HTML file
   - Copy the entire HTML content
   - Paste into the Supabase Dashboard template editor
   - Update the subject line if needed
   - Save

3. **Enable Security Notifications** (if needed)
   - Go to **Authentication** → **Settings** → **Email Auth**
   - Enable security notifications you want to send

### Option 2: Via Supabase CLI (For Local Dev)

1. **Install Supabase CLI**
   ```bash
   npm install -g supabase
   ```

2. **Login to Supabase**
   ```bash
   supabase login
   ```

3. **Link Your Project**
   ```bash
   supabase link --project-ref your-project-ref
   ```

4. **Apply Config** (for local development)
   ```bash
   supabase start
   ```

5. **For Production**, manually copy templates to Dashboard as described in Option 1

---

## Template Variables

Supabase templates use Go template syntax. Available variables:

### Common Variables
- `{{ .ConfirmationURL }}` - Full confirmation/verification URL
- `{{ .SiteURL }}` - Your app's Site URL (from Supabase settings)
- `{{ .Email }}` - User's email address
- `{{ .Token }}` - 6-digit OTP code (for reauthentication)

### Specific Variables
- `{{ .NewEmail }}` - New email address (email_change template)
- `{{ .OldEmail }}` - Old email address (email_changed notification)
- `{{ .OldPhone }}` - Old phone number (phone_changed notification)
- `{{ .Phone }}` - New phone number (phone_changed notification)
- `{{ .Provider }}` - OAuth provider name (identity templates)
- `{{ .FactorType }}` - MFA factor type (MFA templates)

---

## Removing Resend for Auth Emails

Once templates are deployed to Supabase:

1. **Stop calling Resend endpoints** for auth emails:
   - Remove calls to `/api/auth/send-verification`
   - Remove calls to `/api/auth/resend-verification`
   - Let Supabase handle email sending automatically

2. **Update Code** (optional):
   - Remove Resend email calls from `lib/stores/auth-store.ts`
   - Remove custom email sending from signup flow
   - Supabase will automatically send emails using your templates

---

## URL Masking Integration

The templates use `{{ .ConfirmationURL }}` which will contain Supabase URLs. If you've set up URL masking:

1. The URLs will be automatically masked by your middleware/proxy
2. Users clicking links will see `auth.renderiq.io` instead of `projectid.supabase.co`
3. The proxy handles forwarding to Supabase

---

## Template Styling

All templates feature:
- ✅ Renderiq green/lime gradient branding (`#22c55e` to `#84cc16`)
- ✅ Responsive design (mobile-friendly)
- ✅ Professional typography
- ✅ Clear call-to-action buttons
- ✅ Security alerts for sensitive changes
- ✅ Consistent footer with links

---

## Testing

### Test Each Template Type

1. **Confirmation**: Sign up with a new email
2. **Recovery**: Request password reset
3. **Magic Link**: Request magic link sign-in
4. **Email Change**: Change email address
5. **Invite**: Invite a user via admin panel

### Verify
- ✅ Email styling matches app branding
- ✅ Links work correctly
- ✅ Responsive on mobile
- ✅ All template variables are populated

---

## Troubleshooting

### Templates not showing in dashboard?
- Make sure you're in the correct project
- Check file paths in `config.toml` are correct
- Verify HTML is valid

### Variables not working?
- Check Supabase template variable syntax
- Ensure variables match available ones for each template type
- Test with simple template first

### Emails still using default templates?
- Clear Supabase cache
- Wait a few minutes for changes to propagate
- Verify templates are saved in dashboard

---

## Next Steps

1. ✅ Deploy templates to Supabase Dashboard
2. ✅ Test each template type
3. ✅ Remove Resend calls for auth emails (optional)
4. ✅ Verify URL masking works with templates
5. ✅ Monitor email delivery and styling

---

## Notes

- Supabase templates are only available in the Dashboard (not via CLI push)
- CLI config is mainly for local development
- Production templates must be copied manually to Dashboard
- Templates use Go template syntax, not React/JSX
- All URLs in templates should use `{{ .ConfirmationURL }}` or `{{ .SiteURL }}`

