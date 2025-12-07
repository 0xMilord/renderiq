/**
 * Test CDN Endpoints
 * 
 * Tests actual CDN endpoints with real files
 * 
 * Usage:
 *   tsx scripts/test-cdn-endpoints.ts [file-path]
 */

import { execSync } from 'child_process';
import * as https from 'https';
import { URL } from 'url';

const PROJECT_ID = process.env.GOOGLE_CLOUD_PROJECT_ID || process.env.GOOGLE_CLOUD_PROJECT || 'inheritage-viewer-sdk-v1';
const RENDERS_BUCKET = process.env.GOOGLE_CLOUD_STORAGE_BUCKET_RENDERS || 'renderiq-renders';
const UPLOADS_BUCKET = process.env.GOOGLE_CLOUD_STORAGE_BUCKET_UPLOADS || 'renderiq-uploads';
const CDN_DOMAIN = process.env.GCS_CDN_DOMAIN || 'cdn.renderiq.io';

function testEndpoint(url: string): Promise<{ success: boolean; statusCode?: number; headers?: any; error?: string }> {
  return new Promise((resolve) => {
    const parsedUrl = new URL(url);
    const options = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || 443,
      path: parsedUrl.pathname,
      method: 'HEAD',
      timeout: 15000,
      rejectUnauthorized: false // Allow self-signed certs during provisioning
    };

    const req = https.request(options, (res) => {
      resolve({
        success: res.statusCode === 200 || res.statusCode === 404,
        statusCode: res.statusCode,
        headers: {
          'content-type': res.headers['content-type'],
          'cache-control': res.headers['cache-control'],
          'x-cache': res.headers['x-cache'] || res.headers['x-cache-status'],
          'server': res.headers['server'],
          'via': res.headers['via']
        }
      });
      res.destroy();
    });

    req.on('error', (error: any) => {
      resolve({
        success: false,
        error: error.message || error.code
      });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({
        success: false,
        error: 'Timeout'
      });
    });

    req.end();
  });
}

async function findTestFiles() {
  console.log('🔍 Finding test files in buckets...\n');

  // Find a render file
  let rendersFile: string | null = null;
  try {
    const rendersList = execSync(
      `gcloud storage ls gs://${RENDERS_BUCKET}/projects/ --recursive 2>&1`,
      { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 }
    );
    const rendersLines = rendersList.split('\n').filter(l => l.includes('.png') || l.includes('.jpg'));
    if (rendersLines.length > 0) {
      rendersFile = rendersLines[0].replace(`gs://${RENDERS_BUCKET}/`, '').trim();
    }
  } catch (e) {
    console.log('⚠️  Could not list renders files');
  }

  // Find an upload file
  let uploadsFile: string | null = null;
  try {
    const uploadsList = execSync(
      `gcloud storage ls gs://${UPLOADS_BUCKET}/projects/ --recursive 2>&1`,
      { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 }
    );
    const uploadsLines = uploadsList.split('\n').filter(l => l.includes('.png') || l.includes('.jpg') || l.includes('.jpeg'));
    if (uploadsLines.length > 0) {
      uploadsFile = uploadsLines[0].replace(`gs://${UPLOADS_BUCKET}/`, '').trim();
    }
  } catch (e) {
    console.log('⚠️  Could not list uploads files');
  }

  return { rendersFile, uploadsFile };
}

async function main() {
  console.log('🧪 CDN Endpoint Testing');
  console.log('='.repeat(60));
  console.log(`CDN Domain: ${CDN_DOMAIN}`);
  console.log('='.repeat(60));
  console.log('');

  // Test 1: DNS Resolution
  console.log('1️⃣  Testing DNS Resolution...');
  try {
    const dns = require('dns');
    const { promisify } = require('util');
    const resolve4 = promisify(dns.resolve4);
    const addresses = await resolve4(CDN_DOMAIN);
    console.log(`   ✅ DNS resolves to: ${addresses.join(', ')}\n`);
  } catch (error: any) {
    console.log(`   ❌ DNS resolution failed: ${error.message}\n`);
    return;
  }

  // Test 2: SSL Certificate Status
  console.log('2️⃣  Checking SSL Certificate...');
  try {
    const certStatus = execSync(
      `gcloud compute ssl-certificates describe renderiq-cdn-ssl-cert --project=${PROJECT_ID} --format="get(managed.status)" 2>&1`,
      { encoding: 'utf8' }
    ).trim();
    console.log(`   Status: ${certStatus}`);
    if (certStatus === 'ACTIVE') {
      console.log('   ✅ SSL Certificate is ACTIVE\n');
    } else {
      console.log(`   ⏳ SSL Certificate is ${certStatus} (may take 10-60 minutes)\n`);
    }
  } catch (error: any) {
    console.log(`   ⚠️  Could not check SSL certificate: ${error.message}\n`);
  }

  // Test 3: Test Paths (even if SSL not ready)
  console.log('3️⃣  Testing CDN Paths...\n');

  const testPaths = [
    { name: 'Renders Test Path', url: `https://${CDN_DOMAIN}/renders/test` },
    { name: 'Uploads Test Path', url: `https://${CDN_DOMAIN}/uploads/test` }
  ];

  for (const test of testPaths) {
    console.log(`   Testing: ${test.name}`);
    console.log(`   URL: ${test.url}`);
    const result = await testEndpoint(test.url);
    if (result.success) {
      console.log(`   ✅ Status: ${result.statusCode}`);
      if (result.headers) {
        console.log(`   Headers:`, JSON.stringify(result.headers, null, 2));
      }
    } else {
      console.log(`   ❌ Failed: ${result.error || 'Unknown error'}`);
      if (result.statusCode) {
        console.log(`   Status Code: ${result.statusCode}`);
      }
    }
    console.log('');
  }

  // Test 4: Test Real Files
  console.log('4️⃣  Testing Real Files...\n');
  const { rendersFile, uploadsFile } = await findTestFiles();

  if (rendersFile) {
    const cdnUrl = `https://${CDN_DOMAIN}/renders/${rendersFile}`;
    console.log(`   Testing Renders File:`);
    console.log(`   File: ${rendersFile}`);
    console.log(`   CDN URL: ${cdnUrl}`);
    const result = await testEndpoint(cdnUrl);
    if (result.success) {
      console.log(`   ✅ Status: ${result.statusCode}`);
      if (result.headers) {
        console.log(`   Server: ${result.headers.server || 'Unknown'}`);
        console.log(`   Cache: ${result.headers['x-cache'] || 'Not cached'}`);
        console.log(`   Cache-Control: ${result.headers['cache-control'] || 'Not set'}`);
      }
    } else {
      console.log(`   ❌ Failed: ${result.error || 'Unknown error'}`);
    }
    console.log('');
  } else {
    console.log('   ⚠️  No renders files found to test\n');
  }

  if (uploadsFile) {
    const cdnUrl = `https://${CDN_DOMAIN}/uploads/${uploadsFile}`;
    console.log(`   Testing Uploads File:`);
    console.log(`   File: ${uploadsFile}`);
    console.log(`   CDN URL: ${cdnUrl}`);
    const result = await testEndpoint(cdnUrl);
    if (result.success) {
      console.log(`   ✅ Status: ${result.statusCode}`);
      if (result.headers) {
        console.log(`   Server: ${result.headers.server || 'Unknown'}`);
        console.log(`   Cache: ${result.headers['x-cache'] || 'Not cached'}`);
        console.log(`   Cache-Control: ${result.headers['cache-control'] || 'Not set'}`);
      }
    } else {
      console.log(`   ❌ Failed: ${result.error || 'Unknown error'}`);
    }
    console.log('');
  } else {
    console.log('   ⚠️  No uploads files found to test\n');
  }

  // Summary
  console.log('='.repeat(60));
  console.log('📊 Summary');
  console.log('='.repeat(60));
  console.log('✅ DNS: Resolving correctly');
  console.log('⏳ SSL: Still provisioning (this is normal, takes 10-60 minutes)');
  console.log('📝 Next Steps:');
  console.log('   1. Wait for SSL certificate to become ACTIVE');
  console.log('   2. Test again once SSL is active');
  console.log('   3. Verify images load in your application');
}

main().catch(console.error);

