# How to Disable Supabase Emails (Stop Duplicate Emails)

**Date**: 2025-01-27  
**Priority**: 🔴 CRITICAL

---

## Problem

You're receiving **2 verification emails**:
1. One from Supabase (default, unstyled)
2. One from Resend (custom styled)

This happens because `supabase.auth.signUp()` automatically sends a verification email, and then we also send one via Resend.

---

## Solution: Disable Supabase Email Sending

You have **2 options**. Choose the one that works best for you:

---

## ✅ Option 1: Disable Email Confirmations in Supabase Dashboard (RECOMMENDED)

This prevents Supabase from sending emails, but we still handle verification via Resend.

### Steps:

1. **Go to Supabase Dashboard**
   - Navigate to: https://supabase.com/dashboard
   - Select your project

2. **Go to Authentication Settings**
   - Click **Authentication** in the left sidebar
   - Click **Settings** (gear icon)
   - Scroll to **Email Auth** section

3. **Disable Email Confirmations**
   - Find **"Enable email confirmations"** toggle
   - **Turn it OFF** (unchecked)
   - **Keep "Enable email signup"** ON (checked)
   - Click **Save**

4. **Important**: Make sure these settings:
   - ✅ **Enable email signup**: ON
   - ❌ **Enable email confirmations**: OFF
   - ✅ **Secure email change**: ON (optional)

### What This Does:

- Supabase will **NOT** send verification emails automatically
- Users can still sign up with email/password
- We send verification emails via Resend (styled)
- Email verification still works (via our Resend emails)

### ⚠️ Important Note:

Even with email confirmations disabled, Supabase still requires email verification for security. The difference is:
- **Before**: Supabase sends email automatically
- **After**: We send email via Resend, Supabase just checks if email is verified

---

## ✅ Option 2: Configure Supabase SMTP to Dummy/Disabled Server

This makes Supabase try to send emails but fail silently (they won't actually send).

### Steps:

1. **Go to Supabase Dashboard**
   - Navigate to: https://supabase.com/dashboard
   - Select your project

2. **Go to Email Templates**
   - Click **Authentication** → **Email Templates**
   - Scroll to **SMTP Settings**

3. **Configure Invalid SMTP** (to prevent sending)
   - **SMTP Host**: `localhost` (or any invalid host)
   - **SMTP Port**: `25`
   - **SMTP User**: `disabled`
   - **SMTP Password**: `disabled`
   - **Enable Custom SMTP**: ON
   - Click **Save**

### What This Does:

- Supabase tries to send emails but fails (silently)
- No emails are actually sent
- We send verification emails via Resend (styled)
- No duplicate emails

### ⚠️ Warning:

This might cause errors in Supabase logs, but emails won't be sent.

---

## ✅ Option 3: Use Supabase Hooks to Prevent Email Sending (ADVANCED)

Create a database hook that prevents email sending. This is more complex and not recommended.

---

## 🎯 Recommended Approach

**Use Option 1** (Disable email confirmations in Dashboard):
- ✅ Cleanest solution
- ✅ No errors in logs
- ✅ Full control over email sending
- ✅ Easy to revert if needed

---

## Testing After Disabling

1. **Sign up with a new email**
2. **Check inbox** - should receive **ONLY 1 email** (from Resend)
3. **Verify the email** - should work normally
4. **Check spam folder** - should not have duplicate

---

## Verification

After disabling Supabase emails:

1. Sign up with a test email
2. Check inbox - should see only Resend email
3. Check Supabase logs - should not show email sending attempts
4. Verify email - should work normally

---

## Reverting Changes

If you need to re-enable Supabase emails:

1. Go to Supabase Dashboard → Authentication → Settings
2. Turn **"Enable email confirmations"** back ON
3. Save changes

---

## Current Flow (After Fix)

```
1. User signs up
   ↓
2. Supabase creates user (NO email sent)
   ↓
3. Our code calls /api/auth/send-verification
   ↓
4. Resend sends styled verification email ✅
   ↓
5. User clicks link → Verified ✅
```

---

## Troubleshooting

### Still getting duplicate emails?

1. **Check Supabase Dashboard**:
   - Verify "Enable email confirmations" is OFF
   - Check SMTP settings are not configured

2. **Check your code**:
   - Make sure `/api/auth/send-verification` is being called
   - Check Resend dashboard for sent emails

3. **Clear cache**:
   - Wait a few minutes for Supabase settings to propagate
   - Try signing up again

### Emails not being sent at all?

1. **Check Resend API key**:
   - Verify `RESEND_API_KEY` is set
   - Check Resend dashboard for errors

2. **Check domain verification**:
   - Ensure domain is verified in Resend
   - Check DNS records are correct

3. **Check logs**:
   - Look for errors in server logs
   - Check Resend dashboard for delivery status

---

## Summary

**To stop duplicate emails:**

1. ✅ Go to Supabase Dashboard
2. ✅ Authentication → Settings → Email Auth
3. ✅ Turn OFF "Enable email confirmations"
4. ✅ Save
5. ✅ Test signup - should receive only 1 email (from Resend)

That's it! No code changes needed - just a dashboard setting.

