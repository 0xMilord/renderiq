/**
 * Fix Renders Path Matcher
 * 
 * Removes the incorrect /renderiq-renders/* path rule from uploads-matcher
 * The renders bucket should use the default backend, not a path matcher
 * 
 * Usage:
 *   tsx scripts/fix-renders-path-matcher.ts
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
const PATH_MATCHER_NAME = 'path-matcher-1'; // Actual name from URL map

function runGcloud(command: string, description: string): { success: boolean; output?: string; error?: string } {
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
    console.log(`❌ ${description} failed: ${errorMessage}`);
    return { success: false, error: errorMessage };
  }
}

async function main() {
  console.log('🔧 Fixing Renders Path Matcher');
  console.log('='.repeat(60));
  console.log(`Project: ${PROJECT_ID}`);
  console.log(`URL Map: ${URL_MAP_NAME}`);
  console.log(`Path Matcher: ${PATH_MATCHER_NAME}`);
  console.log('='.repeat(60));

  // Step 1: Get current URL map configuration
  console.log('\n📋 Step 1: Getting current URL map configuration...');
  const describeResult = runGcloud(
    `gcloud compute url-maps describe ${URL_MAP_NAME} --format=json --project=${PROJECT_ID}`,
    'Fetching URL map configuration'
  );

  if (!describeResult.success) {
    console.error('❌ Failed to fetch URL map configuration');
    process.exit(1);
  }

  try {
    const urlMap = JSON.parse(describeResult.output || '{}');
    const pathMatcher = urlMap.pathMatchers?.find((pm: any) => pm.name === PATH_MATCHER_NAME);

    if (!pathMatcher) {
      console.log('❌ Path matcher not found');
      process.exit(1);
    }

    console.log('\n📊 Current path matcher configuration:');
    console.log(JSON.stringify(pathMatcher, null, 2));

    // Check if /renderiq-renders/* rule exists
    const rendersRule = pathMatcher.pathRules?.find((rule: any) => 
      rule.paths?.includes('/renderiq-renders/*')
    );

    if (!rendersRule) {
      console.log('\n✅ No /renderiq-renders/* rule found in uploads-matcher');
      console.log('   Configuration is already correct!');
      process.exit(0);
    }

    console.log('\n❌ Found incorrect /renderiq-renders/* rule in path-matcher-1');
    console.log('   This rule should be removed - renders should use default backend');
    console.log('\n📊 Current path rules:');
    pathMatcher.pathRules?.forEach((rule: any, index: number) => {
      console.log(`   ${index + 1}. Paths: ${rule.paths?.join(', ')}`);
      console.log(`      Backend: ${rule.service?.split('/').pop() || 'N/A'}`);
    });

  } catch (error) {
    console.error('❌ Failed to parse URL map configuration:', error);
    process.exit(1);
  }

  // Step 2: Remove the incorrect path rule using gcloud edit
  console.log('\n🗑️  Step 2: Removing incorrect /renderiq-renders/* path rule...');
  console.log('\n📝 Option 1: Use gcloud edit (Recommended)');
  console.log('='.repeat(60));
  console.log(`Run this command:`);
  console.log(`  gcloud compute url-maps edit ${URL_MAP_NAME} --project=${PROJECT_ID}`);
  console.log('\nIn the editor that opens:');
  console.log('1. Find the pathMatchers section');
  console.log('2. Find path-matcher-1');
  console.log('3. Under pathRules, find the rule with paths: ["/renderiq-renders/*"]');
  console.log('4. Delete that entire path rule block (including the "- paths:" and "service:" lines)');
  console.log('5. Keep only the /renderiq-uploads/* rule');
  console.log('6. Save and close the editor');
  console.log('='.repeat(60));

  console.log('\n📝 Option 2: Use Cloud Console');
  console.log('='.repeat(60));
  console.log('1. Go to: https://console.cloud.google.com/net-services/loadbalancing/urlMaps/list?project=' + PROJECT_ID);
  console.log(`2. Click on: ${URL_MAP_NAME}`);
  console.log('3. Click "EDIT"');
  console.log(`4. Find path matcher: ${PATH_MATCHER_NAME}`);
  console.log('5. Find path rule: /renderiq-renders/* → renderiq-renders-cdn-backend');
  console.log('6. DELETE this path rule (click X or delete button)');
  console.log('7. Keep only:');
  console.log('   - /renderiq-uploads/* → renderiq-uploads-cdn-backend');
  console.log('   - Default → renderiq-renders-cdn-backend');
  console.log('8. Click "SAVE"');
  console.log('='.repeat(60));

  console.log('\n💡 Why this is needed:');
  console.log('   The /renderiq-renders/* path should NOT be in a path matcher.');
  console.log('   It should use the default backend (no path matcher).');
  console.log('   Path matchers are evaluated before the default backend,');
  console.log('   so having /renderiq-renders/* in uploads-matcher causes routing issues.');

  console.log('\n✅ After fixing:');
  console.log('   - Default backend will handle /renderiq-renders/*');
  console.log('   - path-matcher-1 will only handle /renderiq-uploads/*');
  console.log('   - Both buckets will work correctly via CDN');
  
  console.log('\n🧪 Test after fix:');
  console.log('   npm run gcs:verify-file -- projects/tool-render-to-cad-20251206/4df4ace2-4109-4128-b935-8c51f0e03770/render_023e8606-10af-4cdb-be5c-6d80043269e0.png');
}

main().catch(console.error);

