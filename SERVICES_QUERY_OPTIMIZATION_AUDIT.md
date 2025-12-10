# Services Query Optimization Audit Report

**Date**: 2025-01-27  
**Scope**: All service layer files for Drizzle ORM query optimization  
**Based on**: Drizzle ORM 2025 Best Practices

---

## Executive Summary

**Total Services Audited**: 27  
**Optimization Opportunities Found**: 15  
**Critical Issues**: 3  
**High Priority**: 6  
**Medium Priority**: 6

---

## Optimization Categories

### 1. Sequential Queries → Parallel Queries
### 2. Sequential Queries → JOINs / Drizzle Query API
### 3. Check-then-Insert → Upsert (ON CONFLICT)
### 4. Frequently Executed Queries → Prepared Statements
### 5. Missing Batch Operations

---

## Detailed Findings

### 🔴 CRITICAL PRIORITY

#### 1. **billing.ts - `addCredits`** (Lines 86-139)
**Problem**: Sequential queries with check-then-insert pattern
```typescript
// Current: 4 sequential queries
let userCredit = await db.select()...; // Query 1
if (!userCredit[0]) {
  await db.insert()...; // Query 2
  userCredit = await db.select()...; // Query 3
}
await db.update()...; // Query 4
await db.insert(creditTransactions)...; // Query 5
```

**Solution**: Use transaction + upsert pattern
```typescript
// ✅ OPTIMIZED: Use transaction + upsert
return await db.transaction(async (tx) => {
  // Upsert user credits
  const [userCredit] = await tx
    .insert(userCredits)
    .values({ userId, balance: 0, totalEarned: 0, totalSpent: 0 })
    .onConflictDoUpdate({
      target: userCredits.userId,
      set: { updatedAt: new Date() }
    })
    .returning();
  
  // Update credits and insert transaction in parallel
  await Promise.all([
    tx.update(userCredits).set({...}).where(...),
    tx.insert(creditTransactions).values({...})
  ]);
});
```

**Impact**: 5 queries → 2 queries (60% reduction)

---

#### 2. **billing.ts - `getUserCredits`** (Lines 202-237)
**Problem**: Check-then-insert pattern
```typescript
// Current: 2 sequential queries
const userCredit = await db.select()...; // Query 1
if (!userCredit[0]) {
  await db.insert()...; // Query 2
}
```

**Solution**: Use upsert
```typescript
// ✅ OPTIMIZED: Use upsert
const [userCredit] = await db
  .insert(userCredits)
  .values({
    userId,
    balance: initialCredits,
    totalEarned: initialCredits,
    totalSpent: 0,
  })
  .onConflictDoUpdate({
    target: userCredits.userId,
    set: { updatedAt: new Date() }
  })
  .returning();
```

**Impact**: 2 queries → 1 query (50% reduction)

---

#### 3. **tools.service.ts - `updateExecutionStatus`** (Lines 75-124)
**Problem**: Sequential queries - update, then analytics, then another update
```typescript
// Current: 3 sequential queries
const execution = await ToolsDAL.updateExecutionStatus(...); // Query 1
if (execution) {
  await ToolsDAL.createAnalyticsEvent(...); // Query 2
  await ToolsDAL.updateExecution(...); // Query 3
}
```

**Solution**: Parallelize analytics and combine updates
```typescript
// ✅ OPTIMIZED: Parallelize analytics, combine updates
const [execution, analyticsPromise] = await Promise.all([
  ToolsDAL.updateExecution(executionId, {
    status,
    ...data,
    errorMessage: data?.errorMessage,
  }),
  // Fire-and-forget analytics (non-blocking)
  ToolsDAL.createAnalyticsEvent({...}).catch(err => logger.warn('Analytics failed', err))
]);
```

**Impact**: 3 queries → 2 queries (33% reduction)

---

### 🟡 HIGH PRIORITY

#### 4. **tools.service.ts - `createExecution`** (Lines 44-70)
**Problem**: Sequential analytics event then execution
```typescript
// Current: 2 sequential queries
await ToolsDAL.createAnalyticsEvent({...}); // Query 1
return await ToolsDAL.createExecution(data); // Query 2
```

**Solution**: Parallelize (analytics can be fire-and-forget)
```typescript
// ✅ OPTIMIZED: Parallelize analytics (fire-and-forget)
const [execution] = await Promise.all([
  ToolsDAL.createExecution(data),
  ToolsDAL.createAnalyticsEvent({...}).catch(err => logger.warn('Analytics failed', err))
]);
return execution;
```

**Impact**: 2 queries → 1 query (50% reduction for execution path)

---

#### 5. **tools.service.ts - `useTemplate`** (Lines 192-206)
**Problem**: Sequential - increment, get template, create analytics
```typescript
// Current: 3 sequential queries
await ToolsDAL.incrementTemplateUsage(templateId); // Query 1
const template = await ToolsDAL.getTemplateById(templateId); // Query 2
if (template) {
  await ToolsDAL.createAnalyticsEvent({...}); // Query 3
}
```

**Solution**: Parallelize increment and get, then analytics
```typescript
// ✅ OPTIMIZED: Parallelize increment and get
const [template] = await Promise.all([
  ToolsDAL.getTemplateById(templateId),
  ToolsDAL.incrementTemplateUsage(templateId)
]);
// Analytics can be fire-and-forget
if (template) {
  ToolsDAL.createAnalyticsEvent({...}).catch(err => logger.warn('Analytics failed', err));
}
```

**Impact**: 3 queries → 2 queries (33% reduction)

---

#### 6. **ambassador.service.ts - `getAmbassadorStats`** (Lines 390-442)
**Problem**: Sequential queries for ambassador, referrals, and commissions
```typescript
// Current: 3 sequential queries
const ambassadorData = await AmbassadorDAL.getAmbassadorById(ambassadorId); // Query 1
const referrals = await AmbassadorDAL.getReferrals(ambassadorId); // Query 2
const commissions = await AmbassadorDAL.getCommissions(ambassadorId); // Query 3
```

**Solution**: Parallelize independent queries
```typescript
// ✅ OPTIMIZED: Parallelize independent queries
const [ambassadorData, referrals, commissions] = await Promise.all([
  AmbassadorDAL.getAmbassadorById(ambassadorId),
  AmbassadorDAL.getReferrals(ambassadorId),
  AmbassadorDAL.getCommissions(ambassadorId)
]);
```

**Impact**: 3 queries → 1 parallel batch (66% time reduction)

---

#### 7. **ambassador.service.ts - `approveAmbassador`** (Lines 66-92)
**Problem**: Sequential - generate code, update status, set code, update status again
```typescript
// Current: 4 sequential queries
const code = await this.generateAmbassadorCode(); // Query 1
await AmbassadorDAL.updateAmbassadorStatus(ambassadorId, 'approved', adminId); // Query 2
await AmbassadorDAL.setAmbassadorCode(ambassadorId, code); // Query 3
const ambassador = await AmbassadorDAL.updateAmbassadorStatus(ambassadorId, 'active', adminId); // Query 4
```

**Solution**: Use transaction and combine updates
```typescript
// ✅ OPTIMIZED: Use transaction and combine updates
return await db.transaction(async (tx) => {
  const code = await this.generateAmbassadorCode();
  const [ambassador] = await tx
    .update(ambassadors)
    .set({
      status: 'active',
      code,
      approvedBy: adminId,
      approvedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(ambassadors.id, ambassadorId))
    .returning();
  return ambassador;
});
```

**Impact**: 4 queries → 2 queries (50% reduction)

---

#### 8. **user-activity.ts - `getUserActivity`** (Lines 20-65)
**Problem**: Sequential queries for renders and projects
```typescript
// Current: 2 sequential queries
const renders = await RendersDAL.getByUser(userId, null, limit); // Query 1
const projects = await ProjectsDAL.getByUserId(userId, limit, 0); // Query 2
```

**Solution**: Parallelize independent queries
```typescript
// ✅ OPTIMIZED: Parallelize independent queries
const [renders, projects] = await Promise.all([
  RendersDAL.getByUser(userId, null, limit),
  ProjectsDAL.getByUserId(userId, limit, 0)
]);
```

**Impact**: 2 queries → 1 parallel batch (50% time reduction)

---

#### 9. **plan-limits.service.ts - `checkProjectLimit`** (Lines 77-105)
**Problem**: Sequential - get limits, then get projects
```typescript
// Current: 2 sequential queries
const limits = await this.getUserPlanLimits(userId); // Query 1 (may query DB)
const userProjects = await ProjectsDAL.getByUserId(userId, 1000, 0); // Query 2
```

**Solution**: Use SQL COUNT instead of fetching all projects
```typescript
// ✅ OPTIMIZED: Use SQL COUNT instead of fetching all
const limits = await this.getUserPlanLimits(userId);
if (limits.maxProjects === null) return { allowed: true, ... };

const [result] = await db
  .select({ count: sql<number>`COUNT(*)::int` })
  .from(projects)
  .where(eq(projects.userId, userId));
const currentCount = result.count;
```

**Impact**: 2 queries → 2 queries (but much faster - COUNT vs SELECT all)

---

#### 10. **plan-limits.service.ts - `checkRenderLimit`** (Lines 110-138)
**Problem**: Sequential - get limits, then get all renders
```typescript
// Current: 2 sequential queries
const limits = await this.getUserPlanLimits(userId); // Query 1
const projectRenders = await RendersDAL.getByProjectId(projectId); // Query 2
```

**Solution**: Use SQL COUNT instead of fetching all renders
```typescript
// ✅ OPTIMIZED: Use SQL COUNT
const limits = await this.getUserPlanLimits(userId);
if (limits.maxRendersPerProject === null) return { allowed: true, ... };

const [result] = await db
  .select({ count: sql<number>`COUNT(*)::int` })
  .from(renders)
  .where(eq(renders.projectId, projectId));
const currentCount = result.count;
```

**Impact**: 2 queries → 2 queries (but much faster - COUNT vs SELECT all)

---

### 🟢 MEDIUM PRIORITY

#### 11. **render.ts - `createRender`** (Lines 75-163)
**Problem**: Sequential - get project, get/create chain, get position
```typescript
// Current: 3 sequential queries
const project = await ProjectsDAL.getById(renderData.projectId); // Query 1
const defaultChain = await RenderChainService.getOrCreateDefaultChain(...); // Query 2
const chainPosition = await RenderChainService.getNextChainPosition(chainId); // Query 3
```

**Note**: This is already optimized in RenderChainService, but could use Drizzle Query API for nested data.

**Solution**: Use Drizzle Query API for nested chain data
```typescript
// ✅ OPTIMIZED: Use Drizzle Query API for nested data
const projectWithChain = await db.query.projects.findFirst({
  where: eq(projects.id, renderData.projectId),
  with: {
    chains: {
      orderBy: desc(renderChains.createdAt),
      limit: 1,
      with: {
        renders: {
          orderBy: renders.chainPosition,
        }
      }
    }
  }
});
```

**Impact**: 3 queries → 1 query (66% reduction)

---

#### 12. **render.ts - `processRender`** (Lines 165-316)
**Problem**: Sequential - get project, get image URL
```typescript
// Current: 2 sequential queries
const project = await ProjectsDAL.getById(renderData.projectId); // Query 1
const originalImageUrl = await StorageService.getFileUrl(originalImageId); // Query 2
```

**Solution**: Parallelize (project fetch and storage fetch are independent)
```typescript
// ✅ OPTIMIZED: Parallelize independent operations
const [project, originalImageUrl] = await Promise.all([
  ProjectsDAL.getById(renderData.projectId),
  StorageService.getFileUrl(originalImageId)
]);
```

**Impact**: 2 queries → 1 parallel batch (50% time reduction)

---

#### 13. **render-chain.ts - `getChainStats`** (Lines 206-221)
**Problem**: Fetches all renders then filters in JavaScript
```typescript
// Current: 1 query fetching all renders, then client-side filtering
const renders = await RendersDAL.getByChainId(chainId);
const completed = renders.filter(r => r.status === 'completed').length;
```

**Solution**: Use SQL aggregation
```typescript
// ✅ OPTIMIZED: Use SQL aggregation
const stats = await db
  .select({
    total: sql<number>`COUNT(*)::int`,
    completed: sql<number>`COUNT(*) FILTER (WHERE ${renders.status} = 'completed')::int`,
    failed: sql<number>`COUNT(*) FILTER (WHERE ${renders.status} = 'failed')::int`,
    processing: sql<number>`COUNT(*) FILTER (WHERE ${renders.status} = 'processing')::int`,
    pending: sql<number>`COUNT(*) FILTER (WHERE ${renders.status} = 'pending')::int`,
  })
  .from(renders)
  .where(eq(renders.chainId, chainId));
```

**Impact**: 1 query + client-side processing → 1 optimized query

---

#### 14. **Prepared Statements for Frequently Executed Queries**

**Candidates for Prepared Statements**:
- `getUserCredits` - Called frequently in billing checks
- `getUserPlanLimits` - Called on every limit check
- `getByUserId` - Called frequently for user lookups
- `getByProjectId` - Called frequently for project lookups

**Example Implementation**:
```typescript
// ✅ OPTIMIZED: Prepared statement for frequently executed query
const getUserCreditsPrepared = db
  .select()
  .from(userCredits)
  .where(eq(userCredits.userId, sql.placeholder('userId')))
  .prepare('get_user_credits');

// Usage
const credits = await getUserCreditsPrepared.execute({ userId });
```

**Impact**: 20-30% performance improvement for frequently executed queries

---

#### 15. **tools.service.ts - `saveTemplate`** (Lines 157-180)
**Problem**: Sequential - create template, then analytics
```typescript
// Current: 2 sequential queries
const template = await ToolsDAL.createTemplate(data); // Query 1
await ToolsDAL.createAnalyticsEvent({...}); // Query 2
```

**Solution**: Parallelize analytics (fire-and-forget)
```typescript
// ✅ OPTIMIZED: Parallelize analytics
const template = await ToolsDAL.createTemplate(data);
ToolsDAL.createAnalyticsEvent({...}).catch(err => logger.warn('Analytics failed', err));
return template;
```

**Impact**: 2 queries → 1 query (50% reduction for template creation)

---

## Summary of Recommendations

### Critical Priority (Fix Immediately)
1. ✅ **billing.ts.addCredits** - Use transaction + upsert (5 queries → 2)
2. ✅ **billing.ts.getUserCredits** - Use upsert (2 queries → 1)
3. ✅ **tools.service.ts.updateExecutionStatus** - Parallelize analytics (3 queries → 2)

### High Priority (Fix Soon)
4. ✅ **tools.service.ts.createExecution** - Parallelize analytics (2 queries → 1)
5. ✅ **tools.service.ts.useTemplate** - Parallelize operations (3 queries → 2)
6. ✅ **ambassador.service.ts.getAmbassadorStats** - Parallelize queries (3 queries → 1 batch)
7. ✅ **ambassador.service.ts.approveAmbassador** - Use transaction (4 queries → 2)
8. ✅ **user-activity.ts.getUserActivity** - Parallelize queries (2 queries → 1 batch)
9. ✅ **plan-limits.service.ts.checkProjectLimit** - Use SQL COUNT (faster)
10. ✅ **plan-limits.service.ts.checkRenderLimit** - Use SQL COUNT (faster)

### Medium Priority (Nice to Have)
11. ✅ **render.ts.createRender** - Use Drizzle Query API (3 queries → 1)
12. ✅ **render.ts.processRender** - Parallelize operations (2 queries → 1 batch)
13. ✅ **render-chain.ts.getChainStats** - Use SQL aggregation (optimized)
14. ✅ **Prepared Statements** - Add for frequently executed queries
15. ✅ **tools.service.ts.saveTemplate** - Parallelize analytics (2 queries → 1)

---

## Performance Impact Estimates

- **Critical fixes**: 30-50% reduction in query time for affected operations
- **High priority fixes**: 20-40% reduction in query time
- **Prepared statements**: 20-30% improvement for frequently executed queries
- **Overall**: Estimated 25-35% improvement in service layer query performance

---

## Implementation Priority

1. **Week 1**: Fix all Critical Priority issues
2. **Week 2**: Fix High Priority issues
3. **Week 3**: Add prepared statements and Medium Priority optimizations
4. **Week 4**: Performance testing and monitoring

---

## Drizzle Best Practices Applied

### ✅ Query API for Nested Data
- Use `db.query` for relational nested data (1 SQL query)
- Example: `db.query.projects.findFirst({ with: { chains: { with: { renders } } } })`

### ✅ Prepared Statements
- Use `.prepare()` for frequently executed queries
- Use `sql.placeholder()` for dynamic values
- Example: `db.select().where(eq(column, sql.placeholder('value'))).prepare('name')`

### ✅ Transactions
- Use transactions for atomic operations
- Parallelize independent operations within transactions

### ✅ Upsert Pattern
- Use `onConflictDoUpdate` instead of check-then-insert
- Eliminates race conditions

### ✅ Parallelization
- Use `Promise.all()` for independent queries
- Fire-and-forget for non-critical operations (analytics)

### ✅ SQL Aggregation
- Use SQL COUNT/SUM instead of fetching all records
- Use FILTER clauses for conditional aggregation

---

**Report Generated**: 2025-01-27  
**Next Steps**: Review and prioritize fixes, then implement in phases

