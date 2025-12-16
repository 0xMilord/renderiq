# CDN SSR Fetch Error Fix

**Date**: 2025-01-XX  
**Status**: ✅ Fixed  
**Issue**: CDN fetch failures during SSR when tldraw tries to export SVG

---

## Problem

The application was throwing errors during Server-Side Rendering (SSR):
```
Failed to fetch (cdn.tldraw.com)
Failed to fetch (cdn.renderiq.io)
```

These errors occur when:
1. `TldrawImage` component tries to export canvas to SVG/PNG
2. Tldraw's `FontManager.toEmbeddedCssDeclaration` tries to fetch fonts from `cdn.tldraw.com`
3. Tldraw's `ImageShapeUtil.toSvg` tries to fetch images from `cdn.renderiq.io`
4. These fetches happen during SSR where network requests may fail or be unavailable

## Root Cause

**File**: `components/canvas/tldraw-snapshot-image.tsx`

The `TldrawImage` component from `@tldraw/tldraw` internally calls `exportToSvg`, which:
1. Tries to fetch fonts from `cdn.tldraw.com` to embed in SVG
2. Tries to fetch images from `cdn.renderiq.io` to convert to data URIs
3. These fetches happen even during SSR, causing errors

Even though the component is marked with `'use client'`, tldraw's internal code still runs during SSR in some cases.

## Solution

**File**: `components/canvas/tldraw-snapshot-image.tsx`

1. **Dynamic Import with SSR Disabled**:
   ```typescript
   const TldrawImage = dynamic(
     () => import('@tldraw/tldraw').then((mod) => mod.TldrawImage),
     { 
       ssr: false, // Disable SSR to prevent CDN fetch errors
       loading: () => <div>Loading...</div>
     }
   );
   ```

2. **Error Boundary**:
   - Wrapped `TldrawImage` in `ErrorBoundary` to catch any remaining errors
   - Added `onError` handler to filter out expected CDN fetch errors
   - Prevents errors from crashing the app

3. **Client-Side Guards**:
   - Already had `typeof window === 'undefined'` check
   - Added `mounted` state to ensure component only renders after client mount

## Changes Made

1. **Dynamic Import**: Changed from static import to dynamic import with `ssr: false`
2. **Error Boundary**: Wrapped component in ErrorBoundary with error filtering
3. **Better Error Handling**: Filter out expected CDN fetch errors from Sentry

## How It Works

1. **Component loads on client only**:
   - Dynamic import with `ssr: false` ensures `TldrawImage` never loads during SSR
   - Loading placeholder shown until component loads

2. **Error boundary catches any remaining errors**:
   - If CDN fetch still fails (e.g., network issue), error boundary catches it
   - Error handler filters out expected CDN errors
   - Component gracefully degrades to placeholder

3. **CDN URL preprocessing** (already existed):
   - `preprocessSnapshot()` replaces CDN URLs with direct GCS URLs
   - Prevents CORS errors when fetching images

## Testing

- [x] No CDN fetch errors during SSR
- [x] Component loads correctly on client
- [x] Error boundary catches and handles errors gracefully
- [x] Loading state shows while component loads
- [x] Snapshot images display correctly

## Related Issues

- ✅ "Failed to fetch (cdn.tldraw.com)" during SSR (FIXED)
- ✅ "Failed to fetch (cdn.renderiq.io)" during SSR (FIXED)
- ✅ SVG export errors during SSR (FIXED)

## Files Modified

1. **components/canvas/tldraw-snapshot-image.tsx**
   - Changed to dynamic import with `ssr: false`
   - Added ErrorBoundary wrapper
   - Added error filtering in onError handler

---

## Conclusion

The CDN SSR fetch errors have been fixed by:
1. Using dynamic import to prevent `TldrawImage` from loading during SSR
2. Adding error boundary to catch any remaining errors
3. Filtering out expected CDN fetch errors from error reporting

The component now:
- Only loads on the client side
- Gracefully handles CDN fetch failures
- Shows loading state while component loads
- Displays snapshot images correctly when loaded

