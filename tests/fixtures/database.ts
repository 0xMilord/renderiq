/**
 * Database fixtures and utilities for testing
 * Provides test database setup, teardown, and factory functions
 */

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '@/lib/db/schema';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { eq } from 'drizzle-orm';
import type { NewUser, NewProject, NewRender } from '@/lib/db/schema';
import { overrideDatabaseForTesting, restoreDatabase } from '../helpers/db-override';

let testDb: ReturnType<typeof drizzle<typeof schema>> | null = null;
let testClient: ReturnType<typeof postgres> | null = null;

/**
 * Setup test database connection and run migrations
 */
export async function setupTestDB() {
  const connectionString = process.env.DATABASE_URL;
  
  if (!connectionString) {
    throw new Error(
      'DATABASE_URL environment variable is not set.\n' +
      'Please create a .env.test file with your test database credentials.\n' +
      'See .env.test.example for reference.\n' +
      'Example: DATABASE_URL=postgresql://postgres:postgres@localhost:5432/renderiq_test'
    );
  }

  // Create connection with better error handling
  try {
    testClient = postgres(connectionString, {
      max: 1,
      prepare: false,
      ssl: connectionString.includes('localhost') ? false : 'require',
      connect_timeout: 5, // 5 second timeout
      // Suppress PostgreSQL notices during tests (they're just informational)
      onnotice: () => {}, // Suppress all notices
      transform: {
        undefined: null, // Transform undefined to null
      },
    });

    // Suppress notices for this connection
    await testClient`SET client_min_messages TO WARNING`;

    // Test connection
    await testClient`SELECT 1`;
  } catch (error: any) {
    if (error.code === 'ECONNREFUSED') {
      throw new Error(
        `Failed to connect to PostgreSQL database.\n` +
        `Connection string: ${connectionString.replace(/:[^:@]+@/, ':****@')}\n\n` +
        `Please ensure:\n` +
        `1. PostgreSQL is running (check with: pg_isready)\n` +
        `2. The test database exists (create with: createdb renderiq_test)\n` +
        `3. The credentials in .env.test are correct\n` +
        `4. PostgreSQL is listening on the correct port (default: 5432)`
      );
    }
    throw error;
  }

  testDb = drizzle(testClient, { schema });

  // Store test database instance
  // Note: The actual db used by DAL will be the one from lib/db
  // which uses DATABASE_URL from environment (set in tests/setup.ts)
  // We ensure DATABASE_URL points to test database before any imports
  overrideDatabaseForTesting(testDb);

  // Run migrations
  // Suppress migration notices - they're just informational
  try {
    await migrate(testDb, { migrationsFolder: './drizzle' });
    console.log('✅ Migrations completed successfully');
  } catch (error: any) {
    // Ignore "already exists" errors - these are expected when migrations run multiple times
    if (error?.message?.includes('already exists') || error?.code === '42P06' || error?.code === '42P07') {
      // These are just notices, not actual errors - schema/table already exists
      // This is expected when running tests multiple times
    } else {
      console.error('❌ Migration failed:', error?.message || error);
      console.error('   This may cause test failures. Please ensure migrations are up to date.');
      // Don't throw - allow tests to continue and fail with clearer errors
    }
  }

  // Verify tables exist and have correct schema
  try {
    const tables = await testClient`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'users'
    `;
    
    if (tables.length === 0) {
      throw new Error(
        'Test database appears to be empty. Tables were not created.\n' +
        'Please run migrations manually: npm run db:migrate\n' +
        'Or ensure your test database has the correct schema.'
      );
    }

    // Check if users table has default for id column
    const columnInfo = await testClient`
      SELECT column_default
      FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = 'users'
      AND column_name = 'id'
    `;
    
    if (columnInfo.length > 0 && !columnInfo[0].column_default) {
      console.warn('⚠️  Warning: users.id column does not have a default value.');
      console.warn('   This may cause test failures. Attempting to fix...');
      
      try {
        // Try to add the default if it's missing
        await testClient`
          ALTER TABLE users 
          ALTER COLUMN id SET DEFAULT gen_random_uuid()
        `;
        console.log('✅ Fixed: Added default value to users.id column');
      } catch (fixError: any) {
        console.warn('   Could not automatically fix. Please run migrations manually.');
        // Continue anyway - createTestUser will generate UUIDs explicitly
      }
    }
  } catch (error: any) {
    if (!error.message.includes('appears to be empty')) {
      // Ignore other errors in verification
    } else {
      throw error;
    }
  }

  // Clean database before tests
  await cleanDatabase();
  
  // Ensure autocommit is enabled (postgres-js uses autocommit by default, but let's be explicit)
  await testClient`SET SESSION CHARACTERISTICS AS TRANSACTION ISOLATION LEVEL READ COMMITTED`;
  
  // ✅ CRITICAL: Drop Supabase auth.users foreign key constraint for test databases
  // This constraint requires users.id to exist in auth.users.id first
  // In test databases, we create users directly, so this constraint breaks tests
  try {
    const constraintCheck = await testClient`
      SELECT constraint_name 
      FROM information_schema.table_constraints 
      WHERE constraint_name = 'users_id_auth_users_id_fk'
      AND table_name = 'users'
      AND table_schema = 'public'
    `;
    
    if (constraintCheck.length > 0) {
      await testClient`ALTER TABLE users DROP CONSTRAINT IF EXISTS users_id_auth_users_id_fk`;
      console.log('✅ Dropped Supabase auth.users foreign key constraint (test database mode)');
    }
  } catch (error: any) {
    // If we can't drop it, that's okay - might not exist or no permissions
    // The migration 0030 will handle it
    if (!error.message?.includes('does not exist')) {
      console.warn('⚠️  Could not drop auth.users constraint:', error.message);
      console.warn('   This may cause test failures. Run migration 0030 to fix.');
    }
  }

  // Try to create ensure_user_exists function if migration 0030 hasn't been run yet
  // This is a best-effort attempt - the migration should be run manually for best results
  try {
    await testClient`
      CREATE OR REPLACE FUNCTION ensure_user_exists(
        p_user_id UUID,
        p_email TEXT,
        p_name TEXT DEFAULT 'Test User',
        p_is_active BOOLEAN DEFAULT true,
        p_email_verified BOOLEAN DEFAULT true
      ) RETURNS UUID AS $$
      DECLARE
        v_user_id UUID;
      BEGIN
        SELECT id INTO v_user_id FROM users WHERE id = p_user_id;
        IF v_user_id IS NULL THEN
          INSERT INTO users (id, email, name, is_active, email_verified, created_at, updated_at)
          VALUES (p_user_id, p_email, p_name, p_is_active, p_email_verified, NOW(), NOW())
          ON CONFLICT (id) DO UPDATE SET
            email = EXCLUDED.email,
            updated_at = NOW()
          RETURNING id INTO v_user_id;
        END IF;
        RETURN v_user_id;
      END;
      $$ LANGUAGE plpgsql;
    `;
    console.log('✅ Created ensure_user_exists() function for test database');
  } catch (error: any) {
    // Function might already exist or we don't have permissions - that's okay
    // The migration 0030 should be run manually for production/test databases
    if (!error.message?.includes('already exists')) {
      console.warn('⚠️  Could not create ensure_user_exists() function:', error.message);
      console.warn('   This is not critical, but running migration 0030 is recommended.');
    }
  }
}

/**
 * Teardown test database connection
 */
export async function teardownTestDB() {
  // Restore original database connection
  restoreDatabase();
  
  if (testDb) {
    await cleanDatabase();
  }
  
  if (testClient) {
    await testClient.end();
    testClient = null;
    testDb = null;
  }
}

/**
 * Clean all tables in correct order (respecting foreign key constraints)
 */
export async function cleanDatabase() {
  if (!testDb) {
    throw new Error('Test database not initialized. Call setupTestDB() first.');
  }

  // Delete in reverse order of dependencies (respecting foreign key constraints)
  await testDb.delete(schema.userLikes);
  await testDb.delete(schema.galleryItems);
  await testDb.delete(schema.renderVersions);
  await testDb.delete(schema.renders);
  await testDb.delete(schema.renderQueue);
  await testDb.delete(schema.toolAnalytics);
  await testDb.delete(schema.toolExecutions);
  await testDb.delete(schema.toolSettingsTemplates);
  await testDb.delete(schema.tools);
  await testDb.delete(schema.canvasGraphs);
  await testDb.delete(schema.canvasFileVersions);
  await testDb.delete(schema.canvasFiles);
  await testDb.delete(schema.projectRules);
  await testDb.delete(schema.renderChains);
  await testDb.delete(schema.projectVersions);
  await testDb.delete(schema.projects);
  await testDb.delete(schema.fileVersions);
  await testDb.delete(schema.fileStorage);
  await testDb.delete(schema.creditTransactions);
  await testDb.delete(schema.userCredits);
  await testDb.delete(schema.ambassadorCommissions);
  await testDb.delete(schema.ambassadorPayouts);
  await testDb.delete(schema.ambassadorReferrals);
  await testDb.delete(schema.ambassadorLinks);
  await testDb.delete(schema.ambassadors);
  await testDb.delete(schema.accountActivity);
  await testDb.delete(schema.sybilDetections);
  await testDb.delete(schema.deviceFingerprints);
  await testDb.delete(schema.ipAddresses);
  await testDb.delete(schema.userSubscriptions);
  await testDb.delete(schema.invoices);
  await testDb.delete(schema.paymentOrders);
  await testDb.delete(schema.creditPackages);
  await testDb.delete(schema.subscriptionPlans);
  await testDb.delete(schema.ambassadorVolumeTiers);
  await testDb.delete(schema.notifications);
  await testDb.delete(schema.usageTracking);
  await testDb.delete(schema.apiRateLimits);
  await testDb.delete(schema.userSettings);
  await testDb.delete(schema.users);
}

/**
 * Get test database instance
 */
export function getTestDB() {
  if (!testDb) {
    throw new Error('Test database not initialized. Call setupTestDB() first.');
  }
  return testDb;
}

/**
 * Get the raw postgres client for direct SQL queries
 */
export function getTestClient() {
  if (!testClient) {
    throw new Error('Test database client not initialized. Call setupTestDB() first.');
  }
  return testClient;
}

// ==================== Factory Functions ====================

/**
 * Create a test user
 */
export async function createTestUser(data?: Partial<NewUser>) {
  const db = getTestDB();
  const client = getTestClient();
  const timestamp = Date.now();
  
  // Explicitly generate UUID if not provided (for databases that don't have defaultRandom())
  const { randomUUID } = await import('crypto');
  const userId = data?.id || randomUUID();
  
  // Validate UUID format if provided
  if (data?.id && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(data.id)) {
    throw new Error(`Invalid UUID format: ${data.id}. Must be a valid UUID.`);
  }
  
  const email = data?.email || `test-${timestamp}@example.com`;
  const name = data?.name || 'Test User';
  const isActive = data?.isActive !== undefined ? data.isActive : true;
  const emailVerified = data?.emailVerified !== undefined ? data.emailVerified : true;
  
  try {
    // Try using ensure_user_exists function if it exists (from migration 0030)
    // This ensures the user is immediately visible in subsequent queries
    try {
      const [result] = await client`
        SELECT ensure_user_exists(
          ${userId}::UUID,
          ${email}::TEXT,
          ${name}::TEXT,
          ${isActive}::BOOLEAN,
          ${emailVerified}::BOOLEAN
        ) as user_id
      `;
      
      // Fetch the user with all fields
      const [user] = await db.select()
        .from(schema.users)
        .where(eq(schema.users.id, result.user_id))
        .limit(1);
      
      if (user) {
        // Update any additional fields that were provided
        if (Object.keys(data || {}).length > 0) {
          const updated = await db.update(schema.users)
            .set({ ...data, updatedAt: new Date() })
            .where(eq(schema.users.id, userId))
            .returning();
          return updated[0] || user;
        }
        return user;
      }
    } catch (funcError: any) {
      // Function doesn't exist yet (migration 0030 not run), fall back to direct insert
      if (funcError.message?.includes('does not exist') || funcError.code === '42883') {
        // Continue to direct insert method
      } else {
        throw funcError;
      }
    }
    
    // Fallback: Direct insert (if ensure_user_exists function doesn't exist)
    const [user] = await db.insert(schema.users).values({
      id: userId,
      email,
      name,
      isActive,
      emailVerified,
      ...data,
    }).returning();
    
    if (!user) {
      throw new Error('Failed to create test user - no user returned from insert');
    }
    
    // Force a commit by doing a simple query (ensures transaction is committed)
    await client`SELECT 1`;
    
    // Verify the user was actually inserted by querying it back
    // Use retry loop in case of transaction timing
    let verifyUser;
    for (let attempt = 0; attempt < 5; attempt++) {
      verifyUser = await db.select().from(schema.users).where(eq(schema.users.id, userId)).limit(1);
      if (verifyUser.length > 0) {
        break;
      }
      // Small delay to allow transaction to commit
      if (attempt < 4) {
        await new Promise(resolve => setTimeout(resolve, 50));
      }
    }
    
    if (!verifyUser || verifyUser.length === 0) {
      throw new Error(
        `User insert appeared to succeed but user not found in database after retries. ` +
        `User ID: ${userId}, Email: ${user.email}. ` +
        `This may indicate a transaction/commit issue. ` +
        `Please run migration 0030_fix_test_db_users_setup.sql to enable ensure_user_exists() function.`
      );
    }
    
    return user;
  } catch (error: any) {
    if (error.code === '23505') { // Unique violation
      // User already exists, try to fetch it
      const existingUser = await db.select().from(schema.users).where(eq(schema.users.id, userId)).limit(1);
      if (existingUser.length > 0) {
        return existingUser[0];
      }
    }
    // Re-throw with more context
    throw new Error(
      `Failed to create test user with ID ${userId}: ${error.message || error}. ` +
      `Error code: ${error.code || 'unknown'}`
    );
  }
}

/**
 * Create a test project
 */
export async function createTestProject(userId: string, data?: Partial<NewProject>) {
  const db = getTestDB();
  const timestamp = Date.now();
  
  // Verify user exists before creating project
  // Use a small retry loop in case of transaction timing issues
  let user;
  for (let attempt = 0; attempt < 3; attempt++) {
    user = await db.select().from(schema.users).where(eq(schema.users.id, userId)).limit(1);
    if (user.length > 0) {
      break;
    }
    // Small delay to allow transaction to commit
    if (attempt < 2) {
      await new Promise(resolve => setTimeout(resolve, 10));
    }
  }
  
  if (!user || user.length === 0) {
    // Get more context for debugging
    const allUsers = await db.select({ id: schema.users.id, email: schema.users.email }).from(schema.users).limit(10);
    throw new Error(
      `Cannot create project: User with id "${userId}" does not exist in the database. ` +
      `Make sure to create the user first using createTestUser(). ` +
      `Found ${allUsers.length} users in database: ${allUsers.map(u => u.id).join(', ')}`
    );
  }
  
  const [project] = await db.insert(schema.projects).values({
    userId,
    name: `Test Project ${timestamp}`,
    slug: `test-project-${timestamp}`,
    platform: 'render',
    status: 'completed',
    ...data,
  }).returning();
  
  if (!project) {
    throw new Error('Failed to create test project - no project returned from insert');
  }
  
  return project;
}

/**
 * Create a test render chain
 */
export async function createTestRenderChain(projectId: string, data?: Partial<typeof schema.renderChains.$inferInsert>) {
  const db = getTestDB();
  
  const [chain] = await db.insert(schema.renderChains).values({
    projectId,
    name: 'Test Chain',
    ...data,
  }).returning();
  
  return chain;
}

/**
 * Create a test render
 */
export async function createTestRender(
  userId: string,
  projectId: string,
  data?: Partial<NewRender>
) {
  const db = getTestDB();
  
  // Verify project exists before creating render
  let project;
  for (let attempt = 0; attempt < 3; attempt++) {
    project = await db.select().from(schema.projects).where(eq(schema.projects.id, projectId)).limit(1);
    if (project.length > 0) {
      break;
    }
    // Small delay to allow transaction to commit
    if (attempt < 2) {
      await new Promise(resolve => setTimeout(resolve, 10));
    }
  }
  
  if (!project || project.length === 0) {
    throw new Error(
      `Cannot create render: Project with id "${projectId}" does not exist in the database. ` +
      `Make sure to create the project first using createTestProject().`
    );
  }
  
  const [render] = await db.insert(schema.renders).values({
    userId,
    projectId,
    type: 'image',
    prompt: 'Test prompt',
    status: 'completed',
    settings: {
      style: 'photorealistic',
      quality: 'high',
      aspectRatio: '16:9',
    },
    ...data,
  }).returning();
  
  if (!render) {
    throw new Error('Failed to create test render - no render returned from insert');
  }
  
  return render;
}

/**
 * Create test user credits
 */
export async function createTestUserCredits(userId: string, balance: number = 100) {
  const db = getTestDB();
  
  const [credits] = await db.insert(schema.userCredits).values({
    userId,
    balance,
    totalEarned: balance,
    totalSpent: 0,
  }).returning();
  
  return credits;
}

/**
 * Create test file storage entry
 */
export async function createTestFileStorage(userId: string, data?: Partial<typeof schema.fileStorage.$inferInsert>) {
  const db = getTestDB();
  const timestamp = Date.now();
  
  const [file] = await db.insert(schema.fileStorage).values({
    userId,
    fileName: `test-file-${timestamp}.jpg`,
    originalName: `test-file-${timestamp}.jpg`,
    mimeType: 'image/jpeg',
    size: 1024,
    url: `https://example.com/test-file-${timestamp}.jpg`,
    key: `test-file-${timestamp}.jpg`,
    bucket: 'test-bucket',
    isPublic: false,
    ...data,
  }).returning();
  
  return file;
}

/**
 * Create test subscription plan
 */
export async function createTestSubscriptionPlan(data?: Partial<typeof schema.subscriptionPlans.$inferInsert>) {
  const db = getTestDB();
  
  const [plan] = await db.insert(schema.subscriptionPlans).values({
    name: 'Test Plan',
    description: 'Test subscription plan',
    price: '9.99',
    currency: 'USD',
    interval: 'month',
    creditsPerMonth: 100,
    isActive: true,
    ...data,
  }).returning();
  
  return plan;
}

/**
 * Create test credit package
 */
export async function createTestCreditPackage(data?: Partial<typeof schema.creditPackages.$inferInsert>) {
  const db = getTestDB();
  
  const [pkg] = await db.insert(schema.creditPackages).values({
    name: 'Test Package',
    description: 'Test credit package',
    credits: 100,
    price: '9.99',
    currency: 'INR',
    bonusCredits: 0,
    isActive: true,
    ...data,
  }).returning();
  
  return pkg;
}

/**
 * Create test tool
 */
export async function createTestTool(data?: Partial<typeof schema.tools.$inferInsert>) {
  const db = getTestDB();
  const timestamp = Date.now();
  
  const [tool] = await db.insert(schema.tools).values({
    slug: `test-tool-${timestamp}`,
    name: 'Test Tool',
    description: 'Test tool description',
    category: 'transformation',
    systemPrompt: 'Test system prompt',
    inputType: 'image',
    outputType: 'image',
    status: 'online',
    isActive: true,
    ...data,
  }).returning();
  
  return tool;
}

/**
 * Create test canvas file
 */
export async function createTestCanvasFile(projectId: string, userId: string, data?: Partial<typeof schema.canvasFiles.$inferInsert>) {
  const db = getTestDB();
  const timestamp = Date.now();
  
  const [file] = await db.insert(schema.canvasFiles).values({
    projectId,
    userId,
    name: `Test Canvas File ${timestamp}`,
    slug: `test-canvas-file-${timestamp}`,
    version: 1,
    isActive: true,
    ...data,
  }).returning();
  
  return file;
}

/**
 * Create test canvas graph
 */
export async function createTestCanvasGraph(
  fileId: string,
  projectId: string,
  userId: string,
  data?: Partial<typeof schema.canvasGraphs.$inferInsert>
) {
  const db = getTestDB();
  
  const [graph] = await db.insert(schema.canvasGraphs).values({
    fileId,
    projectId,
    userId,
    nodes: [],
    connections: [],
    version: 1,
    ...data,
  }).returning();
  
  return graph;
}

/**
 * Create test payment order
 */
export async function createTestPaymentOrder(
  userId: string,
  data?: Partial<typeof schema.paymentOrders.$inferInsert>
) {
  const db = getTestDB();
  
  const [order] = await db.insert(schema.paymentOrders).values({
    userId,
    type: 'credit_package',
    amount: '9.99',
    currency: 'INR',
    status: 'pending',
    ...data,
  }).returning();
  
  return order;
}

/**
 * Create test session (mock for authentication)
 */
export async function createTestSession(userId: string) {
  // This is a mock session - in real tests, you'd use your auth system
  return {
    userId,
    token: `test-token-${userId}-${Date.now()}`,
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
  };
}

