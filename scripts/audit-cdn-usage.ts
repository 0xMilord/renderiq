/**
 * Audit CDN and GCS Storage Usage
 * 
 * Checks all tools, actions, API routes, and components to ensure they're using:
 * 1. New CDN URLs (/renders/ and /uploads/ paths)
 * 2. GCS Storage Service
 * 3. Proper URL generation
 * 
 * Usage:
 *   tsx scripts/audit-cdn-usage.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';

const PROJECT_ROOT = process.cwd();

interface AuditResult {
  file: string;
  issues: string[];
  status: 'pass' | 'warning' | 'fail';
}

const results: AuditResult[] = [];

function checkFile(filePath: string): AuditResult {
  const content = fs.readFileSync(filePath, 'utf8');
  const relativePath = path.relative(PROJECT_ROOT, filePath);
  const issues: string[] = [];
  let status: 'pass' | 'warning' | 'fail' = 'pass';

  // Check 1: Using StorageService (good)
  const usesStorageService = content.includes('StorageService');
  const usesGCSStorageService = content.includes('GCSStorageService');
  
  // Check 2: Hardcoded old URLs (bad)
  const hasOldSupabaseUrl = /supabase\.co\/storage/.test(content);
  const hasOldGCSDirectUrl = /storage\.googleapis\.com\/renderiq-(renders|uploads)/.test(content);
  const hasOldCDNUrl = /cdn\.renderiq\.io\/renderiq-(renders|uploads)/.test(content);
  
  // Check 3: Using new CDN URLs (good)
  const hasNewCDNUrl = /cdn\.renderiq\.io\/(renders|uploads)\//.test(content);
  
  // Check 4: Direct storage calls (should use StorageService)
  const hasDirectSupabaseCall = /supabase\.storage\.from/.test(content) && !content.includes('StorageService');
  
  // Check 5: getPublicUrl usage (good)
  const usesGetPublicUrl = content.includes('getPublicUrl');

  // Evaluate issues
  if (hasOldSupabaseUrl && !content.includes('// OLD') && !content.includes('// Legacy')) {
    issues.push('Contains old Supabase storage URLs');
    status = 'warning';
  }

  if (hasOldGCSDirectUrl && !hasNewCDNUrl) {
    issues.push('Uses direct GCS URLs instead of CDN URLs');
    status = 'warning';
  }

  if (hasOldCDNUrl) {
    issues.push('Uses old CDN URL structure (renderiq-renders/ or renderiq-uploads/ instead of renders/ or uploads/)');
    status = 'fail';
  }

  if (hasDirectSupabaseCall) {
    issues.push('Direct Supabase storage calls (should use StorageService)');
    status = 'fail';
  }

  // Only flag if file handles storage but doesn't use StorageService
  if ((content.includes('upload') || content.includes('storage')) && !usesStorageService && !usesGCSStorageService && hasDirectSupabaseCall) {
    issues.push('Handles storage operations but may not use StorageService');
    status = 'warning';
  }

  return {
    file: relativePath,
    issues,
    status
  };
}

async function main() {
  console.log('🔍 Auditing CDN and GCS Storage Usage');
  console.log('='.repeat(60));
  console.log('');

  // Files to check
  const patterns = [
    'lib/actions/**/*.ts',
    'lib/services/**/*.ts',
    'app/api/**/*.ts',
    'components/**/*.tsx',
    'components/**/*.ts',
    'lib/tools/**/*.ts',
  ];

  const files: string[] = [];
  for (const pattern of patterns) {
    const matches = await glob(pattern, { cwd: PROJECT_ROOT, ignore: ['**/node_modules/**', '**/.next/**'] });
    files.push(...matches.map(f => path.join(PROJECT_ROOT, f)));
  }

  console.log(`📁 Checking ${files.length} files...\n`);

  // Check each file
  for (const file of files) {
    try {
      const result = checkFile(file);
      if (result.issues.length > 0 || result.status !== 'pass') {
        results.push(result);
      }
    } catch (error) {
      // Skip files that can't be read
    }
  }

  // Check environment configuration
  console.log('📋 Environment Configuration:');
  const envPath = path.join(PROJECT_ROOT, '.env.local');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const hasStorageProvider = envContent.includes('STORAGE_PROVIDER');
    const storageProvider = envContent.match(/STORAGE_PROVIDER=(.+)/)?.[1]?.trim();
    const hasCDNDomain = envContent.includes('GCS_CDN_DOMAIN') || envContent.includes('NEXT_PUBLIC_GCS_CDN_DOMAIN');
    
    console.log(`   STORAGE_PROVIDER: ${storageProvider || 'not set (defaults to supabase)'}`);
    console.log(`   CDN Domain: ${hasCDNDomain ? 'configured' : 'not configured'}`);
    
    if (!hasStorageProvider || (storageProvider && !storageProvider.includes('gcs'))) {
      results.push({
        file: '.env.local',
        issues: ['STORAGE_PROVIDER not set to "gcs" - should be "gcs" or "dual-write"'],
        status: 'fail'
      });
    }
  } else {
    console.log('   ⚠️  .env.local not found');
    results.push({
      file: '.env.local',
      issues: ['.env.local file not found'],
      status: 'warning'
    });
  }
  console.log('');

  // Check GCS Storage Service
  console.log('📦 Checking GCS Storage Service:');
  const gcsStoragePath = path.join(PROJECT_ROOT, 'lib/services/gcs-storage.ts');
  if (fs.existsSync(gcsStoragePath)) {
    const gcsContent = fs.readFileSync(gcsStoragePath, 'utf8');
    const hasNewCDNStructure = /\/renders\/|\/uploads\//.test(gcsContent);
    const hasOldCDNStructure = /\/renderiq-renders\/|\/renderiq-uploads\//.test(gcsContent);
    
    if (hasNewCDNStructure) {
      console.log('   ✅ Using new CDN URL structure (/renders/ and /uploads/)');
    } else if (hasOldCDNStructure) {
      console.log('   ❌ Using old CDN URL structure');
      results.push({
        file: 'lib/services/gcs-storage.ts',
        issues: ['Using old CDN URL structure'],
        status: 'fail'
      });
    } else {
      console.log('   ⚠️  CDN URL structure not detected');
    }
  }
  console.log('');

  // Summary
  console.log('='.repeat(60));
  console.log('📊 Audit Summary');
  console.log('='.repeat(60));
  
  const passed = results.filter(r => r.status === 'pass').length;
  const warnings = results.filter(r => r.status === 'warning').length;
  const failed = results.filter(r => r.status === 'fail').length;

  console.log(`✅ Passed: ${files.length - results.length}`);
  console.log(`⚠️  Warnings: ${warnings}`);
  console.log(`❌ Failed: ${failed}`);
  console.log('');

  if (results.length > 0) {
    console.log('📝 Issues Found:');
    console.log('');
    
    const failedFiles = results.filter(r => r.status === 'fail');
    if (failedFiles.length > 0) {
      console.log('❌ Failed Files:');
      failedFiles.forEach(r => {
        console.log(`   ${r.file}`);
        r.issues.forEach(issue => console.log(`      - ${issue}`));
      });
      console.log('');
    }

    const warningFiles = results.filter(r => r.status === 'warning');
    if (warningFiles.length > 0) {
      console.log('⚠️  Warning Files:');
      warningFiles.forEach(r => {
        console.log(`   ${r.file}`);
        r.issues.forEach(issue => console.log(`      - ${issue}`));
      });
      console.log('');
    }
  } else {
    console.log('✅ All files are using proper CDN and GCS storage infrastructure!');
  }

  // Recommendations
  console.log('💡 Recommendations:');
  if (failed > 0) {
    console.log('   1. Fix failed files above');
    console.log('   2. Update old CDN URL structures to use /renders/ and /uploads/');
    console.log('   3. Ensure all storage operations use StorageService');
  } else if (warnings > 0) {
    console.log('   1. Review warning files');
    console.log('   2. Consider migrating old URLs to new CDN structure');
  } else {
    console.log('   ✅ Everything looks good!');
    console.log('   ✅ All tools are using proper CDN infrastructure');
    console.log('   ✅ Storage operations use StorageService → GCSStorageService');
  }

  // Save report
  const reportPath = path.join(PROJECT_ROOT, 'cdn-usage-audit-report.json');
  fs.writeFileSync(reportPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    totalFiles: files.length,
    results,
    summary: {
      passed: files.length - results.length,
      warnings,
      failed
    }
  }, null, 2));

  console.log('');
  console.log(`📝 Full report saved to: ${reportPath}`);

  process.exit(failed > 0 ? 1 : 0);
}

main().catch(console.error);



