# CDN 404 Error Fix Guide

## Issue
CDN is returning 404 errors even though:
- ✅ File exists in bucket
- ✅ Direct GCS access works
- ✅ URL map configuration is correct
- ✅ Backend bucket is configured

## Root Causes (Based on Google Cloud Documentation)

### 1. **Backend Bucket Permissions** (Most Common)
The Cloud Storage bucket must be **publicly accessible** for CDN to serve content.

**Check:**
```bash
gcloud storage buckets describe gs://renderiq-renders --format="get(iamConfiguration)" --project=inheritage-viewer-sdk-v1
```

**Fix:**
```bash
# Make bucket publicly readable
gcloud storage buckets add-iam-policy-binding gs://renderiq-renders \
  --member=allUsers \
  --role=roles/storage.objectViewer \
  --project=inheritage-viewer-sdk-v1
```

**Verify in Console:**
1. Go to Cloud Storage > Buckets
2. Click `renderiq-renders`
3. Go to "Permissions" tab
4. Ensure `allUsers` has `Storage Object Viewer` role

### 2. **Cache Invalidation**
After URL map changes, old cached responses may still be served.

**Fix:**
```bash
# Invalidate all cached content
gcloud compute url-maps invalidate-cdn-cache renderiq-renders-cdn-map \
  --path="/*" \
  --project=inheritage-viewer-sdk-v1
```

**Wait:** Cache invalidation can take 5-15 minutes to propagate globally.

### 3. **Propagation Delay**
URL map changes can take 5-15 minutes to propagate across Google's infrastructure.

**Solution:** Wait 10-15 minutes after making changes, then test again.

### 4. **Path Matching Issue**
The backend bucket expects the path **without** the bucket name prefix.

**Current URL:** `https://cdn.renderiq.io/renderiq-renders/projects/...`
**Backend bucket looks for:** `projects/...` (strips `/renderiq-renders/`)

**This is CORRECT** - the backend bucket automatically strips the bucket name from the path.

## Step-by-Step Fix

### Step 1: Verify Bucket Permissions
```bash
# Check current permissions
gcloud storage buckets get-iam-policy gs://renderiq-renders --project=inheritage-viewer-sdk-v1

# If allUsers is not listed, add it:
gcloud storage buckets add-iam-policy-binding gs://renderiq-renders \
  --member=allUsers \
  --role=roles/storage.objectViewer \
  --project=inheritage-viewer-sdk-v1
```

### Step 2: Invalidate CDN Cache
```bash
# Invalidate all paths
gcloud compute url-maps invalidate-cdn-cache renderiq-renders-cdn-map \
  --path="/*" \
  --project=inheritage-viewer-sdk-v1
```

### Step 3: Wait for Propagation
Wait **10-15 minutes** for changes to propagate.

### Step 4: Test
```powershell
# Test CDN access
Invoke-WebRequest -Uri "https://cdn.renderiq.io/renderiq-renders/projects/tool-render-to-cad-20251206/4df4ace2-4109-4128-b935-8c51f0e03770/render_023e8606-10af-4cdb-be5c-6d80043269e0.png" -Method Head

# Should return:
# ✅ StatusCode: 200
# ✅ Server: Google
# ✅ Cache-Control: public, max-age=...
```

## Verification Checklist

- [ ] Bucket has `allUsers` with `Storage Object Viewer` role
- [ ] Backend bucket is correctly configured (`renderiq-renders-cdn-backend` → `renderiq-renders`)
- [ ] URL map has correct path matcher (only `/renderiq-uploads/*` in path matcher)
- [ ] URL map default service points to `renderiq-renders-cdn-backend`
- [ ] Target proxy points to URL map
- [ ] Forwarding rule points to target proxy
- [ ] SSL certificate is ACTIVE
- [ ] Cache has been invalidated
- [ ] Waited 10-15 minutes for propagation

## Current Configuration Status

✅ **URL Map:** Correctly configured
- Default: `renderiq-renders-cdn-backend`
- Path matcher: `/renderiq-uploads/*` → `renderiq-uploads-cdn-backend`

✅ **Backend Bucket:** Correctly configured
- Name: `renderiq-renders-cdn-backend`
- Bucket: `renderiq-renders`
- CDN: Enabled

✅ **Target Proxy:** Correctly configured
- Points to: `renderiq-renders-cdn-map`
- SSL Certificate: ACTIVE

✅ **Forwarding Rule:** Correctly configured
- IP: `136.110.242.198:443`
- Target: `renderiq-renders-cdn-proxy`

## Most Likely Issue

**Bucket Permissions** - The bucket likely needs to be made publicly accessible.

Run this command to fix:
```bash
gcloud storage buckets add-iam-policy-binding gs://renderiq-renders \
  --member=allUsers \
  --role=roles/storage.objectViewer \
  --project=inheritage-viewer-sdk-v1
```

Then wait 5-10 minutes and test again.

## Additional Resources

- [Google Cloud CDN Troubleshooting](https://cloud.google.com/cdn/docs/troubleshooting-steps)
- [Backend Bucket Permissions](https://cloud.google.com/storage/docs/access-control/making-data-public)
- [CDN Cache Invalidation](https://cloud.google.com/cdn/docs/invalidating-cached-content)

