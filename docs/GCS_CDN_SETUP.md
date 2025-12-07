# GCS Cloud CDN Setup Guide - Fix Slow Image Loading

## Problem
Images are loading slowly from India because:
- GCS bucket is in US region
- Direct access to `storage.googleapis.com` has no global CDN
- No edge caching = slow for users far from bucket region

## Solution: Enable Google Cloud CDN

Cloud CDN provides:
- ✅ Global edge caching (serves from nearest location)
- ✅ 60-80% faster image loading
- ✅ Lower bandwidth costs
- ✅ Better user experience worldwide

## Quick Setup (5 minutes)

### Step 1: Enable Cloud CDN via Console

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Navigate to **Network Services** > **Cloud CDN**
3. Click **Create Backend Bucket**
4. Configure:
   - **Name**: `renderiq-renders-cdn`
   - **Backend bucket**: `renderiq-renders`
   - **Enable Cloud CDN**: ✅ Checked
5. Click **Create**

### Step 2: Create Load Balancer (Required for CDN)

1. Go to **Network Services** > **Load Balancing**
2. Click **Create Load Balancer**
3. Choose **HTTP(S) Load Balancing**
4. Configure:
   - **Name**: `renderiq-cdn-lb`
   - **Backend**: Select `renderiq-renders-cdn` (the backend bucket you created)
   - **Frontend**: 
     - Protocol: HTTPS
     - IP address: Create new (or use existing)
     - Certificate: Google-managed certificate (recommended)
5. Click **Create**

### Step 3: Configure CDN Cache Policy

1. Go to **Network Services** > **Cloud CDN**
2. Click on your CDN configuration
3. Go to **Cache Policy** tab
4. Set:
   - **Cache mode**: `CACHE_ALL_STATIC`
   - **Default TTL**: `86400` (1 day)
   - **Max TTL**: `31536000` (1 year)
   - **Client TTL**: `31536000` (1 year)
   - **Serve stale content**: ✅ Enabled

### Step 4: Update Environment Variables

Add to your `.env.local`:

```env
# Cloud CDN Domain (use the IP or domain from Load Balancer)
# Option 1: Use Load Balancer IP (quick setup)
GCS_CDN_DOMAIN=YOUR_LOAD_BALANCER_IP

# Option 2: Use Custom Domain (recommended for production)
# First, point your DNS to the Load Balancer IP, then:
GCS_CDN_DOMAIN=cdn.renderiq.io
NEXT_PUBLIC_GCS_CDN_DOMAIN=cdn.renderiq.io
```

### Step 5: Restart Your App

```bash
npm run dev
# or
npm run build && npm start
```

## Alternative: Quick Setup via Script

We have a script to automate this (requires gcloud CLI):

```bash
# Install gcloud CLI if not installed
# https://cloud.google.com/sdk/docs/install

# Authenticate
gcloud auth login

# Set your project
gcloud config set project YOUR_PROJECT_ID

# Run setup script
npm run gcs:iam-cdn
```

## Verify CDN is Working

### 1. Check URL Format
After setup, your image URLs should change from:
```
https://storage.googleapis.com/renderiq-renders/...
```
To:
```
https://cdn.renderiq.io/renderiq-renders/...
```
or
```
https://YOUR_LOAD_BALANCER_IP/renderiq-renders/...
```

### 2. Test Performance
- Before CDN: Images load from US (slow in India)
- After CDN: Images load from nearest edge location (fast everywhere)

### 3. Check Cache Headers
```bash
curl -I https://cdn.renderiq.io/renderiq-renders/your-image.png
```

Should see:
```
Cache-Control: public, max-age=31536000, immutable
X-Cache: HIT  # After first request
```

## Cost Impact

**Before CDN:**
- Direct GCS egress: $0.12/GB
- Slow for international users

**After CDN:**
- CDN egress: $0.08/GB (after cache)
- Cache hit rate: ~80-90% (much cheaper)
- **Estimated savings: 60-80%**

## Troubleshooting

### Images Still Slow
1. ✅ Verify `GCS_CDN_DOMAIN` is set in env
2. ✅ Check URLs are using CDN domain (not `storage.googleapis.com`)
3. ✅ Wait 5-10 minutes for CDN propagation
4. ✅ Clear browser cache and test

### CDN Not Caching
1. Check cache headers in response
2. Verify cache policy is set correctly
3. Check if files have proper `Cache-Control` headers

### DNS Issues
1. If using custom domain, verify DNS points to Load Balancer IP
2. Wait for DNS propagation (can take up to 48 hours)
3. Use Load Balancer IP directly for testing

## Performance Comparison

**India → US (Direct GCS):**
- Latency: ~200-300ms
- Speed: Slow

**India → India Edge (Cloud CDN):**
- Latency: ~20-50ms
- Speed: Fast ⚡

## Next Steps

1. ✅ Set up Cloud CDN (follow steps above)
2. ✅ Update environment variables
3. ✅ Test image loading speed
4. ✅ Monitor CDN cache hit rate in Cloud Console
5. ✅ Set up custom domain (optional, for production)

---

**Need Help?** Check the [Google Cloud CDN Documentation](https://cloud.google.com/cdn/docs)

