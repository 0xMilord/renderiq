#!/usr/bin/env node

/**
 * Setup Supabase Storage Buckets
 * 
 * This script creates the necessary storage buckets and policies for the application.
 * Run this after setting up your Supabase project.
 * 
 * Usage:
 * 1. Set your environment variables:
 *    - NEXT_PUBLIC_SUPABASE_URL
 *    - SUPABASE_SERVICE_ROLE_KEY
 * 
 * 2. Run the script:
 *    node scripts/setup-storage.js
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   - NEXT_PUBLIC_SUPABASE_URL');
  console.error('   - SUPABASE_SERVICE_ROLE_KEY');
  console.error('\nMake sure these are set in your .env.local file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function setupStorage() {
  console.log('🚀 Setting up Supabase Storage...\n');

  try {
    // Check if buckets already exist
    const { data: existingBuckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('❌ Failed to list existing buckets:', listError.message);
      return;
    }

    const bucketNames = existingBuckets.map(bucket => bucket.name);
    console.log('📋 Existing buckets:', bucketNames);

    // Create renders bucket
    if (!bucketNames.includes('renders')) {
      console.log('📦 Creating renders bucket...');
      const { data: rendersBucket, error: rendersError } = await supabase.storage.createBucket('renders', {
        public: true,
        fileSizeLimit: 52428800, // 50MB
        allowedMimeTypes: ['image/png', 'image/jpeg', 'image/webp', 'video/mp4']
      });

      if (rendersError) {
        console.error('❌ Failed to create renders bucket:', rendersError.message);
      } else {
        console.log('✅ Renders bucket created successfully');
      }
    } else {
      console.log('✅ Renders bucket already exists');
    }

    // Create uploads bucket
    if (!bucketNames.includes('uploads')) {
      console.log('📦 Creating uploads bucket...');
      const { data: uploadsBucket, error: uploadsError } = await supabase.storage.createBucket('uploads', {
        public: false,
        fileSizeLimit: 104857600, // 100MB
        allowedMimeTypes: ['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'application/pdf']
      });

      if (uploadsError) {
        console.error('❌ Failed to create uploads bucket:', uploadsError.message);
      } else {
        console.log('✅ Uploads bucket created successfully');
      }
    } else {
      console.log('✅ Uploads bucket already exists');
    }

    console.log('\n🔐 Setting up storage policies...');

    // Note: Storage policies need to be created via SQL in the Supabase dashboard
    // or through the Supabase CLI, as they require special permissions
    console.log('⚠️  Storage policies need to be created manually:');
    console.log('   1. Go to your Supabase dashboard');
    console.log('   2. Navigate to Storage > Policies');
    console.log('   3. Run the SQL from drizzle/0004_create_storage_buckets.sql');
    console.log('   4. Or use the Supabase CLI: supabase db reset');

    console.log('\n✅ Storage setup completed!');
    console.log('\nNext steps:');
    console.log('1. Create storage policies using the SQL migration');
    console.log('2. Test image generation in your app');

  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    process.exit(1);
  }
}

// Run the setup
setupStorage();
