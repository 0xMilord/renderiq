# CDN Issues Fix Guide

## Issues Identified from Diagnostic Report

### ❌ Critical Issues

1. **CDN Not Being Used**
   - Response shows `server: UploadServer` (direct GCS)
   - Should show `server: Google` or `via: 1.1 google` (CDN)
   - `cdn-status: Direct` instead of going through CDN

2. **Wrong Cache Headers**
   - Current: `cache-control: private, max-age=0`
   - Should be: `cache-control: public, max-age=31536000, immutable`

3. **DNS Not Resolving on Server**
   - Server can't resolve `cdn.renderiq.io`
   - Expected during DNS propagation (5-60 minutes)

### ⚠️ Warnings

- CORS/IAM checks failed due to gsutil permission issues (non-critical)

## Root Cause

The CDN is configured correctly, but:
1. **DNS not pointing to Load Balancer** - Requests bypass CDN
2. **Cache headers not set** - Files don't have proper cache metadata
3. **Backend bucket cache policy** - May need adjustment

## Fixes Applied

### Fix 1: Update CDN Cache Policy

Run the fix script:
```bash
npm run gcs:fix-cdn
```

This will:
- Update backend bucket cache policy
- Set proper TTL values (1 day default, 1 year max)
- Enable CDN caching for all static content

### Fix 2: Verify DNS Configuration

**Check DNS Record in Namecheap:**
1. Go to Namecheap DNS settings
2. Verify A record exists:
   - **Host:** `cdn`
   - **Type:** `A Record`
   - **Value:** `136.110.242.198` (Load Balancer IP)
   - **TTL:** `Automatic` or `30 min`

**Verify DNS is Resolving:**
```powershell
# Should return 136.110.242.198
nslookup cdn.renderiq.io 8.8.8.8
```

### Fix 3: Test CDN is Working

After DNS propagates, test with a real image:

```powershell
# Test with curl
curl -I https://cdn.renderiq.io/renderiq-renders/[path-to-image]

# Check headers:
# ✅ server: Google (or via: 1.1 google)
# ✅ cache-control: public, max-age=31536000
# ✅ x-cache: HIT or MISS
```

**If you still see `server: UploadServer`:**
- DNS is not pointing to load balancer
- Wait longer for DNS propagation
- Verify DNS record is correct

### Fix 4: Update Existing Files Cache Headers

For existing files in bucket:
```bash
gsutil -m setmeta -h "Cache-Control:public, max-age=31536000, immutable" gs://renderiq-renders/**/*.png
gsutil -m setmeta -h "Cache-Control:public, max-age=31536000, immutable" gs://renderiq-renders/**/*.jpg
gsutil -m setmeta -h "Cache-Control:public, max-age=31536000, immutable" gs://renderiq-renders/**/*.jpeg
gsutil -m setmeta -h "Cache-Control:public, max-age=31536000, immutable" gs://renderiq-renders/**/*.webp
gsutil -m setmeta -h "Cache-Control:public, max-age=31536000, immutable" gs://renderiq-renders/**/*.mp4
```

**Note:** New files uploaded will automatically get correct headers (already configured in `gcs-storage.ts`).

## Step-by-Step Fix

### Step 1: Run Fix Script
```bash
npm run gcs:fix-cdn
```

### Step 2: Verify DNS
```powershell
# Check DNS resolution
nslookup cdn.renderiq.io 8.8.8.8

# Should return: 136.110.242.198
```

### Step 3: Wait for DNS Propagation
- **Typical:** 15-30 minutes
- **Maximum:** Up to 48 hours (rare)

### Step 4: Test CDN
```powershell
# Test with a real image URL
curl -I https://cdn.renderiq.io/renderiq-renders/[your-image-path]

# Look for:
# ✅ server: Google (not UploadServer)
# ✅ cache-control: public, max-age=31536000
# ✅ x-cache: HIT or MISS
```

### Step 5: Re-run Diagnostic
```bash
npm run gcs:diagnose
```

Should now show:
- ✅ HTTPS Access: server: Google
- ✅ Cache Headers: public, max-age=31536000
- ✅ CDN Status: HIT or MISS (not Direct)

## Expected Results After Fix

### Before (Current)
```
server: UploadServer
cache-control: private, max-age=0
cdn-status: Direct
```

### After (Fixed)
```
server: Google
cache-control: public, max-age=31536000, immutable
x-cache: HIT (or MISS on first request)
via: 1.1 google
```

## Troubleshooting

### CDN Still Shows "UploadServer"

**Possible causes:**
1. DNS not pointing to load balancer
2. DNS not propagated yet
3. Load balancer not properly configured

**Solutions:**
1. Verify DNS record in Namecheap
2. Wait longer for DNS propagation
3. Check load balancer status in Cloud Console
4. Verify forwarding rule is active

### Cache Headers Still Wrong

**Possible causes:**
1. Files uploaded before cache headers were set
2. Backend bucket cache policy not updated

**Solutions:**
1. Run fix script: `npm run gcs:fix-cdn`
2. Update existing files metadata (see Fix 4 above)
3. New uploads will automatically get correct headers

### DNS Not Resolving

**Possible causes:**
1. DNS record not created
2. DNS record pointing to wrong IP
3. DNS propagation delay

**Solutions:**
1. Check DNS record in Namecheap
2. Verify IP address matches: `136.110.242.198`
3. Wait for DNS propagation (can take up to 48 hours)

## Summary

**Main Issue:** CDN is configured but not being used because DNS is not pointing to load balancer.

**Fix:**
1. ✅ Run `npm run gcs:fix-cdn` to update cache policy
2. ✅ Verify DNS record points to `136.110.242.198`
3. ✅ Wait for DNS propagation
4. ✅ Test CDN with real image
5. ✅ Verify headers show CDN is working

Once DNS propagates and points to the load balancer, CDN will automatically start working! 🎉

