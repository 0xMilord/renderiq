# CDN Bucket Configuration

## Current Setup

**CDN is configured for:**
- ✅ `renderiq-renders` bucket (via `renderiq-renders-cdn-backend`)

**CDN is NOT configured for:**
- ❌ `renderiq-uploads` bucket

## Issue

When accessing files from `renderiq-uploads` via CDN:
```
https://cdn.renderiq.io/renderiq-uploads/...
```

You get `NoSuchKey` error because:
- The CDN backend bucket only points to `renderiq-renders`
- Files in `renderiq-uploads` are not accessible via CDN

## Solutions

### Option 1: Use Direct GCS URL for Uploads (Recommended)

For files in `renderiq-uploads`, use direct GCS URL:
```
https://storage.googleapis.com/renderiq-uploads/...
```

The code already handles this automatically - it only uses CDN for `renders` bucket.

### Option 2: Set Up CDN for Uploads Bucket

If you want CDN for uploads bucket too, you need to:

1. **Create another backend bucket:**
```bash
gcloud compute backend-buckets create renderiq-uploads-cdn-backend \
  --gcs-bucket-name=renderiq-uploads \
  --enable-cdn \
  --cache-mode=CACHE_ALL_STATIC \
  --project=inheritage-viewer-sdk-v1
```

2. **Update URL map to route both buckets:**
```bash
# Add path matcher for uploads
gcloud compute url-maps add-path-matcher renderiq-renders-cdn-map \
  --path-matcher-name=uploads-matcher \
  --default-backend-bucket=renderiq-uploads-cdn-backend \
  --path-rules="/renderiq-uploads/*=renderiq-uploads-cdn-backend" \
  --project=inheritage-viewer-sdk-v1
```

3. **Update code to use CDN for uploads:**
   - Modify `lib/services/gcs-storage.ts` to use CDN for uploads bucket too

## Testing CDN

### PowerShell Syntax

In PowerShell, use `Invoke-WebRequest` instead of `curl`:

```powershell
# Test CDN (renders bucket)
Invoke-WebRequest -Uri "https://cdn.renderiq.io/renderiq-renders/[path]" -Method Head

# Or use curl.exe (if available)
curl.exe -I https://cdn.renderiq.io/renderiq-renders/[path]
```

### Test with Real File

1. **Find a file in renders bucket:**
```bash
gsutil ls gs://renderiq-renders/**/*.png | head -1
```

2. **Test CDN access:**
```powershell
# Replace [path] with actual file path
Invoke-WebRequest -Uri "https://cdn.renderiq.io/renderiq-renders/[path]" -Method Head
```

3. **Check headers:**
   - Should see: `server: Google`
   - Should see: `cache-control: public, max-age=31536000`
   - Should see: `x-cache: HIT` or `MISS`

## Current Behavior

**Renders bucket (CDN enabled):**
- ✅ Uses CDN: `https://cdn.renderiq.io/renderiq-renders/...`
- ✅ Fast global delivery
- ✅ Cached at edge locations

**Uploads bucket (CDN NOT enabled):**
- ✅ Uses direct GCS: `https://storage.googleapis.com/renderiq-uploads/...`
- ✅ Still works, just not cached
- ✅ Good for user uploads (less caching needed)

## Recommendation

**Keep current setup:**
- CDN for `renders` (generated images - benefit from caching)
- Direct GCS for `uploads` (user uploads - less caching needed)

This is the most cost-effective approach.

