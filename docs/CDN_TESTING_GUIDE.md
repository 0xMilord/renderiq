# CDN Testing Guide

## Issue: Testing CDN with Wrong Bucket

You tried to access:
```
https://cdn.renderiq.io/renderiq-uploads/...
```

But CDN is only configured for `renderiq-renders` bucket, not `renderiq-uploads`.

## Current CDN Configuration

✅ **CDN Enabled:**
- `renderiq-renders` bucket → `https://cdn.renderiq.io/renderiq-renders/...`

❌ **CDN NOT Enabled:**
- `renderiq-uploads` bucket → Use direct GCS: `https://storage.googleapis.com/renderiq-uploads/...`

## How to Test CDN

### Step 1: Find a File in Renders Bucket

```bash
# List files in renders bucket
gsutil ls gs://renderiq-renders/**/*.png | head -1

# Example output:
# gs://renderiq-renders/projects/tool-render-to-cad-20251206/4df4ace2-4109-4128-b935-8c51f0e03770/render_xxx.png
```

### Step 2: Test CDN Access (PowerShell)

**PowerShell Syntax:**
```powershell
# Use Invoke-WebRequest (PowerShell's curl)
Invoke-WebRequest -Uri "https://cdn.renderiq.io/renderiq-renders/[path-to-file]" -Method Head

# Or use curl.exe if available
curl.exe -I https://cdn.renderiq.io/renderiq-renders/[path-to-file]
```

**Example:**
```powershell
# Replace [path] with actual file path from Step 1
Invoke-WebRequest -Uri "https://cdn.renderiq.io/renderiq-renders/projects/tool-render-to-cad-20251206/4df4ace2-4109-4128-b935-8c51f0e03770/render_xxx.png" -Method Head
```

### Step 3: Check Response Headers

**Good (CDN Working):**
```
server: Google
cache-control: public, max-age=31536000, immutable
x-cache: HIT (or MISS on first request)
via: 1.1 google
```

**Bad (CDN Not Working):**
```
server: UploadServer
cache-control: private, max-age=0
cdn-status: Direct
```

## Testing Uploads Bucket

For files in `renderiq-uploads`, use direct GCS URL (CDN not configured):

```powershell
# Direct GCS URL (not CDN)
Invoke-WebRequest -Uri "https://storage.googleapis.com/renderiq-uploads/[path-to-file]" -Method Head
```

## Code Behavior

The code automatically handles this:

**Renders bucket:**
- Uses CDN: `https://cdn.renderiq.io/renderiq-renders/...`
- Fast global delivery
- Cached at edge locations

**Uploads bucket:**
- Uses direct GCS: `https://storage.googleapis.com/renderiq-uploads/...`
- Still works, just not cached
- Good for user uploads (less caching needed)

## PowerShell curl vs curl.exe

**PowerShell `curl` (alias for Invoke-WebRequest):**
```powershell
# This is PowerShell's Invoke-WebRequest
curl -Uri "https://..." -Method Head
```

**Real curl.exe:**
```powershell
# Use curl.exe explicitly
curl.exe -I https://...
```

**Recommended:**
```powershell
# Use Invoke-WebRequest for PowerShell
Invoke-WebRequest -Uri "https://cdn.renderiq.io/renderiq-renders/[path]" -Method Head

# Or use curl.exe
curl.exe -I https://cdn.renderiq.io/renderiq-renders/[path]
```

## Quick Test Script

Create a test file and upload it:

```bash
# Create test file
echo "CDN Test" > cdn-test.txt

# Upload to renders bucket
gsutil cp cdn-test.txt gs://renderiq-renders/cdn-test.txt

# Test CDN
Invoke-WebRequest -Uri "https://cdn.renderiq.io/renderiq-renders/cdn-test.txt" -Method Head
```

## Summary

- ✅ **CDN works for:** `renderiq-renders` bucket
- ❌ **CDN NOT configured for:** `renderiq-uploads` bucket
- ✅ **Use direct GCS for uploads:** `https://storage.googleapis.com/renderiq-uploads/...`
- ✅ **Code handles this automatically** - no changes needed

