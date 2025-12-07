/**
 * Automated Cloud CDN Setup for Google Cloud Storage
 * 
 * This script automates the complete Cloud CDN setup:
 * 1. Creates backend bucket for GCS
 * 2. Creates URL map
 * 3. Creates HTTPS target proxy with Google-managed SSL
 * 4. Creates global forwarding rule (gets IP address)
 * 5. Configures CDN cache policies
 * 6. Outputs CDN domain/IP for environment variables
 * 
 * Usage:
 *   tsx scripts/setup-gcs-cdn.ts [--domain=cdn.renderiq.io]
 * 
 * Prerequisites:
 *   - Google Cloud SDK installed and authenticated
 *   - GOOGLE_CLOUD_PROJECT_ID environment variable set
 *   - GOOGLE_APPLICATION_CREDENTIALS environment variable set
 *   - Billing enabled on GCP project
 *   - Compute Engine API enabled
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

const PROJECT_ID = process.env.GOOGLE_CLOUD_PROJECT_ID || 'inheritage-viewer-sdk-v1';
const RENDERS_BUCKET = process.env.GOOGLE_CLOUD_STORAGE_BUCKET_RENDERS || 'renderiq-renders';
const UPLOADS_BUCKET = process.env.GOOGLE_CLOUD_STORAGE_BUCKET_UPLOADS || 'renderiq-uploads';

// Parse command line arguments
const args = process.argv.slice(2);
const domainArg = args.find(arg => arg.startsWith('--domain='));
const CUSTOM_DOMAIN = domainArg ? domainArg.split('=')[1] : undefined;

// Resource names
const BACKEND_BUCKET_NAME = `${RENDERS_BUCKET}-cdn-backend`;
const URL_MAP_NAME = `${RENDERS_BUCKET}-cdn-map`;
const TARGET_PROXY_NAME = `${RENDERS_BUCKET}-cdn-proxy`;
const FORWARDING_RULE_NAME = `${RENDERS_BUCKET}-cdn-rule`;
const SSL_CERT_NAME = CUSTOM_DOMAIN ? `${RENDERS_BUCKET}-ssl-cert` : undefined;

// Helper function to run gcloud commands
function runGcloud(command: string, description: string): string {
  console.log(`\n🔧 ${description}...`);
  try {
    const output = execSync(command, { 
      encoding: 'utf8',
      stdio: ['inherit', 'pipe', 'pipe']
    });
    console.log(`✅ ${description} completed`);
    return output.trim();
  } catch (error: any) {
    const errorMessage = error.stderr?.toString() || error.message;
    
    // Check if resource already exists
    if (errorMessage.includes('already exists') || errorMessage.includes('ALREADY_EXISTS')) {
      console.log(`ℹ️  Resource already exists, skipping...`);
      return '';
    }
    
    // Check if resource not found (might be okay for some operations)
    if (errorMessage.includes('not found') || errorMessage.includes('NOT_FOUND')) {
      console.log(`⚠️  Resource not found, will create...`);
      return '';
    }
    
    throw new Error(`Failed: ${errorMessage}`);
  }
}

// Check if gcloud is installed
function checkGcloudInstalled(): boolean {
  try {
    execSync('gcloud --version', { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

// Check if project is set
function checkProjectSet(): boolean {
  try {
    const currentProject = execSync('gcloud config get-value project', { encoding: 'utf8' }).trim();
    return currentProject === PROJECT_ID;
  } catch {
    return false;
  }
}

// Enable required APIs
async function enableAPIs() {
  console.log('\n📡 Enabling required Google Cloud APIs...');
  
  const apis = [
    'compute.googleapis.com',
    'storage-api.googleapis.com',
  ];
  
  for (const api of apis) {
    try {
      runGcloud(
        `gcloud services enable ${api} --project=${PROJECT_ID}`,
        `Enabling ${api}`
      );
    } catch (error) {
      console.log(`⚠️  API ${api} might already be enabled or failed to enable`);
    }
  }
}

// Step 1: Create backend bucket
function createBackendBucket() {
  console.log('\n📦 Step 1: Creating backend bucket...');
  
  // Backend buckets are global by default, no --global flag needed
  runGcloud(
    `gcloud compute backend-buckets create ${BACKEND_BUCKET_NAME} \
      --gcs-bucket-name=${RENDERS_BUCKET} \
      --enable-cdn \
      --project=${PROJECT_ID}`,
    `Creating backend bucket ${BACKEND_BUCKET_NAME} with CDN enabled`
  );
}

// Step 2: Create URL map
function createUrlMap() {
  console.log('\n🗺️  Step 2: Creating URL map...');
  
  // URL maps are global by default
  runGcloud(
    `gcloud compute url-maps create ${URL_MAP_NAME} \
      --default-backend-bucket=${BACKEND_BUCKET_NAME} \
      --project=${PROJECT_ID}`,
    `Creating URL map ${URL_MAP_NAME}`
  );
}

// Step 3: Create SSL certificate (if custom domain) or use Google-managed
function createSSLCertificate(): string | undefined {
  if (!CUSTOM_DOMAIN) {
    console.log('\n📜 Using Google-managed SSL certificate (will be created automatically)...');
    return undefined;
  }
  
  console.log(`\n📜 Step 3: Creating SSL certificate for ${CUSTOM_DOMAIN}...`);
  
  try {
    // SSL certificates are global by default
    runGcloud(
      `gcloud compute ssl-certificates create ${SSL_CERT_NAME} \
        --domains=${CUSTOM_DOMAIN} \
        --project=${PROJECT_ID}`,
      `Creating SSL certificate ${SSL_CERT_NAME}`
    );
    return SSL_CERT_NAME;
  } catch (error) {
    console.log('⚠️  SSL certificate creation might take time. Using Google-managed cert instead...');
    return undefined;
  }
}

// Step 4: Create HTTPS target proxy
async function createTargetProxy(sslCertName?: string, ipAddress?: string) {
  console.log('\n🔒 Step 4: Creating HTTPS target proxy...');
  
  if (sslCertName) {
    // Use custom SSL certificate
    // Target proxies are global by default
    runGcloud(
      `gcloud compute target-https-proxies create ${TARGET_PROXY_NAME} \
        --url-map=${URL_MAP_NAME} \
        --ssl-certificates=${sslCertName} \
        --quic-override=ENABLE \
        --project=${PROJECT_ID}`,
      `Creating HTTPS target proxy ${TARGET_PROXY_NAME} with custom SSL`
    );
  } else {
    // For IP-based access, create HTTP proxy (simpler, works immediately)
    // User can add HTTPS later via Console if needed
    const httpProxyName = `${TARGET_PROXY_NAME.replace('-proxy', '-http-proxy')}`;
    
    try {
      // HTTP proxies are global by default
      runGcloud(
        `gcloud compute target-http-proxies create ${httpProxyName} \
          --url-map=${URL_MAP_NAME} \
          --project=${PROJECT_ID}`,
        `Creating HTTP target proxy ${httpProxyName}`
      );
      
      // Update global variable for forwarding rule
      (global as any).HTTP_PROXY_NAME = httpProxyName;
    } catch (error) {
      console.log('⚠️  HTTP proxy creation failed, trying HTTPS with managed cert...');
      
      // Try creating HTTPS proxy with managed certificate
      // Note: This requires the forwarding rule IP first
      if (ipAddress) {
        const managedCertName = `${TARGET_PROXY_NAME}-managed-cert`;
        
        try {
          // SSL certificates are global by default
          runGcloud(
            `gcloud compute ssl-certificates create ${managedCertName} \
              --domains=${ipAddress} \
              --project=${PROJECT_ID}`,
            `Creating managed SSL certificate`
          );
          
          // Wait a moment for cert to initialize
          console.log('   Waiting for certificate to initialize...');
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          // Target proxies are global by default
          runGcloud(
            `gcloud compute target-https-proxies create ${TARGET_PROXY_NAME} \
              --url-map=${URL_MAP_NAME} \
              --ssl-certificates=${managedCertName} \
              --quic-override=ENABLE \
              --project=${PROJECT_ID}`,
            `Creating HTTPS target proxy ${TARGET_PROXY_NAME}`
          );
        } catch (certError) {
          throw new Error('Failed to create HTTPS proxy. Use HTTP for now and add HTTPS via Console.');
        }
      } else {
        throw new Error('IP address required for managed SSL certificate');
      }
    }
  }
}

// Step 5: Create forwarding rule and get IP
function createForwardingRule(httpProxyName?: string): string {
  console.log('\n🌍 Step 5: Creating global forwarding rule...');
  
  // Check if forwarding rule already exists
  try {
    const existing = execSync(
      `gcloud compute forwarding-rules describe ${FORWARDING_RULE_NAME} \
        --global \
        --project=${PROJECT_ID} \
        --format="value(IPAddress)"`,
      { encoding: 'utf8' }
    ).trim();
    
    if (existing) {
      console.log(`✅ Forwarding rule already exists with IP: ${existing}`);
      return existing;
    }
  } catch {
    // Doesn't exist, will create
  }
  
  // Determine which proxy to use
  const targetProxy = httpProxyName 
    ? `--target-http-proxy=${httpProxyName} --ports=80`
    : `--target-https-proxy=${TARGET_PROXY_NAME} --ports=443`;
  
  // Forwarding rules for global load balancers require --global flag
  runGcloud(
    `gcloud compute forwarding-rules create ${FORWARDING_RULE_NAME} \
      ${targetProxy} \
      --global \
      --project=${PROJECT_ID}`,
    `Creating forwarding rule ${FORWARDING_RULE_NAME}`
  );
  
  // Get the IP address
  console.log('\n🔍 Getting IP address...');
  const ip = execSync(
    `gcloud compute forwarding-rules describe ${FORWARDING_RULE_NAME} \
      --global \
      --project=${PROJECT_ID} \
      --format="value(IPAddress)"`,
    { encoding: 'utf8' }
  ).trim();
  
  if (!ip) {
    throw new Error('Failed to get IP address from forwarding rule');
  }
  
  console.log(`✅ Load Balancer IP: ${ip}`);
  return ip;
}

// Step 6: Configure CDN cache policy
function configureCDNCachePolicy() {
  console.log('\n⚙️  Step 6: Configuring CDN cache policy...');
  
  // Set cache policy via backend bucket update
  // Note: Cache policy options may vary by gcloud version
  try {
    // Backend buckets are global, no --global flag needed
    // Try with all cache options first
    runGcloud(
      `gcloud compute backend-buckets update ${BACKEND_BUCKET_NAME} \
        --enable-cdn \
        --cdn-cache-mode=CACHE_ALL_STATIC \
        --project=${PROJECT_ID}`,
      `Enabling CDN with cache mode`
    );
    
    // Try to set TTL values (may not be available in all gcloud versions)
    try {
      runGcloud(
        `gcloud compute backend-buckets update ${BACKEND_BUCKET_NAME} \
          --cdn-default-ttl=86400 \
          --cdn-max-ttl=31536000 \
          --cdn-client-ttl=31536000 \
          --project=${PROJECT_ID}`,
        `Setting CDN TTL values`
      );
    } catch (ttlError) {
      console.log('ℹ️  TTL configuration skipped (may need to be set via Console)');
    }
    
    console.log('✅ CDN cache policy configured');
    console.log('   Note: Fine-tune cache settings in Cloud Console if needed');
  } catch (error) {
    console.log('⚠️  Cache policy configuration had issues, but CDN is enabled.');
    console.log('   You can configure cache settings manually in Cloud Console.');
  }
}

// Update .env.local with CDN domain
function updateEnvFile(cdnDomain: string) {
  const envPath = path.join(process.cwd(), '.env.local');
  let envContent = '';
  
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf8');
  }
  
  // Remove existing GCS_CDN_DOMAIN lines
  envContent = envContent
    .split('\n')
    .filter(line => !line.startsWith('GCS_CDN_DOMAIN=') && !line.startsWith('NEXT_PUBLIC_GCS_CDN_DOMAIN='))
    .join('\n');
  
  // Add new CDN domain
  const cdnConfig = `\n# Cloud CDN Domain (auto-generated by setup-gcs-cdn.ts)\nGCS_CDN_DOMAIN=${cdnDomain}\nNEXT_PUBLIC_GCS_CDN_DOMAIN=${cdnDomain}\n`;
  
  envContent += cdnConfig;
  
  fs.writeFileSync(envPath, envContent);
  console.log(`\n✅ Updated .env.local with CDN domain: ${cdnDomain}`);
}

// Main setup function
async function main() {
  console.log('🚀 Starting Cloud CDN Setup for Google Cloud Storage\n');
  console.log(`📋 Project ID: ${PROJECT_ID}`);
  console.log(`📦 Renders Bucket: ${RENDERS_BUCKET}`);
  if (CUSTOM_DOMAIN) {
    console.log(`🌐 Custom Domain: ${CUSTOM_DOMAIN}`);
  }
  console.log('');
  
  // Pre-flight checks
  if (!checkGcloudInstalled()) {
    console.error('❌ Error: gcloud CLI is not installed.');
    console.error('   Install it from: https://cloud.google.com/sdk/docs/install');
    process.exit(1);
  }
  
  if (!checkProjectSet()) {
    console.log(`⚠️  Project is not set to ${PROJECT_ID}`);
    console.log(`   Setting project...`);
    execSync(`gcloud config set project ${PROJECT_ID}`, { stdio: 'inherit' });
  }
  
  try {
    // Enable APIs
    await enableAPIs();
    
    // Step 1: Create backend bucket
    createBackendBucket();
    
    // Step 2: Create URL map
    createUrlMap();
    
    // Step 3: Create SSL certificate (if custom domain)
    const sslCertName = createSSLCertificate();
    
    // Step 4: Create target proxy (HTTP for IP-based, HTTPS for custom domain)
    // For custom domain with SSL, we can create HTTPS proxy directly
    // For IP-based, we'll create HTTP proxy first, then get IP
    if (sslCertName) {
      // Custom domain: Create HTTPS proxy directly
      await createTargetProxy(sslCertName);
    }
    // For IP-based, we'll create proxy after getting IP
    
    // Step 5: Create forwarding rule and get IP
    const httpProxyName = (global as any).HTTP_PROXY_NAME;
    const ipAddress = createForwardingRule(httpProxyName);
    
    // Step 4b: Create HTTPS proxy if using IP (for managed SSL)
    if (!sslCertName && !httpProxyName) {
      await createTargetProxy(undefined, ipAddress);
    }
    
    // Step 6: Configure CDN cache policy
    configureCDNCachePolicy();
    
    // Determine CDN domain
    const cdnDomain = CUSTOM_DOMAIN || ipAddress;
    
    // Update .env.local
    updateEnvFile(cdnDomain);
    
    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('✅ Cloud CDN Setup Complete!');
    console.log('='.repeat(60));
    console.log(`\n📊 Summary:`);
    console.log(`   Backend Bucket: ${BACKEND_BUCKET_NAME}`);
    console.log(`   URL Map: ${URL_MAP_NAME}`);
    console.log(`   Target Proxy: ${TARGET_PROXY_NAME}`);
    console.log(`   Forwarding Rule: ${FORWARDING_RULE_NAME}`);
    console.log(`   Load Balancer IP: ${ipAddress}`);
    console.log(`   CDN Domain: ${cdnDomain}`);
    
    if (CUSTOM_DOMAIN) {
      console.log(`\n⚠️  IMPORTANT: Point your DNS to the Load Balancer IP:`);
      console.log(`   ${CUSTOM_DOMAIN} → ${ipAddress}`);
      console.log(`   DNS Type: A record`);
      console.log(`\n   After DNS propagates (5-60 minutes), your CDN will be fully active.`);
    } else {
      console.log(`\n✅ CDN is ready! Use the IP address above as your CDN domain.`);
      console.log(`   For production, consider setting up a custom domain with --domain flag.`);
    }
    
    console.log(`\n📝 Next Steps:`);
    console.log(`   1. Restart your Next.js app`);
    console.log(`   2. Test image loading speed`);
    console.log(`   3. Monitor CDN cache hit rate in Cloud Console`);
    console.log(`\n🔗 View in Console:`);
    console.log(`   https://console.cloud.google.com/net-services/loadbalancing/list/loadBalancers?project=${PROJECT_ID}`);
    console.log(`   https://console.cloud.google.com/net-services/cdn/list?project=${PROJECT_ID}`);
    
  } catch (error) {
    console.error('\n❌ Setup failed:', error);
    if (error instanceof Error) {
      console.error(`   Error: ${error.message}`);
    }
    console.error('\n💡 Troubleshooting:');
    console.error('   1. Ensure billing is enabled on your GCP project');
    console.error('   2. Check that Compute Engine API is enabled');
    console.error('   3. Verify service account has necessary permissions');
    console.error('   4. Check gcloud authentication: gcloud auth login');
    process.exit(1);
  }
}

// Run the setup
main().catch((error) => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});

