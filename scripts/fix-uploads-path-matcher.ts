/**
 * Fix Uploads Path Matcher
 * 
 * Fixes the path matcher to point to the correct backend bucket
 * 
 * Usage:
 *   tsx scripts/fix-uploads-path-matcher.ts
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
const URL_MAP_NAME = 'renderiq-renders-cdn-map';
const UPLOADS_BACKEND_BUCKET = 'renderiq-uploads-cdn-backend';

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

async function main() {
  console.log('🔧 Fixing Uploads Path Matcher');
  console.log('='.repeat(60));
  console.log(`Project: ${PROJECT_ID}`);
  console.log(`URL Map: ${URL_MAP_NAME}`);
  console.log(`Correct Backend: ${UPLOADS_BACKEND_BUCKET}`);
  console.log('='.repeat(60));

  console.log('\n⚠️  The path matcher is currently pointing to the wrong backend bucket!');
  console.log('   Current: /renderiq-uploads/* → renderiq-renders-cdn-backend (WRONG)');
  console.log('   Should be: /renderiq-uploads/* → renderiq-uploads-cdn-backend (CORRECT)');
  
  console.log('\n📝 Manual Fix Required via Cloud Console:');
  console.log('\n   1. Go to: https://console.cloud.google.com/net-services/loadbalancing/urlMaps/list?project=' + PROJECT_ID);
  console.log(`   2. Click on: ${URL_MAP_NAME}`);
  console.log('   3. Click "EDIT"');
  console.log('   4. Find path matcher: "uploads-matcher"');
  console.log('   5. Click on it to edit');
  console.log('   6. Update path rule:');
  console.log('      - Paths: /renderiq-uploads/*');
  console.log(`      - Backend: ${UPLOADS_BACKEND_BUCKET} (NOT renderiq-renders-cdn-backend)`);
  console.log('   7. Click "SAVE"');
  
  console.log('\n   OR use gcloud edit:');
  console.log(`   gcloud compute url-maps edit ${URL_MAP_NAME} --project=${PROJECT_ID}`);
  console.log('   Then manually update the path matcher in the YAML editor.');
  
  console.log('\n💡 Quick Fix Command (if gcloud supports it):');
  console.log(`   gcloud compute url-maps edit ${URL_MAP_NAME} --project=${PROJECT_ID}`);
  console.log('   Look for "uploads-matcher" and change backend bucket to:');
  console.log(`   ${UPLOADS_BACKEND_BUCKET}`);
}

main().catch(console.error);



