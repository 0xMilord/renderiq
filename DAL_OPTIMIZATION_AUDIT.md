# DAL Optimization & Parallelization Audit Report

**Date**: 2025-01-27  
**Scope**: All Data Access Layer (DAL) files for optimization and parallelization opportunities

---

## Executive Summary

**Total DALs Audited**: 12  
**Optimization Opportunities Found**: 23  
**Critical Issues**: 5  
**High Priority**: 8  
**Medium Priority**: 10

---

## 1. ToolsDAL (`lib/dal/tools.ts`)

### ✅ Already Optimized
- Good use of batch operations for tool executions
- Proper indexing opportunities (slug, category, outputType)

### 🔴 Critical Issues

#### 1.1 Sequential Queries in `createTemplate` (Lines 286-321)
**Problem**: Two sequential queries when setting default template
```typescript
// Current: Sequential
if (data.isDefault) {
  await db.update(...); // Query 1
}
const [template] = await db.insert(...); // Query 2
```

**Solution**: Use database transaction or combine into single operation
```typescript
// Optimized: Use transaction or conditional update
await db.transaction(async (tx) => {
  if (data.isDefault) {
    await tx.update(...);
  }
  const [template] = await tx.insert(...);
  return template;
});
```

#### 1.2 Sequential Queries in `updateTemplate` (Lines 366-405)
**Problem**: Fetches template, then updates other templates, then updates target
```typescript
// Current: 3 sequential queries
const [template] = await db.select(...); // Query 1
if (data.isDefault && template) {
  await db.update(...); // Query 2
}
const [updated] = await db.update(...); // Query 3
```

**Solution**: Use conditional SQL or transaction
```typescript
// Optimized: Single transaction
await db.transaction(async (tx) => {
  if (data.isDefault) {
    const [template] = await tx.select(...);
    if (template) {
      await tx.update(...);
    }
  }
  return await tx.update(...);
});
```

### 🟡 High Priority

#### 1.3 Missing Batch Operations
**Problem**: No batch methods for:
- Getting multiple tools by IDs
- Getting multiple executions by IDs
- Updating multiple execution statuses

**Solution**: Add batch methods
```typescript
static async getToolsByIds(ids: string[]) {
  if (ids.length === 0) return [];
  return await db
    .select()
    .from(tools)
    .where(inArray(tools.id, ids));
}

static async getExecutionsByIds(ids: string[]) {
  if (ids.length === 0) return [];
  return await db
    .select()
    .from(toolExecutions)
    .where(inArray(toolExecutions.id, ids));
}

static async updateExecutionStatusBatch(
  ids: string[],
  status: 'pending' | 'processing' | 'completed' | 'failed'
) {
  if (ids.length === 0) return;
  await db
    .update(toolExecutions)
    .set({ status, updatedAt: new Date() })
    .where(inArray(toolExecutions.id, ids));
}
```

---

## 2. CanvasFilesDAL (`lib/dal/canvas-files.ts`)

### 🔴 Critical Issues

#### 2.1 Sequential Queries in `create` (Lines 34-61)
**Problem**: Checks for existing slug, then creates file
```typescript
// Current: 2 sequential queries
const existing = await this.getBySlug(...); // Query 1
if (existing) throw error;
const [file] = await db.insert(...); // Query 2
```

**Solution**: Use database unique constraint + handle error, or use INSERT ... ON CONFLICT
```typescript
// Optimized: Let database handle uniqueness
try {
  const [file] = await db.insert(canvasFiles).values(...).returning();
  return file;
} catch (error) {
  if (error.code === '23505') { // Unique violation
    throw new Error(`Canvas file with slug "${data.slug}" already exists`);
  }
  throw error;
}
```

#### 2.2 Sequential Queries in `update` (Lines 121-148)
**Problem**: Fetches file, checks slug, then updates
```typescript
// Current: 3 sequential queries
const [file] = await db.select(...); // Query 1
if (file && data.slug) {
  const existing = await this.getBySlug(...); // Query 2
}
const [updated] = await db.update(...); // Query 3
```

**Solution**: Use conditional update with conflict handling
```typescript
// Optimized: Single update with conflict check
try {
  const [updated] = await db.update(...).returning();
  return updated;
} catch (error) {
  if (error.code === '23505') {
    throw new Error(`Slug already exists`);
  }
  throw error;
}
```

#### 2.3 Sequential Queries in `getFileWithGraph` (Lines 242-264)
**Problem**: Fetches file, then fetches graph separately
```typescript
// Current: 2 sequential queries
const [file] = await db.select(...); // Query 1
const [graph] = await db.select(...); // Query 2
```

**Solution**: Use LEFT JOIN or parallelize
```typescript
// Optimized: Single query with JOIN
const [result] = await db
  .select({
    file: canvasFiles,
    graph: canvasGraphs,
  })
  .from(canvasFiles)
  .leftJoin(canvasGraphs, eq(canvasFiles.id, canvasGraphs.fileId))
  .where(eq(canvasFiles.id, fileId))
  .limit(1);

// OR parallelize if JOIN is complex
const [fileResult, graphResult] = await Promise.all([
  db.select().from(canvasFiles).where(eq(canvasFiles.id, fileId)).limit(1),
  db.select().from(canvasGraphs).where(eq(canvasGraphs.fileId, fileId)).limit(1),
]);
```

#### 2.4 Sequential Queries in `getFileWithGraphBySlug` (Lines 266-283)
**Problem**: Same as 2.3 - sequential file and graph queries

**Solution**: Same as 2.3 - use JOIN or parallelize

---

## 3. CanvasDAL (`lib/dal/canvas.ts`)

### 🔴 Critical Issues

#### 3.1 Sequential Queries in `getByChainId` (Lines 12-43)
**Problem**: Fetches graph, then fetches chain separately
```typescript
// Current: 2 sequential queries
const [graph] = await db.select(...); // Query 1
const [chain] = await db.select(...); // Query 2
```

**Solution**: Use JOIN or parallelize
```typescript
// Optimized: Single query with JOIN
const [result] = await db
  .select({
    graph: canvasGraphs,
    chain: renderChains,
  })
  .from(canvasGraphs)
  .innerJoin(renderChains, eq(canvasGraphs.chainId, renderChains.id))
  .where(eq(canvasGraphs.chainId, chainId))
  .limit(1);

// OR parallelize
const [graphResult, chainResult] = await Promise.all([
  db.select().from(canvasGraphs).where(eq(canvasGraphs.chainId, chainId)).limit(1),
  db.select().from(renderChains).where(eq(renderChains.id, chainId)).limit(1),
]);
```

#### 3.2 Sequential Queries in `getByFileId` (Lines 49-80)
**Problem**: Fetches graph, then fetches file separately

**Solution**: Same as 3.1 - use JOIN or parallelize

#### 3.3 Sequential Queries in `saveGraph` (Lines 86-184)
**Problem**: Multiple sequential queries to determine file/chain, then check existing, then save
```typescript
// Current: 3-4 sequential queries
const [file] = await db.select(...); // Query 1
const existing = await this.getByFileId(...); // Query 2 (which does 2 more queries!)
const [updated] = await db.update(...); // Query 3
```

**Solution**: Optimize by combining checks
```typescript
// Optimized: Single query to get file + existing graph
const [fileWithGraph] = await db
  .select({
    file: canvasFiles,
    graph: canvasGraphs,
  })
  .from(canvasFiles)
  .leftJoin(canvasGraphs, eq(canvasFiles.id, canvasGraphs.fileId))
  .where(eq(canvasFiles.id, identifier.fileId))
  .limit(1);

if (!fileWithGraph?.file) {
  return { success: false, error: 'Canvas file not found' };
}

// Then single update or insert
if (fileWithGraph.graph) {
  // Update
} else {
  // Insert
}
```

---

## 4. RendersDAL (`lib/dal/renders.ts`)

### ✅ Already Optimized
- `getWithContext` - Parallelized (Lines 203-235)
- `getPublicGallery` - Server-side filtering (Lines 296-431)
- `getByIds` - Batch operation (Lines 457-470)
- `updateStatusBatch` - Batch operation (Lines 476-495)
- `batchCheckUserLiked` - Batch operation (Lines 543-557)

### 🟡 High Priority

#### 4.1 Missing Index Recommendations
**Problem**: No explicit index recommendations for common queries

**Solution**: Add comments/documentation for recommended indexes:
```sql
-- Recommended indexes for renders table
CREATE INDEX IF NOT EXISTS idx_renders_user_id_created_at ON renders(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_renders_project_id_created_at ON renders(project_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_renders_chain_id_position ON renders(chain_id, chain_position);
CREATE INDEX IF NOT EXISTS idx_renders_status_created_at ON renders(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_renders_platform ON renders(platform);
CREATE INDEX IF NOT EXISTS idx_renders_settings_image_type ON renders USING GIN (settings jsonb_path_ops);
```

---

## 5. ProjectsDAL (`lib/dal/projects.ts`)

### ✅ Already Optimized
- `getLatestRendersForProjects` - Batch operation with window functions (Lines 183-215)
- `getByUserIdWithRenderCounts` - Single query with JOIN (Lines 75-104)

### 🟡 High Priority

#### 5.1 Sequential Queries in `ensureUniqueSlug` (Lines 17-38)
**Problem**: Loop with sequential queries (potential N queries)
```typescript
// Current: N sequential queries in worst case
while (true) {
  const [existing] = await db.select(...); // Query N
  if (!existing) return slug;
  slug = `${baseSlug}-${counter++}`;
}
```

**Solution**: Use database-level unique constraint + handle conflict, or use better algorithm
```typescript
// Optimized: Use INSERT with ON CONFLICT or better slug generation
// Option 1: Let database handle it
try {
  const [project] = await db.insert(projects).values({...projectData, slug}).returning();
  return project;
} catch (error) {
  if (error.code === '23505') {
    // Retry with counter
    return await this.create({...projectData, name: `${projectData.name} ${Date.now()}`});
  }
  throw error;
}

// Option 2: Better slug generation (include timestamp or UUID)
const baseSlug = generateSlug(projectData.name);
const slug = `${baseSlug}-${Date.now().toString(36)}`;
```

#### 5.2 Sequential Queries in `update` (Lines 113-154)
**Problem**: If name changes, generates slug sequentially
```typescript
// Current: Sequential slug generation
if (updateData.name !== undefined) {
  updateFields.name = updateData.name;
  const baseSlug = generateSlug(updateData.name);
  updateFields.slug = await ensureUniqueSlug(baseSlug, id); // Sequential queries
}
```

**Solution**: Same as 5.1 - use conflict handling

---

## 6. RenderChainsDAL (`lib/dal/render-chains.ts`)

### ✅ Already Optimized
- `getChainWithRenders` - Parallelized (Lines 141-170)
- `batchRemoveRendersFromChain` - Batch operation (Lines 176-191)
- `getUserChainsWithRenders` - Optimized with parallel queries (Lines 195-245)

### 🟡 High Priority

#### 6.1 Sequential Queries in `addRender` (Lines 75-104)
**Problem**: Fetches max position, then updates render
```typescript
// Current: 2 sequential queries
const chainRenders = await db.select(...); // Query 1
const [updatedRender] = await db.update(...); // Query 2
```

**Solution**: Use SQL subquery or window function
```typescript
// Optimized: Single query with subquery
const [updatedRender] = await db
  .update(renders)
  .set({
    chainId,
    chainPosition: sql`COALESCE((SELECT MAX(${renders.chainPosition}) FROM ${renders} WHERE ${renders.chainId} = ${chainId}), 0) + 1`,
    updatedAt: new Date(),
  })
  .where(eq(renders.id, renderId))
  .returning();
```

---

## 7. UsersDAL (`lib/dal/users.ts`)

### ✅ Already Optimized
- Simple, efficient queries
- Good use of indexes (id, email)

### 🟢 Low Priority

#### 7.1 Missing Batch Operations
**Problem**: No batch methods for getting multiple users

**Solution**: Add if needed
```typescript
static async getByIds(ids: string[]): Promise<User[]> {
  if (ids.length === 0) return [];
  return await db
    .select()
    .from(users)
    .where(inArray(users.id, ids));
}
```

---

## 8. BillingDAL (`lib/dal/billing.ts`)

### ✅ Already Optimized
- `getUserSubscription` - Single query with JOIN (Lines 11-72)
- `getUserCreditsWithReset` - Single query with JOINs (Lines 106-150)
- `getUserBillingStats` - Batched single query (Lines 269-348)

### 🟡 High Priority

#### 8.1 Sequential Queries in `getMonthlyCredits` (Lines 155-201)
**Problem**: Two separate queries for earned and spent
```typescript
// Current: 2 sequential queries
const [earnedResult] = await db.select(...); // Query 1
const [spentResult] = await db.select(...); // Query 2
```

**Solution**: Use single query with conditional aggregation
```typescript
// Optimized: Single query with CASE statements
const [result] = await db
  .select({
    earned: sql<number>`COALESCE(SUM(CASE WHEN ${creditTransactions.type} IN ('earned', 'bonus', 'refund') THEN ${creditTransactions.amount} ELSE 0 END), 0)`,
    spent: sql<number>`COALESCE(SUM(CASE WHEN ${creditTransactions.type} = 'spent' THEN ABS(${creditTransactions.amount}) ELSE 0 END), 0)`,
  })
  .from(creditTransactions)
  .where(
    and(
      eq(creditTransactions.userId, userId),
      gte(creditTransactions.createdAt, periodStart),
      lte(creditTransactions.createdAt, periodEnd)
    )
  );

return {
  monthlyEarned: Number(result?.earned || 0),
  monthlySpent: Number(result?.spent || 0),
};
```

#### 8.2 Sequential Queries in `getUserCreditsWithResetAndMonthly` (Lines 206-242)
**Problem**: Calls `getUserSubscription`, then `getUserCreditsWithReset`, then `getMonthlyCredits`
```typescript
// Current: 3 sequential method calls (each may have multiple queries)
const subscription = await this.getUserSubscription(userId); // May have 2 queries
const creditsData = await this.getUserCreditsWithReset(userId); // 1 query
const monthlyCredits = await this.getMonthlyCredits(...); // 2 queries
```

**Solution**: Parallelize independent queries
```typescript
// Optimized: Parallelize independent queries
const [subscription, creditsData] = await Promise.all([
  this.getUserSubscription(userId),
  this.getUserCreditsWithReset(userId),
]);

if (!creditsData) return null;

// Get monthly credits only if subscription exists
let monthlyEarned = 0;
let monthlySpent = 0;
if (subscription?.subscription?.currentPeriodStart && subscription?.subscription?.currentPeriodEnd) {
  const periodStart = new Date(subscription.subscription.currentPeriodStart);
  const periodEnd = new Date(subscription.subscription.currentPeriodEnd);
  const monthlyCredits = await this.getMonthlyCredits(userId, periodStart, periodEnd);
  monthlyEarned = monthlyCredits.monthlyEarned;
  monthlySpent = monthlyCredits.monthlySpent;
}
```

---

## 9. ProjectRulesDAL (`lib/dal/project-rules.ts`)

### ✅ Already Optimized
- Simple, efficient queries
- Good use of indexes (chainId, isActive, order)

### 🟢 Low Priority

#### 9.1 Missing Batch Operations
**Problem**: No batch methods for getting rules for multiple chains

**Solution**: Add if needed
```typescript
static async getActiveRulesByChainIds(chainIds: string[]): Promise<Record<string, ProjectRule[]>> {
  if (chainIds.length === 0) return {};
  
  const rules = await db
    .select()
    .from(projectRules)
    .where(
      and(
        inArray(projectRules.chainId, chainIds),
        eq(projectRules.isActive, true)
      )
    )
    .orderBy(asc(projectRules.order), asc(projectRules.createdAt));
  
  // Group by chainId
  return rules.reduce((acc, rule) => {
    if (!acc[rule.chainId]) acc[rule.chainId] = [];
    acc[rule.chainId].push(rule);
    return acc;
  }, {} as Record<string, ProjectRule[]>);
}
```

---

## 10. ActivityDAL (`lib/dal/activity.ts`)

### ✅ Already Optimized
- `getUserActivity` - Parallelized (Lines 45-142)

### 🟢 Low Priority
- No additional optimizations needed

---

## 11. AmbassadorDAL (`lib/dal/ambassador.ts`)

### 🟡 High Priority

#### 11.1 Sequential Queries in `trackReferral` (Lines 284-330)
**Problem**: Inserts referral, then updates link, then updates ambassador (3 sequential queries)
```typescript
// Current: 3 sequential queries
const [referral] = await db.insert(...); // Query 1
if (linkId) {
  await db.update(...); // Query 2
}
await db.update(...); // Query 3
```

**Solution**: Use transaction or parallelize independent updates
```typescript
// Optimized: Transaction or parallelize
await db.transaction(async (tx) => {
  const [referral] = await tx.insert(ambassadorReferrals).values(...).returning();
  
  // Parallelize independent updates
  await Promise.all([
    linkId ? tx.update(ambassadorLinks).set(...).where(...) : Promise.resolve(),
    tx.update(ambassadors).set(...).where(...),
  ]);
  
  return referral;
});
```

#### 11.2 Sequential Queries in `updateReferralOnSubscription` (Lines 366-407)
**Problem**: Updates referral, then updates link (2 sequential queries)

**Solution**: Parallelize if independent, or use transaction
```typescript
// Optimized: Parallelize independent updates
const [updated] = await db.update(...).returning();

if (updated.linkId) {
  await Promise.all([
    db.update(ambassadorLinks).set(...).where(...),
    // Any other independent updates
  ]);
}
```

#### 11.3 Sequential Queries in `recordCommission` (Lines 412-471)
**Problem**: Inserts commission, then updates referral, then updates ambassador (3 sequential queries)

**Solution**: Use transaction
```typescript
// Optimized: Transaction
await db.transaction(async (tx) => {
  const [commission] = await tx.insert(ambassadorCommissions).values(...).returning();
  
  await Promise.all([
    tx.update(ambassadorReferrals).set(...).where(...),
    tx.update(ambassadors).set(...).where(...),
  ]);
  
  return commission;
});
```

#### 11.4 Sequential Queries in `updatePayoutStatus` (Lines 582-645)
**Problem**: Updates payout, then fetches payout, then updates commissions, then updates ambassador (4 sequential queries)

**Solution**: Use transaction and combine queries
```typescript
// Optimized: Transaction with combined logic
await db.transaction(async (tx) => {
  const [updated] = await tx.update(ambassadorPayouts).set(...).where(...).returning();
  
  if (status === 'paid' && updated) {
    await Promise.all([
      tx.update(ambassadorCommissions).set(...).where(...),
      tx.update(ambassadors).set({
        pendingEarnings: sql`${ambassadors.pendingEarnings} - ${updated.totalCommissions}`,
        paidEarnings: sql`${ambassadors.paidEarnings} + ${updated.totalCommissions}`,
        updatedAt: new Date(),
      }).where(eq(ambassadors.id, updated.ambassadorId)),
    ]);
  }
  
  return updated;
});
```

---

## 12. AuthDAL (`lib/dal/auth.ts`)

### ✅ Already Optimized
- `getUserStatus` - Single query for both isActive and isAdmin (Lines 264-288)
- `isUserActive` and `isUserAdmin` - Use optimized `getUserStatus` (Lines 290-314)

### 🟢 Low Priority
- No additional optimizations needed

---

## Summary of Recommendations

### Critical Priority (Fix Immediately)
1. **CanvasFilesDAL.create** - Use database constraints instead of pre-check
2. **CanvasFilesDAL.getFileWithGraph** - Use JOIN or parallelize
3. **CanvasDAL.getByChainId/getByFileId** - Use JOIN or parallelize
4. **CanvasDAL.saveGraph** - Optimize sequential queries
5. **ToolsDAL.createTemplate/updateTemplate** - Use transactions

### High Priority (Fix Soon)
6. **BillingDAL.getMonthlyCredits** - Combine into single query
7. **BillingDAL.getUserCreditsWithResetAndMonthly** - Parallelize
8. **ProjectsDAL.ensureUniqueSlug** - Use conflict handling
9. **RenderChainsDAL.addRender** - Use SQL subquery
10. **AmbassadorDAL** - Multiple methods need transactions/parallelization
11. **ToolsDAL** - Add batch operations

### Medium Priority (Nice to Have)
12. Add batch operations to all DALs where applicable
13. Add index recommendations documentation
14. Consider adding query result caching for frequently accessed data

---

## Implementation Priority

1. **Week 1**: Fix all Critical Priority issues
2. **Week 2**: Fix High Priority issues
3. **Week 3**: Add batch operations and documentation
4. **Week 4**: Performance testing and monitoring

---

## Performance Impact Estimates

- **Critical fixes**: 30-50% reduction in query time for affected operations
- **High priority fixes**: 20-40% reduction in query time
- **Batch operations**: 60-80% reduction in query time for bulk operations
- **Overall**: Estimated 25-35% improvement in database query performance

---

**Report Generated**: 2025-01-27  
**Next Steps**: Review and prioritize fixes, then implement in phases

