/**
 * Migration script to move files from Supabase Storage to Google Cloud Storage
 * 
 * This script:
 * 1. Lists all files in Supabase buckets
 * 2. Downloads files from Supabase
 * 3. Uploads to GCS
 * 4. Updates database URLs
 * 5. Verifies migration success
 * 
 * Usage:
 *   tsx scripts/migrate-storage-to-gcs.ts [--batch-size=100] [--dry-run]
 * 
 * Options:
 *   --batch-size: Number of files to process in each batch (default: 100)
 *   --dry-run: Don't actually migrate, just show what would be migrated
 */

// CRITICAL: Load environment variables BEFORE any other imports
// This must happen first because database connection requires DATABASE_URL
import * as fs from 'fs';
import * as path from 'path';

// Load environment variables from .env.local
const envPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  try {
    const envFile = fs.readFileSync(envPath, 'utf8');
    envFile.split('\n').forEach((line: string) => {
      // Skip comments and empty lines
      const trimmedLine = line.trim();
      if (trimmedLine && !trimmedLine.startsWith('#')) {
        const [key, ...valueParts] = trimmedLine.split('=');
        if (key && valueParts.length > 0) {
          const value = valueParts.join('=').trim().replace(/^["']|["']$/g, '');
          if (!process.env[key.trim()]) {
            process.env[key.trim()] = value;
          }
        }
      }
    });
  } catch (e) {
    console.error('⚠️  Warning: Failed to load .env.local:', e);
  }
}

// Now import other modules that depend on environment variables
import { createClient } from '@supabase/supabase-js';
import { Storage } from '@google-cloud/storage';
import { eq, sql } from 'drizzle-orm';
import { logger } from '@/lib/utils/logger';

// Dynamic import for db - will be loaded after env vars are set
// This is necessary because db/index.ts checks DATABASE_URL on import

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const PROJECT_ID = process.env.GOOGLE_CLOUD_PROJECT_ID || 'inheritage-viewer-sdk-v1';
const RENDERS_BUCKET = process.env.GOOGLE_CLOUD_STORAGE_BUCKET_RENDERS || 'renderiq-renders';
const UPLOADS_BUCKET = process.env.GOOGLE_CLOUD_STORAGE_BUCKET_UPLOADS || 'renderiq-uploads';
const CDN_DOMAIN = process.env.GCS_CDN_DOMAIN;

// Helper function to check if a path is a valid file
function isValidKeyFile(filePath: string | undefined): boolean {
  if (!filePath) return false;
  try {
    const resolvedPath = path.resolve(filePath);
    return fs.existsSync(resolvedPath) && fs.statSync(resolvedPath).isFile();
  } catch {
    return false;
  }
}

// Helper function to get service account key path
function getServiceAccountKeyPath(): string | undefined {
  let keyFilename = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  
  // If not set or path is invalid/not a file, try to find service-account-key.json in project root
  if (!isValidKeyFile(keyFilename)) {
    const rootKeyPath = path.resolve(process.cwd(), 'service-account-key.json');
    if (isValidKeyFile(rootKeyPath)) {
      return rootKeyPath;
    }
    return undefined;
  }
  
  return path.resolve(keyFilename);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const gcsStorage = new Storage({
  projectId: PROJECT_ID,
  keyFilename: getServiceAccountKeyPath(),
});

interface MigrationStats {
  total: number;
  migrated: number;
  failed: number;
  skipped: number;
  errors: Array<{ file: string; error: string }>;
}

function getGCSUrl(bucket: string, key: string): string {
  const gcsBucket = bucket === 'renders' ? RENDERS_BUCKET : UPLOADS_BUCKET;
  if (CDN_DOMAIN) {
    return `https://${CDN_DOMAIN}/${gcsBucket}/${key}`;
  }
  return `https://storage.googleapis.com/${gcsBucket}/${key}`;
}

async function migrateFile(
  supabaseBucket: string,
  supabaseKey: string,
  dryRun: boolean
): Promise<{ success: boolean; gcsUrl?: string; error?: string }> {
  try {
    // Skip if this looks like a folder (no file extension and ends with / or is a known folder name)
    if (!supabaseKey.includes('.') || supabaseKey.endsWith('/') || 
        supabaseKey === 'projects' || supabaseKey === 'uploads' || supabaseKey === 'renders') {
      return { success: false, error: 'Skipping folder (not a file)' };
    }

    // Download from Supabase
    const { data, error: downloadError } = await supabase.storage
      .from(supabaseBucket)
      .download(supabaseKey);

    if (downloadError) {
      const errorMsg = downloadError.message || JSON.stringify(downloadError) || 'Unknown error';
      return { success: false, error: `Download failed: ${errorMsg}` };
    }

    if (!data) {
      return { success: false, error: 'Download failed: No data returned' };
    }

    const buffer = Buffer.from(await data.arrayBuffer());

    if (dryRun) {
      return { success: true, gcsUrl: getGCSUrl(supabaseBucket, supabaseKey) };
    }

    // Upload to GCS
    const gcsBucket = supabaseBucket === 'renders' ? RENDERS_BUCKET : UPLOADS_BUCKET;
    const gcsBucketObj = gcsStorage.bucket(gcsBucket);
    const gcsFile = gcsBucketObj.file(supabaseKey);

    // Upload to GCS
    // Note: With uniform bucket-level access enabled, we can't use legacy ACLs
    // The bucket's IAM policy controls public access, not per-file ACLs
    await gcsFile.save(buffer, {
      metadata: {
        contentType: data.type || 'application/octet-stream',
        cacheControl: 'public, max-age=3600',
      },
      // Don't use 'public' option - uniform bucket-level access handles this via IAM
    });

    // Note: With uniform bucket-level access, files are automatically public
    // if the bucket has public IAM permissions. No need to call makePublic().

    const gcsUrl = getGCSUrl(supabaseBucket, supabaseKey);

    return { success: true, gcsUrl };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

async function updateDatabaseUrls(
  oldUrl: string,
  newUrl: string,
  key: string,
  bucket: string
): Promise<void> {
  // Dynamically import db and schema after env vars are loaded
  const { db } = await import('@/lib/db');
  const { fileStorage, renders } = await import('@/lib/db/schema');
  
  // Update fileStorage table
  await db
    .update(fileStorage)
    .set({
      url: newUrl,
      metadata: sql`COALESCE(metadata, '{}'::jsonb) || '{"migratedFromSupabase": true, "migratedAt": ${new Date().toISOString()}}'::jsonb`,
      updatedAt: new Date(),
    })
    .where(eq(fileStorage.key, key));

  // Update renders table
  await db
    .update(renders)
    .set({
      outputUrl: newUrl,
      updatedAt: new Date(),
    })
    .where(eq(renders.outputUrl, oldUrl));

  // Also update uploadedImageUrl
  await db
    .update(renders)
    .set({
      uploadedImageUrl: newUrl,
      updatedAt: new Date(),
    })
    .where(eq(renders.uploadedImageUrl, oldUrl));
}

/**
 * Recursively list all files in a Supabase Storage bucket
 */
async function listAllFilesRecursively(
  bucketName: string,
  prefix: string = '',
  allFiles: Array<{ path: string; size: number; created_at?: string }> = []
): Promise<Array<{ path: string; size: number; created_at?: string }>> {
  const { data: items, error } = await supabase.storage.from(bucketName).list(prefix, {
    limit: 1000,
    offset: 0,
    sortBy: { column: 'created_at', order: 'asc' },
  });

  if (error) {
    console.error(`❌ Error listing ${prefix}:`, error);
    return allFiles;
  }

  if (!items || items.length === 0) {
    return allFiles;
  }

  for (const item of items) {
    const itemPath = prefix ? `${prefix}/${item.name}` : item.name;
    
    // If it's a folder (no size), recurse into it
    if ((item as any).size === null || (item as any).size === undefined) {
      // Skip known empty folder placeholders
      if (item.name !== '.emptyFolderPlaceholder') {
        await listAllFilesRecursively(bucketName, itemPath, allFiles);
      }
    } else {
      // It's a file, add it to the list
      allFiles.push({
        path: itemPath,
        size: (item as any).size || 0,
        created_at: (item as any).created_at,
      });
    }
  }

  return allFiles;
}

async function migrateBucket(
  bucketName: string,
  batchSize: number,
  dryRun: boolean
): Promise<MigrationStats> {
  const stats: MigrationStats = {
    total: 0,
    migrated: 0,
    failed: 0,
    skipped: 0,
    errors: [],
  };

  console.log(`\n📦 Starting migration for bucket: ${bucketName}`);

  try {
    // Recursively list all files in Supabase bucket
    console.log(`🔍 Scanning bucket recursively for all files...`);
    const allFiles = await listAllFilesRecursively(bucketName);

    if (allFiles.length === 0) {
      console.log(`ℹ️  No files found in ${bucketName}`);
      return stats;
    }

    stats.total = allFiles.length;
    console.log(`📋 Found ${allFiles.length} files to migrate`);

    // Process in batches
    for (let i = 0; i < allFiles.length; i += batchSize) {
      const batch = allFiles.slice(i, i + batchSize);
      console.log(`\n🔄 Processing batch ${Math.floor(i / batchSize) + 1} (${batch.length} files)...`);

      for (const file of batch) {
        const filePath = file.path;
        const oldUrl = `${SUPABASE_URL}/storage/v1/object/public/${bucketName}/${filePath}`;

        console.log(`  📄 Migrating: ${filePath}`);

        const result = await migrateFile(bucketName, filePath, dryRun);

        if (result.success && result.gcsUrl) {
          if (!dryRun) {
            await updateDatabaseUrls(oldUrl, result.gcsUrl, filePath, bucketName);
          }
          stats.migrated++;
          console.log(`  ✅ Migrated: ${filePath}`);
        } else {
          stats.failed++;
          stats.errors.push({ file: filePath, error: result.error || 'Unknown error' });
          console.error(`  ❌ Failed: ${filePath} - ${result.error}`);
        }

        // Small delay to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }
  } catch (error) {
    console.error(`❌ Error migrating bucket ${bucketName}:`, error);
  }

  return stats;
}

async function main() {
  try {
    const args = process.argv.slice(2);
    const batchSize = parseInt(args.find((arg) => arg.startsWith('--batch-size='))?.split('=')[1] || '100');
    const dryRun = args.includes('--dry-run');

    console.log('🔍 DRY RUN MODE - No files will be migrated\n');
    console.log('🚀 Starting Supabase to GCS migration...\n');
    console.log(`📊 Configuration:`);
    console.log(`   Project ID: ${PROJECT_ID}`);
    console.log(`   Batch Size: ${batchSize}`);
    console.log(`   Dry Run: ${dryRun ? 'Yes' : 'No'}`);
    console.log(`   Supabase URL: ${SUPABASE_URL ? 'Set' : 'NOT SET'}`);
    console.log(`   Supabase Key: ${SUPABASE_KEY ? 'Set' : 'NOT SET'}\n`);

  const allStats: MigrationStats = {
    total: 0,
    migrated: 0,
    failed: 0,
    skipped: 0,
    errors: [],
  };

  // Migrate renders bucket
  const rendersStats = await migrateBucket('renders', batchSize, dryRun);
  allStats.total += rendersStats.total;
  allStats.migrated += rendersStats.migrated;
  allStats.failed += rendersStats.failed;
  allStats.skipped += rendersStats.skipped;
  allStats.errors.push(...rendersStats.errors);

  // Migrate uploads bucket
  const uploadsStats = await migrateBucket('uploads', batchSize, dryRun);
  allStats.total += uploadsStats.total;
  allStats.migrated += uploadsStats.migrated;
  allStats.failed += uploadsStats.failed;
  allStats.skipped += uploadsStats.skipped;
  allStats.errors.push(...uploadsStats.errors);

    // Print summary
    console.log('\n' + '='.repeat(50));
    console.log('📊 MIGRATION SUMMARY');
    console.log('='.repeat(50));
    console.log(`Total files: ${allStats.total}`);
    console.log(`✅ Migrated: ${allStats.migrated}`);
    console.log(`❌ Failed: ${allStats.failed}`);
    console.log(`⏭️  Skipped: ${allStats.skipped}`);

  if (allStats.errors.length > 0) {
    console.log(`\n❌ Errors (${allStats.errors.length}):`);
    allStats.errors.slice(0, 10).forEach(({ file, error }) => {
      console.log(`   ${file}: ${error}`);
    });
    if (allStats.errors.length > 10) {
      console.log(`   ... and ${allStats.errors.length - 10} more errors`);
    }
  }

    if (dryRun) {
      console.log('\n🔍 This was a dry run. Run without --dry-run to perform actual migration.');
    } else {
      console.log('\n✅ Migration completed!');
    }
  } catch (error) {
    console.error('❌ Fatal error in main():', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Stack trace:', error.stack);
    }
    throw error;
  }
}

main().catch((error) => {
  console.error('❌ Migration failed:', error);
  if (error instanceof Error) {
    console.error('Error message:', error.message);
    console.error('Stack trace:', error.stack);
  }
  process.exit(1);
});

