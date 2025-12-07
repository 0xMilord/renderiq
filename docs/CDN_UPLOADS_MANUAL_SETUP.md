# Manual CDN Setup for Uploads Bucket

## Status

✅ **Backend bucket created:** `renderiq-uploads-cdn-backend`
❌ **Path matcher needs manual configuration**

## Quick Fix via Cloud Console

### Step 1: Open URL Map

Go to: https://console.cloud.google.com/net-services/loadbalancing/urlMaps/list?project=inheritage-viewer-sdk-v1

Click on: **renderiq-renders-cdn-map**

### Step 2: Edit URL Map

1. Click **"EDIT"** button
2. Scroll down to **"Path matchers"** section
3. Click **"ADD PATH MATCHER"**

### Step 3: Configure Path Matcher

**Name:**
```
uploads-matcher
```

**Default backend:**
- Select: **Backend bucket**
- Choose: **renderiq-uploads-cdn-backend**

**Path rules:**
- Click **"ADD PATH RULE"**
- **Paths:** `/renderiq-uploads/*`
- **Backend:** Select **renderiq-uploads-cdn-backend** (backend bucket)

### Step 4: Save

Click **"SAVE"** at the bottom

## Verify Configuration

After saving, test:

```powershell
# Test uploads bucket via CDN
Invoke-WebRequest -Uri "https://cdn.renderiq.io/renderiq-uploads/[path-to-file]" -Method Head

# Should see:
# ✅ HTTP 200 (or 404 if file doesn't exist, but should not be "NoSuchKey" from wrong bucket)
# ✅ server: Google
# ✅ cache-control: public, max-age=31536000
```

## Alternative: Use gcloud Edit

```bash
gcloud compute url-maps edit renderiq-renders-cdn-map --project=inheritage-viewer-sdk-v1
```

This opens the URL map in your default editor. Add:

```yaml
pathMatchers:
- name: uploads-matcher
  defaultBackendBucket: renderiq-uploads-cdn-backend
  pathRules:
  - paths:
    - /renderiq-uploads/*
    backendBucket: renderiq-uploads-cdn-backend
```

Save and close the editor.

## Expected Result

After configuration:
- ✅ `/renderiq-renders/*` → `renderiq-renders-cdn-backend`
- ✅ `/renderiq-uploads/*` → `renderiq-uploads-cdn-backend`
- ✅ Both buckets accessible via CDN

## Testing

```powershell
# Test renders bucket
Invoke-WebRequest -Uri "https://cdn.renderiq.io/renderiq-renders/[path]" -Method Head

# Test uploads bucket
Invoke-WebRequest -Uri "https://cdn.renderiq.io/renderiq-uploads/[path]" -Method Head
```

Both should work! 🎉

