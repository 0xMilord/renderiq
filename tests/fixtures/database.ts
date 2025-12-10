/**
 * Database fixtures and utilities for testing
 * Provides test database setup, teardown, and factory functions
 */

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '@/lib/db/schema';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
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
    throw new Error('DATABASE_URL environment variable is not set');
  }

  // Create connection
  testClient = postgres(connectionString, {
    max: 1,
    prepare: false,
    ssl: connectionString.includes('localhost') ? false : 'require',
  });

  testDb = drizzle(testClient, { schema });

  // Store test database instance
  // Note: The actual db used by DAL will be the one from lib/db
  // which uses DATABASE_URL from environment (set in tests/setup.ts)
  // We ensure DATABASE_URL points to test database before any imports
  overrideDatabaseForTesting(testDb);

  // Run migrations
  try {
    await migrate(testDb, { migrationsFolder: './drizzle' });
  } catch (error) {
    console.warn('Migration failed, continuing with existing schema:', error);
  }

  // Clean database before tests
  await cleanDatabase();
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

// ==================== Factory Functions ====================

/**
 * Create a test user
 */
export async function createTestUser(data?: Partial<NewUser>) {
  const db = getTestDB();
  const timestamp = Date.now();
  
  const [user] = await db.insert(schema.users).values({
    email: `test-${timestamp}@example.com`,
    name: 'Test User',
    isActive: true,
    emailVerified: true,
    ...data,
  }).returning();
  
  return user;
}

/**
 * Create a test project
 */
export async function createTestProject(userId: string, data?: Partial<NewProject>) {
  const db = getTestDB();
  const timestamp = Date.now();
  
  const [project] = await db.insert(schema.projects).values({
    userId,
    name: `Test Project ${timestamp}`,
    slug: `test-project-${timestamp}`,
    platform: 'render',
    status: 'completed',
    ...data,
  }).returning();
  
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

