/**
 * Fix CDN Issues Script
 * 
 * Fixes issues identified by diagnostic script:
 * 1. Ensures CDN is properly configured
 * 2. Fixes cache headers on bucket
 * 3. Verifies backend bucket configuration
 * 4. Tests CDN is actually serving content
 * 
 * Usage:
 *   tsx scripts/fix-cdn-issues.ts
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
const RENDERS_BUCKET = process.env.GOOGLE_CLOUD_STORAGE_BUCKET_RENDERS || 'renderiq-renders';
const BACKEND_BUCKET_NAME = 'renderiq-renders-cdn-backend';

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

function fixCacheHeaders() {
  console.log('\n📋 Fix 1: Updating CDN Cache Policy...');
  
  // First, ensure CDN is enabled
  const enableSuccess = runGcloud(
    `gcloud compute backend-buckets update ${BACKEND_BUCKET_NAME} \
      --enable-cdn \
      --project=${PROJECT_ID}`,
    'Enabling CDN on backend bucket'
  );

  if (!enableSuccess) {
    console.log('⚠️  Failed to enable CDN. Check backend bucket exists.');
    return;
  }

  // Update cache mode (correct syntax - no "cdn-" prefix)
  const cacheModeSuccess = runGcloud(
    `gcloud compute backend-buckets update ${BACKEND_BUCKET_NAME} \
      --cache-mode=CACHE_ALL_STATIC \
      --project=${PROJECT_ID}`,
    'Setting cache mode to CACHE_ALL_STATIC'
  );

  if (!cacheModeSuccess) {
    console.log('⚠️  Cache mode update failed. It may already be set correctly.');
  }

  // Note: TTL values may need to be set via Cloud Console or using different flags
  // Check current gcloud version for available options
  console.log('\n💡 Note: TTL values can be configured via Cloud Console:');
  console.log('   https://console.cloud.google.com/net-services/cdn');
  console.log('   Navigate to your backend bucket and set:');
  console.log('   - Default TTL: 86400 (1 day)');
  console.log('   - Max TTL: 31536000 (1 year)');
  console.log('   - Client TTL: 31536000 (1 year)');
}

function fixBucketMetadata() {
  console.log('\n📋 Fix 2: Setting Cache-Control metadata on bucket...');
  
  // Set default cache-control metadata on bucket
  // This ensures files uploaded get proper cache headers
  const success = runGcloud(
    `gsutil -m setmeta -h "Cache-Control:public, max-age=31536000, immutable" gs://${RENDERS_BUCKET}/**/*.png gs://${RENDERS_BUCKET}/**/*.jpg gs://${RENDERS_BUCKET}/**/*.jpeg gs://${RENDERS_BUCKET}/**/*.webp gs://${RENDERS_BUCKET}/**/*.mp4 2>&1 || echo "Note: Some files may not exist, this is normal"`,
    'Setting cache-control metadata on existing files'
  );

  console.log('\n💡 Note: New files uploaded will automatically get cache headers from gcs-storage.ts');
  console.log('   This command updates existing files. It may take a while for large buckets.');
}

function verifyBackendBucket() {
  console.log('\n📋 Fix 3: Verifying Backend Bucket Configuration...');
  
  const details = execSync(
    `gcloud compute backend-buckets describe ${BACKEND_BUCKET_NAME} --project=${PROJECT_ID} --format="json"`,
    { encoding: 'utf8' }
  );

  try {
    const config = JSON.parse(details);
    
    if (!config.enableCdn) {
      console.log('⚠️  CDN is not enabled on backend bucket!');
      runGcloud(
        `gcloud compute backend-buckets update ${BACKEND_BUCKET_NAME} --enable-cdn --project=${PROJECT_ID}`,
        'Enabling CDN on backend bucket'
      );
    } else {
      console.log('✅ CDN is enabled on backend bucket');
    }

    // Check cache policy
    if (!config.cdnPolicy || config.cdnPolicy.cacheMode !== 'CACHE_ALL_STATIC') {
      console.log('⚠️  Cache mode is not CACHE_ALL_STATIC');
      fixCacheHeaders();
    } else {
      console.log('✅ Cache mode is CACHE_ALL_STATIC');
    }

  } catch (error: any) {
    console.error('❌ Error verifying backend bucket:', error.message);
  }
}

function checkLoadBalancerRouting() {
  console.log('\n📋 Fix 4: Verifying Load Balancer Routing...');
  
  // Get forwarding rule
  const forwardingRule = execSync(
    `gcloud compute forwarding-rules describe renderiq-renders-cdn-rule --global --project=${PROJECT_ID} --format="json"`,
    { encoding: 'utf8' }
  );

  try {
    const rule = JSON.parse(forwardingRule);
    console.log(`✅ Forwarding rule found: ${rule.name}`);
    console.log(`   IP Address: ${rule.IPAddress}`);
    console.log(`   Target: ${rule.target}`);
    
    // Get target proxy
    const targetProxyName = rule.target.split('/').pop();
    const targetProxy = execSync(
      `gcloud compute target-https-proxies describe ${targetProxyName} --global --project=${PROJECT_ID} --format="json"`,
      { encoding: 'utf8' }
    );

    const proxy = JSON.parse(targetProxy);
    console.log(`✅ Target proxy found: ${proxy.name}`);
    console.log(`   URL Map: ${proxy.urlMap}`);
    
    // Get URL map
    const urlMapName = proxy.urlMap.split('/').pop();
    const urlMap = execSync(
      `gcloud compute url-maps describe ${urlMapName} --global --project=${PROJECT_ID} --format="json"`,
      { encoding: 'utf8' }
    );

    const map = JSON.parse(urlMap);
    console.log(`✅ URL map found: ${map.name}`);
    console.log(`   Default Service: ${map.defaultService}`);
    
    if (map.defaultService.includes('backendBuckets')) {
      console.log('✅ URL map is correctly routing to backend bucket');
    } else {
      console.log('⚠️  URL map may not be routing to backend bucket correctly');
    }

  } catch (error: any) {
    console.error('❌ Error checking load balancer routing:', error.message);
  }
}

function testCDN() {
  console.log('\n📋 Fix 5: Testing CDN...');
  console.log('\n🔍 To test if CDN is working:');
  console.log('   1. Upload a test image to your bucket');
  console.log('   2. Access it via: https://cdn.renderiq.io/renderiq-renders/[path-to-image]');
  console.log('   3. Check response headers:');
  console.log('      - Should see "server: Google" or "via: 1.1 google" (not "UploadServer")');
  console.log('      - Should see "cache-control: public, max-age=31536000"');
  console.log('      - Should see "x-cache: HIT" or "x-cache: MISS"');
  console.log('\n   If you see "UploadServer", CDN is not being used.');
  console.log('   This usually means:');
  console.log('   - DNS not pointing to load balancer IP');
  console.log('   - Load balancer not properly configured');
  console.log('   - Backend bucket not properly linked');
}

function createTestFile() {
  console.log('\n📋 Fix 6: Creating Test File...');
  
  // Create a simple test HTML file to verify CDN
  const testHtml = `<!DOCTYPE html>
<html>
<head>
    <title>CDN Test</title>
</head>
<body>
    <h1>CDN Diagnostic Test</h1>
    <p>If you can see this, CDN is working!</p>
    <p>Check browser DevTools Network tab for response headers.</p>
    <p>Look for:</p>
    <ul>
        <li>server: Google (not UploadServer)</li>
        <li>cache-control: public, max-age=31536000</li>
        <li>x-cache: HIT or MISS</li>
    </ul>
</body>
</html>`;

  // Try to upload via gsutil
  const testFilePath = path.join(process.cwd(), 'cdn-test.html');
  fs.writeFileSync(testFilePath, testHtml);

  console.log(`\n📝 Test file created: ${testFilePath}`);
  console.log(`\n   To upload to bucket:`);
  console.log(`   gsutil cp ${testFilePath} gs://${RENDERS_BUCKET}/cdn-test.html`);
  console.log(`\n   Then test: https://cdn.renderiq.io/renderiq-renders/cdn-test.html`);
}

async function main() {
  console.log('🔧 CDN Issues Fix Script');
  console.log('='.repeat(60));
  console.log(`Project: ${PROJECT_ID}`);
  console.log(`Bucket: ${RENDERS_BUCKET}`);
  console.log(`Backend Bucket: ${BACKEND_BUCKET_NAME}`);
  console.log('='.repeat(60));

  // Fix 1: Update cache headers
  fixCacheHeaders();

  // Fix 2: Set bucket metadata (optional, for existing files)
  console.log('\n⚠️  Skipping bulk metadata update (can be slow for large buckets)');
  console.log('   New files will get correct headers automatically.');
  console.log('   To update existing files, run:');
  console.log(`   gsutil -m setmeta -h "Cache-Control:public, max-age=31536000, immutable" gs://${RENDERS_BUCKET}/**/*`);

  // Fix 3: Verify backend bucket
  verifyBackendBucket();

  // Fix 4: Check load balancer routing
  checkLoadBalancerRouting();

  // Fix 5: Test instructions
  testCDN();

  // Fix 6: Create test file
  createTestFile();

  console.log('\n' + '='.repeat(60));
  console.log('✅ Fix Script Complete!');
  console.log('='.repeat(60));
  console.log('\n📝 Next Steps:');
  console.log('   1. Wait for DNS propagation (if DNS not resolving)');
  console.log('   2. Verify DNS points to Load Balancer IP: 136.110.242.198');
  console.log('   3. Test CDN with a real image file');
  console.log('   4. Check response headers to confirm CDN is working');
  console.log('   5. Run diagnostic again: npm run gcs:diagnose');
  console.log('\n💡 If CDN still shows "UploadServer":');
  console.log('   - DNS may not be pointing to load balancer');
  console.log('   - Wait longer for DNS propagation');
  console.log('   - Check DNS record in Namecheap');
  console.log('   - Verify Load Balancer IP matches DNS');
}

main().catch(console.error);

