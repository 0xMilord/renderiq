import { pgTable, text, timestamp, uuid, integer, boolean, jsonb, decimal, bigint } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';

// Users table with enhanced profile
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  name: text('name'),
  avatar: text('avatar'),
  bio: text('bio'),
  website: text('website'),
  location: text('location'),
  isActive: boolean('is_active').default(true).notNull(),
  isAdmin: boolean('is_admin').default(false).notNull(),
  emailVerified: boolean('email_verified').default(false).notNull(),
  lastLoginAt: timestamp('last_login_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Subscription plans
export const subscriptionPlans = pgTable('subscription_plans', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  description: text('description'),
  price: decimal('price', { precision: 10, scale: 2 }).notNull(),
  currency: text('currency').default('USD').notNull(),
  interval: text('interval', { enum: ['month', 'year'] }).notNull(),
  creditsPerMonth: integer('credits_per_month').notNull(),
  maxProjects: integer('max_projects'),
  maxRendersPerProject: integer('max_renders_per_project'),
  features: jsonb('features').$type<string[]>(),
  razorpayPlanId: text('razorpay_plan_id'), // Razorpay plan ID for recurring subscriptions
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Credit packages for one-time purchases
export const creditPackages = pgTable('credit_packages', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  description: text('description'),
  credits: integer('credits').notNull(),
  price: decimal('price', { precision: 10, scale: 2 }).notNull(),
  currency: text('currency').default('INR').notNull(), // Razorpay uses INR
  bonusCredits: integer('bonus_credits').default(0).notNull(), // Bonus credits (like "Buy 100, Get 10 free")
  isPopular: boolean('is_popular').default(false).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  displayOrder: integer('display_order').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Payment orders for tracking Razorpay payments
export const paymentOrders = pgTable('payment_orders', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  type: text('type', { enum: ['subscription', 'credit_package'] }).notNull(),
  referenceId: uuid('reference_id'), // plan_id or credit_package_id
  razorpayOrderId: text('razorpay_order_id').unique(),
  razorpayPaymentId: text('razorpay_payment_id'),
  razorpaySubscriptionId: text('razorpay_subscription_id'),
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
  currency: text('currency').default('INR').notNull(),
  status: text('status', { enum: ['pending', 'processing', 'completed', 'failed', 'cancelled'] }).default('pending').notNull(),
  metadata: jsonb('metadata').$type<Record<string, any>>(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// User subscriptions
export const userSubscriptions = pgTable('user_subscriptions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  planId: uuid('plan_id').references(() => subscriptionPlans.id).notNull(),
  status: text('status', { enum: ['active', 'canceled', 'past_due', 'unpaid'] }).notNull(),
  stripeSubscriptionId: text('stripe_subscription_id').unique(),
  stripeCustomerId: text('stripe_customer_id'),
  razorpaySubscriptionId: text('razorpay_subscription_id').unique(),
  razorpayCustomerId: text('razorpay_customer_id'),
  currentPeriodStart: timestamp('current_period_start').notNull(),
  currentPeriodEnd: timestamp('current_period_end').notNull(),
  cancelAtPeriodEnd: boolean('cancel_at_period_end').default(false).notNull(),
  canceledAt: timestamp('canceled_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Credits system
export const userCredits = pgTable('user_credits', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  balance: integer('balance').default(0).notNull(),
  totalEarned: integer('total_earned').default(0).notNull(),
  totalSpent: integer('total_spent').default(0).notNull(),
  lastResetAt: timestamp('last_reset_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Credit transactions
export const creditTransactions = pgTable('credit_transactions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  amount: integer('amount').notNull(), // positive for earned, negative for spent
  type: text('type', { enum: ['earned', 'spent', 'refund', 'bonus'] }).notNull(),
  description: text('description').notNull(),
  referenceId: text('reference_id'), // ID of related entity (render, subscription, etc.)
  referenceType: text('reference_type', { enum: ['render', 'subscription', 'bonus', 'refund'] }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// File storage metadata
export const fileStorage = pgTable('file_storage', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  fileName: text('file_name').notNull(),
  originalName: text('original_name').notNull(),
  mimeType: text('mime_type').notNull(),
  size: bigint('size', { mode: 'number' }).notNull(),
  url: text('url').notNull(),
  key: text('key').notNull(),
  bucket: text('bucket').notNull(),
  isPublic: boolean('is_public').default(false).notNull(),
  metadata: jsonb('metadata').$type<Record<string, any>>(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// File versions
export const fileVersions = pgTable('file_versions', {
  id: uuid('id').primaryKey().defaultRandom(),
  fileId: uuid('file_id').references(() => fileStorage.id).notNull(),
  version: integer('version').notNull(),
  url: text('url').notNull(),
  key: text('key').notNull(),
  size: bigint('size', { mode: 'number' }).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Projects table with enhanced metadata
export const projects = pgTable('projects', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  description: text('description'),
  originalImageId: uuid('original_image_id').references(() => fileStorage.id),
  status: text('status', { enum: ['processing', 'completed', 'failed'] }).default('processing').notNull(),
  isPublic: boolean('is_public').default(false).notNull(),
  tags: jsonb('tags').$type<string[]>(),
  metadata: jsonb('metadata').$type<Record<string, any>>(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Project versions for history tracking
export const projectVersions = pgTable('project_versions', {
  id: uuid('id').primaryKey().defaultRandom(),
  projectId: uuid('project_id').references(() => projects.id).notNull(),
  version: integer('version').notNull(),
  name: text('name').notNull(),
  description: text('description'),
  originalImageId: uuid('original_image_id').references(() => fileStorage.id),
  changes: jsonb('changes').$type<Record<string, any>>(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Render chains table for version control
export const renderChains = pgTable('render_chains', {
  id: uuid('id').primaryKey().defaultRandom(),
  projectId: uuid('project_id').references(() => projects.id, { onDelete: 'cascade' }).notNull(),
  name: text('name').notNull(),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Project rules table - rules that apply to each chain
export const projectRules = pgTable('project_rules', {
  id: uuid('id').primaryKey().defaultRandom(),
  chainId: uuid('chain_id').references(() => renderChains.id, { onDelete: 'cascade' }).notNull(),
  rule: text('rule').notNull(), // The rule text, e.g., "always use xyz material", "always make 4 floor high"
  isActive: boolean('is_active').default(true).notNull(), // Whether to automatically attach to prompts
  order: integer('order').default(0).notNull(), // Order for displaying rules
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Renders table with enhanced tracking and version control
export const renders = pgTable('renders', {
  id: uuid('id').primaryKey().defaultRandom(),
  projectId: uuid('project_id').references(() => projects.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  type: text('type', { enum: ['image', 'video'] }).notNull(),
  prompt: text('prompt').notNull(),
  settings: jsonb('settings').$type<{
    style: string;
    quality: 'standard' | 'high' | 'ultra';
    aspectRatio: string;
    duration?: number; // for videos
    imageType?: string;
    negativePrompt?: string;
    renderMode?: string;
    // Video-specific fields
    model?: 'veo3' | 'veo3_fast';
    generationType?: 'text-to-video' | 'image-to-video' | 'keyframe-sequence';
  }>(),
  outputUrl: text('output_url'),
  outputKey: text('output_key'),
  status: text('status', { enum: ['pending', 'processing', 'completed', 'failed'] }).default('pending').notNull(),
  errorMessage: text('error_message'),
  processingTime: integer('processing_time'), // in seconds
  creditsCost: integer('credits_cost').default(1).notNull(),
  priority: integer('priority').default(0).notNull(), // for queue management
  queuePosition: integer('queue_position'),
  estimatedCompletionAt: timestamp('estimated_completion_at'),
  startedAt: timestamp('started_at'),
  completedAt: timestamp('completed_at'),
  // Version control fields
  parentRenderId: uuid('parent_render_id').references((): any => renders.id),
  chainId: uuid('chain_id').references(() => renderChains.id),
  chainPosition: integer('chain_position'),
  referenceRenderId: uuid('reference_render_id').references((): any => renders.id),
  contextData: jsonb('context_data').$type<{
    successfulElements?: string[];
    previousPrompts?: string[];
    userFeedback?: string;
    chainEvolution?: string;
  }>(),
  thumbnailUrl: text('thumbnail_url'),
  // Uploaded image fields
  uploadedImageUrl: text('uploaded_image_url'),
  uploadedImageKey: text('uploaded_image_key'),
  uploadedImageId: uuid('uploaded_image_id').references(() => fileStorage.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Render versions for history tracking
export const renderVersions = pgTable('render_versions', {
  id: uuid('id').primaryKey().defaultRandom(),
  renderId: uuid('render_id').references(() => renders.id).notNull(),
  version: integer('version').notNull(),
  prompt: text('prompt').notNull(),
  settings: jsonb('settings').$type<Record<string, any>>(),
  outputFileId: uuid('output_file_id').references(() => fileStorage.id),
  changes: jsonb('changes').$type<Record<string, any>>(),
  referenceRenderId: uuid('reference_render_id').references(() => renders.id),
  contextPrompt: text('context_prompt'),
  thumbnailUrl: text('thumbnail_url'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Gallery items (public renders)
export const galleryItems = pgTable('gallery_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  renderId: uuid('render_id').references(() => renders.id, { onDelete: 'cascade' }).notNull(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  isPublic: boolean('is_public').default(false).notNull(),
  likes: integer('likes').default(0).notNull(),
  views: integer('views').default(0).notNull(),
  featured: boolean('featured').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Notifications system
export const notifications = pgTable('notifications', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  type: text('type', { enum: ['render_completed', 'render_failed', 'subscription_expired', 'credits_low', 'system'] }).notNull(),
  title: text('title').notNull(),
  message: text('message').notNull(),
  data: jsonb('data').$type<Record<string, any>>(),
  isRead: boolean('is_read').default(false).notNull(),
  readAt: timestamp('read_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Usage tracking
export const usageTracking = pgTable('usage_tracking', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  date: timestamp('date').notNull(),
  rendersCreated: integer('renders_created').default(0).notNull(),
  creditsSpent: integer('credits_spent').default(0).notNull(),
  storageUsed: bigint('storage_used', { mode: 'number' }).default(0).notNull(),
  apiCalls: integer('api_calls').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// API rate limiting
export const apiRateLimits = pgTable('api_rate_limits', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  endpoint: text('endpoint').notNull(),
  requestsCount: integer('requests_count').default(0).notNull(),
  windowStart: timestamp('window_start').notNull(),
  windowEnd: timestamp('window_end').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Render queue for processing management
export const renderQueue = pgTable('render_queue', {
  id: uuid('id').primaryKey().defaultRandom(),
  renderId: uuid('render_id').references(() => renders.id).notNull(),
  priority: integer('priority').default(0).notNull(),
  status: text('status', { enum: ['queued', 'processing', 'completed', 'failed'] }).default('queued').notNull(),
  position: integer('position').notNull(),
  estimatedStartAt: timestamp('estimated_start_at'),
  startedAt: timestamp('started_at'),
  completedAt: timestamp('completed_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// User settings and preferences
export const userSettings = pgTable('user_settings', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  preferences: jsonb('preferences').$type<{
    theme: 'light' | 'dark' | 'system';
    notifications: {
      email: boolean;
      push: boolean;
      renderComplete: boolean;
      creditsLow: boolean;
    };
    defaultRenderSettings: {
      style: string;
      quality: string;
      aspectRatio: string;
    };
  }>(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Canvas graphs for node-based editor
export const canvasGraphs = pgTable('canvas_graphs', {
  id: uuid('id').primaryKey().defaultRandom(),
  chainId: uuid('chain_id').references(() => renderChains.id, { onDelete: 'cascade' }).notNull().unique(),
  projectId: uuid('project_id').references(() => projects.id, { onDelete: 'cascade' }).notNull(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  nodes: jsonb('nodes').notNull(),
  connections: jsonb('connections').notNull(),
  viewport: jsonb('viewport').$type<{ x: number; y: number; zoom: number }>(),
  version: integer('version').default(1).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Create Zod schemas
export const insertUserSchema = createInsertSchema(users);
export const selectUserSchema = createSelectSchema(users);

export const insertSubscriptionPlanSchema = createInsertSchema(subscriptionPlans);
export const selectSubscriptionPlanSchema = createSelectSchema(subscriptionPlans);

export const insertUserSubscriptionSchema = createInsertSchema(userSubscriptions);
export const selectUserSubscriptionSchema = createSelectSchema(userSubscriptions);

export const insertUserCreditsSchema = createInsertSchema(userCredits);
export const selectUserCreditsSchema = createSelectSchema(userCredits);

export const insertCreditTransactionSchema = createInsertSchema(creditTransactions);
export const selectCreditTransactionSchema = createSelectSchema(creditTransactions);

export const insertFileStorageSchema = createInsertSchema(fileStorage);
export const selectFileStorageSchema = createSelectSchema(fileStorage);

export const insertFileVersionSchema = createInsertSchema(fileVersions);
export const selectFileVersionSchema = createSelectSchema(fileVersions);

export const insertProjectSchema = createInsertSchema(projects);
export const selectProjectSchema = createSelectSchema(projects);

export const insertProjectVersionSchema = createInsertSchema(projectVersions);
export const selectProjectVersionSchema = createSelectSchema(projectVersions);

export const insertRenderChainSchema = createInsertSchema(renderChains);
export const selectRenderChainSchema = createSelectSchema(renderChains);

export const insertProjectRuleSchema = createInsertSchema(projectRules);
export const selectProjectRuleSchema = createSelectSchema(projectRules);

export const insertRenderSchema = createInsertSchema(renders);
export const selectRenderSchema = createSelectSchema(renders);

export const insertRenderVersionSchema = createInsertSchema(renderVersions);
export const selectRenderVersionSchema = createSelectSchema(renderVersions);

export const insertGalleryItemSchema = createInsertSchema(galleryItems);
export const selectGalleryItemSchema = createSelectSchema(galleryItems);

export const insertNotificationSchema = createInsertSchema(notifications);
export const selectNotificationSchema = createSelectSchema(notifications);

export const insertUsageTrackingSchema = createInsertSchema(usageTracking);
export const selectUsageTrackingSchema = createSelectSchema(usageTracking);

export const insertApiRateLimitSchema = createInsertSchema(apiRateLimits);
export const selectApiRateLimitSchema = createSelectSchema(apiRateLimits);

export const insertRenderQueueSchema = createInsertSchema(renderQueue);
export const selectRenderQueueSchema = createSelectSchema(renderQueue);

export const insertUserSettingsSchema = createInsertSchema(userSettings);
export const selectUserSettingsSchema = createSelectSchema(userSettings);

export const insertCanvasGraphSchema = createInsertSchema(canvasGraphs);
export const selectCanvasGraphSchema = createSelectSchema(canvasGraphs);

// Type exports
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type SubscriptionPlan = typeof subscriptionPlans.$inferSelect;
export type NewSubscriptionPlan = typeof subscriptionPlans.$inferInsert;

export type UserSubscription = typeof userSubscriptions.$inferSelect;
export type NewUserSubscription = typeof userSubscriptions.$inferInsert;

export type UserCredits = typeof userCredits.$inferSelect;
export type NewUserCredits = typeof userCredits.$inferInsert;

export type CreditTransaction = typeof creditTransactions.$inferSelect;
export type NewCreditTransaction = typeof creditTransactions.$inferInsert;

export type FileStorage = typeof fileStorage.$inferSelect;
export type NewFileStorage = typeof fileStorage.$inferInsert;

export type FileVersion = typeof fileVersions.$inferSelect;
export type NewFileVersion = typeof fileVersions.$inferInsert;

export type Project = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;

export type ProjectVersion = typeof projectVersions.$inferSelect;
export type NewProjectVersion = typeof projectVersions.$inferInsert;

export type RenderChain = typeof renderChains.$inferSelect;
export type NewRenderChain = typeof renderChains.$inferInsert;

export type ProjectRule = typeof projectRules.$inferSelect;
export type NewProjectRule = typeof projectRules.$inferInsert;

export type Render = typeof renders.$inferSelect;
export type NewRender = typeof renders.$inferInsert;

export type RenderVersion = typeof renderVersions.$inferSelect;
export type NewRenderVersion = typeof renderVersions.$inferInsert;

export type GalleryItem = typeof galleryItems.$inferSelect;
export type NewGalleryItem = typeof galleryItems.$inferInsert;

export type Notification = typeof notifications.$inferSelect;
export type NewNotification = typeof notifications.$inferInsert;

export type UsageTracking = typeof usageTracking.$inferSelect;
export type NewUsageTracking = typeof usageTracking.$inferInsert;

export type ApiRateLimit = typeof apiRateLimits.$inferSelect;
export type NewApiRateLimit = typeof apiRateLimits.$inferInsert;

export type RenderQueue = typeof renderQueue.$inferSelect;
export type NewRenderQueue = typeof renderQueue.$inferInsert;

export type UserSettings = typeof userSettings.$inferSelect;
export type NewUserSettings = typeof userSettings.$inferInsert;

export type CanvasGraph = typeof canvasGraphs.$inferSelect;
export type NewCanvasGraph = typeof canvasGraphs.$inferInsert;

export type CreditPackage = typeof creditPackages.$inferSelect;
export type NewCreditPackage = typeof creditPackages.$inferInsert;

export type PaymentOrder = typeof paymentOrders.$inferSelect;
export type NewPaymentOrder = typeof paymentOrders.$inferInsert;
