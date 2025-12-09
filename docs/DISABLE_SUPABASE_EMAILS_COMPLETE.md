# Complete Guide: Disable Supabase Emails & URL Masking

**Date**: 2025-01-27  
**Status**: ✅ IMPLEMENTED

---

## Problem

1. **Duplicate emails** - Getting emails from both Supabase and Resend
2. **Unbranded URLs** - Auth links show `projectid.supabase.co` instead of your domain

---

## Solutions

### Solution 1: Disable Supabase Emails (Stop Duplicates)

**Steps**:

1. Go to **Supabase Dashboard**: https://supabase.com/dashboard
2. Select your project
3. Navigate to **Authentication** → **Settings** (gear icon)
4. Scroll to **Email Auth** section
5. **Turn OFF** "Enable email confirmations"
6. Click **Save**

**Result**: 
- ✅ Supabase will NOT send emails automatically
- ✅ Only Resend sends emails (styled)
- ✅ No more duplicates

---

### Solution 2: URL Masking (Brand Your Auth URLs)

**What it does**:
- Masks `projectid.supabase.co/auth/v1/verify` → `auth.renderiq.io/auth/v1/verify`
- All verification links use your branded domain
- No need to buy Supabase's custom domain feature

**Implementation**:
- ✅ Created URL masking utility (`lib/utils/url-masker.ts`)
- ✅ Created proxy middleware (`middleware.ts`)
- ✅ Updated all email generation to use masked URLs

**Setup Required**:

1. **Add DNS Record**:
   ```
   Type: CNAME
   Name: auth
   Value: [your-vercel-deployment].vercel.app
   TTL: 3600
   ```

2. **Configure Vercel**:
   - Go to Vercel Dashboard → Your Project → Settings → Domains
   - Add domain: `auth.renderiq.io`
   - Vercel will automatically route it

3. **Add Environment Variable** (optional):
   ```env
   NEXT_PUBLIC_MASKED_AUTH_DOMAIN=auth.renderiq.io
   ```

**How It Works**:
```
1. Code generates: https://projectid.supabase.co/auth/v1/verify?token=xyz
2. maskSupabaseUrl() converts to: https://auth.renderiq.io/auth/v1/verify?token=xyz
3. Email sent with masked URL
4. User clicks masked URL
5. Middleware proxies to Supabase
6. Supabase processes and redirects back
```

---

## Files Changed

### New Files:
- ✅ `lib/utils/url-masker.ts` - URL masking utility
- ✅ `middleware.ts` - Proxy middleware for auth.renderiq.io
- ✅ `app/api/auth-proxy/[...path]/route.ts` - API proxy route (alternative)
- ✅ `docs/URL_MASKING_SETUP.md` - Setup guide

### Updated Files:
- ✅ `app/api/auth/send-verification/route.ts` - Uses masked URLs
- ✅ `app/api/auth/resend-verification/route.ts` - Uses masked URLs
- ✅ `app/api/auth/forgot-password/route.ts` - Uses masked URLs
- ✅ `app/api/webhooks/supabase-auth/route.ts` - Uses masked URLs

---

## Testing

### Test URL Masking:
```typescript
import { maskSupabaseUrl } from '@/lib/utils/url-masker';

const original = 'https://projectid.supabase.co/auth/v1/verify?token=xyz';
const masked = maskSupabaseUrl(original);
// Result: https://auth.renderiq.io/auth/v1/verify?token=xyz
```

### Test Email Flow:
1. Sign up with test email
2. Check verification email - should show `auth.renderiq.io` domain
3. Click link - should work correctly
4. Check inbox - should receive only 1 email (from Resend)

---

## Quick Checklist

- [ ] Disable "Enable email confirmations" in Supabase Dashboard
- [ ] Add CNAME record for `auth.renderiq.io`
- [ ] Add domain in Vercel Dashboard
- [ ] Test signup flow
- [ ] Verify only 1 email received
- [ ] Verify email links use `auth.renderiq.io`

---

## Troubleshooting

### Still getting duplicate emails?
- Check Supabase Dashboard - "Enable email confirmations" should be OFF
- Wait a few minutes for settings to propagate

### DNS not working?
- Check DNS propagation at [whatsmydns.net](https://www.whatsmydns.net)
- Verify CNAME record is correct
- Wait up to 48 hours for DNS propagation

### Proxy not working?
- Check middleware is deployed
- Verify `NEXT_PUBLIC_SUPABASE_URL` is set
- Check Vercel logs for errors

### Links still show Supabase domain?
- Clear cache and rebuild
- Verify `maskSupabaseUrl()` is being called
- Check environment variables

---

## Summary

**To fix duplicates**: Disable email confirmations in Supabase Dashboard  
**To brand URLs**: Set up DNS for `auth.renderiq.io` (URL masking is already implemented)

Both solutions work independently - you can use one or both!

