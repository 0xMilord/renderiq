# Quick Fix: Stop Duplicate Emails

**Problem**: Getting 2 verification emails (one from Supabase, one from Resend)

**Solution**: Disable Supabase's automatic email sending

---

## 🚀 Quick Steps (2 minutes)

### Step 1: Go to Supabase Dashboard
1. Visit: https://supabase.com/dashboard
2. Select your project

### Step 2: Disable Email Confirmations
1. Click **Authentication** (left sidebar)
2. Click **Settings** (gear icon)
3. Scroll to **Email Auth** section
4. Find **"Enable email confirmations"**
5. **Turn it OFF** (uncheck the box)
6. Click **Save**

### Step 3: Verify Settings
Make sure:
- ✅ **Enable email signup**: ON
- ❌ **Enable email confirmations**: OFF
- ✅ **Secure email change**: ON (optional)

### Step 4: Test
1. Sign up with a test email
2. Check inbox - should receive **ONLY 1 email** (from Resend)
3. Verify it works

---

## ✅ What This Does

- **Before**: Supabase sends email → Resend sends email = **2 emails** ❌
- **After**: Only Resend sends email = **1 email** ✅

---

## ⚠️ Important Notes

- Email verification still works (via our Resend emails)
- Users still need to verify their email
- We just control which service sends the email
- No code changes needed

---

## 🔄 If You Need to Revert

1. Go back to Supabase Dashboard
2. Turn **"Enable email confirmations"** back ON
3. Save

---

## 📧 Alternative: Use Resend SMTP in Supabase

If you want Supabase to send emails through Resend (but still use Supabase templates):

1. Go to **Authentication** → **Email Templates** → **SMTP Settings**
2. Configure:
   - **SMTP Host**: `smtp.resend.com`
   - **SMTP Port**: `465` (SSL)
   - **SMTP User**: `resend`
   - **SMTP Password**: Your Resend API key
   - **From Email**: `team@renderiq.io`
3. Enable **Custom SMTP**
4. Save

**Note**: This still uses Supabase's default email templates (not our custom styled ones).

---

## ✅ Recommended Solution

**Disable email confirmations** (Option 1) is the best approach because:
- ✅ We have full control over email design
- ✅ Uses our custom styled templates
- ✅ No duplicate emails
- ✅ Easy to manage

