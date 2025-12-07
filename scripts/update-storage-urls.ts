/**
 * Script to update database URLs from Supabase to GCS format
 * 
 * This script updates URLs in the database without migrating files.
 * Use this if files have already been migrated to GCS.
 * 
 * Usage:
 *   tsx scripts/update-storage-urls.ts [--dry-run]
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
// Note: db and schema will be dynamically imported in functions to ensure env vars are loaded first
import { sql, like } from 'drizzle-orm';
import { logger } from '@/lib/utils/logger';
import { transformSupabaseToGCS } from '@/lib/utils/storage-url';

const CDN_DOMAIN = process.env.GCS_CDN_DOMAIN;

async function updateFileStorageUrls(dryRun: boolean) {
  // Dynamically import db and schema after env vars are loaded
  const { db } = await import('@/lib/db');
  const { fileStorage } = await import('@/lib/db/schema');
  
  logger.log('🔄 Updating fileStorage table URLs...');

  const files = await db.select().from(fileStorage).where(
    like(fileStorage.url, '%supabase.co/storage%')
  );

  logger.log(`📋 Found ${files.length} files with Supabase URLs`);

  let updated = 0;
  for (const file of files) {
    try {
      const newUrl = transformSupabaseToGCS(file.url, CDN_DOMAIN);

      if (dryRun) {
        logger.log(`  Would update: ${file.url} → ${newUrl}`);
      } else {
        await db
          .update(fileStorage)
          .set({
            url: newUrl,
            metadata: sql`COALESCE(metadata, '{}'::jsonb) || '{"urlUpdatedAt": ${new Date().toISOString()}}'::jsonb`,
            updatedAt: new Date(),
          })
          .where(sql`${fileStorage.id} = ${file.id}`);

        logger.log(`  ✅ Updated: ${file.fileName}`);
      }
      updated++;
    } catch (error) {
      logger.error(`  ❌ Failed to update ${file.fileName}:`, error);
    }
  }

  return updated;
}

async function updateRendersUrls(dryRun: boolean) {
  // Dynamically import db and schema after env vars are loaded
  const { db } = await import('@/lib/db');
  const { renders } = await import('@/lib/db/schema');
  
  logger.log('\n🔄 Updating renders table URLs...');

  const rendersWithSupabase = await db.select().from(renders).where(
    sql`${renders.outputUrl} LIKE '%supabase.co/storage%' OR ${renders.uploadedImageUrl} LIKE '%supabase.co/storage%'`
  );

  logger.log(`📋 Found ${rendersWithSupabase.length} renders with Supabase URLs`);

  let updated = 0;
  for (const render of rendersWithSupabase) {
    try {
      const updates: any = { updatedAt: new Date() };

      if (render.outputUrl?.includes('supabase.co')) {
        updates.outputUrl = transformSupabaseToGCS(render.outputUrl, CDN_DOMAIN);
      }

      if (render.uploadedImageUrl?.includes('supabase.co')) {
        updates.uploadedImageUrl = transformSupabaseToGCS(render.uploadedImageUrl, CDN_DOMAIN);
      }

      if (dryRun) {
        logger.log(`  Would update render ${render.id}`);
      } else {
        await db.update(renders).set(updates).where(sql`${renders.id} = ${render.id}`);
        logger.log(`  ✅ Updated render ${render.id}`);
      }
      updated++;
    } catch (error) {
      logger.error(`  ❌ Failed to update render ${render.id}:`, error);
    }
  }

  return updated;
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');

  if (dryRun) {
    logger.log('🔍 DRY RUN MODE - No URLs will be updated\n');
  }

  logger.log('🚀 Starting URL update...\n');

  const fileStorageUpdated = await updateFileStorageUrls(dryRun);
  const rendersUpdated = await updateRendersUrls(dryRun);

  logger.log('\n' + '='.repeat(50));
  logger.log('📊 UPDATE SUMMARY');
  logger.log('='.repeat(50));
  logger.log(`fileStorage records updated: ${fileStorageUpdated}`);
  logger.log(`renders records updated: ${rendersUpdated}`);

  if (dryRun) {
    logger.log('\n🔍 This was a dry run. Run without --dry-run to perform actual updates.');
  } else {
    logger.log('\n✅ URL update completed!');
  }
}

main().catch((error) => {
  logger.error('❌ URL update failed:', error);
  process.exit(1);
});

