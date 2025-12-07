# Storage Migration: Supabase Storage → Google Cloud Storage

## Executive Summary

**Current State**: Using Supabase Storage for all file uploads (renders, uploads, receipts)
**Target State**: Migrate to Google Cloud Storage with Cloud CDN for fast image delivery
**Cost Savings**: Estimated 60-80% reduction in storage costs
**Performance**: Improved delivery speed with Cloud CDN

## Current Infrastructure Audit

### 1. Storage Service Layer (`lib/services/storage.ts`)

**Current Implementation:**
- Uses `@supabase/supabase-js` client
- Two buckets: `renders` (public) and `uploads` (private)
- Methods:
  - `uploadFile()` - Uploads File or Buffer
  - `uploadFromUrl()` - Downloads and uploads from URL
  - `deleteFile()` - Deletes file from bucket
  - `getSignedUrl()` - Generates signed URLs for private files
  - `getFileUrl()` - Gets public URL from file ID
  - `updateFileProjectSlug()` - Updates metadata

**File Path Structure:**
- Renders: `renders/{userId}/{fileName}` or `projects/{projectSlug}/{userId}/{fileName}`
- Uploads: `uploads/{userId}/{fileName}` or `projects/{projectSlug}/{userId}/{fileName}`

### 2. Database Schema (`lib/db/schema.ts`)

**Tables storing URLs:**
- `renders` table:
  - `outputUrl` (text) - Public URL for generated renders
  - `outputKey` (text) - Storage key/path
  - `uploadedImageUrl` (text) - URL for uploaded input images
  - `uploadedImageKey` (text) - Storage key for uploads
  - `uploadedImageId` (uuid) - Reference to `fileStorage` table

- `fileStorage` table:
  - `url` (text) - Full public URL
  - `key` (text) - Storage path/key
  - `bucket` (text) - Bucket name ('renders' or 'uploads')
  - `isPublic` (boolean) - Public/private flag

### 3. DAL Layer (`lib/dal/renders.ts`)

**Methods using storage:**
- `create()` - Creates render record with URLs
- `updateOutput()` - Updates `outputUrl` and `outputKey`
- No direct storage calls, only stores URLs

### 4. Service Layer

**Files using StorageService:**
- `lib/services/storage.ts` - Main storage service
- `lib/services/render.ts` - Uses `StorageService.uploadFile()` for project images
- `lib/services/receipt.service.ts` - Uploads PDF receipts
- `lib/services/thumbnail.ts` - (Commented out delete)

### 5. Actions Layer (`lib/actions/`)

**Files using StorageService:**
- `lib/actions/render.actions.ts` - Multiple upload calls:
  - Line 287: Upload original image
  - Line 714: Upload generated image/video
  - Line 725: Upload from URL
  - Line 739: Upload processed image

### 6. Components/Hooks

**Components displaying images:**
- `components/tools/base-tool-component.tsx` - Shows `outputUrl` in img tags
- `components/chat/unified-chat-interface.tsx` - Displays renders with `outputUrl`
- `components/engines/render-preview.tsx` - Shows render images
- `components/engines/render-chain-viz.tsx` - Displays chain renders
- `components/chat/mention-tagger.tsx` - Shows render thumbnails
- `components/gallery/gallery-image-card.tsx` - Gallery images

**URL Pattern Detection:**
- Components check for `supabase.co` in URLs to decide between `<img>` and Next.js `<Image>`
- This pattern will need updating for GCS URLs

### 7. API Routes

**Files using storage:**
- `app/api/renders/route.ts` - Uses StorageService for uploads

## Migration Strategy

### Phase 1: Dual-Write (Zero Downtime)

**Goal**: Write to both Supabase and GCS simultaneously
**Duration**: 1-2 weeks
**Risk**: Low

1. Create GCS service alongside Supabase
2. Add feature flag to control storage provider
3. Update `StorageService` to write to both
4. New uploads go to both systems
5. Read from Supabase (existing URLs still work)

### Phase 2: Data Migration

**Goal**: Migrate existing files from Supabase to GCS
**Duration**: 1-2 weeks (depending on data volume)
**Risk**: Medium

1. Create migration script to:
   - List all files in Supabase buckets
   - Download from Supabase
   - Upload to GCS
   - Update database URLs
   - Verify migration success
2. Run migration in batches
3. Keep Supabase files as backup during migration

### Phase 3: Read from GCS

**Goal**: Switch reads to GCS
**Duration**: 1 week
**Risk**: Low

1. Update URL generation to use GCS
2. Update components to handle GCS URLs
3. Test thoroughly
4. Monitor for issues

### Phase 4: Cleanup

**Goal**: Remove Supabase storage dependency
**Duration**: 1 week
**Risk**: Low

1. Verify all files migrated
2. Remove Supabase storage code
3. Update documentation
4. Archive Supabase buckets (keep for 30 days)

## Implementation Plan

### Step 1: Install Google Cloud Storage SDK

```bash
npm install @google-cloud/storage
```

### Step 2: Create GCS Service

Create `lib/services/gcs-storage.ts` with:
- Bucket initialization
- Upload methods (matching StorageService interface)
- Download methods
- Signed URL generation
- Public URL generation

### Step 3: Update StorageService

Add abstraction layer:
- Feature flag: `USE_GCS_STORAGE` (env variable)
- Dual-write mode during migration
- URL transformation helper
- Backward compatibility for Supabase URLs

### Step 4: Cloud CDN Setup

**Google Cloud CDN Configuration:**
- Enable Cloud CDN on GCS bucket
- Configure cache policies
- Set up custom domain (optional)
- Configure CORS for image delivery

**CDN Benefits:**
- Global edge caching
- Reduced latency
- Lower bandwidth costs
- Better performance for image-heavy app

### Step 5: URL Migration

**URL Format:**
- Old: `https://{project}.supabase.co/storage/v1/object/public/{bucket}/{path}`
- New: `https://storage.googleapis.com/{bucket}/{path}` or custom CDN domain

**Database Updates:**
- Update `renders.outputUrl` for all existing records
- Update `renders.outputKey` if needed
- Update `fileStorage.url` for all records
- Keep old URLs in `metadata` for rollback

### Step 6: Component Updates

**Update URL detection:**
- Replace `supabase.co` checks with GCS URL pattern
- Update Next.js Image component usage
- Ensure proper CORS headers

## Technical Details

### Google Cloud Storage Setup

**Buckets:**
- `renderiq-renders` (public, for generated images/videos)
- `renderiq-uploads` (private, for user uploads)
- `renderiq-receipts` (private, for PDF receipts)

**IAM Permissions:**
- Service account with Storage Object Admin role
- Public read access for renders bucket
- Signed URL access for uploads/receipts

**CORS Configuration:**
```json
[
  {
    "origin": ["https://renderiq.io", "https://*.renderiq.io"],
    "method": ["GET", "HEAD"],
    "responseHeader": ["Content-Type", "Cache-Control"],
    "maxAgeSeconds": 3600
  }
]
```

### CDN Configuration

**Cloud CDN Settings:**
- Cache mode: Cache all static content
- Default TTL: 1 hour
- Max TTL: 1 day
- Serve stale content: Yes (for availability)

**Custom Domain (Optional):**
- `cdn.renderiq.io` or `assets.renderiq.io`
- SSL certificate via Google-managed certs
- Better branding and performance

### Cost Comparison

**Supabase Storage:**
- $0.021/GB storage
- $0.09/GB egress
- No CDN included

**Google Cloud Storage:**
- $0.020/GB storage (Standard)
- $0.12/GB egress (first 10TB)
- Cloud CDN: $0.08/GB (after cache hit)
- **Estimated savings: 60-80%** with CDN cache hits

## Migration Scripts

### 1. Dual-Write Script
- Enable dual-write mode
- Monitor both systems
- Verify file integrity

### 2. Data Migration Script
- Batch processing (100 files at a time)
- Resume capability
- Error handling and retry logic
- Progress tracking
- Verification after migration

### 3. URL Update Script
- Update database URLs in batches
- Verify URL accessibility
- Rollback capability

### 4. Cleanup Script
- Verify all files migrated
- Archive Supabase buckets
- Remove old URLs after verification period

## Risk Mitigation

### Risks:
1. **Data Loss**: Mitigated by dual-write and verification
2. **Downtime**: Zero-downtime migration strategy
3. **URL Breaking**: Backward compatibility layer
4. **Cost Overruns**: Monitor usage during migration

### Rollback Plan:
1. Feature flag to switch back to Supabase
2. Keep Supabase files for 30 days
3. Database rollback script
4. URL reversion script

## Testing Checklist

- [ ] GCS service uploads work
- [ ] GCS service downloads work
- [ ] Signed URLs work for private files
- [ ] Public URLs work for renders
- [ ] CDN caching works correctly
- [ ] Image display in all components
- [ ] Download functionality works
- [ ] Migration script works correctly
- [ ] URL updates don't break existing links
- [ ] Performance is improved
- [ ] Cost reduction verified

## Timeline

**Week 1-2**: Setup GCS, create service, dual-write
**Week 3-4**: Data migration
**Week 5**: Switch reads to GCS
**Week 6**: Cleanup and verification

## Files to Modify

### New Files:
- `lib/services/gcs-storage.ts` - GCS implementation
- `scripts/migrate-storage-to-gcs.ts` - Migration script
- `scripts/update-storage-urls.ts` - URL update script

### Modified Files:
- `lib/services/storage.ts` - Add GCS support
- `lib/dal/renders.ts` - (No changes, URLs only)
- `components/**/*.tsx` - Update URL detection patterns
- `.env.example` - Add GCS config
- `package.json` - Add @google-cloud/storage

## Environment Variables

```env
# Google Cloud Storage
GOOGLE_CLOUD_PROJECT_ID=your-project-id
GOOGLE_CLOUD_STORAGE_BUCKET_RENDERS=renderiq-renders
GOOGLE_CLOUD_STORAGE_BUCKET_UPLOADS=renderiq-uploads
GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json

# Feature Flag
USE_GCS_STORAGE=false  # Set to true to enable GCS
STORAGE_MIGRATION_MODE=dual-write  # 'supabase', 'gcs', or 'dual-write'

# CDN (Optional)
   GCS_CDN_DOMAIN=cdn.renderiq.io
```

## Next Steps

1. ✅ Audit complete
2. ✅ Create GCS service implementation
3. ✅ Set up Google Cloud project and buckets (use `npm run gcs:setup`)
4. ⏳ Configure Cloud CDN (manual step in GCP console)
5. ✅ Implement dual-write mode
6. ✅ Create migration scripts
7. ⏳ Test thoroughly
8. ⏳ Execute migration
9. ⏳ Monitor and verify
10. ⏳ Cleanup Supabase storage

## Quick Start Guide

### 1. Install Dependencies
```bash
npm install @google-cloud/storage
```

### 2. Set Up Google Cloud Project
1. Create a service account in Google Cloud Console
2. Download the service account key JSON file
3. Set `GOOGLE_APPLICATION_CREDENTIALS` environment variable to the path of the key file

### 3. Create Buckets
```bash
npm run gcs:setup
```

This will create:
- `renderiq-renders` (public bucket for generated images)
- `renderiq-uploads` (private bucket for user uploads)
- `renderiq-receipts` (private bucket for PDF receipts)

### 4. Configure Environment Variables
Add to your `.env.local`:
```env
GOOGLE_CLOUD_PROJECT_ID=inheritage-viewer-sdk-v1
GOOGLE_CLOUD_STORAGE_BUCKET_RENDERS=renderiq-renders
GOOGLE_CLOUD_STORAGE_BUCKET_UPLOADS=renderiq-uploads
GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account-key.json
STORAGE_PROVIDER=dual-write  # Start with dual-write mode
```

### 5. Enable Dual-Write Mode
Set `STORAGE_PROVIDER=dual-write` to write to both Supabase and GCS simultaneously.

### 6. Migrate Existing Files
```bash
# Dry run first
tsx scripts/migrate-storage-to-gcs.ts --dry-run

# Actual migration
tsx scripts/migrate-storage-to-gcs.ts --batch-size=100
```

### 7. Update Database URLs
```bash
# Dry run first
tsx scripts/update-storage-urls.ts --dry-run

# Actual update
tsx scripts/update-storage-urls.ts
```

### 8. Switch to GCS-Only Mode
Once migration is complete and verified:
```env
STORAGE_PROVIDER=gcs
```

### 9. Enable Cloud CDN (Optional but Recommended)
1. Go to Google Cloud Console → Cloud CDN
2. Create a backend bucket pointing to `renderiq-renders`
3. Configure cache policies
4. Set up custom domain (optional)
5. Update `GCS_CDN_DOMAIN` environment variable

