# Fix CDN AccessDenied Error - Bucket Public Access

## Issue
Getting `AccessDenied` errors when accessing files via CDN:
```
<Error>
<Code>AccessDenied</Code>
<Message>Access denied.</Message>
</Error>
```

## Root Cause
The `renderiq-uploads` bucket has **Public Access Prevention** enabled, which prevents adding `allUsers` IAM policy.

## Solution

### Option 1: Disable Public Access Prevention via Cloud Console (Recommended)

1. Go to: https://console.cloud.google.com/storage/buckets?project=inheritage-viewer-sdk-v1
2. Click on: **renderiq-uploads**
3. Go to: **"Permissions"** tab
4. Click: **"Edit access"** or **"Add principal"**
5. Add:
   - **Principal:** `allUsers`
   - **Role:** `Storage Object Viewer`
6. If you see a warning about Public Access Prevention:
   - Go to: **"Configuration"** tab
   - Find: **"Public access prevention"**
   - Click: **"Edit"**
   - Select: **"Not enforced"** or **"Inherited"**
   - Click: **"Save"**
7. Then go back to **"Permissions"** and add `allUsers` again

### Option 2: Use gcloud (if organization policy allows)

```bash
# Clear public access prevention
gcloud storage buckets update gs://renderiq-uploads \
  --clear-pap \
  --project=inheritage-viewer-sdk-v1

# Wait a few seconds for propagation
sleep 5

# Add public access
gcloud storage buckets add-iam-policy-binding gs://renderiq-uploads \
  --member=allUsers \
  --role=roles/storage.objectViewer \
  --project=inheritage-viewer-sdk-v1
```

### Option 3: Make Individual Objects Public (Alternative)

If you can't disable Public Access Prevention at the bucket level, you can make individual objects public:

```bash
# Make a specific object public
gsutil iam ch allUsers:objectViewer gs://renderiq-uploads/path/to/file.png

# Or make all objects in a prefix public
gsutil -m iam ch -r allUsers:objectViewer gs://renderiq-uploads/projects/
```

**Note:** This is less efficient but works if bucket-level public access is blocked.

## Verify Fix

After making the bucket public, test:

```powershell
# Test uploads bucket via CDN
Invoke-WebRequest -Uri "https://cdn.renderiq.io/renderiq-uploads/projects/tool-render-to-cad-20251206/4df4ace2-4109-4128-b935-8c51f0e03770/l7LJ9LgDmX89OmazAClxn.png" -Method Head

# Should return:
# ✅ StatusCode: 200
# ✅ Server: Google
```

## Current Status

✅ **renderiq-renders bucket:** Public access enabled (`allUsers` has `Storage Object Viewer`)
❌ **renderiq-uploads bucket:** Public access prevention enabled (needs to be disabled)

## Why This Is Needed

For Cloud CDN to serve content from a backend bucket, the underlying GCS bucket must be publicly accessible. The CDN acts as a proxy, but it still needs to read from the bucket, which requires public read permissions.

## Security Note

Making buckets public is safe if:
- ✅ You only store public content (rendered images, user uploads meant to be shared)
- ✅ You don't store sensitive data (API keys, private files, etc.)
- ✅ You use proper file naming/access patterns

For this use case (public gallery images and user uploads), public access is appropriate.

