# CDN Uploads Bucket Path Routing Issue

## Problem

Direct GCS URL works:
```
https://storage.googleapis.com/renderiq-uploads/projects/.../file.png ✅
```

CDN URL returns `NoSuchKey`:
```
https://cdn.renderiq.io/renderiq-uploads/projects/.../file.png ❌
```

## Root Cause

When a request comes in for `/renderiq-uploads/projects/...`, the path matcher matches `/renderiq-uploads/*` and routes to the backend bucket. However, the backend bucket receives the **full path** `/renderiq-uploads/projects/...` and looks for that exact path in the bucket.

But the file is actually at `projects/...` in the bucket (without the `/renderiq-uploads/` prefix).

## Current Configuration

- **Path Matcher:** `/renderiq-uploads/*` → `renderiq-uploads-cdn-backend`
- **Backend Bucket:** `renderiq-uploads-cdn-backend` → `renderiq-uploads` bucket
- **Issue:** Backend bucket receives `/renderiq-uploads/projects/...` but file is at `projects/...`

## Solution Options

### Option 1: Use Different Path Structure (Recommended)

Instead of `/renderiq-uploads/projects/...`, use just `/uploads/projects/...`:

1. Update URL map path rule to `/uploads/*`
2. Update code to generate URLs like `https://cdn.renderiq.io/uploads/...`
3. Files remain at `projects/...` in the bucket

**Pros:** Simple, no path rewriting needed
**Cons:** Requires code changes

### Option 2: Store Files with Bucket Name Prefix

Store files in the bucket with the prefix: `renderiq-uploads/projects/...`

**Pros:** No code changes needed
**Cons:** Changes file structure in bucket

### Option 3: Use Backend Service Instead of Backend Bucket

Create a backend service that can handle path rewrites, then proxy to GCS.

**Pros:** More flexible routing
**Cons:** More complex setup, additional cost

### Option 4: Use Cloud Function/Cloud Run Proxy

Create a proxy service that handles path rewriting.

**Pros:** Full control
**Cons:** Additional complexity and cost

## Recommended Fix

**Use Option 1** - Change the path structure:

1. Update URL map:
   ```yaml
   pathRules:
   - paths:
     - /uploads/*
     service: renderiq-uploads-cdn-backend
   ```

2. Update code in `lib/services/gcs-storage.ts`:
   ```typescript
   // Change from:
   return `https://${CDN_DOMAIN}/renderiq-uploads/${filePath}`;
   
   // To:
   return `https://${CDN_DOMAIN}/uploads/${filePath}`;
   ```

3. Files in bucket remain at `projects/...` (no change needed)

This way, when a request comes in for `/uploads/projects/...`, the backend bucket receives `/uploads/projects/...` and looks for that in the bucket. But wait, that still won't work...

Actually, the real issue is that **backend buckets don't automatically strip the matched path prefix**. They receive the full path and look for it in the bucket.

## Actual Solution

The path in the URL must match the path in the bucket. So either:

1. **Change URL structure** to not include bucket name: `/uploads/projects/...` → store files at `uploads/projects/...` in bucket
2. **Store files with bucket name prefix** in bucket: `renderiq-uploads/projects/...`
3. **Use a different routing approach** that doesn't include the bucket name in the path

## Quick Fix (Temporary)

For now, the code should use direct GCS URLs for uploads bucket until this is resolved:

```typescript
// In lib/services/gcs-storage.ts
if (bucketName === 'uploads') {
  // Use direct GCS for uploads (CDN path routing issue)
  return `https://storage.googleapis.com/${UPLOADS_BUCKET}/${filePath}`;
}
```

This is already the fallback behavior, so uploads should work via direct GCS URLs.

