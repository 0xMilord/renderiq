/**
 * Reset and Recreate CDN Infrastructure
 * 
 * Deletes all existing CDN infrastructure and recreates it properly
 * with URL rewrites to handle path routing correctly.
 * 
 * Bucket structure:
 * - Files stored at: projects/... (no bucket name prefix)
 * - CDN URLs: /uploads/projects/... and /renders/projects/...
 * - URL rewrite strips /uploads/ and /renders/ prefixes
 * 
 * Usage:
 *   tsx scripts/reset-cdn-infrastructure.ts
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
const UPLOADS_BUCKET = process.env.GOOGLE_CLOUD_STORAGE_BUCKET_UPLOADS || 'renderiq-uploads';
const CDN_DOMAIN = process.env.GCS_CDN_DOMAIN || 'cdn.renderiq.io';

// Resource names
const RENDERS_BACKEND_BUCKET = `${RENDERS_BUCKET}-cdn-backend`;
const UPLOADS_BACKEND_BUCKET = `${UPLOADS_BUCKET}-cdn-backend`;
const URL_MAP_NAME = 'renderiq-cdn-map';
const SSL_CERT_NAME = 'renderiq-cdn-ssl-cert';
const HTTPS_PROXY_NAME = 'renderiq-cdn-https-proxy';
const FORWARDING_RULE_NAME = 'renderiq-cdn-rule';

function runGcloud(command: string, description: string, ignoreErrors = false): { success: boolean; output?: string; error?: string } {
  try {
    console.log(`🔧 ${description}...`);
    const output = execSync(command, { 
      encoding: 'utf8',
      stdio: 'pipe',
      env: { ...process.env, CLOUDSDK_CORE_PROJECT: PROJECT_ID }
    });
    console.log(`✅ ${description} completed`);
    return { success: true, output: output.toString() };
  } catch (error: any) {
    const errorMessage = error.stderr?.toString() || error.message || 'Unknown error';
    if (ignoreErrors) {
      console.log(`⚠️  ${description} failed (ignored): ${errorMessage.substring(0, 200)}`);
      return { success: false, error: errorMessage };
    }
    console.log(`❌ ${description} failed: ${errorMessage.substring(0, 200)}`);
    return { success: false, error: errorMessage };
  }
}

async function deleteExistingInfrastructure() {
  console.log('\n🗑️  Step 1: Deleting existing CDN infrastructure...');
  console.log('='.repeat(60));

  // Delete in reverse order of creation
  const resources = [
    { name: FORWARDING_RULE_NAME, type: 'forwarding-rules', description: 'Forwarding rule' },
    { name: HTTPS_PROXY_NAME, type: 'target-https-proxies', description: 'HTTPS proxy' },
    { name: URL_MAP_NAME, type: 'url-maps', description: 'URL map' },
    { name: SSL_CERT_NAME, type: 'ssl-certificates', description: 'SSL certificate' },
    { name: RENDERS_BACKEND_BUCKET, type: 'backend-buckets', description: 'Renders backend bucket' },
    { name: UPLOADS_BACKEND_BUCKET, type: 'backend-buckets', description: 'Uploads backend bucket' },
  ];

  for (const resource of resources) {
    runGcloud(
      `gcloud compute ${resource.type} describe ${resource.name} --project=${PROJECT_ID} --format="get(name)" 2>&1`,
      `Checking if ${resource.description} exists`,
      true
    );

    runGcloud(
      `gcloud compute ${resource.type} delete ${resource.name} --project=${PROJECT_ID} --quiet 2>&1`,
      `Deleting ${resource.description}`,
      true
    );
  }

  console.log('✅ Infrastructure deletion completed (errors ignored if resources don\'t exist)');
}

async function createBackendBuckets() {
  console.log('\n📦 Step 2: Creating backend buckets...');
  console.log('='.repeat(60));

  // Create renders backend bucket
  runGcloud(
    `gcloud compute backend-buckets create ${RENDERS_BACKEND_BUCKET} \
      --gcs-bucket-name=${RENDERS_BUCKET} \
      --enable-cdn \
      --cache-mode=CACHE_ALL_STATIC \
      --project=${PROJECT_ID}`,
    `Creating ${RENDERS_BACKEND_BUCKET}`
  );

  // Create uploads backend bucket
  runGcloud(
    `gcloud compute backend-buckets create ${UPLOADS_BACKEND_BUCKET} \
      --gcs-bucket-name=${UPLOADS_BUCKET} \
      --enable-cdn \
      --cache-mode=CACHE_ALL_STATIC \
      --project=${PROJECT_ID}`,
    `Creating ${UPLOADS_BACKEND_BUCKET}`
  );
}

async function createURLMap() {
  console.log('\n🗺️  Step 3: Creating URL map with proper path routing...');
  console.log('='.repeat(60));

  // Create basic URL map (URL rewrites must be configured via Cloud Console)
  runGcloud(
    `gcloud compute url-maps create ${URL_MAP_NAME} \
      --default-backend-bucket=${RENDERS_BACKEND_BUCKET} \
      --project=${PROJECT_ID}`,
    'Creating URL map'
  );

  // Add path rules for uploads and renders
  // Note: URL rewrites must be configured via Cloud Console as gcloud CLI doesn't support them for backend buckets
  runGcloud(
    `gcloud compute url-maps add-path-matcher ${URL_MAP_NAME} \
      --path-matcher-name=cdn-matcher \
      --default-backend-bucket=${RENDERS_BACKEND_BUCKET} \
      --path-rules="/uploads/*=backendBuckets/${UPLOADS_BACKEND_BUCKET,/renders/*=backendBuckets/${RENDERS_BACKEND_BUCKET}" \
      --project=${PROJECT_ID}`,
    'Adding path matcher with uploads and renders rules',
    true
  );

  console.log('\n📝 IMPORTANT: URL rewrites must be configured manually via Cloud Console');
  console.log('   Backend buckets don\'t support URL rewrites via gcloud CLI.');
  console.log('\n   Steps to configure URL rewrites:');
  console.log('   1. Go to: https://console.cloud.google.com/net-services/loadbalancing/urlMaps/list');
  console.log(`   2. Click on: ${URL_MAP_NAME}`);
  console.log('   3. Click "EDIT"');
  console.log('   4. Under "Host and path rules", click "Advanced host and path rule (URL redirect, URL rewrite)"');
  console.log('   5. For each path rule:');
  console.log('      a. Click the pencil icon to edit');
  console.log('      b. Under "Action", select "Route traffic to a single backend"');
  console.log('      c. Select the appropriate backend bucket');
  console.log('      d. Click "Add-on action (URL rewrite)"');
  console.log('      e. Set "Path prefix rewrite" to "/" (this strips /uploads/ or /renders/)');
  console.log('   6. Configure these path rules:');
  console.log(`      - Path: /uploads/* → Backend: ${UPLOADS_BACKEND_BUCKET} → Rewrite: /`);
  console.log(`      - Path: /renders/* → Backend: ${RENDERS_BACKEND_BUCKET} → Rewrite: /`);
  console.log('   7. Click "Save" and "Update"');
}

async function createSSLCertificate() {
  console.log('\n🔒 Step 4: Creating SSL certificate...');
  console.log('='.repeat(60));

  runGcloud(
    `gcloud compute ssl-certificates create ${SSL_CERT_NAME} \
      --domains=${CDN_DOMAIN} \
      --project=${PROJECT_ID}`,
    'Creating SSL certificate'
  );

  console.log('⏳ SSL certificate provisioning can take 10-60 minutes.');
  console.log('   Check status: gcloud compute ssl-certificates describe ' + SSL_CERT_NAME);
}

async function createTargetProxy() {
  console.log('\n🔗 Step 5: Creating HTTPS target proxy...');
  console.log('='.repeat(60));

  runGcloud(
    `gcloud compute target-https-proxies create ${HTTPS_PROXY_NAME} \
      --url-map=${URL_MAP_NAME} \
      --ssl-certificates=${SSL_CERT_NAME} \
      --project=${PROJECT_ID}`,
    'Creating HTTPS target proxy'
  );
}

async function createForwardingRule() {
  console.log('\n🌐 Step 6: Creating forwarding rule...');
  console.log('='.repeat(60));

  const result = runGcloud(
    `gcloud compute forwarding-rules create ${FORWARDING_RULE_NAME} \
      --target-https-proxy=${HTTPS_PROXY_NAME} \
      --ports=443 \
      --network-tier=PREMIUM \
      --global \
      --project=${PROJECT_ID}`,
    'Creating forwarding rule'
  );

  if (result.success && result.output) {
    // Extract IP address from output
    const ipMatch = result.output.match(/IP_ADDRESS:\s*([0-9.]+)/);
    if (ipMatch) {
      const ipAddress = ipMatch[1];
      console.log(`\n✅ Load Balancer IP: ${ipAddress}`);
      console.log(`\n📋 DNS Configuration:`);
      console.log(`   Add A record: ${CDN_DOMAIN} -> ${ipAddress}`);
    }
  }
}

async function updateCode() {
  console.log('\n📝 Step 7: Updating code to use new URL structure...');
  console.log('='.repeat(60));

  // Update gcs-storage.ts to use /uploads/ and /renders/ instead of /renderiq-uploads/ and /renderiq-renders/
  const gcsStoragePath = path.join(process.cwd(), 'lib/services/gcs-storage.ts');
  if (fs.existsSync(gcsStoragePath)) {
    let content = fs.readFileSync(gcsStoragePath, 'utf8');
    
    // Update getPublicUrl method
    const oldPattern = /private static getPublicUrl\(bucketName: string, filePath: string\): string \{[\s\S]*?\n  \}/;
    const newMethod = `  private static getPublicUrl(bucketName: string, filePath: string): string {
    const bucket = bucketName === 'renders' ? RENDERS_BUCKET : UPLOADS_BUCKET;
    
    // Use CDN with simplified paths: /uploads/* and /renders/*
    // URL rewrite in load balancer strips the prefix, so backend bucket receives just the filePath
    if (CDN_DOMAIN) {
      const pathPrefix = bucketName === 'renders' ? 'renders' : 'uploads';
      return \`https://\${CDN_DOMAIN}/\${pathPrefix}/\${filePath}\`;
    }
    
    // Use standard GCS public URL when CDN not configured
    return \`https://storage.googleapis.com/\${bucket}/\${filePath}\`;
  }`;

    if (oldPattern.test(content)) {
      content = content.replace(oldPattern, newMethod);
      fs.writeFileSync(gcsStoragePath, content);
      console.log('✅ Updated lib/services/gcs-storage.ts');
    } else {
      console.log('⚠️  Could not find getPublicUrl method to update');
    }
  }
}

async function main() {
  console.log('🚀 Resetting and Recreating CDN Infrastructure');
  console.log('='.repeat(60));
  console.log(`Project: ${PROJECT_ID}`);
  console.log(`Renders Bucket: ${RENDERS_BUCKET}`);
  console.log(`Uploads Bucket: ${UPLOADS_BUCKET}`);
  console.log(`CDN Domain: ${CDN_DOMAIN}`);
  console.log('='.repeat(60));

  try {
    // Step 1: Delete existing infrastructure
    await deleteExistingInfrastructure();

    // Step 2: Create backend buckets
    await createBackendBuckets();

    // Step 3: Create URL map
    await createURLMap();

    // Step 4: Create SSL certificate
    await createSSLCertificate();

    // Step 5: Create target proxy
    await createTargetProxy();

    // Step 6: Create forwarding rule
    await createForwardingRule();

    // Step 7: Update code
    await updateCode();

    console.log('\n✅ CDN Infrastructure Creation Complete!');
    console.log('='.repeat(60));
    console.log('\n📋 Summary of what was created:');
    console.log(`   ✅ Backend Buckets: ${RENDERS_BACKEND_BUCKET}, ${UPLOADS_BACKEND_BUCKET}`);
    console.log(`   ✅ URL Map: ${URL_MAP_NAME}`);
    console.log(`   ✅ SSL Certificate: ${SSL_CERT_NAME}`);
    console.log(`   ✅ HTTPS Proxy: ${HTTPS_PROXY_NAME}`);
    console.log(`   ✅ Forwarding Rule: ${FORWARDING_RULE_NAME}`);
    console.log('\n📋 Next Steps (REQUIRED):');
    console.log('1. ⚠️  Configure URL rewrites in Cloud Console (see instructions above)');
    console.log('2. ⏳ Wait for SSL certificate to provision (10-60 minutes)');
    console.log('3. 🌐 Configure DNS: Add A record for ' + CDN_DOMAIN + ' pointing to Load Balancer IP');
    console.log('4. 🧪 Test CDN URLs after DNS propagates:');
    console.log('   - https://' + CDN_DOMAIN + '/renders/projects/...');
    console.log('   - https://' + CDN_DOMAIN + '/uploads/projects/...');
    console.log('\n💡 How URL rewrites work:');
    console.log('   - Request: https://cdn.renderiq.io/uploads/projects/file.jpg');
    console.log('   - URL rewrite strips /uploads/ → Backend receives: /projects/file.jpg');
    console.log('   - Backend bucket looks for: projects/file.jpg ✅');
    console.log('   - Same for /renders/ → strips to /projects/file.jpg');

  } catch (error) {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  }
}

main().catch(console.error);

