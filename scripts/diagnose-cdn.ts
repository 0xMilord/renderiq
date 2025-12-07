/**
 * CDN Diagnostic Script
 * 
 * Comprehensive diagnostic tool to check:
 * - CDN configuration and status
 * - Load balancer health
 * - Backend bucket configuration
 * - CORS settings
 * - Cache policies
 * - DNS resolution
 * - SSL certificate status
 * - URL map configuration
 * - Test file accessibility
 * 
 * Usage:
 *   tsx scripts/diagnose-cdn.ts
 */

import { execSync } from 'child_process';
import * as https from 'https';
import * as http from 'http';
import { URL } from 'url';
import * as fs from 'fs';
import * as path from 'path';
import * as dns from 'dns';
import { promisify } from 'util';

const dnsResolve4 = promisify(dns.resolve4);

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
const URL_MAP_NAME = 'renderiq-cdn-map';

interface DiagnosticResult {
  name: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
  details?: any;
}

const results: DiagnosticResult[] = [];

function logResult(result: DiagnosticResult) {
  results.push(result);
  const icon = result.status === 'pass' ? '✅' : result.status === 'fail' ? '❌' : '⚠️';
  console.log(`${icon} ${result.name}: ${result.message}`);
  if (result.details) {
    console.log(`   Details:`, JSON.stringify(result.details, null, 2));
  }
}

function runGcloud(command: string, description: string): string | null {
  try {
    const output = execSync(command, { encoding: 'utf8', stdio: 'pipe' });
    return output.trim();
  } catch (error: any) {
    logResult({
      name: description,
      status: 'fail',
      message: `Command failed: ${error.message}`,
      details: { command, error: error.message }
    });
    return null;
  }
}

async function checkDNSResolution(domain: string): Promise<DiagnosticResult> {
  try {
    const addresses = await dnsResolve4(domain);
    return {
      name: 'DNS Resolution',
      status: 'pass',
      message: `${domain} resolves to ${addresses.join(', ')}`,
      details: { domain, addresses }
    };
  } catch (err: any) {
    return {
      name: 'DNS Resolution',
      status: 'fail',
      message: `Cannot resolve ${domain}: ${err.message}`,
      details: { domain, error: err.message }
    };
  }
}

function checkHTTPSAccess(url: string): Promise<DiagnosticResult> {
  return new Promise((resolve) => {
    const parsedUrl = new URL(url);
    const options = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || 443,
      path: parsedUrl.pathname,
      method: 'HEAD',
      timeout: 10000,
      rejectUnauthorized: true
    };

    const req = https.request(options, (res) => {
      const headers = res.headers;
      resolve({
        name: 'HTTPS Access',
        status: res.statusCode === 200 || res.statusCode === 404 ? 'pass' : 'warning',
        message: `HTTP ${res.statusCode} - ${res.statusMessage}`,
        details: {
          url,
          statusCode: res.statusCode,
          headers: {
            'content-type': headers['content-type'],
            'cache-control': headers['cache-control'],
            'x-cache': headers['x-cache'] || headers['x-cache-status'],
            'server': headers['server'],
            'via': headers['via']
          }
        }
      });
      res.destroy();
    });

    req.on('error', (error: any) => {
      resolve({
        name: 'HTTPS Access',
        status: 'fail',
        message: `Cannot access ${url}: ${error.message}`,
        details: { url, error: error.message, code: error.code }
      });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({
        name: 'HTTPS Access',
        status: 'fail',
        message: `Timeout accessing ${url}`,
        details: { url, timeout: true }
      });
    });

    req.end();
  });
}

function checkLoadBalancer(): DiagnosticResult {
  const forwardingRules = runGcloud(
    `gcloud compute forwarding-rules list --global --project=${PROJECT_ID} --format="json"`,
    'Load Balancer Forwarding Rules'
  );

  if (!forwardingRules) {
    return {
      name: 'Load Balancer',
      status: 'fail',
      message: 'Cannot retrieve forwarding rules'
    };
  }

  try {
    const rules = JSON.parse(forwardingRules);
    const cdnRule = rules.find((r: any) => 
      r.name.includes('cdn') || r.name.includes('renderiq')
    );

    if (!cdnRule) {
      return {
        name: 'Load Balancer',
        status: 'warning',
        message: 'No CDN forwarding rule found',
        details: { availableRules: rules.map((r: any) => r.name) }
      };
    }

    return {
      name: 'Load Balancer',
      status: 'pass',
      message: `Found forwarding rule: ${cdnRule.name}`,
      details: {
        name: cdnRule.name,
        ipAddress: cdnRule.IPAddress,
        target: cdnRule.target,
        portRange: cdnRule.portRange,
        loadBalancingScheme: cdnRule.loadBalancingScheme
      }
    };
  } catch (error: any) {
    return {
      name: 'Load Balancer',
      status: 'fail',
      message: `Error parsing forwarding rules: ${error.message}`
    };
  }
}

function checkBackendBuckets(): DiagnosticResult {
  const backendBuckets = runGcloud(
    `gcloud compute backend-buckets list --project=${PROJECT_ID} --format="json"`,
    'Backend Buckets'
  );

  if (!backendBuckets) {
    return {
      name: 'Backend Buckets',
      status: 'fail',
      message: 'Cannot retrieve backend buckets'
    };
  }

  try {
    const buckets = JSON.parse(backendBuckets);
    const rendersBackend = buckets.find((b: any) => 
      b.name.includes('renders') && b.name.includes('cdn')
    );
    const uploadsBackend = buckets.find((b: any) => 
      b.name.includes('uploads') && b.name.includes('cdn')
    );

    const allFound = rendersBackend && uploadsBackend;
    const status = allFound ? 'pass' : 'warning';

    let details: any = {
      rendersBackend: rendersBackend ? {
        name: rendersBackend.name,
        bucketName: rendersBackend.bucketName,
        enableCdn: rendersBackend.enableCdn !== false
      } : null,
      uploadsBackend: uploadsBackend ? {
        name: uploadsBackend.name,
        bucketName: uploadsBackend.bucketName,
        enableCdn: uploadsBackend.enableCdn !== false
      } : null
    };

    // Get detailed info for renders
    if (rendersBackend) {
      const rendersDetails = runGcloud(
        `gcloud compute backend-buckets describe ${rendersBackend.name} --project=${PROJECT_ID} --format="json"`,
        'Renders Backend Details'
      );
      if (rendersDetails) {
        try {
          const rendersObj = JSON.parse(rendersDetails);
          details.rendersBackend.cdnPolicy = rendersObj.cdnPolicy || 'Not configured';
        } catch (e) {}
      }
    }

    // Get detailed info for uploads
    if (uploadsBackend) {
      const uploadsDetails = runGcloud(
        `gcloud compute backend-buckets describe ${uploadsBackend.name} --project=${PROJECT_ID} --format="json"`,
        'Uploads Backend Details'
      );
      if (uploadsDetails) {
        try {
          const uploadsObj = JSON.parse(uploadsDetails);
          details.uploadsBackend.cdnPolicy = uploadsObj.cdnPolicy || 'Not configured';
        } catch (e) {}
      }
    }

    return {
      name: 'Backend Buckets',
      status,
      message: allFound 
        ? `Found both backend buckets: ${rendersBackend.name}, ${uploadsBackend.name}`
        : `Missing backend buckets. Found: ${rendersBackend ? rendersBackend.name : 'none'}, ${uploadsBackend ? uploadsBackend.name : 'none'}`,
      details
    };
  } catch (error: any) {
    return {
      name: 'Backend Buckets',
      status: 'fail',
      message: `Error parsing backend buckets: ${error.message}`
    };
  }
}

function checkURLMap(): DiagnosticResult {
  const urlMaps = runGcloud(
    `gcloud compute url-maps list --project=${PROJECT_ID} --format="json"`,
    'URL Maps'
  );

  if (!urlMaps) {
    return {
      name: 'URL Map',
      status: 'fail',
      message: 'Cannot retrieve URL maps'
    };
  }

  try {
    const maps = JSON.parse(urlMaps);
    const cdnMap = maps.find((m: any) => 
      m.name === URL_MAP_NAME || m.name.includes('cdn') || m.name.includes('renderiq')
    );

    if (!cdnMap) {
      return {
        name: 'URL Map',
        status: 'fail',
        message: 'No CDN URL map found',
        details: { availableMaps: maps.map((m: any) => m.name) }
      };
    }

    // Get detailed info
    const details = runGcloud(
      `gcloud compute url-maps describe ${cdnMap.name} --project=${PROJECT_ID} --format="json"`,
      'URL Map Details'
    );

    let detailsObj: any = {};
    if (details) {
      try {
        detailsObj = JSON.parse(details);
      } catch (e) {
        // Ignore parse errors
      }
    }

    return {
      name: 'URL Map',
      status: 'pass',
      message: `Found URL map: ${cdnMap.name}`,
      details: {
        name: cdnMap.name,
        defaultService: detailsObj.defaultService,
        hostRules: detailsObj.hostRules || []
      }
    };
  } catch (error: any) {
    return {
      name: 'URL Map',
      status: 'fail',
      message: `Error parsing URL maps: ${error.message}`
    };
  }
}

function checkSSLCertificate(): DiagnosticResult {
  const certs = runGcloud(
    `gcloud compute ssl-certificates list --project=${PROJECT_ID} --format="json"`,
    'SSL Certificates'
  );

  if (!certs) {
    return {
      name: 'SSL Certificate',
      status: 'warning',
      message: 'Cannot retrieve SSL certificates (may be using HTTP)'
    };
  }

  try {
    const certificates = JSON.parse(certs);
    const cdnCert = certificates.find((c: any) => 
      c.managed?.domains?.includes(CDN_DOMAIN) || 
      c.name.includes('cdn') || 
      c.name.includes('renderiq')
    );

    if (!cdnCert) {
      return {
        name: 'SSL Certificate',
        status: 'warning',
        message: 'No SSL certificate found for CDN domain (may be using HTTP)',
        details: { availableCerts: certificates.map((c: any) => c.name) }
      };
    }

    return {
      name: 'SSL Certificate',
      status: cdnCert.managed?.status === 'ACTIVE' ? 'pass' : 'warning',
      message: `SSL Certificate: ${cdnCert.name} - Status: ${cdnCert.managed?.status || 'Unknown'}`,
      details: {
        name: cdnCert.name,
        status: cdnCert.managed?.status,
        domains: cdnCert.managed?.domains,
        type: cdnCert.type
      }
    };
  } catch (error: any) {
    return {
      name: 'SSL Certificate',
      status: 'warning',
      message: `Error parsing SSL certificates: ${error.message}`
    };
  }
}

function checkBucketCORS(): DiagnosticResult {
  const cors = runGcloud(
    `gsutil cors get gs://${RENDERS_BUCKET} 2>&1 || echo "[]"`,
    'Bucket CORS Configuration'
  );

  if (!cors || cors.includes('AccessDeniedException') || cors.includes('404')) {
    return {
      name: 'Bucket CORS',
      status: 'warning',
      message: 'Cannot retrieve CORS configuration (may not be set)',
      details: { bucket: RENDERS_BUCKET }
    };
  }

  try {
    const corsConfig = JSON.parse(cors);
    return {
      name: 'Bucket CORS',
      status: corsConfig.length > 0 ? 'pass' : 'warning',
      message: corsConfig.length > 0 
        ? `CORS configured with ${corsConfig.length} rule(s)`
        : 'No CORS configuration found',
      details: {
        bucket: RENDERS_BUCKET,
        cors: corsConfig
      }
    };
  } catch (error: any) {
    return {
      name: 'Bucket CORS',
      status: 'warning',
      message: `CORS configuration exists but cannot parse: ${cors}`,
      details: { bucket: RENDERS_BUCKET, raw: cors }
    };
  }
}

function checkBucketIAM(): DiagnosticResult {
  const iam = runGcloud(
    `gsutil iam get gs://${RENDERS_BUCKET} 2>&1 || echo "{}"`,
    'Bucket IAM Permissions'
  );

  if (!iam || iam.includes('AccessDeniedException')) {
    return {
      name: 'Bucket IAM',
      status: 'warning',
      message: 'Cannot retrieve IAM permissions',
      details: { bucket: RENDERS_BUCKET }
    };
  }

  try {
    const iamPolicy = JSON.parse(iam);
    const publicAccess = iamPolicy.bindings?.some((b: any) => 
      b.role === 'roles/storage.objectViewer' && 
      b.members?.includes('allUsers')
    );

    return {
      name: 'Bucket IAM',
      status: publicAccess ? 'pass' : 'warning',
      message: publicAccess 
        ? 'Bucket is publicly accessible'
        : 'Bucket may not be publicly accessible',
      details: {
        bucket: RENDERS_BUCKET,
        bindings: iamPolicy.bindings || []
      }
    };
  } catch (error: any) {
    return {
      name: 'Bucket IAM',
      status: 'warning',
      message: `IAM policy exists but cannot parse`,
      details: { bucket: RENDERS_BUCKET }
    };
  }
}

function checkCacheHeaders(url: string): Promise<DiagnosticResult> {
  return new Promise((resolve) => {
    const parsedUrl = new URL(url);
    const options = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || 443,
      path: parsedUrl.pathname,
      method: 'HEAD',
      timeout: 10000
    };

    const req = https.request(options, (res) => {
      const cacheControl = res.headers['cache-control'];
      const expires = res.headers['expires'];
      const etag = res.headers['etag'];
      const lastModified = res.headers['last-modified'];
      const xCache = res.headers['x-cache'] || res.headers['x-cache-status'];
      const via = res.headers['via'];

      const hasCacheControl = !!cacheControl;
      const hasLongCache = cacheControl?.includes('max-age') && 
        parseInt(cacheControl.match(/max-age=(\d+)/)?.[1] || '0') >= 86400;

      resolve({
        name: 'Cache Headers',
        status: hasCacheControl && hasLongCache ? 'pass' : 'warning',
        message: hasCacheControl 
          ? `Cache-Control: ${cacheControl}`
          : 'No Cache-Control header found',
        details: {
          url,
          'cache-control': cacheControl,
          'expires': expires,
          'etag': etag,
          'last-modified': lastModified,
          'x-cache': xCache,
          'via': via,
          'cdn-status': xCache || (via ? 'CDN detected' : 'Direct')
        }
      });
      res.destroy();
    });

    req.on('error', (error: any) => {
      resolve({
        name: 'Cache Headers',
        status: 'fail',
        message: `Cannot check cache headers: ${error.message}`,
        details: { url, error: error.message }
      });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({
        name: 'Cache Headers',
        status: 'fail',
        message: 'Timeout checking cache headers',
        details: { url }
      });
    });

    req.end();
  });
}

async function main() {
  console.log('🔍 CDN Diagnostic Tool');
  console.log('='.repeat(60));
  console.log(`Project: ${PROJECT_ID}`);
  console.log(`Bucket: ${RENDERS_BUCKET}`);
  console.log(`CDN Domain: ${CDN_DOMAIN}`);
  console.log('='.repeat(60));
  console.log('');

  // Check 1: DNS Resolution
  console.log('📡 Checking DNS Resolution...');
  const dnsResult = await checkDNSResolution(CDN_DOMAIN);
  logResult(dnsResult);
  console.log('');

  // Check 2: Load Balancer
  console.log('⚖️  Checking Load Balancer...');
  logResult(checkLoadBalancer());
  console.log('');

  // Check 3: Backend Buckets
  console.log('📦 Checking Backend Buckets...');
  logResult(checkBackendBuckets());
  console.log('');

  // Check 4: URL Map
  console.log('🗺️  Checking URL Map...');
  logResult(checkURLMap());
  console.log('');

  // Check 5: SSL Certificate
  console.log('🔒 Checking SSL Certificate...');
  logResult(checkSSLCertificate());
  console.log('');

  // Check 6: Bucket CORS
  console.log('🌐 Checking Bucket CORS...');
  logResult(checkBucketCORS());
  console.log('');

  // Check 7: Bucket IAM
  console.log('🔐 Checking Bucket IAM...');
  logResult(checkBucketIAM());
  console.log('');

  // Check 8: HTTPS Access - Test both paths
  console.log('🌍 Testing HTTPS Access...');
  const rendersTestUrl = `https://${CDN_DOMAIN}/renders/test`;
  const uploadsTestUrl = `https://${CDN_DOMAIN}/uploads/test`;
  
  console.log(`   Testing renders path: ${rendersTestUrl}`);
  const rendersHttpsResult = await checkHTTPSAccess(rendersTestUrl);
  logResult({ ...rendersHttpsResult, name: 'HTTPS Access (Renders)' });
  
  console.log(`   Testing uploads path: ${uploadsTestUrl}`);
  const uploadsHttpsResult = await checkHTTPSAccess(uploadsTestUrl);
  logResult({ ...uploadsHttpsResult, name: 'HTTPS Access (Uploads)' });
  console.log('');

  // Check 9: Cache Headers - Test both paths
  console.log('💾 Checking Cache Headers...');
  console.log(`   Testing renders path: ${rendersTestUrl}`);
  const rendersCacheResult = await checkCacheHeaders(rendersTestUrl);
  logResult({ ...rendersCacheResult, name: 'Cache Headers (Renders)' });
  
  console.log(`   Testing uploads path: ${uploadsTestUrl}`);
  const uploadsCacheResult = await checkCacheHeaders(uploadsTestUrl);
  logResult({ ...uploadsCacheResult, name: 'Cache Headers (Uploads)' });
  console.log('');

  // Check 10: Test actual files if available
  console.log('📁 Testing Actual Files...');
  try {
    // Try to find a real file in renders bucket
    const rendersFiles = runGcloud(
      `gsutil ls gs://${RENDERS_BUCKET}/projects/**/*.png 2>&1 | head -1`,
      'List Renders Files'
    );
    if (rendersFiles && !rendersFiles.includes('CommandException')) {
      const filePath = rendersFiles.trim().replace(`gs://${RENDERS_BUCKET}/`, '');
      const cdnUrl = `https://${CDN_DOMAIN}/renders/${filePath}`;
      console.log(`   Testing real file: ${cdnUrl}`);
      const realFileResult = await checkHTTPSAccess(cdnUrl);
      logResult({ ...realFileResult, name: 'Real File Access (Renders)' });
    } else {
      logResult({
        name: 'Real File Access (Renders)',
        status: 'warning',
        message: 'No test files found in renders bucket'
      });
    }

    // Try to find a real file in uploads bucket
    const uploadsFiles = runGcloud(
      `gsutil ls gs://${UPLOADS_BUCKET}/projects/**/*.{png,jpg,jpeg} 2>&1 | head -1`,
      'List Uploads Files'
    );
    if (uploadsFiles && !uploadsFiles.includes('CommandException')) {
      const filePath = uploadsFiles.trim().replace(`gs://${UPLOADS_BUCKET}/`, '');
      const cdnUrl = `https://${CDN_DOMAIN}/uploads/${filePath}`;
      console.log(`   Testing real file: ${cdnUrl}`);
      const realFileResult = await checkHTTPSAccess(cdnUrl);
      logResult({ ...realFileResult, name: 'Real File Access (Uploads)' });
    } else {
      logResult({
        name: 'Real File Access (Uploads)',
        status: 'warning',
        message: 'No test files found in uploads bucket'
      });
    }
  } catch (error: any) {
    logResult({
      name: 'Real File Access',
      status: 'warning',
      message: `Could not test real files: ${error.message}`
    });
  }
  console.log('');

  // Summary
  console.log('='.repeat(60));
  console.log('📊 Diagnostic Summary');
  console.log('='.repeat(60));
  
  const passed = results.filter(r => r.status === 'pass').length;
  const failed = results.filter(r => r.status === 'fail').length;
  const warnings = results.filter(r => r.status === 'warning').length;

  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`⚠️  Warnings: ${warnings}`);
  console.log('');

  if (failed > 0) {
    console.log('❌ Failed Checks:');
    results.filter(r => r.status === 'fail').forEach(r => {
      console.log(`   - ${r.name}: ${r.message}`);
    });
    console.log('');
  }

  if (warnings > 0) {
    console.log('⚠️  Warnings:');
    results.filter(r => r.status === 'warning').forEach(r => {
      console.log(`   - ${r.name}: ${r.message}`);
    });
    console.log('');
  }

  // Recommendations
  console.log('💡 Recommendations:');
  if (failed > 0) {
    console.log('   1. Fix failed checks above');
    console.log('   2. Run CDN setup script: npm run gcs:cdn');
    console.log('   3. Verify DNS propagation');
  } else if (warnings > 0) {
    console.log('   1. Review warnings above');
    console.log('   2. Consider configuring missing settings');
  } else {
    console.log('   ✅ All checks passed! CDN should be working correctly.');
  }

  console.log('');
  console.log('📝 Full diagnostic report saved to: cdn-diagnostic-report.json');
  
  // Save full report
  fs.writeFileSync(
    'cdn-diagnostic-report.json',
    JSON.stringify({ timestamp: new Date().toISOString(), results }, null, 2)
  );

  process.exit(failed > 0 ? 1 : 0);
}

main().catch(console.error);

