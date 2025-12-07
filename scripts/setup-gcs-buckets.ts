/**
 * Setup Google Cloud Storage buckets for Renderiq
 * 
 * This script creates the necessary GCS buckets and configures them:
 * - renderiq-renders (public, for generated images/videos)
 * - renderiq-uploads (private, for user uploads)
 * - renderiq-receipts (private, for PDF receipts)
 * 
 * Usage:
 *   tsx scripts/setup-gcs-buckets.ts
 * 
 * Prerequisites:
 *   - Google Cloud SDK installed and authenticated
 *   - GOOGLE_CLOUD_PROJECT_ID environment variable set
 *   - GOOGLE_APPLICATION_CREDENTIALS environment variable set (or use gcloud auth)
 */

import { Storage } from '@google-cloud/storage';
import * as fs from 'fs';
import * as path from 'path';

// Load environment variables (Next.js handles this automatically, but we can manually load for scripts)
if (typeof process.env.NODE_ENV === 'undefined' || process.env.NODE_ENV !== 'production') {
  try {
    // Try to load .env.local if it exists
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
    // Ignore errors, environment variables may already be set
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

// Determine service account key file path
let keyFilename: string | undefined = process.env.GOOGLE_APPLICATION_CREDENTIALS;

// If not set or path is invalid/not a file, try to find service-account-key.json in project root
if (!isValidKeyFile(keyFilename)) {
  const rootKeyPath = path.resolve(process.cwd(), 'service-account-key.json');
  if (isValidKeyFile(rootKeyPath)) {
    keyFilename = rootKeyPath;
    console.log(`📁 Using service account key from project root: ${keyFilename}\n`);
  } else {
    console.warn('⚠️  Warning: No service account key file found.');
    console.warn('   Set GOOGLE_APPLICATION_CREDENTIALS environment variable or place service-account-key.json in project root.\n');
  }
} else {
  keyFilename = path.resolve(keyFilename!);
  console.log(`📁 Using service account key from: ${keyFilename}\n`);
}

// Initialize Storage client
const storage = new Storage({
  projectId: PROJECT_ID,
  keyFilename: keyFilename,
});

interface BucketConfig {
  name: string;
  public: boolean;
  cors: Array<{
    origin: string[];
    method: string[];
    responseHeader: string[];
    maxAgeSeconds: number;
  }>;
  lifecycle?: {
    rule: Array<{
      action: { type: string };
      condition: { age: number };
    }>;
  };
}

const bucketConfigs: BucketConfig[] = [
  {
    name: RENDERS_BUCKET,
    public: true,
    cors: [
      {
        origin: [
          'https://renderiq.io',
          'https://www.renderiq.io',
          'https://*.renderiq.io',
          'http://localhost:3000',
          'http://localhost:3001',
        ],
        method: ['GET', 'HEAD', 'OPTIONS'],
        responseHeader: ['Content-Type', 'Cache-Control', 'Content-Disposition'],
        maxAgeSeconds: 3600,
      },
    ],
  },
  {
    name: UPLOADS_BUCKET,
    public: true, // Public so app can display uploaded images (style references, input images, etc.)
    cors: [
      {
        origin: [
          'https://renderiq.io',
          'https://www.renderiq.io',
          'https://*.renderiq.io',
          'http://localhost:3000',
          'http://localhost:3001',
        ],
        method: ['GET', 'HEAD', 'POST', 'PUT', 'OPTIONS'],
        responseHeader: ['Content-Type', 'Cache-Control', 'Content-Disposition'],
        maxAgeSeconds: 3600,
      },
    ],
  },
  {
    name: RECEIPTS_BUCKET,
    public: false,
    cors: [
      {
        origin: [
          'https://renderiq.io',
          'https://www.renderiq.io',
          'https://*.renderiq.io',
          'http://localhost:3000',
          'http://localhost:3001',
        ],
        method: ['GET', 'HEAD', 'OPTIONS'],
        responseHeader: ['Content-Type', 'Cache-Control', 'Content-Disposition'],
        maxAgeSeconds: 3600,
      },
    ],
    lifecycle: {
      rule: [
        {
          action: { type: 'Delete' as const },
          condition: { age: 365 }, // Delete receipts older than 1 year
        },
      ],
    },
  },
];

async function setupBuckets() {
  console.log('🚀 Setting up Google Cloud Storage buckets...\n');
  console.log(`📋 Project ID: ${PROJECT_ID}\n`);

  for (const config of bucketConfigs) {
    try {
      const bucket = storage.bucket(config.name);

      // Check if bucket exists
      const [exists] = await bucket.exists();
      
      if (exists) {
        console.log(`✅ Bucket "${config.name}" already exists`);
      } else {
        // Create bucket
        console.log(`📦 Creating bucket "${config.name}"...`);
        await bucket.create({
          location: 'us-central1', // Change to your preferred region
          storageClass: 'STANDARD',
          versioning: {
            enabled: false,
          },
        });
        console.log(`✅ Bucket "${config.name}" created successfully`);
      }

      // Configure CORS
      console.log(`🔧 Configuring CORS for "${config.name}"...`);
      await bucket.setCorsConfiguration(config.cors);
      console.log(`✅ CORS configured for "${config.name}"`);

      // Set public access based on config
      if (config.public) {
        console.log(`🌐 Making "${config.name}" publicly readable...`);
        // First, check if uniform bucket-level access is enabled
        const [metadata] = await bucket.getMetadata();
        if (metadata.iamConfiguration?.uniformBucketLevelAccess?.enabled) {
          // With uniform bucket-level access, we need to grant public access via IAM
          // Make the bucket public
          await bucket.makePublic();
        } else {
          // Without uniform bucket-level access, make individual files public
          await bucket.makePublic();
        }
        console.log(`✅ "${config.name}" is now publicly readable`);
      } else {
        // Ensure private bucket is not public
        console.log(`🔒 Ensuring "${config.name}" is private...`);
        const [metadata] = await bucket.getMetadata();
        if (metadata.iamConfiguration?.publicAccessPrevention !== 'enforced') {
          await bucket.setMetadata({
            iamConfiguration: {
              publicAccessPrevention: 'enforced',
            },
          });
        }
        console.log(`✅ "${config.name}" is private`);
      }

      // Configure lifecycle rules if specified
      if (config.lifecycle) {
        console.log(`⏰ Configuring lifecycle rules for "${config.name}"...`);
        await bucket.setMetadata({
          lifecycle: {
            rule: config.lifecycle.rule.map(rule => ({
              action: { type: rule.action.type as 'Delete' },
              condition: rule.condition,
            })),
          },
        });
        console.log(`✅ Lifecycle rules configured for "${config.name}"`);
      }

      // Set uniform bucket-level access
      console.log(`🔐 Setting uniform bucket-level access for "${config.name}"...`);
      await bucket.setMetadata({
        iamConfiguration: {
          uniformBucketLevelAccess: {
            enabled: true,
          },
        },
      });
      console.log(`✅ Uniform bucket-level access enabled for "${config.name}"`);

      console.log(`\n`);
    } catch (error) {
      console.error(`❌ Failed to setup bucket "${config.name}":`, error);
      if (error instanceof Error) {
        console.error(`   Error message: ${error.message}`);
      }
      process.exit(1);
    }
  }

  console.log('🎉 All buckets setup completed successfully!\n');
  console.log('📝 Next steps:');
  console.log('   1. Enable Cloud CDN for the renders bucket (optional but recommended)');
  console.log('   2. Set up IAM permissions for service account');
  console.log('   3. Configure custom domain for CDN (optional)');
  console.log('   4. Update environment variables in your .env file');
  console.log('\n');
}

// Run the setup
setupBuckets().catch((error) => {
  console.error('❌ Setup failed:', error);
  process.exit(1);
});

