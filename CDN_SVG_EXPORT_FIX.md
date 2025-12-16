# CDN SVG Export Fix

**Date**: 2025-01-XX  
**Status**: ✅ Fixed  
**Issue**: Failed to fetch (cdn.renderiq.io) during SVG export

---

## Problem

When tldraw tries to export the canvas to SVG, it calls `ImageShapeUtil.toSvg` which internally uses `getDataURIFromURL` to fetch images from CDN URLs (`cdn.renderiq.io`). This fails with a CORS error because:

1. Browser-side fetch requests to CDN domains have CORS restrictions
2. `getDataURIFromURL` tries to fetch images directly from the browser
3. CDN URLs don't allow cross-origin requests from the browser

## Root Cause

Image assets in the canvas were created with CDN URLs (`cdn.renderiq.io`). When tldraw exports to SVG, it needs to convert these URLs to data URIs, but the CDN doesn't allow CORS requests.

## Solution

**File**: `components/canvas/renderiq-canvas.tsx` (lines ~797 and ~659)

**Before**:
```typescript
editor.createAssets([
  {
    id: assetId,
    typeName: 'asset',
    type: 'image',
    props: {
      src: render.outputUrl!, // CDN URL causes CORS error
      // ...
    },
  },
]);
```

**After**:
```typescript
// ✅ FIX: Convert CDN URL to direct GCS URL to avoid CORS issues during SVG export
// tldraw's ImageShapeUtil.toSvg uses getDataURIFromURL which fails on CDN URLs due to CORS
const { cdnToDirectGCS, isCDNUrl } = await import('@/lib/utils/cdn-fallback');
const imageUrl = render.outputUrl!;
const assetUrl = isCDNUrl(imageUrl) ? cdnToDirectGCS(imageUrl) : imageUrl;

editor.createAssets([
  {
    id: assetId,
    typeName: 'asset',
    type: 'image',
    props: {
      src: assetUrl, // Use direct GCS URL instead of CDN URL
      // ...
    },
    meta: {
      renderId: render.id,
      originalUrl: imageUrl, // Store original URL in meta for reference
    },
  },
]);
```

## Changes Made

1. **Pre-process image URLs before creating assets**:
   - Check if URL is a CDN URL using `isCDNUrl()`
   - Convert CDN URL to direct GCS URL using `cdnToDirectGCS()`
   - Use direct GCS URL in asset `src` property
   - Store original URL in `meta.originalUrl` for reference

2. **Applied to both locations**:
   - When adding current render to canvas (line ~797)
   - When loading chain renders to canvas (line ~659)

## Result

- ✅ Image assets use direct GCS URLs (no CORS restrictions)
- ✅ SVG export works without fetch errors
- ✅ Original CDN URLs stored in meta for reference
- ✅ Images still load correctly (direct GCS URLs work fine)
- ✅ No breaking changes to existing functionality

## How It Works

1. **Asset Creation**:
   - Image URL is checked: `isCDNUrl(imageUrl)`
   - If CDN URL: Converted to direct GCS URL: `cdnToDirectGCS(imageUrl)`
   - If already direct GCS URL: Used as-is
   - Asset created with direct GCS URL in `src` property

2. **SVG Export**:
   - tldraw's `ImageShapeUtil.toSvg` calls `getDataURIFromURL(assetUrl)`
   - Direct GCS URLs don't have CORS restrictions
   - Image is successfully fetched and converted to data URI
   - SVG export completes without errors

## Files Modified

1. **components/canvas/renderiq-canvas.tsx**
   - Added CDN URL preprocessing when creating image assets
   - Applied to both current render and chain renders loading

## Testing

- [x] Image assets created with direct GCS URLs
- [x] SVG export works without CORS errors
- [x] Images display correctly in canvas
- [x] Original URLs preserved in meta
- [x] No breaking changes

---

## Related Issues

- ✅ "Failed to fetch (cdn.renderiq.io)" during SVG export (FIXED)
- ✅ CORS errors when exporting canvas to SVG (FIXED)
- ✅ ImageShapeUtil.toSvg fetch failures (FIXED)

