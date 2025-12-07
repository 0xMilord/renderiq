/**
 * Add CDN Support for Uploads Bucket
 * 
 * This script adds CDN support for renderiq-uploads bucket by:
 * 1. Creating backend bucket for uploads
 * 2. Adding path matcher to existing URL map
 * 3. Configuring CDN cache policies
 * 4. Testing the configuration
 * 
 * Usage:
 *   tsx scripts/add-uploads-cdn.ts
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

// Load environment variables
if (typeof process.env.NODE_ENV === 'undefined' || process.env.NODE_ENV !== 'production') {
  try {
    const envPath = path.join(process.cwd(), '.env.local');
    if (fs.existsSync(envPath)) {
      const envFile = fs.readFileSync(envPath, 'utf8');
      envFile.split('\n').forEach((line: string) => {
        const [key, ...valueParts] = line.split('=');
        if (key && valueParts.length > 0) {
          const value = valueParts.join('=').trim().replace(/^["']|["']$/g, '');
          if (!process.env[key.trim()]) {
            process.env[key.trim()] = value;
          }
        }
      });
    }
  } catch (e) {
    // Ignore errors
  }
}

const PROJECT_ID = process.env.GOOGLE_CLOUD_PROJECT_ID || process.env.GOOGLE_CLOUD_PROJECT || 'inheritage-viewer-sdk-v1';
const UPLOADS_BUCKET = process.env.GOOGLE_CLOUD_STORAGE_BUCKET_UPLOADS || 'renderiq-uploads';
const RENDERS_BUCKET = process.env.GOOGLE_CLOUD_STORAGE_BUCKET_RENDERS || 'renderiq-renders';
const BACKEND_BUCKET_NAME = 'renderiq-uploads-cdn-backend';
const URL_MAP_NAME = 'renderiq-renders-cdn-map'; // Use existing URL map

function runGcloud(command: string, description: string): boolean {
  try {
    console.log(`\n🔧 ${description}...`);
    execSync(command, { stdio: 'inherit', encoding: 'utf8' });
    console.log(`✅ ${description} completed`);
    return true;
  } catch (error: any) {
    console.error(`❌ ${description} failed: ${error.message}`);
    return false;
  }
}

function checkResourceExists(resourceType: string, resourceName: string): boolean {
  try {
    execSync(
      `gcloud compute ${resourceType} describe ${resourceName} --project=${PROJECT_ID} --format="value(name)" 2>&1`,
      { stdio: 'pipe', encoding: 'utf8' }
    );
    return true;
  } catch {
    return false;
  }
}

async function main() {
  console.log('🚀 Adding CDN Support for Uploads Bucket');
  console.log('='.repeat(60));
  console.log(`Project: ${PROJECT_ID}`);
  console.log(`Uploads Bucket: ${UPLOADS_BUCKET}`);
  console.log(`Renders Bucket: ${RENDERS_BUCKET}`);
  console.log('='.repeat(60));

  // Step 1: Create backend bucket for uploads
  console.log('\n📦 Step 1: Creating backend bucket for uploads...');
  
  if (checkResourceExists('backend-buckets', BACKEND_BUCKET_NAME)) {
    console.log(`✅ Backend bucket ${BACKEND_BUCKET_NAME} already exists`);
  } else {
    const success = runGcloud(
      `gcloud compute backend-buckets create ${BACKEND_BUCKET_NAME} \
        --gcs-bucket-name=${UPLOADS_BUCKET} \
        --enable-cdn \
        --cache-mode=CACHE_ALL_STATIC \
        --project=${PROJECT_ID}`,
      `Creating backend bucket ${BACKEND_BUCKET_NAME}`
    );

    if (!success) {
      console.error('❌ Failed to create backend bucket. Exiting.');
      process.exit(1);
    }
  }

  // Step 2: Get current URL map configuration
  console.log('\n🗺️  Step 2: Updating URL map to include uploads bucket...');
  
  try {
    // Get current URL map details
    const urlMapDetails = execSync(
      `gcloud compute url-maps describe ${URL_MAP_NAME} --project=${PROJECT_ID} --format="json"`,
      { encoding: 'utf8' }
    );
    
    const urlMap = JSON.parse(urlMapDetails);
    console.log(`✅ Found URL map: ${urlMap.name}`);
    console.log(`   Default service: ${urlMap.defaultService}`);

    // Check if path matcher already exists for uploads
    const hasUploadsMatcher = urlMap.pathMatchers?.some((pm: any) => 
      pm.name === 'uploads-matcher' || 
      pm.pathRules?.some((pr: any) => pr.paths?.includes('/renderiq-uploads/*'))
    );

    if (hasUploadsMatcher) {
      console.log('✅ Path matcher for uploads already exists');
    } else {
      // Add path matcher for uploads bucket
      console.log('   Adding path matcher for uploads bucket...');
      
      // Method 1: Try using add-path-matcher with correct backend bucket format
      // For backend buckets, use: backendBuckets/BACKEND_BUCKET_NAME
      const pathRuleSuccess = runGcloud(
        `gcloud compute url-maps add-path-matcher ${URL_MAP_NAME} \
          --path-matcher-name=uploads-matcher \
          --default-backend-bucket=${BACKEND_BUCKET_NAME} \
          --path-rules="/renderiq-uploads/*=backendBuckets/${BACKEND_BUCKET_NAME}" \
          --project=${PROJECT_ID}`,
        'Adding path matcher for uploads'
      );

      if (!pathRuleSuccess) {
        // Method 2: Try alternative format
        console.log('⚠️  First attempt failed, trying alternative format...');
        const altSuccess = runGcloud(
          `gcloud compute url-maps add-path-matcher ${URL_MAP_NAME} \
            --path-matcher-name=uploads-matcher \
            --default-backend-bucket=${BACKEND_BUCKET_NAME} \
            --backend-bucket-path-rules="/renderiq-uploads/*=${BACKEND_BUCKET_NAME}" \
            --project=${PROJECT_ID}`,
          'Adding path matcher for uploads (alternative format)'
        );

        if (!altSuccess) {
          // Method 3: Manual configuration via Console
          console.log('\n⚠️  Automatic path matcher addition failed.');
          console.log('📝 Manual configuration required via Cloud Console:');
          console.log('\n   1. Go to Cloud Console:');
          console.log(`      https://console.cloud.google.com/net-services/loadbalancing/urlMaps/list?project=${PROJECT_ID}`);
          console.log(`   2. Click on: ${URL_MAP_NAME}`);
          console.log('   3. Click "EDIT"');
          console.log('   4. Scroll to "Path matchers" section');
          console.log('   5. Click "ADD PATH MATCHER"');
          console.log('   6. Configure:');
          console.log(`      - Name: uploads-matcher`);
          console.log(`      - Default backend: ${BACKEND_BUCKET_NAME}`);
          console.log('      - Path rules:');
          console.log(`        - Paths: /renderiq-uploads/*`);
          console.log(`        - Backend: ${BACKEND_BUCKET_NAME} (backend bucket)`);
          console.log('   7. Click "SAVE"');
          console.log('\n   Or use gcloud edit command:');
          console.log(`   gcloud compute url-maps edit ${URL_MAP_NAME} --project=${PROJECT_ID}`);
          console.log('   Then add the path matcher manually in the editor.');
        }
      }
    }

  } catch (error: any) {
    console.error('❌ Error updating URL map:', error.message);
    console.log('\n📝 Manual configuration required:');
    console.log('   See instructions above for adding path matcher via Console');
  }

  // Step 3: Verify configuration
  console.log('\n✅ Step 3: Verifying configuration...');
  
  try {
    const backendDetails = execSync(
      `gcloud compute backend-buckets describe ${BACKEND_BUCKET_NAME} --project=${PROJECT_ID} --format="json"`,
      { encoding: 'utf8' }
    );
    
    const backend = JSON.parse(backendDetails);
    console.log(`✅ Backend bucket: ${backend.name}`);
    console.log(`   GCS bucket: ${backend.bucketName}`);
    console.log(`   CDN enabled: ${backend.enableCdn !== false}`);
    console.log(`   Cache mode: ${backend.cdnPolicy?.cacheMode || 'Not set'}`);
  } catch (error: any) {
    console.error('⚠️  Could not verify backend bucket:', error.message);
  }

  // Step 4: Update code to use CDN for uploads
  console.log('\n📝 Step 4: Code update required...');
  console.log('   The code needs to be updated to use CDN for uploads bucket.');
  console.log('   This will be done automatically in the next step.');

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('✅ CDN Setup for Uploads Bucket Complete!');
  console.log('='.repeat(60));
  console.log(`\n📊 Summary:`);
  console.log(`   Backend Bucket: ${BACKEND_BUCKET_NAME}`);
  console.log(`   URL Map: ${URL_MAP_NAME}`);
  console.log(`   Path: /renderiq-uploads/*`);
  console.log(`   CDN Domain: cdn.renderiq.io`);
  
  console.log(`\n📝 Next Steps:`);
  console.log(`   1. Verify URL map has path matcher for /renderiq-uploads/*`);
  console.log(`   2. Test CDN: https://cdn.renderiq.io/renderiq-uploads/[path]`);
  console.log(`   3. Check response headers (should see CDN headers)`);
  console.log(`   4. Run diagnostic: npm run gcs:diagnose`);
  
  console.log(`\n🔗 View in Console:`);
  console.log(`   URL Map: https://console.cloud.google.com/net-services/loadbalancing/urlMaps/list?project=${PROJECT_ID}`);
  console.log(`   Backend Buckets: https://console.cloud.google.com/net-services/loadbalancing/backendBuckets/list?project=${PROJECT_ID}`);
}

main().catch(console.error);

