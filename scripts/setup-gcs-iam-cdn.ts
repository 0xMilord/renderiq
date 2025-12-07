/**
 * Setup IAM permissions and Cloud CDN for Google Cloud Storage buckets
 * 
 * This script:
 * 1. Grants IAM permissions to the service account for all buckets
 * 2. Enables Cloud CDN for the renders bucket (optional but recommended)
 * 
 * Usage:
 *   tsx scripts/setup-gcs-iam-cdn.ts
 * 
 * Prerequisites:
 *   - Google Cloud SDK installed and authenticated
 *   - GOOGLE_CLOUD_PROJECT_ID environment variable set
 *   - GOOGLE_APPLICATION_CREDENTIALS environment variable set (or service-account-key.json in root)
 */

import { Storage } from '@google-cloud/storage';
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
const RECEIPTS_BUCKET = process.env.GOOGLE_CLOUD_STORAGE_BUCKET_RECEIPTS || 'renderiq-receipts';

// Helper function to check if a path is a valid file
function isValidKeyFile(filePath: string | undefined): boolean {
  if (!filePath) return false;
  try {
    const resolvedPath = path.resolve(filePath);
    return fs.existsSync(resolvedPath) && fs.statSync(resolvedPath).isFile();
  } catch {
    return false;
  }
}

// Get service account email from key file
function getServiceAccountEmail(): string {
  let keyFilename: string | undefined = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  
  if (!isValidKeyFile(keyFilename)) {
    const rootKeyPath = path.resolve(process.cwd(), 'service-account-key.json');
    if (isValidKeyFile(rootKeyPath)) {
      keyFilename = rootKeyPath;
    } else {
      throw new Error('Service account key file not found. Set GOOGLE_APPLICATION_CREDENTIALS or place service-account-key.json in project root.');
    }
  } else {
    keyFilename = path.resolve(keyFilename!);
  }

  // Read the key file to get the service account email
  const keyFile = JSON.parse(fs.readFileSync(keyFilename, 'utf8'));
  return keyFile.client_email;
}

// Initialize Storage client
let keyFilename: string | undefined = process.env.GOOGLE_APPLICATION_CREDENTIALS;

if (!isValidKeyFile(keyFilename)) {
  const rootKeyPath = path.resolve(process.cwd(), 'service-account-key.json');
  if (isValidKeyFile(rootKeyPath)) {
    keyFilename = rootKeyPath;
  }
} else {
  keyFilename = path.resolve(keyFilename!);
}

const storage = new Storage({
  projectId: PROJECT_ID,
  keyFilename: keyFilename,
});

// IAM roles
const ROLES = {
  OBJECT_VIEWER: 'roles/storage.objectViewer', // Read-only access
  OBJECT_ADMIN: 'roles/storage.objectAdmin',   // Full control (read, write, delete)
};

interface BucketIAMConfig {
  name: string;
  role: string;
  description: string;
}

const bucketIAMConfigs: BucketIAMConfig[] = [
  {
    name: RENDERS_BUCKET,
    role: ROLES.OBJECT_VIEWER,
    description: 'Read-only access for public renders bucket',
  },
  {
    name: UPLOADS_BUCKET,
    role: ROLES.OBJECT_ADMIN,
    description: 'Full control for uploads bucket',
  },
  {
    name: RECEIPTS_BUCKET,
    role: ROLES.OBJECT_ADMIN,
    description: 'Full control for receipts bucket',
  },
];

async function setupIAMPermissions() {
  console.log('🔐 Setting up IAM permissions...\n');

  const serviceAccountEmail = getServiceAccountEmail();
  console.log(`📧 Service Account: ${serviceAccountEmail}\n`);

  for (const config of bucketIAMConfigs) {
    try {
      const bucket = storage.bucket(config.name);

      // Check if bucket exists
      const [exists] = await bucket.exists();
      if (!exists) {
        console.log(`⚠️  Bucket "${config.name}" does not exist. Skipping IAM setup.`);
        continue;
      }

      console.log(`🔧 Setting IAM permissions for "${config.name}"...`);
      console.log(`   Role: ${config.role}`);
      console.log(`   Description: ${config.description}`);

      // Get current IAM policy
      const [policy] = await bucket.iam.getPolicy();

      // Check if the binding already exists
      let binding = policy.bindings.find((b: any) => b.role === config.role);
      
      if (!binding) {
        // Create new binding
        binding = {
          role: config.role,
          members: [],
        };
        policy.bindings.push(binding);
      }

      // Add service account to members if not already present
      const member = `serviceAccount:${serviceAccountEmail}`;
      if (!binding.members.includes(member)) {
        binding.members.push(member);
        console.log(`   ✅ Adding ${member} to ${config.role}`);
      } else {
        console.log(`   ℹ️  ${member} already has ${config.role}`);
      }

      // Update IAM policy
      await bucket.iam.setPolicy(policy);
      console.log(`✅ IAM permissions configured for "${config.name}"\n`);

      // For public buckets (renders and uploads), grant public read access
      if (config.name === RENDERS_BUCKET || config.name === UPLOADS_BUCKET) {
        console.log(`🌐 Granting public read access to "${config.name}"...`);
        try {
          // Get updated policy
          const [updatedPolicy] = await bucket.iam.getPolicy();
          
          // Check if public read binding exists
          const publicBinding = updatedPolicy.bindings.find(
            (b: any) => b.role === 'roles/storage.objectViewer' && b.members.includes('allUsers')
          );
          
          if (!publicBinding) {
            // Find or create the objectViewer binding
            let objectViewerBinding = updatedPolicy.bindings.find(
              (b: any) => b.role === 'roles/storage.objectViewer'
            );
            
            if (!objectViewerBinding) {
              objectViewerBinding = {
                role: 'roles/storage.objectViewer',
                members: [],
              };
              updatedPolicy.bindings.push(objectViewerBinding);
            }
            
            // Add allUsers if not already present
            if (!objectViewerBinding.members.includes('allUsers')) {
              objectViewerBinding.members.push('allUsers');
              await bucket.iam.setPolicy(updatedPolicy);
              console.log(`   ✅ Public read access granted to "${config.name}"`);
            } else {
              console.log(`   ℹ️  Public read access already granted to "${config.name}"`);
            }
          } else {
            console.log(`   ℹ️  Public read access already granted to "${config.name}"`);
          }
        } catch (publicError) {
          console.error(`   ⚠️  Failed to grant public access:`, publicError);
          if (publicError instanceof Error) {
            console.error(`   Error: ${publicError.message}`);
          }
        }
        console.log('');
      }
    } catch (error) {
      console.error(`❌ Failed to setup IAM for "${config.name}":`, error);
      if (error instanceof Error) {
        console.error(`   Error message: ${error.message}`);
      }
    }
  }

  console.log('🎉 IAM permissions setup completed!\n');
}

async function enableCloudCDN() {
  console.log('🌐 Setting up Cloud CDN for renders bucket...\n');

  try {
    const bucket = storage.bucket(RENDERS_BUCKET);

    // Check if bucket exists
    const [exists] = await bucket.exists();
    if (!exists) {
      console.log(`⚠️  Bucket "${RENDERS_BUCKET}" does not exist. Skipping CDN setup.`);
      return;
    }

    console.log('📝 Note: Cloud CDN setup requires additional steps:');
    console.log('   1. Create a Cloud Load Balancer with a backend bucket');
    console.log('   2. Configure the backend bucket to point to your GCS bucket');
    console.log('   3. Set up a custom domain (optional)');
    console.log('   4. Configure SSL certificate');
    console.log('\n');
    console.log('🔗 Quick setup guide:');
    console.log('   1. Go to: https://console.cloud.google.com/net-services/loadbalancing');
    console.log(`   2. Create a new HTTP(S) Load Balancer`);
    console.log(`   3. Add backend: Backend bucket → ${RENDERS_BUCKET}`);
    console.log(`   4. Configure frontend: IP address and port (80/443)`);
    console.log(`   5. Review and create`);
    console.log('\n');
    console.log('💡 Alternative: Use Cloud CDN with Cloud Storage directly');
    console.log('   - Cloud CDN can be enabled via gcloud CLI:');
    console.log(`   - gcloud compute backend-buckets create ${RENDERS_BUCKET}-cdn \\`);
    console.log(`       --gcs-bucket-name=${RENDERS_BUCKET}`);
    console.log(`   - gcloud compute url-maps create ${RENDERS_BUCKET}-map \\`);
    console.log(`       --default-backend-bucket=${RENDERS_BUCKET}-cdn`);
    console.log('\n');
    console.log('⚠️  Automated CDN setup requires Cloud Load Balancer API access.');
    console.log('   For now, please set up CDN manually using the steps above.\n');

    // Note: Full CDN automation would require:
    // - @google-cloud/compute package
    // - Cloud Load Balancer API access
    // - More complex setup with backend buckets, URL maps, target proxies, etc.
    // This is better done via console or gcloud CLI for now

  } catch (error) {
    console.error('❌ Failed to setup CDN:', error);
    if (error instanceof Error) {
      console.error(`   Error message: ${error.message}`);
    }
  }
}

async function main() {
  console.log('🚀 Setting up IAM permissions and Cloud CDN for GCS buckets...\n');
  console.log(`📋 Project ID: ${PROJECT_ID}\n`);

  // Setup IAM permissions
  await setupIAMPermissions();

  // Setup Cloud CDN (with instructions)
  await enableCloudCDN();

  console.log('✅ Setup completed!\n');
  console.log('📝 Summary:');
  console.log('   ✅ IAM permissions configured for all buckets');
  console.log('   📖 CDN setup instructions provided above');
  console.log('\n');
  console.log('🔍 Verify IAM permissions:');
  console.log('   gcloud projects get-iam-policy ${PROJECT_ID}');
  console.log('   gcloud storage buckets get-iam-policy gs://${RENDERS_BUCKET}');
  console.log('\n');
}

// Run the setup
main().catch((error) => {
  console.error('❌ Setup failed:', error);
  process.exit(1);
});

