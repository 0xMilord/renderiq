# Supabase Email Customization Guide

**Date**: 2025-01-27  
**Status**: ✅ IMPLEMENTED

---

## Problem

Supabase auth emails are sent using Supabase's default templates, which don't match our app's theme and branding. They appear unstyled and unprofessional.

---

## Solution

We now send all verification emails through **Resend** with custom-styled templates that match our app theme.

### Changes Made

1. **Custom Email Templates** (`lib/services/email.service.ts`)
   - ✅ Updated email template to match app theme
   - ✅ Green/lime color scheme (`#22c55e` primary, `#84cc16` accent)
   - ✅ Modern gradient buttons
   - ✅ Professional branding and styling
   - ✅ Responsive design

2. **New Send Verification Endpoint** (`app/api/auth/send-verification/route.ts`)
   - ✅ Sends styled emails via Resend during signup
   - ✅ Generates verification links using Supabase admin API
   - ✅ Matches app branding

3. **Signup Flow Updated** (`lib/stores/auth-store.ts`)
   - ✅ Calls `/api/auth/send-verification` after signup
   - ✅ Sends custom-styled email instead of Supabase default

---

## How It Works

1. User signs up via `supabase.auth.signUp()`
2. Immediately after signup, we call `/api/auth/send-verification`
3. This endpoint:
   - Finds the user via Supabase admin API
   - Generates a verification link
   - Sends styled email via Resend
4. User receives beautiful, branded verification email

---

## Optional: Disable Supabase Default Emails

To prevent Supabase from sending its own emails (avoiding duplicates), configure Supabase:

### Option 1: Disable Auto-Confirm Emails (Recommended)

Go to Supabase Dashboard → Authentication → Settings → Email Auth:
- Uncheck "Enable email confirmations" (but keep email required)
- This prevents Supabase from sending its own emails

### Option 2: Configure SMTP to Use Resend

Go to Supabase Dashboard → Authentication → Email Templates → SMTP Settings:
- **SMTP Host**: `smtp.resend.com`
- **SMTP Port**: `465` (SSL) or `587` (TLS)
- **SMTP User**: `resend`
- **SMTP Password**: Your Resend API key
- **From Email**: Your verified Resend domain (e.g., `team@renderiq.io`)

This way, Supabase emails will be sent through Resend, but you still won't have full control over the template.

**Note**: Option 1 (disabling auto-confirm) is better since we're sending custom emails anyway.

---

## Email Template Features

### Design
- ✅ Green/lime gradient branding (`#22c55e` to `#84cc16`)
- ✅ Clean, modern layout
- ✅ Responsive design (mobile-friendly)
- ✅ Professional typography
- ✅ Clear call-to-action buttons

### Content
- ✅ Personalized greeting
- ✅ Clear instructions
- ✅ Verification button
- ✅ Fallback link text
- ✅ Expiration notice
- ✅ Footer with links

---

## Testing

1. Sign up with a new email
2. Check inbox for styled verification email
3. Verify the email matches app branding
4. Click verification link
5. Should redirect to dashboard

---

## Future Improvements

- [ ] Add email preference center
- [ ] A/B test email designs
- [ ] Add email analytics
- [ ] Create email template builder

---

## Files Modified

- `lib/services/email.service.ts` - Updated email template styling
- `lib/stores/auth-store.ts` - Added call to send styled email
- `app/api/auth/send-verification/route.ts` - New endpoint for styled emails

---

## Notes

- Supabase's `auth.signUp()` may still send a default email if not disabled
- Our custom email is sent immediately after, so users may receive both
- To prevent duplicates, configure Supabase as described above
- The custom email takes precedence since it's styled and branded

