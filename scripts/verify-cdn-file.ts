/**
 * Verify CDN File Access
 * 
 * Checks if a file exists in the bucket and tests CDN access
 * 
 * Usage:
 *   tsx scripts/verify-cdn-file.ts [file-path]
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { Storage } from '@google-cloud/storage';

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
const CDN_DOMAIN = process.env.GCS_CDN_DOMAIN || 'cdn.renderiq.io';

// Initialize Storage
const storage = new Storage({
  projectId: PROJECT_ID,
  keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS || path.join(process.cwd(), 'service-account-key.json'),
});

async function checkFileExists(bucketName: string, filePath: string): Promise<boolean> {
  try {
    const bucket = storage.bucket(bucketName);
    const file = bucket.file(filePath);
    const [exists] = await file.exists();
    return exists;
  } catch (error) {
    console.error('Error checking file:', error);
    return false;
  }
}

async function listFilesInPath(bucketName: string, prefix: string) {
  try {
    const bucket = storage.bucket(bucketName);
    const [files] = await bucket.getFiles({ prefix, maxResults: 10 });
    return files.map(f => f.name);
  } catch (error) {
    console.error('Error listing files:', error);
    return [];
  }
}

async function testCDNAccess(cdnUrl: string) {
  return new Promise((resolve) => {
    const https = require('https');
    const url = require('url');
    const parsedUrl = url.parse(cdnUrl);
    
    const options = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || 443,
      path: parsedUrl.pathname,
      method: 'HEAD',
      timeout: 10000,
    };

    const req = https.request(options, (res: any) => {
      resolve({
        statusCode: res.statusCode,
        headers: res.headers,
        success: res.statusCode === 200,
      });
      res.destroy();
    });

    req.on('error', (error: any) => {
      resolve({
        error: error.message,
        success: false,
      });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({
        error: 'Timeout',
        success: false,
      });
    });

    req.end();
  });
}

async function main() {
  const filePath = process.argv[2] || 'projects/tool-render-to-cad-20251206/4df4ace2-4109-4128-b935-8c51f0e03770/render_c5e16e39-f87c-486c-9f2d-e9419277e8a5.png';
  
  console.log('🔍 Verifying CDN File Access');
  console.log('='.repeat(60));
  console.log(`File Path: ${filePath}`);
  console.log(`Bucket: ${RENDERS_BUCKET}`);
  console.log('='.repeat(60));

  // Step 1: Check if file exists in bucket
  console.log('\n📦 Step 1: Checking if file exists in bucket...');
  const exists = await checkFileExists(RENDERS_BUCKET, filePath);
  
  if (exists) {
    console.log('✅ File exists in bucket');
  } else {
    console.log('❌ File does NOT exist in bucket');
    console.log('\n🔍 Searching for similar files...');
    
    // Try to find files in the same directory
    const dirPath = filePath.substring(0, filePath.lastIndexOf('/'));
    const files = await listFilesInPath(RENDERS_BUCKET, dirPath);
    
    if (files.length > 0) {
      console.log(`\n📁 Found ${files.length} files in directory:`);
      files.slice(0, 5).forEach(f => console.log(`   - ${f}`));
      if (files.length > 5) {
        console.log(`   ... and ${files.length - 5} more`);
      }
    } else {
      console.log('❌ No files found in directory');
      
      // Try parent directory
      const parentPath = dirPath.substring(0, dirPath.lastIndexOf('/'));
      if (parentPath) {
        console.log(`\n🔍 Searching parent directory: ${parentPath}`);
        const parentFiles = await listFilesInPath(RENDERS_BUCKET, parentPath);
        if (parentFiles.length > 0) {
          console.log(`\n📁 Found ${parentFiles.length} files in parent directory:`);
          parentFiles.slice(0, 5).forEach(f => console.log(`   - ${f}`));
        }
      }
    }
    
    console.log('\n💡 Possible issues:');
    console.log('   1. File was never uploaded');
    console.log('   2. File path is incorrect');
    console.log('   3. File is in a different bucket');
    console.log('   4. File was deleted');
    
    process.exit(1);
  }

  // Step 2: Test direct GCS access
  console.log('\n🌐 Step 2: Testing direct GCS access...');
  const gcsUrl = `https://storage.googleapis.com/${RENDERS_BUCKET}/${filePath}`;
  console.log(`   URL: ${gcsUrl}`);
  
  const gcsResult: any = await testCDNAccess(gcsUrl);
  if (gcsResult.success) {
    console.log(`✅ Direct GCS access works (HTTP ${gcsResult.statusCode})`);
  } else {
    console.log(`❌ Direct GCS access failed: ${gcsResult.error || gcsResult.statusCode}`);
  }

  // Step 3: Test CDN access
  console.log('\n🚀 Step 3: Testing CDN access...');
  const cdnUrl = `https://${CDN_DOMAIN}/${RENDERS_BUCKET}/${filePath}`;
  console.log(`   URL: ${cdnUrl}`);
  
  const cdnResult: any = await testCDNAccess(cdnUrl);
  if (cdnResult.success) {
    console.log(`✅ CDN access works (HTTP ${cdnResult.statusCode})`);
    console.log(`   Server: ${cdnResult.headers['server'] || 'Unknown'}`);
    console.log(`   Cache-Control: ${cdnResult.headers['cache-control'] || 'Not set'}`);
    console.log(`   X-Cache: ${cdnResult.headers['x-cache'] || cdnResult.headers['x-cache-status'] || 'Not set'}`);
  } else {
    console.log(`❌ CDN access failed: ${cdnResult.error || cdnResult.statusCode}`);
    
    if (cdnResult.statusCode === 404) {
      console.log('\n💡 CDN returned 404 - Possible issues:');
      console.log('   1. CDN backend bucket not configured correctly');
      console.log('   2. URL map routing issue');
      console.log('   3. File path mismatch');
      console.log('   4. CDN cache needs to be invalidated');
    }
  }

  // Step 4: Compare URLs
  console.log('\n📊 Step 4: URL Comparison');
  console.log('='.repeat(60));
  console.log(`Direct GCS: ${gcsUrl}`);
  console.log(`CDN URL:   ${cdnUrl}`);
  console.log('='.repeat(60));

  // Summary
  console.log('\n📝 Summary:');
  if (exists && gcsResult.success) {
    console.log('✅ File exists and is accessible via direct GCS');
    if (cdnResult.success) {
      console.log('✅ CDN is working correctly');
    } else {
      console.log('❌ CDN is not working - check configuration');
      console.log('\n🔧 Troubleshooting:');
      console.log('   1. Run: npm run gcs:diagnose');
      console.log('   2. Check URL map configuration');
      console.log('   3. Verify backend bucket is linked correctly');
      console.log('   4. Wait a few minutes for CDN propagation');
    }
  } else if (!exists) {
    console.log('❌ File does not exist in bucket');
    console.log('   Check if file was uploaded correctly');
  }
}

main().catch(console.error);

