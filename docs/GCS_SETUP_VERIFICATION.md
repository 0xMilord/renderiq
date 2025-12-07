# GCS Setup Verification Checklist

## Current Status

### ✅ Code Implementation
- [x] GCS Storage Service implemented (`lib/services/gcs-storage.ts`)
- [x] StorageService supports dual-write mode
- [x] All components updated to handle GCS URLs
- [x] Migration scripts created

### ⚠️ Configuration Required

**IMPORTANT**: GCS is NOT active by default. You must configure it:

1. **Environment Variables** - Set in `.env.local`:
   ```env
   # Required for GCS
   GOOGLE_CLOUD_PROJECT_ID=inheritage-viewer-sdk-v1
   GOOGLE_CLOUD_STORAGE_BUCKET_RENDERS=renderiq-renders
   GOOGLE_CLOUD_STORAGE_BUCKET_UPLOADS=renderiq-uploads
   GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account-key.json
   
   # Storage Provider Mode
   STORAGE_PROVIDER=supabase  # Options: 'supabase', 'gcs', or 'dual-write'
   ```

2. **Current Default**: `STORAGE_PROVIDER=supabase` (Supabase Storage is still being used)

## How to Enable GCS

### Step 1: Install Package
```bash
npm install @google-cloud/storage
```

### Step 2: Set Up Google Cloud
1. Create service account in Google Cloud Console
2. Grant Storage Object Admin role
3. Download JSON key file
4. Set `GOOGLE_APPLICATION_CREDENTIALS` to key file path

### Step 3: Create Buckets
```bash
npm run gcs:setup
```

### Step 4: Enable Dual-Write Mode (Recommended First Step)
```env
STORAGE_PROVIDER=dual-write
```

This will:
- ✅ Write to both Supabase AND GCS
- ✅ Read from Supabase (existing URLs still work)
- ✅ Verify GCS is working before full migration
- ✅ Zero downtime

### Step 5: Verify Uploads
1. Upload a test file through the app
2. Check Supabase Storage - file should be there
3. Check GCS bucket - file should also be there
4. Verify database URL is correct

### Step 6: Switch to GCS-Only
Once verified:
```env
STORAGE_PROVIDER=gcs
```

## Verification Commands

### Check Current Storage Provider
```bash
# In your code, check:
echo $STORAGE_PROVIDER
# Should be: 'supabase', 'gcs', or 'dual-write'
```

### Verify GCS Buckets Exist
```bash
# Run the setup script (it will tell you if buckets exist)
npm run gcs:setup
```

### Test Upload
1. Upload a file through the app
2. Check logs for:
   - `✅ GCS: File uploaded successfully` (if GCS is enabled)
   - `✅ Storage: Dual-write mode` (if dual-write is enabled)

## Current Behavior

### With `STORAGE_PROVIDER=supabase` (Default)
- ✅ Files upload to Supabase Storage
- ✅ URLs are Supabase URLs
- ✅ Images render correctly
- ❌ GCS is NOT used

### With `STORAGE_PROVIDER=dual-write`
- ✅ Files upload to BOTH Supabase and GCS
- ✅ URLs are GCS URLs (primary)
- ✅ Images render correctly
- ✅ Fallback to Supabase if GCS fails
- ✅ Zero downtime migration

### With `STORAGE_PROVIDER=gcs`
- ✅ Files upload to GCS only
- ✅ URLs are GCS URLs
- ✅ Images render correctly
- ❌ Supabase Storage is NOT used

## Image Delivery Optimization

### Current (Supabase)
- Direct Supabase CDN
- No custom CDN configuration
- Good performance but higher costs

### With GCS + Cloud CDN
- Google Cloud CDN
- Global edge caching
- Lower costs (60-80% savings)
- Better performance

### To Enable CDN:
1. Set up Cloud CDN in Google Cloud Console
2. Point to `renderiq-renders` bucket
3. Configure cache policies
4. Set custom domain (optional)
5. Update env vars:
   ```env
   GCS_CDN_DOMAIN=cdn.renderiq.io
   NEXT_PUBLIC_GCS_CDN_DOMAIN=cdn.renderiq.io
   ```

## Troubleshooting

### Files Not Uploading to GCS
1. Check `STORAGE_PROVIDER` env var
2. Verify `GOOGLE_APPLICATION_CREDENTIALS` is set
3. Check service account has correct permissions
4. Verify buckets exist: `npm run gcs:setup`

### Images Not Rendering
1. Check URL format in database
2. Verify CORS is configured on buckets
3. Check browser console for CORS errors
4. Verify bucket is public (for renders bucket)

### Dual-Write Not Working
1. Check logs for errors
2. Verify both Supabase and GCS credentials
3. Check network connectivity
4. Review error logs in console

## Next Steps

1. **Set up Google Cloud** (if not done)
2. **Create buckets**: `npm run gcs:setup`
3. **Enable dual-write**: Set `STORAGE_PROVIDER=dual-write`
4. **Test uploads**: Verify files in both systems
5. **Migrate existing files**: Run migration script
6. **Switch to GCS-only**: Set `STORAGE_PROVIDER=gcs`
7. **Enable CDN**: Set up Cloud CDN for optimization

---

**Status**: Code is ready, but GCS is NOT active until you configure it!


