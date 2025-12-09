# URL Masking Setup - auth.renderiq.io

**Date**: 2025-01-27  
**Purpose**: Mask Supabase auth URLs to use `auth.renderiq.io` instead of `projectid.supabase.co`

---

## Overview

Instead of buying Supabase's custom domain feature, we're using URL masking to make Supabase auth URLs appear as `auth.renderiq.io`.

**Before**: `https://projectid.supabase.co/auth/v1/verify?token=xyz`  
**After**: `https://auth.renderiq.io/auth/v1/verify?token=xyz`

---

## How It Works

1. **URL Generation**: When generating verification links, we mask the Supabase URL to use `auth.renderiq.io`
2. **Proxy Route**: Requests to `auth.renderiq.io/auth/v1/*` are proxied to Supabase via `/api/auth-proxy/*`
3. **DNS Setup**: Point `auth.renderiq.io` to your Vercel/deployment

---

## Setup Steps

### Step 1: Configure Environment Variable

Add to your `.env` file:

```env
# Masked auth domain (optional, defaults to auth.renderiq.io)
NEXT_PUBLIC_MASKED_AUTH_DOMAIN=auth.renderiq.io
```

### Step 2: Set Up DNS for auth.renderiq.io

#### Option A: Using Vercel (Recommended)

1. Go to Vercel Dashboard → Your Project → Settings → Domains
2. Add domain: `auth.renderiq.io`
3. Follow DNS configuration instructions:
   - Add CNAME record: `auth` → `cname.vercel-dns.com`
   - Or add A record as instructed by Vercel

#### Option B: Using Your Domain Provider

Add a CNAME record:
```
Type: CNAME
Name: auth
Value: [your-vercel-deployment].vercel.app
TTL: 3600
```

### Step 3: Configure Vercel to Route Subdomain

1. Go to Vercel Dashboard → Your Project → Settings → Domains
2. Add `auth.renderiq.io` as a domain
3. Vercel will automatically route it to your Next.js app

### Step 4: Test the Proxy

1. Sign up with a test email
2. Check the verification email - link should be `auth.renderiq.io/auth/v1/verify?...`
3. Click the link - should proxy to Supabase and work correctly

---

## Code Implementation

### URL Masking Utility

Created `lib/utils/url-masker.ts`:
- `maskSupabaseUrl()` - Masks Supabase URLs to use auth.renderiq.io
- `unmaskAuthUrl()` - Unmasks URLs (for internal use)
- `shouldMaskUrl()` - Checks if URL needs masking

### Proxy Route

Created `app/api/auth-proxy/[...path]/route.ts`:
- Handles all requests to `auth.renderiq.io/auth/v1/*`
- Proxies to Supabase auth endpoints
- Preserves redirects and cookies

### Updated Email Generation

All verification link generation now uses masked URLs:
- `app/api/auth/send-verification/route.ts`
- `app/api/auth/resend-verification/route.ts`
- `app/api/auth/forgot-password/route.ts`
- `app/api/webhooks/supabase-auth/route.ts`

---

## How the Flow Works

```
1. User signs up
   ↓
2. Code generates Supabase link: https://projectid.supabase.co/auth/v1/verify?token=xyz
   ↓
3. maskSupabaseUrl() converts to: https://auth.renderiq.io/auth/v1/verify?token=xyz
   ↓
4. Email sent with masked URL
   ↓
5. User clicks: https://auth.renderiq.io/auth/v1/verify?token=xyz
   ↓
6. Request hits: /api/auth-proxy/verify?token=xyz
   ↓
7. Proxy forwards to: https://projectid.supabase.co/auth/v1/verify?token=xyz
   ↓
8. Supabase processes and redirects back to your app
```

---

## Testing

### Test URL Masking

```typescript
import { maskSupabaseUrl } from '@/lib/utils/url-masker';

const original = 'https://projectid.supabase.co/auth/v1/verify?token=xyz';
const masked = maskSupabaseUrl(original);
// Result: https://auth.renderiq.io/auth/v1/verify?token=xyz
```

### Test Proxy Route

1. Visit: `https://auth.renderiq.io/auth/v1/health` (if available)
2. Or sign up and click verification link
3. Should proxy correctly to Supabase

---

## Troubleshooting

### DNS Not Working

1. Check DNS propagation: Use [whatsmydns.net](https://www.whatsmydns.net)
2. Verify CNAME record is correct
3. Wait up to 48 hours for DNS propagation

### Proxy Not Working

1. Check Vercel logs for errors
2. Verify `NEXT_PUBLIC_SUPABASE_URL` is set
3. Test proxy route directly: `/api/auth-proxy/verify?token=test`

### Links Still Showing Supabase Domain

1. Verify `maskSupabaseUrl()` is being called
2. Check environment variables are set
3. Clear cache and rebuild

---

## Security Considerations

- ✅ Proxy validates requests
- ✅ Only proxies `/auth/v1/*` paths
- ✅ Preserves Supabase authentication
- ✅ No sensitive data exposed

---

## Files Modified

- ✅ `lib/utils/url-masker.ts` - URL masking utility (NEW)
- ✅ `app/api/auth-proxy/[...path]/route.ts` - Proxy route (NEW)
- ✅ `app/api/auth/send-verification/route.ts` - Uses masked URLs
- ✅ `app/api/auth/resend-verification/route.ts` - Uses masked URLs
- ✅ `app/api/auth/forgot-password/route.ts` - Uses masked URLs
- ✅ `app/api/webhooks/supabase-auth/route.ts` - Uses masked URLs

---

## Alternative: Middleware-Based Proxy

If the API route doesn't work well, you can use Next.js middleware:

```typescript
// middleware.ts
export function middleware(request: NextRequest) {
  // Handle auth.renderiq.io requests
  if (request.nextUrl.hostname === 'auth.renderiq.io') {
    // Proxy logic here
  }
}
```

---

## Notes

- This solution works without purchasing Supabase's custom domain feature
- All verification, password reset, and OAuth links will use `auth.renderiq.io`
- The proxy is transparent to users
- Supabase still processes all auth requests normally

