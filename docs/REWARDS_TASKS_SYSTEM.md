# Rewards & Tasks System - Complete Infrastructure Plan

## Executive Summary

**Is this a good idea?** ✅ **YES - Highly Recommended**

### Benefits:
1. **User Engagement**: Keeps users active and returning daily
2. **Growth & Backlinks**: Natural link building through social shares and reviews
3. **Community Building**: Encourages Discord/Telegram participation
4. **Content Creation**: User-generated content (tweets, reviews) = free marketing
5. **Retention**: Daily login rewards create habit formation
6. **Authority Building**: Reviews and mentions improve SEO and brand trust
7. **Viral Potential**: Social shares increase organic reach

### Cost Optimization:
- **Credit Value**: 5 INR per credit
- **Original Plan**: Too expensive (e.g., 25 credits = 125 INR per review)
- **Updated Plan**: 80% reduction (e.g., 5 credits = 25 INR per review)
- **Streak System**: Quadratic rewards incentivize long-term engagement without high upfront costs
- **Daily Login**: Starts at 1 credit, grows to 225 credits at 30-day streak (but user earned it!)

### Similar Successful Implementations:
- Crew.ai - Task-based credit system
- Notion - Referral rewards
- Figma - Community contributions
- Discord - Server boosts and rewards

---

## Current Architecture Audit

### ✅ Existing Infrastructure

#### 1. **Credits System** (Already Built)
- **Schema**: `userCredits` table with balance, totalEarned, totalSpent
- **Transactions**: `creditTransactions` table with type, amount, description
- **DAL**: `BillingDAL` with credit management methods
- **Service**: `BillingService` with credit operations
- **Actions**: `billing.actions.ts` for credit retrieval
- **Status**: ✅ Fully functional, ready to extend

#### 2. **User System**
- **Schema**: `users` table with profile data
- **DAL**: `AuthDAL`, `UsersDAL` for user operations
- **Service**: `UserOnboardingService`, `ProfileStatsService`
- **Actions**: `user-onboarding.actions.ts`, `profile.actions.ts`
- **Status**: ✅ Complete user management

#### 3. **Activity Tracking**
- **Schema**: `usageTracking` table exists
- **DAL**: `activity.ts` (needs verification)
- **Service**: `user-activity.ts` service exists
- **Status**: ⚠️ May need extension for task tracking

#### 4. **Architecture Pattern** (Well Established)
```
Components → Hooks → Actions → Services → DAL → Database
```
- ✅ Consistent pattern across codebase
- ✅ Type-safe with TypeScript + Zod
- ✅ Server actions for security
- ✅ Proper error handling

---

## Complete Infrastructure Plan

### Phase 1: Database Schema

#### New Tables Needed

##### 1. `task_categories` Table
```typescript
export const taskCategories = pgTable('task_categories', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull().unique(), // 'social', 'community', 'content', 'engagement'
  slug: text('slug').notNull().unique(),
  description: text('description'),
  icon: text('icon'), // Icon identifier
  displayOrder: integer('display_order').default(0).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
```

##### 2. `tasks` Table
```typescript
export const tasks = pgTable('tasks', {
  id: uuid('id').primaryKey().defaultRandom(),
  categoryId: uuid('category_id').references(() => taskCategories.id).notNull(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  description: text('description').notNull(),
  instructions: text('instructions'), // Detailed instructions
  creditsReward: integer('credits_reward').notNull(), // Credits earned
  verificationType: text('verification_type', { 
    enum: ['automatic', 'manual', 'link_verification', 'api_verification', 'screenshot'] 
  }).notNull(),
  verificationConfig: jsonb('verification_config').$type<Record<string, any>>(), // Platform-specific config
  cooldownHours: integer('cooldown_hours').default(0).notNull(), // 0 = one-time, 24 = daily, etc.
  maxCompletions: integer('max_completions'), // null = unlimited
  isActive: boolean('is_active').default(true).notNull(),
  displayOrder: integer('display_order').default(0).notNull(),
  requirements: jsonb('requirements').$type<Record<string, any>>(), // Additional requirements
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
```

##### 3. `user_tasks` Table (Task Completions)
```typescript
export const userTasks = pgTable('user_tasks', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  taskId: uuid('task_id').references(() => tasks.id).notNull(),
  status: text('status', { 
    enum: ['pending', 'completed', 'verified', 'rejected', 'expired'] 
  }).default('pending').notNull(),
  verificationData: jsonb('verification_data').$type<Record<string, any>>(), // Link, screenshot, etc.
  verifiedAt: timestamp('verified_at'),
  verifiedBy: uuid('verified_by').references(() => users.id), // Admin who verified (if manual)
  creditsAwarded: integer('credits_awarded').default(0).notNull(),
  transactionId: uuid('transaction_id').references(() => creditTransactions.id),
  metadata: jsonb('metadata').$type<Record<string, any>>(), // Additional data
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Unique constraint: user can only complete same task once per cooldown period
uniqueIndex('user_task_cooldown_idx').on(userTasks.userId, userTasks.taskId, sql`DATE(${userTasks.createdAt})`);
```

##### 4. `task_verification_logs` Table (Audit Trail)
```typescript
export const taskVerificationLogs = pgTable('task_verification_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  userTaskId: uuid('user_task_id').references(() => userTasks.id, { onDelete: 'cascade' }).notNull(),
  verificationMethod: text('verification_method').notNull(), // 'api', 'link', 'screenshot', 'manual'
  verificationResult: text('verification_result', { 
    enum: ['success', 'failed', 'pending'] 
  }).notNull(),
  verificationDetails: jsonb('verification_details').$type<Record<string, any>>(),
  errorMessage: text('error_message'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
```

##### 5. `user_streaks` Table (Streak Tracking)
```typescript
export const userStreaks = pgTable('user_streaks', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull().unique(),
  currentStreak: integer('current_streak').default(0).notNull(),
  longestStreak: integer('longest_streak').default(0).notNull(),
  lastLoginDate: date('last_login_date'),
  streakStartDate: date('streak_start_date'),
  totalLoginDays: integer('total_login_days').default(0).notNull(),
  gracePeriodUsed: boolean('grace_period_used').default(false).notNull(), // One-time grace period
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
```

---

### Phase 2: Task Categories & Tasks Definition

#### Category 1: Social Media Engagement
**Slug**: `social-media`

| Task | Credits | Verification | Cooldown |
|------|---------|--------------|----------|
| Follow on Twitter/X | 1 | API (Twitter API) | One-time |
| Follow on LinkedIn | 1 | Manual (link verification) | One-time |
| Follow on Instagram | 1 | Manual (screenshot) | One-time |
| Follow on YouTube | 1 | Manual (link verification) | One-time |
| Follow on GitHub | 1 | API (GitHub API) | One-time |
| Follow on Medium | 1 | Manual (link verification) | One-time |
| Follow on Reddit | 1 | Manual (screenshot) | One-time |
| Follow on TikTok | 1 | Manual (screenshot) | One-time |
| Follow on Threads | 1 | Manual (screenshot) | One-time |
| Tweet about Renderiq | 2 | API (Twitter API search) | Daily |
| Retweet Renderiq post | 1 | API (Twitter API) | Daily |
| Like Renderiq tweet | 1 | API (Twitter API) | Daily |
| Share on LinkedIn | 2 | Manual (link verification) | Daily |
| Post on Instagram | 2 | Manual (screenshot) | Daily |
| Share on Facebook | 2 | Manual (screenshot) | Daily |
| Share on Reddit | 2 | Manual (link verification) | Daily |
| Comment on YouTube video | 1 | Manual (link verification) | Daily |

#### Category 2: Review & Rating
**Slug**: `reviews`

| Task | Credits | Verification | Cooldown |
|------|---------|--------------|----------|
| 5-star review on Product Hunt | 5 | Manual (link verification) | One-time |
| 5-star review on G2 | 5 | Manual (link verification) | One-time |
| 5-star review on Capterra | 5 | Manual (link verification) | One-time |
| 5-star review on Trustpilot | 5 | Manual (link verification) | One-time |
| 5-star review on SourceForge | 5 | Manual (link verification) | One-time |
| 5-star review on AlternativeTo | 5 | Manual (link verification) | One-time |
| Upvote on Reddit | 1 | Manual (screenshot) | Daily |
| Upvote on HackerNews | 1 | Manual (screenshot) | Daily |
| Upvote on Product Hunt | 1 | Manual (screenshot) | Daily |
| Star on GitHub | 1 | API (GitHub API) | One-time |
| Bookmark on GitHub | 1 | API (GitHub API) | One-time |

#### Category 3: Community Engagement
**Slug**: `community`

| Task | Credits | Verification | Cooldown |
|------|---------|--------------|----------|
| Join Discord server | 2 | Discord Bot API | One-time |
| Join Telegram channel | 2 | Telegram Bot API | One-time |
| Join Slack community | 2 | Manual (screenshot) | One-time |
| Active Discord member (7 days) | 3 | Discord Bot API | Weekly |
| Active Discord member (30 days) | 5 | Discord Bot API | Monthly |
| Send message in Discord | 1 | Discord Bot API | Daily |
| Help another user (Discord) | 1 | Manual (admin verification) | Daily |
| Answer question in Discord | 2 | Manual (admin verification) | Daily |
| Share in community | 2 | Manual (link verification) | Daily |
| Participate in community event | 3 | Manual (admin verification) | Per event |
| Complete community challenge | 5 | Manual (admin verification) | Per challenge |

#### Category 4: Content Creation
**Slug**: `content`

| Task | Credits | Verification | Cooldown |
|------|---------|--------------|----------|
| Create YouTube video | 10 | Manual (link verification) | One-time per video |
| Write blog post | 10 | Manual (link verification) | One-time per post |
| Create tutorial | 15 | Manual (link verification) | One-time per tutorial |
| Share case study | 20 | Manual (link verification) | One-time per case study |
| Create Twitter thread | 3 | API (Twitter API) | Daily |
| Create LinkedIn article | 5 | Manual (link verification) | One-time per article |
| Create Medium article | 5 | Manual (link verification) | One-time per article |
| Create Dev.to post | 5 | Manual (link verification) | One-time per post |
| Create Reddit post | 2 | Manual (link verification) | Daily |
| Create Instagram Reel | 5 | Manual (screenshot) | One-time per reel |
| Create TikTok video | 5 | Manual (screenshot) | One-time per video |
| Create GitHub README example | 3 | Manual (link verification) | One-time per example |
| Submit to Awesome Lists | 2 | Manual (link verification) | One-time per submission |

#### Category 5: Daily Engagement & Streaks
**Slug**: `daily`

**Streak System Formula**: `credits = baseCredits * (streakDays^2 / 4)` (Quadratic growth)
- Day 1: 1 credit (1 * 1^2 / 4 = 0.25, rounded to 1)
- Day 2: 1 credit (1 * 2^2 / 4 = 1)
- Day 4: 4 credits (1 * 4^2 / 4 = 4)
- Day 7: 12 credits (1 * 7^2 / 4 = 12.25, rounded to 12)
- Day 14: 49 credits (1 * 14^2 / 4 = 49)
- Day 30: 225 credits (1 * 30^2 / 4 = 225)

| Task | Base Credits | Streak Formula | Verification | Cooldown |
|------|--------------|----------------|--------------|----------|
| Daily login | 1 | `1 * (streak^2 / 4)` | Automatic (session check) | Daily (24h) |
| Create a render | 1 | N/A | Automatic (render created) | Daily |
| Share render to gallery | 1 | N/A | Automatic (gallery publish) | Daily |
| Complete onboarding | 2 | N/A | Automatic (onboarding complete) | One-time |
| Use a tool | 1 | N/A | Automatic (tool execution) | Daily |
| Create a project | 1 | N/A | Automatic (project created) | Daily |
| Complete 3 renders in a day | 2 | N/A | Automatic (render count) | Daily |
| Complete 5 renders in a day | 3 | N/A | Automatic (render count) | Daily |
| Weekly active (7 days) | 5 | N/A | Automatic (login tracking) | Weekly |
| Monthly active (30 days) | 10 | N/A | Automatic (login tracking) | Monthly |

#### Category 6: Referral & Growth
**Slug**: `referral`

| Task | Credits | Verification | Cooldown |
|------|---------|--------------|----------|
| Refer a friend (signup) | 5 | Automatic (referral code) | Per referral |
| Refer a friend (first render) | 10 | Automatic (referral + render) | Per referral |
| Refer 3 friends | 15 | Automatic (referral count) | One-time bonus |
| Refer 5 friends | 25 | Automatic (referral count) | One-time bonus |
| Refer 10 friends | 50 | Automatic (referral count) | One-time bonus |
| Refer 20 friends | 100 | Automatic (referral count) | One-time bonus |

#### Category 7: Platform Engagement
**Slug**: `platform`

| Task | Credits | Verification | Cooldown |
|------|---------|--------------|----------|
| Connect Twitter account | 1 | OAuth verification | One-time |
| Connect GitHub account | 1 | OAuth verification | One-time |
| Connect Discord account | 1 | OAuth verification | One-time |
| Complete profile | 2 | Automatic (profile fields) | One-time |
| Add profile picture | 1 | Automatic (avatar upload) | One-time |
| Add bio | 1 | Automatic (bio field) | One-time |
| Add website link | 1 | Automatic (website field) | One-time |
| Enable 2FA | 2 | Automatic (2FA enabled) | One-time |
| Download mobile app | 2 | Manual (screenshot) | One-time |
| Enable notifications | 1 | Automatic (notification permission) | One-time |

#### Category 8: Learning & Education
**Slug**: `learning`

| Task | Credits | Verification | Cooldown |
|------|---------|--------------|----------|
| Complete getting started guide | 2 | Automatic (guide completion) | One-time |
| Watch tutorial video | 1 | Automatic (video watch time) | Per video |
| Read documentation page | 1 | Automatic (page view tracking) | Per page |
| Complete interactive tutorial | 3 | Automatic (tutorial completion) | Per tutorial |
| Attend webinar | 3 | Manual (registration + attendance) | Per webinar |
| Complete certification | 10 | Manual (certificate verification) | One-time |

#### Category 9: Feedback & Improvement
**Slug**: `feedback`

| Task | Credits | Verification | Cooldown |
|------|---------|--------------|----------|
| Submit feature request | 1 | Automatic (form submission) | Daily |
| Report a bug | 1 | Automatic (bug report) | Daily |
| Complete user survey | 2 | Automatic (survey completion) | Per survey |
| Participate in beta testing | 5 | Manual (admin verification) | Per beta |
| Provide feedback on feature | 1 | Automatic (feedback form) | Daily |
| Vote on feature requests | 1 | Automatic (vote tracking) | Daily |

#### Category 10: Collaboration & Sharing
**Slug**: `collaboration`

| Task | Credits | Verification | Cooldown |
|------|---------|--------------|----------|
| Share project publicly | 1 | Automatic (project visibility) | Per project |
| Create public template | 2 | Automatic (template creation) | Per template |
| Fork a project | 1 | Automatic (project fork) | Daily |
| Star a project | 1 | Automatic (project star) | Daily |
| Comment on project | 1 | Automatic (comment tracking) | Daily |
| Collaborate on project | 2 | Automatic (collaborator added) | Per collaboration |

#### Category 11: Achievements & Milestones
**Slug**: `achievements`

| Task | Credits | Verification | Cooldown |
|------|---------|--------------|----------|
| Create 10 renders | 2 | Automatic (render count) | One-time |
| Create 50 renders | 5 | Automatic (render count) | One-time |
| Create 100 renders | 10 | Automatic (render count) | One-time |
| Create 500 renders | 25 | Automatic (render count) | One-time |
| Create 1000 renders | 50 | Automatic (render count) | One-time |
| Get 10 likes on render | 2 | Automatic (like count) | One-time |
| Get 50 likes on render | 5 | Automatic (like count) | One-time |
| Get 100 likes on render | 10 | Automatic (like count) | One-time |
| Reach 7-day streak | 5 | Automatic (streak tracking) | One-time |
| Reach 30-day streak | 25 | Automatic (streak tracking) | One-time |
| Reach 100-day streak | 100 | Automatic (streak tracking) | One-time |

#### Category 12: Integration & API
**Slug**: `integration`

| Task | Credits | Verification | Cooldown |
|------|---------|--------------|----------|
| Generate API key | 1 | Automatic (API key creation) | One-time |
| Make first API call | 2 | Automatic (API usage tracking) | One-time |
| Make 100 API calls | 5 | Automatic (API call count) | One-time |
| Integrate with Zapier | 3 | Manual (integration screenshot) | One-time |
| Integrate with Make.com | 3 | Manual (integration screenshot) | One-time |
| Create API integration | 5 | Manual (code/example verification) | Per integration |

---

### Phase 3: Streak System Implementation

#### Database Schema Addition

```typescript
// Add to userCredits table or create new user_streaks table
export const userStreaks = pgTable('user_streaks', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull().unique(),
  currentStreak: integer('current_streak').default(0).notNull(),
  longestStreak: integer('longest_streak').default(0).notNull(),
  lastLoginDate: date('last_login_date'),
  streakStartDate: date('streak_start_date'),
  totalLoginDays: integer('total_login_days').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
```

#### Streak Calculation Formula

```typescript
/**
 * Calculate credits based on streak using quadratic equation
 * Formula: credits = baseCredits * (streakDays^2 / 4)
 * This means each doubling of streak time roughly quadruples the reward
 */
function calculateStreakCredits(streakDays: number, baseCredits: number = 1): number {
  if (streakDays <= 0) return 0;
  if (streakDays === 1) return baseCredits; // First day gets base
  
  // Quadratic formula: base * (streak^2 / 4)
  const credits = Math.round(baseCredits * (Math.pow(streakDays, 2) / 4));
  
  // Cap at reasonable maximum (e.g., 500 credits per day)
  return Math.min(credits, 500);
}

// Examples:
// Day 1: 1 credit
// Day 2: 1 credit (1 * 4/4 = 1)
// Day 4: 4 credits (1 * 16/4 = 4)
// Day 7: 12 credits (1 * 49/4 = 12.25 → 12)
// Day 14: 49 credits (1 * 196/4 = 49)
// Day 30: 225 credits (1 * 900/4 = 225)
// Day 60: 900 credits (1 * 3600/4 = 900, but capped at 500)
```

#### Streak Service Methods

```typescript
export class StreakService {
  static async updateStreak(userId: string): Promise<{ streak: number; credits: number }>
  static async getStreak(userId: string): Promise<UserStreak | null>
  static async resetStreak(userId: string): Promise<void>
  static async calculateStreakCredits(streakDays: number): Promise<number>
  static async checkStreakBreak(userId: string): Promise<boolean>
}
```

---

### Phase 3: Data Access Layer (DAL)

#### File: `lib/dal/tasks.ts`

```typescript
export class TasksDAL {
  // Task Management
  static async getAllTasks(filters?: { categoryId?: string; isActive?: boolean })
  static async getTaskById(taskId: string)
  static async getTaskBySlug(slug: string)
  static async getTasksByCategory(categorySlug: string)
  
  // User Task Completions
  static async getUserTasks(userId: string, filters?: { status?: string; taskId?: string })
  static async getUserTaskCompletion(userId: string, taskId: string, date?: Date)
  static async createUserTask(userId: string, taskId: string, verificationData: any)
  static async updateUserTaskStatus(userTaskId: string, status: string, verifiedBy?: string)
  static async getUserTaskStats(userId: string) // Total completed, credits earned, etc.
  
  // Verification
  static async createVerificationLog(userTaskId: string, method: string, result: string, details: any)
  static async getVerificationLogs(userTaskId: string)
  
  // Categories
  static async getAllCategories()
  static async getCategoryBySlug(slug: string)
  
  // Streaks
  static async getUserStreak(userId: string)
  static async createUserStreak(userId: string)
  static async updateUserStreak(userId: string, updates: Partial<UserStreak>)
  static async resetUserStreak(userId: string)
}
```

---

### Phase 4: Services Layer

#### File: `lib/services/tasks.service.ts`

```typescript
export class TasksService {
  // Task Operations
  static async getAvailableTasks(userId: string) // Filter by cooldown, max completions
  static async canCompleteTask(userId: string, taskId: string) // Check cooldown, max completions
  static async calculateCooldownRemaining(userId: string, taskId: string) // Hours remaining
  
  // Task Completion
  static async completeTask(userId: string, taskId: string, verificationData: any)
  static async verifyTask(userTaskId: string, method: 'automatic' | 'manual', verifierId?: string)
  
  // Credit Awarding
  static async awardCreditsForTask(userId: string, taskId: string, userTaskId: string)
  
  // Streak Management
  static async updateDailyLoginStreak(userId: string): Promise<{ streak: number; credits: number; isNewStreak: boolean }>
  static async calculateStreakCredits(streakDays: number, baseCredits?: number): Promise<number>
  static async checkStreakBreak(userId: string): Promise<boolean>
  static async useGracePeriod(userId: string): Promise<boolean>
  
  // Verification Services
  static async verifyTwitterFollow(userId: string, username: string) // Twitter API
  static async verifyGitHubFollow(userId: string, username: string) // GitHub API
  static async verifyDiscordMember(userId: string, discordId: string) // Discord Bot API
  static async verifyTelegramMember(userId: string, telegramId: string) // Telegram Bot API
  static async verifyLinkSubmission(url: string, taskId: string) // Validate link format
  static async verifyScreenshot(imageUrl: string, taskId: string) // Image validation (future: AI)
}
```

#### File: `lib/services/task-verification.service.ts`

```typescript
export class TaskVerificationService {
  // Automatic Verification
  static async verifyAutomaticTask(userTaskId: string, taskId: string, userId: string)
  static async verifyTwitterTask(userTaskId: string, config: any)
  static async verifyGitHubTask(userTaskId: string, config: any)
  static async verifyDiscordTask(userTaskId: string, config: any)
  static async verifyTelegramTask(userTaskId: string, config: any)
  static async verifyLinkTask(userTaskId: string, url: string, config: any)
  
  // Manual Verification Queue
  static async queueForManualVerification(userTaskId: string, reason: string)
  static async getPendingManualVerifications(limit?: number)
  
  // Verification Helpers
  static async checkTwitterFollowStatus(username: string, targetUsername: string)
  static async checkGitHubFollowStatus(username: string, targetUsername: string)
  static async validateReviewLink(url: string, platform: string)
  static async extractPlatformFromUrl(url: string)
}
```

---

### Phase 5: Server Actions

#### File: `lib/actions/tasks.actions.ts`

```typescript
'use server';

// Task Retrieval
export async function getAvailableTasksAction()
export async function getTaskCategoriesAction()
export async function getUserTasksAction(userId?: string)
export async function getUserTaskStatsAction(userId?: string)

// Task Completion
export async function completeTaskAction(taskId: string, verificationData: Record<string, any>)
export async function submitTaskVerificationAction(userTaskId: string, verificationData: Record<string, any>)

// Admin Actions
export async function verifyTaskManuallyAction(userTaskId: string, status: 'verified' | 'rejected', reason?: string)
export async function getPendingVerificationsAction()
```

---

### Phase 6: Hooks

#### File: `lib/hooks/use-tasks.ts`

```typescript
'use client';

export function useTasks() {
  // Get available tasks
  // Get user's completed tasks
  // Get task stats
  // Complete task
  // Check task eligibility
}
```

#### File: `lib/hooks/use-task-completion.ts`

```typescript
'use client';

export function useTaskCompletion(taskId: string) {
  // Check if can complete
  // Get cooldown remaining
  // Submit completion
  // Track verification status
}
```

---

### Phase 7: UI Components

#### Components Needed:

1. **`components/tasks/tasks-page.tsx`** - Main tasks page
2. **`components/tasks/task-category-section.tsx`** - Category grouping
3. **`components/tasks/task-card.tsx`** - Individual task card
4. **`components/tasks/task-completion-modal.tsx`** - Submit verification
5. **`components/tasks/task-verification-form.tsx`** - Link/screenshot upload
6. **`components/tasks/user-task-stats.tsx`** - Stats dashboard
7. **`components/tasks/task-progress-indicator.tsx`** - Progress tracking
8. **`components/tasks/daily-login-badge.tsx`** - Daily login reminder
9. **`components/admin/task-verification-queue.tsx`** - Admin verification panel

---

### Phase 8: Routes

#### Public Routes:
- `/tasks` - Main tasks page (public, but requires auth for completion)
- `/tasks/[categorySlug]` - Category-specific tasks

#### Admin Routes:
- `/admin/tasks` - Task management
- `/admin/tasks/verifications` - Manual verification queue
- `/admin/tasks/stats` - Task completion analytics

---

### Phase 9: Automated Verification Strategies

#### 1. **Twitter/X Verification**
- **Method**: Twitter API v2
- **Implementation**: 
  - User connects Twitter account (OAuth)
  - Store Twitter user ID
  - Use `GET /2/users/:id/following` to check follow status
  - For tweets: Search API for mentions
- **Automation Level**: ✅ Fully Automated

#### 2. **GitHub Verification**
- **Method**: GitHub API
- **Implementation**:
  - User connects GitHub account (OAuth)
  - Store GitHub username
  - Use `GET /user/following/:username` to verify
- **Automation Level**: ✅ Fully Automated

#### 3. **Discord Verification**
- **Method**: Discord Bot API
- **Implementation**:
  - User joins Discord server
  - Bot tracks member join events
  - Store Discord user ID
  - Verify membership via `GET /guilds/:id/members/:id`
- **Automation Level**: ✅ Fully Automated

#### 4. **Telegram Verification**
- **Method**: Telegram Bot API
- **Implementation**:
  - User joins Telegram channel
  - Bot tracks member join events
  - Store Telegram user ID
  - Verify via `getChatMember` API
- **Automation Level**: ✅ Fully Automated

#### 5. **Link Verification**
- **Method**: URL validation + scraping
- **Implementation**:
  - Validate URL format matches platform
  - Scrape page for user identifier (username, email)
  - Match against user's profile
  - Verify review/rating content
- **Automation Level**: ⚠️ Semi-Automated (needs validation)

#### 6. **Screenshot Verification**
- **Method**: Image processing + manual review
- **Implementation**:
  - Accept screenshot upload
  - Store in cloud storage
  - Queue for manual admin review
  - Future: AI image recognition (OCR + validation)
- **Automation Level**: ❌ Manual (can be automated with AI later)

#### 7. **Daily Login**
- **Method**: Session tracking
- **Implementation**:
  - Track last login timestamp
  - Award credits if 24+ hours since last daily reward
  - Automatic on session creation
- **Automation Level**: ✅ Fully Automated

#### 8. **Render Creation**
- **Method**: Database event
- **Implementation**:
  - Listen to render creation events
  - Check if user already got daily render credit
  - Award credits automatically
- **Automation Level**: ✅ Fully Automated

---

### Phase 10: External API Integrations Needed

#### 1. **Twitter/X API**
- **Provider**: Twitter API v2
- **Endpoints Needed**:
  - OAuth for account connection
  - `GET /2/users/:id/following` - Check follows
  - `GET /2/tweets/search/recent` - Search mentions
- **Cost**: Free tier available, paid for higher limits
- **Setup**: Twitter Developer Account

#### 2. **GitHub API**
- **Provider**: GitHub REST API
- **Endpoints Needed**:
  - OAuth for account connection
  - `GET /user/following/:username` - Check follows
- **Cost**: Free (rate limited)
- **Setup**: GitHub OAuth App

#### 3. **Discord Bot**
- **Provider**: Discord API
- **Endpoints Needed**:
  - Bot token for server access
  - `GET /guilds/:id/members/:id` - Check membership
  - Webhook for member join events
- **Cost**: Free
- **Setup**: Discord Developer Portal

#### 4. **Telegram Bot**
- **Provider**: Telegram Bot API
- **Endpoints Needed**:
  - Bot token
  - `getChatMember` - Check channel membership
  - Webhook for member join events
- **Cost**: Free
- **Setup**: BotFather

#### 5. **Link Scraping Service** (Optional)
- **Provider**: Custom or third-party (Puppeteer, ScraperAPI)
- **Purpose**: Validate review links, extract user info
- **Cost**: Varies (can use Puppeteer for free)

---

### Phase 11: Database Migrations

#### Migration 1: Create Task Tables
```sql
-- task_categories
CREATE TABLE task_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT,
  display_order INTEGER DEFAULT 0 NOT NULL,
  is_active BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- tasks
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES task_categories(id) NOT NULL,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  instructions TEXT,
  credits_reward INTEGER NOT NULL,
  verification_type TEXT NOT NULL CHECK (verification_type IN ('automatic', 'manual', 'link_verification', 'api_verification', 'screenshot')),
  verification_config JSONB,
  cooldown_hours INTEGER DEFAULT 0 NOT NULL,
  max_completions INTEGER,
  is_active BOOLEAN DEFAULT true NOT NULL,
  display_order INTEGER DEFAULT 0 NOT NULL,
  requirements JSONB,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- user_tasks
CREATE TABLE user_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  task_id UUID REFERENCES tasks(id) NOT NULL,
  status TEXT DEFAULT 'pending' NOT NULL CHECK (status IN ('pending', 'completed', 'verified', 'rejected', 'expired')),
  verification_data JSONB,
  verified_at TIMESTAMP,
  verified_by UUID REFERENCES users(id),
  credits_awarded INTEGER DEFAULT 0 NOT NULL,
  transaction_id UUID REFERENCES credit_transactions(id),
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- task_verification_logs
CREATE TABLE task_verification_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_task_id UUID REFERENCES user_tasks(id) ON DELETE CASCADE NOT NULL,
  verification_method TEXT NOT NULL,
  verification_result TEXT NOT NULL CHECK (verification_result IN ('success', 'failed', 'pending')),
  verification_details JSONB,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- user_streaks
CREATE TABLE user_streaks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  current_streak INTEGER DEFAULT 0 NOT NULL,
  longest_streak INTEGER DEFAULT 0 NOT NULL,
  last_login_date DATE,
  streak_start_date DATE,
  total_login_days INTEGER DEFAULT 0 NOT NULL,
  grace_period_used BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Indexes
CREATE INDEX idx_user_tasks_user_id ON user_tasks(user_id);
CREATE INDEX idx_user_tasks_task_id ON user_tasks(task_id);
CREATE INDEX idx_user_tasks_status ON user_tasks(status);
CREATE INDEX idx_user_tasks_created_at ON user_tasks(created_at);
CREATE UNIQUE INDEX idx_user_task_cooldown ON user_tasks(user_id, task_id, DATE(created_at));
CREATE INDEX idx_user_streaks_user_id ON user_streaks(user_id);
```

#### Migration 2: Seed Initial Tasks
- Insert task categories
- Insert all task definitions
- Set up default verification configs

---

### Phase 12: Background Jobs & Cron

#### Jobs Needed:

1. **Daily Task Reset** (Cron: Daily at midnight UTC)
   - Reset daily login flags
   - Reset daily task cooldowns
   - Award daily login credits

2. **Automatic Verification Processor** (Cron: Every 5 minutes)
   - Process pending automatic verifications
   - Check API statuses
   - Update task statuses
   - Award credits

3. **Cooldown Expiration Check** (Cron: Hourly)
   - Check expired cooldowns
   - Allow task re-completion

4. **Verification Retry** (Cron: Every 15 minutes)
   - Retry failed API verifications
   - Handle rate limits

---

### Phase 13: Security & Anti-Fraud

#### Fraud Prevention:

1. **Rate Limiting**
   - Limit task submissions per user per hour
   - Prevent spam submissions

2. **Duplicate Detection**
   - Check for duplicate links/screenshots
   - Prevent same verification data reuse

3. **Sybil Detection**
   - Track IP addresses
   - Detect multiple accounts from same source
   - Flag suspicious patterns

4. **Verification Validation**
   - Validate links are real and accessible
   - Check screenshots aren't doctored (future: AI)
   - Verify API responses are legitimate

5. **Cooldown Enforcement**
   - Strict cooldown checking
   - Prevent gaming the system

---

### Phase 14: Analytics & Reporting

#### Metrics to Track:

1. **Task Completion Rates**
   - Most completed tasks
   - Least completed tasks
   - Category performance

2. **User Engagement**
   - Daily active users completing tasks
   - Average credits earned per user
   - Task completion velocity

3. **Verification Metrics**
   - Automatic vs manual verification ratio
   - Verification success rate
   - Average verification time

4. **Growth Metrics**
   - Referrals generated
   - Social shares
   - Backlinks created
   - Review submissions

---

## Implementation Priority

### Phase 1 (MVP - 2 weeks)
1. ✅ Database schema & migrations
2. ✅ Basic DAL for tasks
3. ✅ Task service with manual verification
4. ✅ Simple tasks page UI
5. ✅ Daily login task (automatic)
6. ✅ Render creation task (automatic)

### Phase 2 (Core Features - 2 weeks)
1. ✅ Twitter API integration
2. ✅ GitHub API integration
3. ✅ Discord Bot integration
4. ✅ Link verification system
5. ✅ Admin verification queue
6. ✅ Task completion flow

### Phase 3 (Advanced - 2 weeks)
1. ✅ Telegram Bot integration
2. ✅ Review platform verification
3. ✅ Content creation tasks
4. ✅ Referral system integration
5. ✅ Analytics dashboard
6. ✅ Background job processors

### Phase 4 (Polish - 1 week)
1. ✅ UI/UX improvements
2. ✅ Mobile optimization
3. ✅ Notification system
4. ✅ Leaderboards (optional)
5. ✅ Badges/achievements (optional)

---

## Estimated Development Time

- **Total**: ~7-8 weeks
- **Team Size**: 1-2 developers
- **Complexity**: Medium-High
- **ROI**: Very High (user engagement + growth)

---

## Risk Assessment

### Low Risk ✅
- Daily login task
- Render creation task
- Basic UI components
- Database schema

### Medium Risk ⚠️
- API integrations (rate limits, changes)
- Link verification accuracy
- Manual verification queue management

### High Risk ❌
- Screenshot verification (fraud potential)
- Social media API changes
- Bot detection by platforms

---

## Success Metrics

### Engagement Metrics
- **Target**: 40% of users complete at least 1 task per week
- **Target**: 20% of users complete daily login 5+ days/week
- **Target**: Average 30-40 credits earned per user per month (reduced from 50)
- **Target**: 10% of users maintain 7+ day streaks
- **Target**: 5% of users maintain 30+ day streaks

### Growth Metrics
- **Target**: 100+ social shares per month
- **Target**: 50+ reviews submitted per month
- **Target**: 200+ Discord/Telegram members per month
- **Target**: 10+ backlinks from content creation tasks

### Retention Metrics
- **Target**: 15% increase in daily active users
- **Target**: 20% increase in user retention (30-day)

---

## Next Steps

1. ✅ **Review this document** - Get stakeholder approval
2. ✅ **Create database migrations** - Set up schema
3. ✅ **Build MVP** - Start with daily login + basic tasks
4. ✅ **Integrate APIs** - Twitter, GitHub, Discord
5. ✅ **Build admin panel** - Manual verification queue
6. ✅ **Launch beta** - Test with small user group
7. ✅ **Iterate** - Based on user feedback
8. ✅ **Scale** - Add more tasks and automation

---

## Questions to Resolve

1. ✅ **Credit Values**: Reduced by 80% to optimize costs (5 INR per credit)
2. **Streak Cap**: Should we cap daily streak rewards? (Proposed: 500 credits max per day)
3. **Verification Strictness**: How strict should link verification be? (Exact match vs fuzzy)
4. **Manual Review SLA**: What's the target time for manual verification? (24h? 48h?)
5. **Fraud Tolerance**: How aggressive should anti-fraud measures be? (Balance UX vs security)
6. **API Costs**: Budget for Twitter API, scraping services?
7. **Content Moderation**: Who reviews screenshots and content submissions?
8. **Streak Break Grace Period**: Allow 1-day grace period for missed logins? (Prevents accidental breaks)

---

## Conclusion

This rewards/tasks system is **highly recommended** and aligns perfectly with your existing architecture. The implementation is straightforward given your well-structured codebase, and the ROI potential is significant for both user engagement and growth.

**Recommendation**: Start with Phase 1 (MVP) to validate the concept, then expand based on user feedback and engagement metrics.
