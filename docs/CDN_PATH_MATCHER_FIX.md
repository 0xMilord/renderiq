# Fix CDN Path Matcher for Uploads Bucket

## Issue

The path matcher for uploads is pointing to the **wrong backend bucket**:

**Current (WRONG):**
- Path: `/renderiq-uploads/*`
- Backend: `renderiq-renders-cdn-backend` ❌

**Should be:**
- Path: `/renderiq-uploads/*`
- Backend: `renderiq-uploads-cdn-backend` ✅

## Quick Fix via Cloud Console

### Step 1: Open URL Map

Go to: https://console.cloud.google.com/net-services/loadbalancing/urlMaps/list?project=inheritage-viewer-sdk-v1

Click on: **renderiq-renders-cdn-map**

### Step 2: Edit Path Matcher

1. Click **"EDIT"**
2. Find path matcher: **"uploads-matcher"**
3. Click on it to expand/edit
4. Find path rule: `/renderiq-uploads/*`
5. Change backend from: `renderiq-renders-cdn-backend` ❌
6. To: `renderiq-uploads-cdn-backend` ✅
7. Click **"SAVE"**

### Step 3: Verify

After saving, the configuration should show:
- ✅ `/renderiq-uploads/*` → `renderiq-uploads-cdn-backend`
- ✅ Default (all other paths) → `renderiq-renders-cdn-backend`

## Alternative: Use gcloud Edit

```bash
gcloud compute url-maps edit renderiq-renders-cdn-map --project=inheritage-viewer-sdk-v1
```

This opens the URL map in your default editor. Find:

```yaml
pathMatchers:
- name: uploads-matcher
  defaultBackendBucket: renderiq-renders-cdn-backend  # WRONG
  pathRules:
  - paths:
    - /renderiq-uploads/*
    backendBucket: renderiq-renders-cdn-backend  # WRONG - CHANGE THIS
```

Change to:

```yaml
pathMatchers:
- name: uploads-matcher
  defaultBackendBucket: renderiq-uploads-cdn-backend  # CORRECT
  pathRules:
  - paths:
    - /renderiq-uploads/*
    backendBucket: renderiq-uploads-cdn-backend  # CORRECT
```

Save and close the editor.

## After Fix

Test the uploads bucket:

```powershell
# Test uploads bucket via CDN
Invoke-WebRequest -Uri "https://cdn.renderiq.io/renderiq-uploads/[path]" -Method Head

# Should see:
# ✅ HTTP 200 (or 404 if file doesn't exist, but not "NoSuchKey" from wrong bucket)
# ✅ server: Google
# ✅ cache-control: public, max-age=31536000
```

## Summary

**Problem:** Path matcher pointing to wrong backend bucket
**Fix:** Update path matcher to use `renderiq-uploads-cdn-backend`
**Time:** 2 minutes via Console

Once fixed, both buckets will work via CDN! 🎉

