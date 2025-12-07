# CDN Code Updates Summary

## Overview

Updated all code to use the new CDN URL structure with proper fallback mechanisms. The new structure uses simplified paths (`/uploads/` and `/renders/`) that are rewritten by the load balancer to match the bucket structure.

## New URL Structure

### Old Structure (Direct GCS):
- `https://storage.googleapis.com/renderiq-renders/projects/...`
- `https://storage.googleapis.com/renderiq-uploads/projects/...`

### New Structure (CDN):
- `https://cdn.renderiq.io/renders/projects/...`
- `https://cdn.renderiq.io/uploads/projects/...`

### How It Works:
1. **Request**: `https://cdn.renderiq.io/uploads/projects/file.jpg`
2. **Load Balancer URL Rewrite**: Strips `/uploads/` → `/projects/file.jpg`
3. **Backend Bucket**: Receives `/projects/file.jpg` and looks for it in `renderiq-uploads` bucket ✅

## Files Updated

### 1. `lib/services/gcs-storage.ts`
**Updated**: `getPublicUrl()` method
- Now generates URLs with simplified paths: `/uploads/` and `/renders/`
- Automatically uses CDN domain when configured
- Falls back to direct GCS URLs when CDN not configured

```typescript
// New implementation
if (CDN_DOMAIN) {
  const pathPrefix = bucketName === 'renders' ? 'renders' : 'uploads';
  return `https://${CDN_DOMAIN}/${pathPrefix}/${filePath}`;
}
```

### 2. `lib/utils/cdn-fallback.ts`
**Updated**: `cdnToDirectGCS()` function
- Now handles new simplified path structure
- Maps `/renders/` → `renderiq-renders/`
- Maps `/uploads/` → `renderiq-uploads/`
- Maintains backward compatibility with old structure

```typescript
// Handles both new and old structures
if (gcsUrl.includes('/renders/')) {
  gcsUrl = gcsUrl.replace('/renders/', '/renderiq-renders/');
} else if (gcsUrl.includes('/uploads/')) {
  gcsUrl = gcsUrl.replace('/uploads/', '/renderiq-uploads/');
}
```

### 3. `components/chat/unified-chat-interface.tsx`
**Updated**: Image rendering for both renders and uploaded images
- All render output images now use CDN URLs with fallback
- Uploaded images now use CDN URLs with fallback
- Added error handling with automatic fallback to direct GCS URLs

**Changes:**
- Render output images: Already had fallback, now using new CDN URLs
- Uploaded images: Added `shouldUseRegularImg()` check and fallback handling

### 4. `components/tools/base-tool-component.tsx`
**Updated**: Before/After image comparison
- Added imports for `shouldUseRegularImg` and `handleImageErrorWithFallback`
- Updated both "Before" (uploaded) and "After" (rendered) images to use CDN with fallback
- Added error handling with automatic fallback

### 5. `lib/utils/storage-url.ts`
**Already Updated**: URL detection functions
- `isGCSUrl()` already recognizes `cdn.renderiq.io`
- `shouldUseRegularImg()` already handles CDN URLs
- No changes needed

## Fallback Mechanism

All images now have a three-tier fallback system:

1. **Primary**: CDN URL (`https://cdn.renderiq.io/renders/...` or `/uploads/...`)
2. **Fallback**: Direct GCS URL (`https://storage.googleapis.com/renderiq-renders/...`)
3. **Placeholder**: `/placeholder-image.jpg` if both fail

### How Fallback Works:

```typescript
onError={(e) => {
  const img = e.target as HTMLImageElement;
  const originalUrl = imageUrl;
  
  // Try CDN fallback to direct GCS URL
  const fallbackUrl = handleImageErrorWithFallback(originalUrl, e);
  if (fallbackUrl && fallbackUrl !== '/placeholder-image.jpg') {
    img.src = fallbackUrl; // Automatically tries direct GCS
  } else {
    img.src = '/placeholder-image.jpg'; // Final fallback
  }
}}
```

## Testing Checklist

After deploying these changes, verify:

- [ ] New renders generate CDN URLs (`/renders/...`)
- [ ] New uploads generate CDN URLs (`/uploads/...`)
- [ ] Images load correctly from CDN
- [ ] Fallback works when CDN is unavailable
- [ ] Old direct GCS URLs still work (backward compatibility)
- [ ] Uploaded images display correctly in chat
- [ ] Before/After comparison works in tools
- [ ] Gallery images load correctly

## Backward Compatibility

The code maintains backward compatibility:
- Old direct GCS URLs (`storage.googleapis.com/...`) still work
- Old CDN URLs with full bucket names (`/renderiq-renders/...`) are handled by fallback
- New simplified URLs (`/renders/...`, `/uploads/...`) are the primary format

## Next Steps

1. ✅ Code updated to use new CDN URL structure
2. ⏳ Configure URL rewrites in Cloud Console (see `CDN_FRESH_SETUP_SUMMARY.md`)
3. ⏳ Wait for SSL certificate provisioning
4. ⏳ Configure DNS A record
5. ⏳ Test CDN URLs after DNS propagates

## Related Documentation

- `docs/CDN_FRESH_SETUP_SUMMARY.md` - Infrastructure setup guide
- `docs/CDN_FALLBACK_IMPLEMENTATION.md` - Fallback mechanism details
- `docs/CDN_UPLOADS_PATH_ISSUE.md` - Original path routing issue

