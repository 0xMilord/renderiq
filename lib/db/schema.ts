import { pgTable, text, timestamp, uuid, integer, boolean, jsonb, decimal, bigint, uniqueIndex } from 'drizzle-orm/pg-core';
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
  currency: text('currency').default('INR').notNull(),
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

// Credit packages for one-time purchases with volume-based pricing
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
  pricingTier: text('pricing_tier').default('standard').notNull(), // 'single', 'standard', 'bulk'
  pricePerCredit: decimal('price_per_credit', { precision: 10, scale: 2 }).default('5.00').notNull(),
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
  invoiceNumber: text('invoice_number').unique(),
  receiptPdfUrl: text('receipt_pdf_url'),
  receiptSentAt: timestamp('receipt_sent_at'),
  taxAmount: decimal('tax_amount', { precision: 10, scale: 2 }).default('0'),
  discountAmount: decimal('discount_amount', { precision: 10, scale: 2 }).default('0'),
  metadata: jsonb('metadata').$type<Record<string, any>>(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Invoices table for invoice management
export const invoices = pgTable('invoices', {
  id: uuid('id').primaryKey().defaultRandom(),
  invoiceNumber: text('invoice_number').unique().notNull(),
  paymentOrderId: uuid('payment_order_id').references(() => paymentOrders.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
  taxAmount: decimal('tax_amount', { precision: 10, scale: 2 }).default('0'),
  discountAmount: decimal('discount_amount', { precision: 10, scale: 2 }).default('0'),
  totalAmount: decimal('total_amount', { precision: 10, scale: 2 }).notNull(),
  currency: text('currency').default('INR').notNull(),
  pdfUrl: text('pdf_url'),
  status: text('status').default('pending').notNull(),
  metadata: jsonb('metadata').$type<Record<string, any>>(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// User subscriptions
export const userSubscriptions = pgTable('user_subscriptions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  planId: uuid('plan_id').references(() => subscriptionPlans.id).notNull(),
  status: text('status', { enum: ['active', 'canceled', 'past_due', 'unpaid', 'pending'] }).notNull(),
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
  // Platform identifier to prevent cross-contamination between render, tools, and canvas
  platform: text('platform', { enum: ['render', 'tools', 'canvas'] }).default('render').notNull(),
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
  // Platform identifier to prevent cross-contamination
  platform: text('platform', { enum: ['render', 'tools', 'canvas'] }),
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

// User likes for gallery items
// Note: Unique constraint (user_id, gallery_item_id) is enforced via migration
export const userLikes = pgTable('user_likes', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  galleryItemId: uuid('gallery_item_id').references(() => galleryItems.id, { onDelete: 'cascade' }).notNull(),
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

// Canvas files (Figma-like structure: Project → File → Canvas Graph)
export const canvasFiles = pgTable('canvas_files', {
  id: uuid('id').primaryKey().defaultRandom(),
  projectId: uuid('project_id').references(() => projects.id, { onDelete: 'cascade' }).notNull(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  name: text('name').notNull(),
  slug: text('slug').notNull(),
  description: text('description'),
  thumbnailUrl: text('thumbnail_url'),
  thumbnailKey: text('thumbnail_key'),
  version: integer('version').default(1).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  isArchived: boolean('is_archived').default(false).notNull(),
  metadata: jsonb('metadata').$type<Record<string, any>>(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Canvas file versions for version history
export const canvasFileVersions = pgTable('canvas_file_versions', {
  id: uuid('id').primaryKey().defaultRandom(),
  fileId: uuid('file_id').references(() => canvasFiles.id, { onDelete: 'cascade' }).notNull(),
  version: integer('version').notNull(),
  graphId: uuid('graph_id').references((): any => canvasGraphs.id, { onDelete: 'set null' }),
  name: text('name'),
  description: text('description'),
  createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Canvas graphs for node-based editor
export const canvasGraphs = pgTable('canvas_graphs', {
  id: uuid('id').primaryKey().defaultRandom(),
  // Legacy: Keep chainId for backward compatibility during migration (nullable)
  chainId: uuid('chain_id').references(() => renderChains.id, { onDelete: 'cascade' }),
  // New: Use fileId for proper Figma-like structure (required for new records)
  fileId: uuid('file_id').references(() => canvasFiles.id, { onDelete: 'cascade' }).notNull(),
  projectId: uuid('project_id').references(() => projects.id, { onDelete: 'cascade' }).notNull(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  nodes: jsonb('nodes').notNull(),
  connections: jsonb('connections').notNull(),
  viewport: jsonb('viewport').$type<{ x: number; y: number; zoom: number }>(),
  version: integer('version').default(1).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  // Unique constraint: one graph per file (Figma-like structure)
  fileIdUnique: uniqueIndex('idx_canvas_graphs_file_id_unique').on(table.fileId),
}));

// Tools infrastructure for /apps platform
export const tools = pgTable('tools', {
  id: uuid('id').primaryKey().defaultRandom(),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
  description: text('description'),
  category: text('category', { enum: ['transformation', 'floorplan', 'diagram', 'material', 'interior', '3d', 'presentation', 'video'] }).notNull(),
  systemPrompt: text('system_prompt').notNull(),
  inputType: text('input_type', { enum: ['image', 'image+text', 'multiple'] }).notNull(),
  outputType: text('output_type', { enum: ['image', 'video', '3d', 'audio', 'doc'] }).notNull(),
  icon: text('icon'),
  color: text('color'),
  priority: text('priority', { enum: ['high', 'medium', 'low'] }).default('medium').notNull(),
  status: text('status', { enum: ['online', 'offline'] }).default('online').notNull(),
  settingsSchema: jsonb('settings_schema').$type<Record<string, any>>(),
  defaultSettings: jsonb('default_settings').$type<Record<string, any>>(),
  seoMetadata: jsonb('seo_metadata').$type<{
    title?: string;
    description?: string;
    keywords?: string[];
  }>(),
  metadata: jsonb('metadata').$type<Record<string, any>>(),
  version: integer('version').default(1).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Tool executions - separate from renders for /apps platform
export const toolExecutions = pgTable('tool_executions', {
  id: uuid('id').primaryKey().defaultRandom(),
  toolId: uuid('tool_id').references(() => tools.id, { onDelete: 'cascade' }).notNull(),
  projectId: uuid('project_id').references(() => projects.id, { onDelete: 'cascade' }).notNull(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  // Input tracking
  inputImages: jsonb('input_images').$type<Array<{ fileId?: string; url: string; key?: string }>>(),
  inputText: text('input_text'),
  inputSettings: jsonb('input_settings').$type<Record<string, any>>(),
  // Output tracking
  outputRenderId: uuid('output_render_id').references(() => renders.id, { onDelete: 'set null' }),
  outputUrl: text('output_url'),
  outputKey: text('output_key'),
  outputFileId: uuid('output_file_id').references(() => fileStorage.id, { onDelete: 'set null' }),
  // Execution metadata
  status: text('status', { enum: ['pending', 'processing', 'completed', 'failed', 'cancelled'] }).default('pending').notNull(),
  errorMessage: text('error_message'),
  processingTime: integer('processing_time'),
  creditsCost: integer('credits_cost').default(0).notNull(),
  // Reproducibility
  executionConfig: jsonb('execution_config').$type<Record<string, any>>().notNull(),
  parentExecutionId: uuid('parent_execution_id').references((): any => toolExecutions.id, { onDelete: 'set null' }),
  // Batch execution support
  batchGroupId: uuid('batch_group_id'),
  batchIndex: integer('batch_index'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  startedAt: timestamp('started_at'),
  completedAt: timestamp('completed_at'),
});

// Tool settings templates - user-specific or global presets
export const toolSettingsTemplates = pgTable('tool_settings_templates', {
  id: uuid('id').primaryKey().defaultRandom(),
  toolId: uuid('tool_id').references(() => tools.id, { onDelete: 'cascade' }).notNull(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  description: text('description'),
  settings: jsonb('settings').$type<Record<string, any>>().notNull(),
  isDefault: boolean('is_default').default(false).notNull(),
  isPublic: boolean('is_public').default(false).notNull(),
  usageCount: integer('usage_count').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Tool analytics - usage and performance tracking
export const toolAnalytics = pgTable('tool_analytics', {
  id: uuid('id').primaryKey().defaultRandom(),
  toolId: uuid('tool_id').references(() => tools.id, { onDelete: 'cascade' }).notNull(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
  executionId: uuid('execution_id').references(() => toolExecutions.id, { onDelete: 'set null' }),
  eventType: text('event_type', { enum: ['execution_started', 'execution_completed', 'execution_failed', 'template_used', 'settings_saved'] }).notNull(),
  metadata: jsonb('metadata').$type<Record<string, any>>(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Sybil detection tables
export const deviceFingerprints = pgTable('device_fingerprints', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  fingerprintHash: text('fingerprint_hash').notNull(), // SHA-256 hash of device fingerprint
  userAgent: text('user_agent'),
  browser: text('browser'),
  os: text('os'),
  screenResolution: text('screen_resolution'),
  timezone: text('timezone'),
  language: text('language'),
  platform: text('platform'),
  hardwareConcurrency: integer('hardware_concurrency'),
  deviceMemory: integer('device_memory'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const ipAddresses = pgTable('ip_addresses', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  ipAddress: text('ip_address').notNull(),
  country: text('country'),
  city: text('city'),
  isp: text('isp'),
  isProxy: boolean('is_proxy').default(false),
  isVpn: boolean('is_vpn').default(false),
  isTor: boolean('is_tor').default(false),
  firstSeenAt: timestamp('first_seen_at').defaultNow().notNull(),
  lastSeenAt: timestamp('last_seen_at').defaultNow().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const sybilDetections = pgTable('sybil_detections', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  riskScore: integer('risk_score').notNull(), // 0-100, higher = more suspicious
  riskLevel: text('risk_level', { enum: ['low', 'medium', 'high', 'critical'] }).notNull(),
  detectionReasons: jsonb('detection_reasons').$type<string[]>().notNull(), // Array of reasons
  linkedAccounts: jsonb('linked_accounts').$type<string[]>(), // Array of user IDs linked to same device/IP
  deviceFingerprintId: uuid('device_fingerprint_id').references(() => deviceFingerprints.id),
  ipAddressId: uuid('ip_address_id').references(() => ipAddresses.id),
  isBlocked: boolean('is_blocked').default(false).notNull(),
  creditsAwarded: integer('credits_awarded').default(0).notNull(), // Reduced credits if suspicious
  reviewedBy: uuid('reviewed_by').references(() => users.id), // Admin who reviewed
  reviewedAt: timestamp('reviewed_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const accountActivity = pgTable('account_activity', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  eventType: text('event_type', { enum: ['signup', 'login', 'render', 'credit_purchase', 'logout'] }).notNull(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  deviceFingerprintId: uuid('device_fingerprint_id').references(() => deviceFingerprints.id),
  metadata: jsonb('metadata').$type<Record<string, any>>(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Ambassador/Affiliate system tables
export const ambassadors = pgTable('ambassadors', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull().unique(),
  code: text('code').unique(), // e.g., "ABC123" - nullable until approved
  status: text('status', { enum: ['pending', 'approved', 'rejected', 'active', 'suspended'] }).notNull().default('pending'),
  discountPercentage: decimal('discount_percentage', { precision: 5, scale: 2 }).notNull().default('20.00'), // Base discount %
  commissionPercentage: decimal('commission_percentage', { precision: 5, scale: 2 }).notNull().default('25.00'), // Commission %
  commissionDurationMonths: integer('commission_duration_months').notNull().default(6), // Months to earn commission
  totalReferrals: integer('total_referrals').notNull().default(0),
  totalEarnings: decimal('total_earnings', { precision: 10, scale: 2 }).notNull().default('0.00'),
  pendingEarnings: decimal('pending_earnings', { precision: 10, scale: 2 }).notNull().default('0.00'),
  paidEarnings: decimal('paid_earnings', { precision: 10, scale: 2 }).notNull().default('0.00'),
  applicationData: jsonb('application_data').$type<Record<string, any>>(), // Store application form data
  approvedBy: uuid('approved_by').references(() => users.id), // Admin who approved
  approvedAt: timestamp('approved_at'),
  rejectedReason: text('rejected_reason'),
  notes: text('notes'), // Admin notes
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const ambassadorLinks = pgTable('ambassador_links', {
  id: uuid('id').primaryKey().defaultRandom(),
  ambassadorId: uuid('ambassador_id').references(() => ambassadors.id, { onDelete: 'cascade' }).notNull(),
  code: text('code').notNull(), // Custom code (e.g., "summer2025")
  url: text('url').notNull(), // Full URL with ref parameter
  campaignName: text('campaign_name'), // Optional campaign name
  description: text('description'),
  clickCount: integer('click_count').notNull().default(0),
  signupCount: integer('signup_count').notNull().default(0),
  conversionCount: integer('conversion_count').notNull().default(0), // Users who subscribed
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const ambassadorReferrals = pgTable('ambassador_referrals', {
  id: uuid('id').primaryKey().defaultRandom(),
  ambassadorId: uuid('ambassador_id').references(() => ambassadors.id, { onDelete: 'cascade' }).notNull(),
  referredUserId: uuid('referred_user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  linkId: uuid('link_id').references(() => ambassadorLinks.id), // Which link was used
  referralCode: text('referral_code').notNull(), // The code used at signup
  signupAt: timestamp('signup_at').defaultNow().notNull(),
  firstSubscriptionAt: timestamp('first_subscription_at'), // When they first subscribed
  subscriptionId: uuid('subscription_id').references(() => userSubscriptions.id), // Current active subscription
  totalCommissionEarned: decimal('total_commission_earned', { precision: 10, scale: 2 }).notNull().default('0.00'),
  commissionMonthsRemaining: integer('commission_months_remaining').notNull().default(6),
  status: text('status', { enum: ['pending', 'active', 'completed', 'expired'] }).notNull().default('pending'),
  metadata: jsonb('metadata').$type<Record<string, any>>(), // Additional tracking data
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const ambassadorPayouts = pgTable('ambassador_payouts', {
  id: uuid('id').primaryKey().defaultRandom(),
  ambassadorId: uuid('ambassador_id').references(() => ambassadors.id, { onDelete: 'cascade' }).notNull(),
  periodStart: timestamp('period_start').notNull(), // Week start
  periodEnd: timestamp('period_end').notNull(), // Week end
  totalCommissions: decimal('total_commissions', { precision: 10, scale: 2 }).notNull().default('0.00'),
  commissionCount: integer('commission_count').notNull().default(0), // Number of commissions in period
  status: text('status', { enum: ['pending', 'processing', 'paid', 'failed'] }).notNull().default('pending'),
  paymentMethod: text('payment_method'), // 'bank_transfer', 'paypal', 'stripe', etc.
  paymentReference: text('payment_reference'), // External payment reference
  paidAt: timestamp('paid_at'),
  paidBy: uuid('paid_by').references(() => users.id), // Admin who processed
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const ambassadorCommissions = pgTable('ambassador_commissions', {
  id: uuid('id').primaryKey().defaultRandom(),
  ambassadorId: uuid('ambassador_id').references(() => ambassadors.id, { onDelete: 'cascade' }).notNull(),
  referralId: uuid('referral_id').references(() => ambassadorReferrals.id, { onDelete: 'cascade' }).notNull(),
  subscriptionId: uuid('subscription_id').references(() => userSubscriptions.id, { onDelete: 'cascade' }).notNull(),
  paymentOrderId: uuid('payment_order_id').references(() => paymentOrders.id), // Link to payment
  periodStart: timestamp('period_start').notNull(), // Billing period start
  periodEnd: timestamp('period_end').notNull(), // Billing period end
  subscriptionAmount: decimal('subscription_amount', { precision: 10, scale: 2 }).notNull(), // Original subscription amount
  discountAmount: decimal('discount_amount', { precision: 10, scale: 2 }).notNull().default('0.00'), // Discount given to user
  commissionPercentage: decimal('commission_percentage', { precision: 5, scale: 2 }).notNull(), // Commission % at time of payment
  commissionAmount: decimal('commission_amount', { precision: 10, scale: 2 }).notNull(), // Calculated commission
  currency: text('currency').notNull().default('USD'),
  status: text('status', { enum: ['pending', 'paid', 'cancelled'] }).notNull().default('pending'),
  payoutPeriodId: uuid('payout_period_id').references(() => ambassadorPayouts.id), // Reference to payout period
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const ambassadorVolumeTiers = pgTable('ambassador_volume_tiers', {
  id: uuid('id').primaryKey().defaultRandom(),
  tierName: text('tier_name').notNull().unique(), // e.g., "Bronze", "Silver", "Gold"
  minReferrals: integer('min_referrals').notNull(), // Minimum referrals to reach tier
  discountPercentage: decimal('discount_percentage', { precision: 5, scale: 2 }).notNull(), // Discount % for this tier
  commissionPercentage: decimal('commission_percentage', { precision: 5, scale: 2 }), // Commission % for this tier (optional override)
  isActive: boolean('is_active').notNull().default(true),
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

export const insertPaymentOrderSchema = createInsertSchema(paymentOrders);
export const selectPaymentOrderSchema = createSelectSchema(paymentOrders);

export const insertInvoiceSchema = createInsertSchema(invoices);
export const selectInvoiceSchema = createSelectSchema(invoices);

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

export const insertCanvasFileSchema = createInsertSchema(canvasFiles);
export const selectCanvasFileSchema = createSelectSchema(canvasFiles);

export const insertCanvasFileVersionSchema = createInsertSchema(canvasFileVersions);
export const selectCanvasFileVersionSchema = createSelectSchema(canvasFileVersions);

export const insertToolSchema = createInsertSchema(tools);
export const selectToolSchema = createSelectSchema(tools);

export const insertToolExecutionSchema = createInsertSchema(toolExecutions);
export const selectToolExecutionSchema = createSelectSchema(toolExecutions);

export const insertToolSettingsTemplateSchema = createInsertSchema(toolSettingsTemplates);
export const selectToolSettingsTemplateSchema = createSelectSchema(toolSettingsTemplates);

export const insertToolAnalyticsSchema = createInsertSchema(toolAnalytics);
export const selectToolAnalyticsSchema = createSelectSchema(toolAnalytics);

export const insertDeviceFingerprintSchema = createInsertSchema(deviceFingerprints);
export const selectDeviceFingerprintSchema = createSelectSchema(deviceFingerprints);

export const insertIpAddressSchema = createInsertSchema(ipAddresses);
export const selectIpAddressSchema = createSelectSchema(ipAddresses);

export const insertSybilDetectionSchema = createInsertSchema(sybilDetections);
export const selectSybilDetectionSchema = createSelectSchema(sybilDetections);

export const insertAccountActivitySchema = createInsertSchema(accountActivity);
export const selectAccountActivitySchema = createSelectSchema(accountActivity);

export const insertAmbassadorSchema = createInsertSchema(ambassadors);
export const selectAmbassadorSchema = createSelectSchema(ambassadors);

export const insertAmbassadorLinkSchema = createInsertSchema(ambassadorLinks);
export const selectAmbassadorLinkSchema = createSelectSchema(ambassadorLinks);

export const insertAmbassadorReferralSchema = createInsertSchema(ambassadorReferrals);
export const selectAmbassadorReferralSchema = createSelectSchema(ambassadorReferrals);

export const insertAmbassadorCommissionSchema = createInsertSchema(ambassadorCommissions);
export const selectAmbassadorCommissionSchema = createSelectSchema(ambassadorCommissions);

export const insertAmbassadorPayoutSchema = createInsertSchema(ambassadorPayouts);
export const selectAmbassadorPayoutSchema = createSelectSchema(ambassadorPayouts);

export const insertAmbassadorVolumeTierSchema = createInsertSchema(ambassadorVolumeTiers);
export const selectAmbassadorVolumeTierSchema = createSelectSchema(ambassadorVolumeTiers);

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

export type CanvasFile = typeof canvasFiles.$inferSelect;
export type NewCanvasFile = typeof canvasFiles.$inferInsert;

export type CanvasFileVersion = typeof canvasFileVersions.$inferSelect;
export type NewCanvasFileVersion = typeof canvasFileVersions.$inferInsert;

export type Tool = typeof tools.$inferSelect;
export type NewTool = typeof tools.$inferInsert;

export type ToolExecution = typeof toolExecutions.$inferSelect;
export type NewToolExecution = typeof toolExecutions.$inferInsert;

export type ToolSettingsTemplate = typeof toolSettingsTemplates.$inferSelect;
export type NewToolSettingsTemplate = typeof toolSettingsTemplates.$inferInsert;

export type ToolAnalytics = typeof toolAnalytics.$inferSelect;
export type NewToolAnalytics = typeof toolAnalytics.$inferInsert;

export type CreditPackage = typeof creditPackages.$inferSelect;
export type NewCreditPackage = typeof creditPackages.$inferInsert;

export type PaymentOrder = typeof paymentOrders.$inferSelect;
export type NewPaymentOrder = typeof paymentOrders.$inferInsert;

export type Invoice = typeof invoices.$inferSelect;
export type NewInvoice = typeof invoices.$inferInsert;

export type DeviceFingerprint = typeof deviceFingerprints.$inferSelect;
export type NewDeviceFingerprint = typeof deviceFingerprints.$inferInsert;

export type IpAddress = typeof ipAddresses.$inferSelect;
export type NewIpAddress = typeof ipAddresses.$inferInsert;

export type SybilDetection = typeof sybilDetections.$inferSelect;
export type NewSybilDetection = typeof sybilDetections.$inferInsert;

export type AccountActivity = typeof accountActivity.$inferSelect;
export type NewAccountActivity = typeof accountActivity.$inferInsert;

export type Ambassador = typeof ambassadors.$inferSelect;
export type NewAmbassador = typeof ambassadors.$inferInsert;

export type AmbassadorLink = typeof ambassadorLinks.$inferSelect;
export type NewAmbassadorLink = typeof ambassadorLinks.$inferInsert;

export type AmbassadorReferral = typeof ambassadorReferrals.$inferSelect;
export type NewAmbassadorReferral = typeof ambassadorReferrals.$inferInsert;

export type AmbassadorCommission = typeof ambassadorCommissions.$inferSelect;
export type NewAmbassadorCommission = typeof ambassadorCommissions.$inferInsert;

export type AmbassadorPayout = typeof ambassadorPayouts.$inferSelect;
export type NewAmbassadorPayout = typeof ambassadorPayouts.$inferInsert;

export type AmbassadorVolumeTier = typeof ambassadorVolumeTiers.$inferSelect;
export type NewAmbassadorVolumeTier = typeof ambassadorVolumeTiers.$inferInsert;
