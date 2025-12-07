# Fix CDN Path Matcher Configuration

## Current Issue

Looking at your path rules, there's a **WRONG path rule**:

**Current Configuration:**
1. ✅ Default → `renderiq-renders-cdn-backend` (correct)
2. ❌ `/renderiq-renders/*` → `renderiq-uploads-cdn-backend` (WRONG! This routes renders to uploads backend)
3. ✅ `/renderiq-uploads/*` → `renderiq-uploads-cdn-backend` (correct)
4. ✅ Default (uploads-matcher) → `renderiq-renders-cdn-backend` (correct)

## Problem

The path rule `/renderiq-renders/*` is pointing to the **uploads backend**, which is why renders bucket images are failing!

## Fix

### Step 1: Edit URL Map

1. Go to: https://console.cloud.google.com/net-services/loadbalancing/urlMaps/list?project=inheritage-viewer-sdk-v1
2. Click on: **renderiq-renders-cdn-map**
3. Click **"EDIT"**

### Step 2: Remove Wrong Path Rule

1. Find path matcher: **"uploads-matcher"**
2. Look for path rule: `/renderiq-renders/*` → `renderiq-uploads-cdn-backend`
3. **DELETE this path rule** (click the X or delete button)
4. Keep only:
   - `/renderiq-uploads/*` → `renderiq-uploads-cdn-backend`
   - Default → `renderiq-renders-cdn-backend`
5. Click **"SAVE"**

### Step 3: Correct Configuration

After fix, you should have:

**Default (no path matcher):**
- All unmatched → `renderiq-renders-cdn-backend` ✅

**uploads-matcher:**
- `/renderiq-uploads/*` → `renderiq-uploads-cdn-backend` ✅
- Default (within matcher) → `renderiq-renders-cdn-backend` ✅

**DO NOT have:**
- ❌ `/renderiq-renders/*` → `renderiq-uploads-cdn-backend` (DELETE THIS)

## Why This Happened

The path matcher was probably created with a wrong path rule. The `/renderiq-renders/*` path should NOT be in the uploads-matcher - it should use the default backend.

## After Fix

Both buckets will work correctly:
- ✅ `https://cdn.renderiq.io/renderiq-renders/...` → `renderiq-renders-cdn-backend`
- ✅ `https://cdn.renderiq.io/renderiq-uploads/...` → `renderiq-uploads-cdn-backend`

## Test

After fixing:

```powershell
# Test renders bucket
Invoke-WebRequest -Uri "https://cdn.renderiq.io/renderiq-renders/[path]" -Method Head

# Test uploads bucket  
Invoke-WebRequest -Uri "https://cdn.renderiq.io/renderiq-uploads/[path]" -Method Head
```

Both should work! 🎉

