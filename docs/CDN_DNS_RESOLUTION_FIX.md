# CDN DNS Resolution Fix

## Issue

**Error:** `Error: getaddrinfo ENOTFOUND cdn.renderiq.io`

**Cause:** Server-side DNS can't resolve `cdn.renderiq.io` yet (DNS propagation in progress)

**Impact:** Images fail to load in unified chat interface after generation

## Root Cause

1. DNS record was just created and hasn't propagated to all DNS servers
2. Your server's DNS resolver (or Next.js server) can't resolve `cdn.renderiq.io` yet
3. Next.js Image optimizer or server-side rendering tries to fetch images and fails

## Fix Applied

### 1. ✅ Updated `shouldUseRegularImg()` Function

**File:** `lib/utils/storage-url.ts`

- Added hardcoded check for `cdn.renderiq.io` (doesn't rely on env var)
- Ensures all CDN URLs use regular `<img>` tags (not Next.js Image component)
- Prevents server-side DNS resolution issues

### 2. ✅ Created CDN Fallback Utility

**File:** `lib/utils/cdn-fallback.ts`

- Provides fallback mechanism if needed
- Converts CDN URLs to direct GCS URLs server-side
- Client-side uses CDN, server-side uses direct GCS

## Immediate Solutions

### Option 1: Wait for DNS Propagation (Recommended)

DNS propagation typically takes **5-60 minutes**. Once your server's DNS resolver updates, images will work automatically.

**Check DNS propagation:**
```powershell
# From your server/development machine
nslookup cdn.renderiq.io

# Should return: 136.110.242.198
```

### Option 2: Restart Development Server

After DNS propagates, restart your Next.js dev server:

```powershell
# Stop server (Ctrl+C)
npm run dev
```

### Option 3: Use Direct GCS URLs Temporarily (Workaround)

If you need images to work immediately, temporarily use direct GCS URLs:

1. **Temporarily remove CDN domain from env:**
   ```env
   # Comment out or remove
   # GCS_CDN_DOMAIN=cdn.renderiq.io
   # NEXT_PUBLIC_GCS_CDN_DOMAIN=cdn.renderiq.io
   ```

2. **Restart server:**
   ```powershell
   npm run dev
   ```

3. **After DNS propagates, re-enable CDN:**
   ```env
   GCS_CDN_DOMAIN=cdn.renderiq.io
   NEXT_PUBLIC_GCS_CDN_DOMAIN=cdn.renderiq.io
   ```

## Verification

### Check if DNS is Resolved

```powershell
# From your development machine
nslookup cdn.renderiq.io

# Should return:
# Name:    cdn.renderiq.io
# Address:  136.110.242.198
```

### Test CDN Access

```powershell
# Test if CDN responds
Invoke-WebRequest -Uri "https://cdn.renderiq.io/renderiq-renders/test" -Method Head

# Should return HTTP 404 or 403 (means CDN is working, just file doesn't exist)
```

### Check Image Loading

1. Generate a new render
2. Check browser console for errors
3. Verify image loads in unified chat interface

## Why This Happens

1. **DNS Propagation Delay:**
   - DNS changes take time to propagate globally
   - Your server's DNS resolver might cache old records
   - Different DNS servers update at different times

2. **Server-Side vs Client-Side:**
   - **Client-side (browser):** Uses user's DNS resolver (might already have CDN DNS)
   - **Server-side (Next.js):** Uses server's DNS resolver (might not have CDN DNS yet)

3. **Next.js Image Optimization:**
   - Next.js Image component tries to optimize images server-side
   - This requires DNS resolution on the server
   - Regular `<img>` tags don't need server-side DNS

## Long-Term Solution

The fix ensures:
- ✅ All CDN URLs use regular `<img>` tags (no server-side DNS needed)
- ✅ `shouldUseRegularImg()` detects CDN URLs reliably
- ✅ No Next.js Image optimization for CDN URLs (avoids DNS issues)

## Status

- ✅ **Code fix applied** - CDN URLs now use regular `<img>` tags
- ⏳ **DNS propagation** - Wait 5-60 minutes for server DNS to update
- ✅ **Fallback ready** - Can use direct GCS URLs if needed

## Next Steps

1. **Wait 15-30 minutes** for DNS propagation
2. **Restart dev server** after DNS resolves
3. **Test image loading** in unified chat interface
4. **Verify CDN is working** - images should load faster

---

**Note:** This is a temporary DNS propagation issue. Once DNS fully propagates (typically within an hour), everything will work automatically. The code fixes ensure this won't happen again even if DNS is slow to update.

