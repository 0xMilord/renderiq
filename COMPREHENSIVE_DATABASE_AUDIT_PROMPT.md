# Comprehensive Database Performance Audit - Agent Instructions

## Mission
Conduct a complete audit of the entire codebase to identify and fix ALL database performance issues, including N+1 queries, connection leaks, inefficient queries, and missing indexes.

## Audit Scope

### Phase 1: Identify All Database Access Points
Search the entire codebase for:

1. **DAL (Data Access Layer) Files**
   - Location: `lib/dal/*.ts`
   - Check: Every method that queries the database
   - Look for: Sequential queries in loops, missing batch operations

2. **Service Layer Files**
   - Location: `lib/services/*.ts`
   - Check: Methods that call multiple DAL methods
   - Look for: Repeated queries, missing data joins

3. **Server Actions**
   - Location: `lib/actions/*.ts`
   - Check: All exported functions that interact with database
   - Look for: Multiple sequential DAL calls, missing parallel fetches

4. **API Routes**
   - Location: `app/api/**/route.ts`
   - Check: GET/POST/PUT/DELETE handlers
   - Look for: Direct database queries, missing connection cleanup

5. **Server Components (RSC)**
   - Location: `app/**/page.tsx` (server components)
   - Check: Data fetching in components
   - Look for: Multiple fetch operations, sequential Promise.all usage

### Phase 2: Critical N+1 Query Patterns to Find

#### Pattern 1: Loop with Individual Queries
```typescript
// ❌ BAD - N+1 Query
const items = await db.select().from(table1);
for (const item of items) {
  const related = await db.select().from(table2).where(eq(table2.itemId, item.id));
  item.related = related;
}
```

#### Pattern 2: Multiple Sequential DAL Calls
```typescript
// ❌ BAD - Multiple Round Trips
const projects = await ProjectsDAL.getByUserId(userId);
for (const project of projects) {
  project.renders = await RendersDAL.getByProjectId(project.id); // N+1!
  project.chains = await ChainsDAL.getByProjectId(project.id); // Another N+1!
}
```

#### Pattern 3: Missing Batch Operations
```typescript
// ❌ BAD - Individual Queries
const render1 = await RendersDAL.getById(id1);
const render2 = await RendersDAL.getById(id2);
const render3 = await RendersDAL.getById(id3);
```

#### Pattern 4: Inefficient Joins
```typescript
// ❌ BAD - Fetching too much data
const allData = await db.select().from(largeTable); // Gets 10,000 rows
const filtered = allData.filter(x => x.userId === userId); // Filters in JS
```

### Phase 3: Files to Audit (Systematic Checklist)

#### High Priority - Known Heavy Operations
- [ ] `lib/dal/projects.ts` - All methods
- [ ] `lib/dal/render-chains.ts` - All methods
- [ ] `lib/dal/renders.ts` - All methods
- [ ] `lib/dal/gallery.ts` - All methods
- [ ] `lib/services/user-activity.ts` - All methods
- [ ] `lib/services/gallery.ts` - All methods
- [ ] `lib/actions/projects.actions.ts` - All exports
- [ ] `lib/actions/renders.actions.ts` - All exports
- [ ] `lib/actions/gallery.actions.ts` - All exports

#### Medium Priority - User-Facing Features
- [ ] `app/dashboard/projects/page.tsx`
- [ ] `app/dashboard/page.tsx`
- [ ] `app/gallery/page.tsx`
- [ ] `app/[projectSlug]/chat/[chainId]/page.tsx`
- [ ] `lib/services/billing.ts`
- [ ] `lib/services/subscription.ts`
- [ ] `lib/actions/billing.actions.ts`

#### Lower Priority - Less Frequent Operations
- [ ] `lib/services/user-onboarding.ts`
- [ ] `lib/services/auth.ts`
- [ ] `lib/dal/users.ts`
- [ ] All API routes in `app/api/**/route.ts`

### Phase 4: Audit Questions for Each File

For EACH file containing database operations, answer:

1. **Query Count Analysis**
   - How many database queries are executed?
   - Are any queries executed in a loop?
   - Can multiple queries be combined into one?

2. **Batch Operation Check**
   - Are there methods that could benefit from batch operations?
   - Can we use `inArray()` instead of multiple `eq()` queries?
   - Can we use SQL window functions (ROW_NUMBER, RANK)?

3. **Connection Management**
   - Are connections properly closed/reused?
   - Are there any connection leaks?
   - Is connection pooling configured correctly?

4. **Index Usage**
   - Are queries using proper WHERE clauses?
   - Are foreign keys indexed?
   - Are commonly queried fields indexed?

5. **Data Volume**
   - How much data is being fetched?
   - Can we use pagination/limits?
   - Are we selecting only needed fields?

### Phase 5: Required Fixes

For each issue found, implement:

#### Fix Type A: Convert Loop Queries to Batch
```typescript
// ✅ GOOD - Batch Query
const items = await db.select().from(table1).where(eq(table1.userId, userId));
const itemIds = items.map(i => i.id);

const allRelated = await db.select()
  .from(table2)
  .where(inArray(table2.itemId, itemIds));

const relatedByItem = allRelated.reduce((acc, r) => {
  if (!acc[r.itemId]) acc[r.itemId] = [];
  acc[r.itemId].push(r);
  return acc;
}, {});

items.forEach(item => {
  item.related = relatedByItem[item.id] || [];
});
```

#### Fix Type B: Add Batch Methods to DAL
```typescript
// Add to DAL
static async getByIds(ids: string[]) {
  if (ids.length === 0) return [];
  return await db.select()
    .from(table)
    .where(inArray(table.id, ids));
}

static async getBatchWithRelations(ids: string[]) {
  // Use SQL JOIN or window functions
  // Return all data in 1-2 queries max
}
```

#### Fix Type C: Use SQL Window Functions
```typescript
// ✅ GOOD - Get top N per group in ONE query
const topRenders = await db
  .select({
    ...renders,
    rowNum: sql<number>`ROW_NUMBER() OVER (PARTITION BY ${renders.projectId} ORDER BY ${renders.createdAt} DESC)`.as('row_num'),
  })
  .from(renders)
  .where(inArray(renders.projectId, projectIds));

const filtered = topRenders.filter(r => r.rowNum <= 5);
```

#### Fix Type D: Parallel Fetching
```typescript
// ✅ GOOD - Parallel independent queries
const [projects, userStats, credits] = await Promise.all([
  ProjectsDAL.getByUserId(userId),
  UserActivityDAL.getStats(userId),
  BillingDAL.getCredits(userId)
]);
```

### Phase 6: Testing Requirements

For each fix:

1. **Measure Before/After**
   - Query count: Before vs After
   - Response time: Before vs After
   - Database connections: Before vs After

2. **Test in Production-Like Conditions**
   - Large datasets (100+ records)
   - Multiple concurrent users
   - Cold starts (serverless)

3. **Verify Correctness**
   - Data matches original query results
   - No missing or duplicate data
   - Proper error handling

### Phase 7: Documentation

Create/update `DATABASE_PERFORMANCE_AUDIT.md` with:

1. **Executive Summary**
   - Total issues found
   - Total fixes applied
   - Overall performance improvement

2. **Detailed Findings** (per file)
   - File path
   - Issue description
   - Before metrics
   - After metrics
   - Code changes

3. **Best Practices Document**
   - Patterns to avoid
   - Patterns to use
   - Code review checklist

### Phase 8: Preventive Measures

Add to the project:

1. **Performance Monitoring**
   - Add query count logging to all DAL methods
   - Track response times for all actions
   - Alert on regression

2. **Code Review Checklist**
   - No queries in loops
   - All batch operations use `inArray()`
   - All actions have max 3 queries
   - All connections properly managed

3. **Database Indexes**
   - Review schema for missing indexes
   - Add indexes for foreign keys
   - Add indexes for frequently queried fields

## Output Format

For each file audited, report:

```markdown
### File: lib/services/example.ts

#### Issues Found: 2

##### Issue 1: N+1 Query in getProjectsWithDetails()
- **Severity**: HIGH
- **Current Queries**: 1 + N (where N = number of projects)
- **Pattern**: Loop with individual queries
- **Line**: 45-52
- **Impact**: 51 queries for 50 projects = 5-10 seconds

##### Fix Applied:
- Added batch method `getProjectRendersInBatch()` to RendersDAL
- Reduced to 2 queries total (projects + batch renders)
- New response time: 200-300ms
- **Improvement**: 95% faster, 96% fewer queries

##### Code Changes:
```typescript
// Before (❌)
const projects = await ProjectsDAL.getAll();
for (const project of projects) {
  project.renders = await RendersDAL.getByProjectId(project.id);
}

// After (✅)
const projects = await ProjectsDAL.getAll();
const projectIds = projects.map(p => p.id);
const allRenders = await RendersDAL.getByProjectIds(projectIds);
const rendersByProject = groupBy(allRenders, 'projectId');
projects.forEach(p => p.renders = rendersByProject[p.id] || []);
```
```

## Start Command

Begin the audit with:

1. List all files in `lib/dal/`, `lib/services/`, `lib/actions/`
2. For each file, read and analyze all database operations
3. Document issues found
4. Implement fixes
5. Test and verify
6. Generate final report

---

**CRITICAL**: This audit should find and fix ALL database performance issues, not just obvious ones. Every loop, every sequential query, every missing index should be identified and addressed.

