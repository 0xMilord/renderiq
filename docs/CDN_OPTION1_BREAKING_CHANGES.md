# Option 1: Breaking Changes Analysis

## Current State

**Files stored in bucket:**
- Path: `projects/tool-render-to-cad-20251206/4df4ace2-4109-4128-b935-8c51f0e03770/file.png`
- URL in database: `https://storage.googleapis.com/renderiq-uploads/projects/.../file.png`

**URLs stored in Supabase:**
- `renders.uploadedImageUrl` - Full URL stored
- `renders.outputUrl` - Full URL stored  
- `fileStorage.url` - Full URL stored

## If We Implement Option 1

**New files stored in bucket:**
- Path: `renderiq-uploads/projects/tool-render-to-cad-20251206/4df4ace2-4109-4128-b935-8c51f0e03770/file.png`
- New URL: `https://cdn.renderiq.io/renderiq-uploads/projects/.../file.png`

**Problem:**
- ✅ New files: Work with CDN
- ❌ Old files: Still at `projects/...` in bucket
- ❌ Old URLs in database: Point to old paths that won't work with CDN
- ❌ Old URLs: Will break if we change URL generation

## Breaking Changes

1. **Old URLs in database** will point to paths that don't exist in new structure
2. **Old files** remain at old paths (`projects/...`)
3. **New files** stored at new paths (`renderiq-uploads/projects/...`)
4. **Mixed state** - some files work, some don't

## Solutions to Avoid Breaking Changes

### Option A: Migrate All Old Files (Recommended if doing Option 1)

1. **Copy old files** from `projects/...` to `renderiq-uploads/projects/...` in bucket
2. **Update all URLs** in database to new paths
3. **Delete old files** after migration

**Migration script needed:**
```typescript
// For each file in bucket at projects/...
// 1. Copy to renderiq-uploads/projects/...
// 2. Update database URLs
// 3. Verify new URLs work
// 4. Delete old files
```

**Pros:**
- All files work with CDN
- Clean migration
- No mixed state

**Cons:**
- Requires migration script
- Takes time to migrate
- Risk of data loss if migration fails

### Option B: Backward Compatibility (Safer)

Keep supporting both old and new paths:

```typescript
// In getPublicUrl()
if (CDN_DOMAIN && bucketName === 'uploads') {
  // Check if file exists at new path, fallback to old
  // Or use direct GCS for old files, CDN for new
  const isNewFile = filePath.startsWith('renderiq-uploads/');
  if (isNewFile) {
    return `https://${CDN_DOMAIN}/${filePath}`;
  }
  // Old files use direct GCS
  return `https://storage.googleapis.com/${bucket}/${filePath}`;
}
```

**Pros:**
- No breaking changes
- Old files still work
- New files get CDN

**Cons:**
- Mixed URL structure
- More complex code
- Old files don't benefit from CDN

### Option C: Keep Current Solution (Recommended)

**Use direct GCS for uploads** (current implementation):
- ✅ No breaking changes
- ✅ All files work immediately
- ✅ Simple code
- ✅ No migration needed
- ⚠️ No CDN for uploads (but uploads are typically accessed once)

## Recommendation

**Keep current solution** (direct GCS for uploads) because:
1. ✅ No breaking changes
2. ✅ No migration needed
3. ✅ All existing URLs continue to work
4. ✅ Uploads are typically accessed once (less CDN benefit)
5. ✅ Simpler architecture

If you really need CDN for uploads, use **Option B** (backward compatibility) to avoid breaking old URLs.

