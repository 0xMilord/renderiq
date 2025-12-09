# Complete Guide: Disable Supabase Emails + URL Masking

**Date**: 2025-01-27  
**Status**: ✅ IMPLEMENTED

---

## 🎯 Goals

1. ✅ Stop duplicate emails (Supabase + Resend)
2. ✅ Brand auth URLs (use `auth.renderiq.io` instead of `projectid.supabase.co`)

---

## Part 1: Disable Supabase Emails

### Steps

1. Go to **Supabase Dashboard**: https://supabase.com/dashboard
2. Select your project
3. Navigate to **Authentication** → **Settings** (gear icon)
4. Scroll to **Email Auth** section
5. Find **"Enable email confirmations"**
6. **Turn it OFF** (uncheck)
7. Click **Save**

**Result**: Only Resend sends emails (no duplicates)

---

## Part 2: URL Masking Setup

### What It Does

Converts Supabase URLs:
- **Before**: `https://projectid.supabase.co/auth/v1/verify?token=xyz`
- **After**: `https://auth.renderiq.io/auth/v1/verify?token=xyz`

### DNS Setup

#### Option A: Vercel (Recommended)

1. Go to **Vercel Dashboard** → Your Project → **Settings** → **Domains**
2. Click **Add Domain**
3. Enter: `auth.renderiq.io`
4. Follow DNS instructions (usually CNAME to Vercel)

#### Option B: Manual DNS

Add CNAME record:
```
Type: CNAME
Name: auth
Value: [your-vercel-app].vercel.app
TTL: 3600
```

### Environment Variable (Optional)

```env
NEXT_PUBLIC_MASKED_AUTH_DOMAIN=auth.renderiq.io
```

### How It Works

1. **Code generates Supabase link**: `projectid.supabase.co/auth/v1/verify?token=xyz`
2. **maskSupabaseUrl() masks it**: `auth.renderiq.io/auth/v1/verify?token=xyz`
3. **Email sent with masked URL**
4. **User clicks masked URL**
5. **Middleware proxies** `auth.renderiq.io/auth/v1/*` → Supabase
6. **Supabase processes** and redirects back

---

## Implementation Details

### Files Created/Modified

✅ **New Files**:
- `lib/utils/url-masker.ts` - URL masking utility
- `middleware.ts` - Unified middleware (handles proxy + normal requests)
- `app/api/auth-proxy/[...path]/route.ts` - Alternative API proxy route

✅ **Updated Files**:
- `app/api/auth/send-verification/route.ts` - Uses masked URLs
- `app/api/auth/resend-verification/route.ts` - Uses masked URLs
- `app/api/auth/forgot-password/route.ts` - Uses masked URLs
- `app/api/webhooks/supabase-auth/route.ts` - Uses masked URLs

✅ **Removed Files**:
- `proxy.ts` - Merged into `middleware.ts`

---

## Testing

### Test URL Masking

```typescript
import { maskSupabaseUrl } from '@/lib/utils/url-masker';

const original = 'https://projectid.supabase.co/auth/v1/verify?token=xyz';
const masked = maskSupabaseUrl(original);
console.log(masked); 
// Output: https://auth.renderiq.io/auth/v1/verify?token=xyz
```

### Test Email Flow

1. Sign up with test email
2. Check verification email
   - ✅ Should show `auth.renderiq.io` domain
   - ✅ Should receive only 1 email (from Resend)
3. Click verification link
   - ✅ Should proxy to Supabase
   - ✅ Should work correctly

### Test Proxy

Visit directly:
- `https://auth.renderiq.io/auth/v1/verify?token=test`
- Should proxy to Supabase

---

## Troubleshooting

### Still getting duplicate emails?

1. Verify Supabase Dashboard: "Enable email confirmations" = OFF
2. Wait 5-10 minutes for settings to propagate
3. Clear browser cache
4. Try signup again

### DNS not working?

1. Check DNS propagation: [whatsmydns.net](https://www.whatsmydns.net)
2. Verify CNAME record is correct
3. Wait up to 48 hours for DNS propagation
4. Check Vercel domain configuration

### Proxy not working?

1. Check `NEXT_PUBLIC_SUPABASE_URL` is set
2. Verify middleware is deployed
3. Check Vercel logs for errors
4. Test proxy route: `/api/auth-proxy/verify?token=test`

### Links still show Supabase domain?

1. Clear cache and rebuild
2. Verify `maskSupabaseUrl()` is being called
3. Check environment variables
4. Restart dev server

---

## Quick Checklist

- [ ] Disable "Enable email confirmations" in Supabase Dashboard
- [ ] Add DNS CNAME record for `auth.renderiq.io`
- [ ] Add domain in Vercel Dashboard
- [ ] Test signup - should receive only 1 email
- [ ] Verify email links use `auth.renderiq.io`
- [ ] Test verification link works

---

## Summary

**Problem 1 (Duplicates)**: ✅ Fixed by disabling email confirmations in Supabase  
**Problem 2 (Unbranded URLs)**: ✅ Fixed by URL masking + DNS setup

Both solutions work together to give you:
- ✅ Single email (from Resend, styled)
- ✅ Branded URLs (`auth.renderiq.io`)
- ✅ No need to buy Supabase custom domain feature

