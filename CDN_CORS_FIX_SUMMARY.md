# CDN CORS Fix Summary

## Problem
Tldraw's `TldrawImage` component was failing with CORS errors when trying to:
1. Fetch images from `cdn.renderiq.io` to convert to data URIs for SVG export
2. Fetch fonts from `cdn.tldraw.com` for SVG export

## Root Cause
- Browser-side fetch requests to CDN domains have CORS restrictions
- TldrawImage internally uses `exportToSvg` which tries to fetch images/fonts
- CDN URLs don't allow cross-origin requests from the browser

## Solutions Implemented

### 1. Pre-process Snapshots (`components/canvas/tldraw-snapshot-image.tsx`)
✅ **FIXED**: Added `preprocessSnapshot()` function that:
- Recursively finds all CDN URLs in the snapshot
- Replaces `cdn.renderiq.io` URLs with direct `storage.googleapis.com` URLs
- Direct GCS URLs don't have CORS restrictions
- Applied before passing snapshot to `TldrawImage`

### 2. Image Proxy API (`app/api/proxy-image/route.ts`)
✅ **CREATED**: Server-side image proxy API that:
- Accepts image URLs via POST request
- Converts CDN URLs to direct GCS URLs
- Fetches images server-side (no CORS issues)
- Returns base64 data URIs
- Can be used for future image processing needs

### 3. Bundled Assets (`components/canvas/renderiq-canvas.tsx`)
✅ **EXISTING**: Already configured to use bundled assets:
- Uses `getAssetUrlsByMetaUrl()` to bundle tldraw assets
- Falls back to CDN if bundling fails
- This should prevent font CORS errors when bundling works

## How It Works

1. **For Chain/Project Cards**:
   - Snapshot is extracted from `render.contextData.tldrawCanvasState.canvasData`
   - `TldrawSnapshotImage` pre-processes the snapshot
   - CDN URLs are replaced with direct GCS URLs
   - `TldrawImage` receives the processed snapshot
   - No CORS errors when exporting to PNG/SVG

2. **For Fonts**:
   - Tldraw tries to use bundled assets first (via `getAssetUrlsByMetaUrl()`)
   - If bundling fails, it falls back to CDN
   - Font CORS errors may still occur if bundling fails
   - This is a tldraw limitation - fonts are fetched by tldraw internally

## Files Modified

1. `components/canvas/tldraw-snapshot-image.tsx`
   - Added `preprocessSnapshot()` function
   - Pre-processes snapshots before passing to TldrawImage

2. `app/api/proxy-image/route.ts` (NEW)
   - Server-side image proxy API
   - Can be used for future image processing

## Testing

To verify the fix:
1. Open a chain card that has a snapshot
2. Check browser console - should see no CORS errors for `cdn.renderiq.io`
3. Font errors from `cdn.tldraw.com` may still appear if bundling fails
4. Snapshot images should render correctly on chain/project cards

## Future Improvements

1. **Font CORS**: Configure tldraw to always use bundled assets (requires webpack config)
2. **Error Handling**: Add try-catch around TldrawImage to gracefully handle font errors
3. **Caching**: Cache processed snapshots to avoid re-processing on every render

