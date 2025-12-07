# Dashboard Infrastructure Performance Audit

**Date:** 2024-12-19  
**Scope:** Complete dashboard infrastructure including routes, components, DAL services, and actions

## Executive Summary

This audit examines the entire dashboard infrastructure for:
1. **Memoization** of expensive operations and components
2. **Data access patterns** (batch vs single queries)
3. **Component optimization** opportunities
4. **Query optimization** in DAL services

## Findings Overview

### ✅ Strengths
- Good use of batch queries in DAL services
- Some memoization in paginated components
- Parallel query execution in several places

### ⚠️ Issues Found
- **Missing memoization** in several expensive operations
- **Unoptimized filtering/sorting** in client components
- **Missing React.memo** on frequently re-rendering components
- **Single query patterns** where batch would be better
- **Missing useCallback** for event handlers passed to children

---

## 1. Memoization Audit

### ✅ Currently Memoized

#### Dashboard Layout (`app/dashboard/layout.tsx`)
- ✅ `chainsByProject` - Memoized with `useMemo` (line 239)
- ✅ Helper functions are pure (no memoization needed)

#### Paginated Components
- ✅ `RecentProjectsPaginated` - `currentProjects` memoized (line 23)
- ✅ `RecentActivityPaginated` - `currentActivities` memoized (line 23)

### ❌ Missing Memoization

#### Dashboard Layout (`app/dashboard/layout.tsx`)
**Issues:**
1. **Line 174-177**: User display info calculations run on every render
   ```typescript
   const userName = userProfile?.name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User';
   const userEmail = user?.email || '';
   const userAvatar = userProfile?.avatar || user?.user_metadata?.avatar_url || '';
   const userInitials = userName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U';
   ```
   **Impact:** String operations and array methods on every render
   **Fix:** Wrap in `useMemo` with `[userProfile, user]` dependencies

2. **Line 251-259**: `toggleProject` function recreated on every render
   **Impact:** Causes child components to re-render unnecessarily
   **Fix:** Wrap in `useCallback` with `[expandedProjects]` dependency

3. **Line 262-270**: `handleSelectChain` function recreated on every render
   **Impact:** Causes child components to re-render unnecessarily
   **Fix:** Wrap in `useCallback` with `[chains, projects, router]` dependencies

4. **Line 273-276**: `handleSignOut` function recreated on every render
   **Impact:** Causes child components to re-render unnecessarily
   **Fix:** Wrap in `useCallback` with `[signOut, router]` dependencies

5. **Line 206-230**: `fetchData` function recreated on every render
   **Impact:** Causes unnecessary re-fetches if passed to children
   **Fix:** Wrap in `useCallback` with `[user?.id]` dependency

#### Projects Page (`app/dashboard/projects/page.tsx`)
**Issues:**
1. **Line 26-31**: `filteredProjects` recalculated on every render
   ```typescript
   const filteredProjects = projects.filter(project => {
     const matchesSearch = project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          project.description?.toLowerCase().includes(searchQuery.toLowerCase());
     const matchesStatus = filterStatus === 'all' || project.status === filterStatus;
     return matchesSearch && matchesStatus;
   });
   ```
   **Impact:** O(n) filter operation on every render, even when inputs haven't changed
   **Fix:** Wrap in `useMemo` with `[projects, searchQuery, filterStatus]` dependencies

2. **Line 33-44**: `sortedProjects` recalculated on every render
   ```typescript
   const sortedProjects = [...filteredProjects].sort((a, b) => {
     // ... sorting logic
   });
   ```
   **Impact:** O(n log n) sort operation on every render
   **Fix:** Wrap in `useMemo` with `[filteredProjects, sortBy]` dependencies

3. **Line 47-56**: `getGridCols` function recreated on every render
   **Impact:** Minor, but could be memoized
   **Fix:** Wrap in `useCallback` or move outside component

4. **Line 58-65, 67-72, 74-78**: Event handlers recreated on every render
   **Impact:** Causes child components to re-render unnecessarily
   **Fix:** Wrap all in `useCallback` with appropriate dependencies

#### Project Detail Page (`app/dashboard/projects/[slug]/page.tsx`)
**Issues:**
1. **Line 84-88**: `filteredRenders` recalculated on every render
   **Impact:** O(n) filter operation on every render
   **Fix:** Wrap in `useMemo` with `[renders, searchQuery, filterStatus]` dependencies

2. **Line 90-101**: `sortedRenders` recalculated on every render
   **Impact:** O(n log n) sort operation on every render
   **Fix:** Wrap in `useMemo` with `[filteredRenders, sortBy]` dependencies

3. **Line 103-112**: `getGridCols` function recreated on every render
   **Fix:** Wrap in `useCallback` or move outside component

4. **Line 114-138**: Event handlers recreated on every render
   **Fix:** Wrap all in `useCallback` with appropriate dependencies

5. **Line 263-266**: Chain mapping recalculated on every render
   ```typescript
   chains={chains.map(chain => ({
     ...chain,
     renderCount: renders.filter(r => r.chainId === chain.id).length,
     renders: renders.filter(r => r.chainId === chain.id).slice(0, 5)
   }))}
   ```
   **Impact:** O(n*m) operation where n=chains, m=renders - VERY EXPENSIVE
   **Fix:** Pre-compute with `useMemo` and create a Map for O(1) lookups

#### Library Client (`app/dashboard/library/library-client.tsx`)
**Issues:**
1. **Line 30**: Project IDs set creation recalculated
   **Fix:** Wrap in `useMemo`

2. **Line 44**: Filtered projects recalculated on every render
   **Fix:** Wrap in `useMemo` with `[rendersByProject, selectedProjectId]` dependencies

3. **Line 47**: Total renders calculation recalculated
   **Fix:** Wrap in `useMemo`

#### Billing History Credits (`app/dashboard/billing/history/credits/page.tsx`)
**Issues:**
1. **Line 53-59**: Multiple filter operations in render
   **Fix:** Combine into single `useMemo` with all filter dependencies

2. **Line 234-235, 242-243**: Reduce operations recalculated on every render
   **Fix:** Wrap in `useMemo`

### ❌ Missing React.memo

**Components that should be memoized:**
1. `ProjectCard` - Rendered in lists, receives stable props
2. `ImageCard` - Rendered in lists, receives stable props
3. `ChainList` - Receives stable props, expensive to render
4. `ProjectTree` - Complex tree structure, should only re-render when data changes

---

## 2. Data Access Patterns Audit

### ✅ Good Batch Query Patterns

#### ProjectsDAL (`lib/dal/projects.ts`)
- ✅ **Line 134-162**: `getLatestRendersForProjects` - Batch fetch for multiple projects using window functions
- ✅ **Line 75-104**: `getByUserIdWithRenderCounts` - Single query with JOIN and aggregation

#### RendersDAL (`lib/dal/renders.ts`)
- ✅ **Line 214-225**: `getWithContext` - Parallelized related data fetching with `Promise.all`
- ✅ **Line 362-375**: `getByIds` - Batch fetch multiple renders by IDs
- ✅ **Line 381-400**: `updateStatusBatch` - Batch update multiple renders
- ✅ **Line 448-462**: `batchCheckUserLiked` - Batch check user likes for multiple items

#### ActivityDAL (`lib/dal/activity.ts`)
- ✅ **Line 45-89**: `getUserActivity` - Fetches renders and likes separately, then combines (could be optimized with UNION)

#### BillingDAL (`lib/dal/billing.ts`)
- ✅ **Line 138-182**: `getUserCreditsWithReset` - Single query with JOINs instead of multiple queries

#### Gallery Actions (`lib/actions/gallery.actions.ts`)
- ✅ **Line 28-140**: `getLongestChains` - Optimized batch fetching with parallel queries

### ⚠️ Optimization Opportunities

#### Dashboard Page (`app/dashboard/page.tsx`)
**Current (Line 51-72):**
```typescript
const [
  projectsData,
  activityData,
  creditsData,
  projectCountResult,
  renderCountResult
] = await Promise.all([
  ProjectsDAL.getByUserId(user.id, 100),
  ActivityDAL.getUserActivity(user.id, 100),
  BillingDAL.getUserCreditsWithReset(user.id),
  db.select({ count: sql<number>`COUNT(*)` })
    .from(projects)
    .where(eq(projects.userId, user.id)),
  db.select({
    total: sql<number>`COUNT(*)`,
    completed: sql<number>`COUNT(*) FILTER (WHERE ${renders.status} = 'completed')`
  })
    .from(renders)
    .where(eq(renders.userId, user.id))
]);
```

**Issue:** 
- `projectCountResult` is redundant - count can be derived from `projectsData.length`
- Two separate queries for render counts could be combined

**Optimization:**
```typescript
const [
  projectsData,
  activityData,
  creditsData,
  renderCountResult
] = await Promise.all([
  ProjectsDAL.getByUserId(user.id, 100),
  ActivityDAL.getUserActivity(user.id, 100),
  BillingDAL.getUserCreditsWithReset(user.id),
  // Single query for both counts
  db.select({
    total: sql<number>`COUNT(*)`,
    completed: sql<number>`COUNT(*) FILTER (WHERE ${renders.status} = 'completed')`
  })
    .from(renders)
    .where(eq(renders.userId, user.id))
]);

const totalProjects = projectsData.length;
```

#### ActivityDAL (`lib/dal/activity.ts`)
**Current (Line 45-89):**
- Fetches renders and likes in separate queries, then combines in JavaScript

**Optimization Opportunity:**
- Use SQL UNION to combine in database, reducing data transfer and processing
- Could use a single query with UNION ALL and type discriminator

#### Dashboard Layout (`app/dashboard/layout.tsx`)
**Current (Line 211-214):**
```typescript
const [projectsRes, chainsRes] = await Promise.all([
  fetch('/api/projects'),
  fetch('/api/projects/chains')
]);
```

**Issue:** Two separate API calls from client
**Optimization:** Create a single API endpoint that returns both projects and chains

#### Project Detail Page (`app/dashboard/projects/[slug]/page.tsx`)
**Current (Line 263-266):**
```typescript
chains={chains.map(chain => ({
  ...chain,
  renderCount: renders.filter(r => r.chainId === chain.id).length,
  renders: renders.filter(r => r.chainId === chain.id).slice(0, 5)
}))}
```

**Issue:** O(n*m) complexity - for each chain, filters all renders
**Optimization:** 
1. Pre-compute render counts and groups with `useMemo`
2. Create a Map for O(1) lookups:
```typescript
const rendersByChainId = useMemo(() => {
  const map = new Map<string, Render[]>();
  renders.forEach(render => {
    if (render.chainId) {
      if (!map.has(render.chainId)) {
        map.set(render.chainId, []);
      }
      map.get(render.chainId)!.push(render);
    }
  });
  return map;
}, [renders]);

const chainsWithRenders = useMemo(() => {
  return chains.map(chain => ({
    ...chain,
    renderCount: rendersByChainId.get(chain.id)?.length || 0,
    renders: rendersByChainId.get(chain.id)?.slice(0, 5) || []
  }));
}, [chains, rendersByChainId]);
```

---

## 3. Component Optimization

### Missing useCallback

**All event handlers in these components should use `useCallback`:**
1. `app/dashboard/layout.tsx` - All handlers (toggleProject, handleSelectChain, handleSignOut, fetchData)
2. `app/dashboard/projects/page.tsx` - All handlers (handleDeleteProject, handleDuplicateProject, handleEditProject)
3. `app/dashboard/projects/[slug]/page.tsx` - All handlers (handleView, handleDownload, handleLike, handleShare, handleCreateChain)
4. `app/dashboard/library/library-client.tsx` - All handlers

### Missing React.memo

**Components that should be wrapped with React.memo:**
1. `ProjectCard` - Receives stable props, rendered in lists
2. `ImageCard` - Receives stable props, rendered in lists  
3. `ChainList` - Complex component, should only re-render when data changes
4. `ProjectTree` - Complex tree structure
5. `RecentProjectsPaginated` - Receives stable props
6. `RecentActivityPaginated` - Receives stable props

---

## 4. Query Optimization Summary

### ✅ Well Optimized
- Batch operations in DAL services
- Parallel query execution with `Promise.all`
- JOINs used appropriately
- Window functions for batch operations

### ⚠️ Needs Optimization
1. **Dashboard page** - Redundant count query
2. **ActivityDAL** - Could use SQL UNION instead of JavaScript combination
3. **Project detail page** - O(n*m) chain-render mapping
4. **Dashboard layout** - Two API calls could be one

---

## 5. Recommendations Priority

### 🔴 High Priority (Performance Impact)
1. **Memoize filtered/sorted arrays** in:
   - `app/dashboard/projects/page.tsx` (filteredProjects, sortedProjects)
   - `app/dashboard/projects/[slug]/page.tsx` (filteredRenders, sortedRenders)
   - `app/dashboard/library/library-client.tsx` (filteredProjects)

2. **Fix O(n*m) chain-render mapping** in:
   - `app/dashboard/projects/[slug]/page.tsx` (line 263-266)

3. **Memoize user display info** in:
   - `app/dashboard/layout.tsx` (line 174-177)

### 🟡 Medium Priority (Code Quality)
1. **Add useCallback** to all event handlers
2. **Add React.memo** to list item components
3. **Optimize dashboard page queries** (remove redundant count)

### 🟢 Low Priority (Nice to Have)
1. **Combine API calls** in dashboard layout
2. **Optimize ActivityDAL** with SQL UNION
3. **Move pure functions** outside components

---

## 6. Implementation Checklist

### Immediate Fixes
- [ ] Memoize `filteredProjects` and `sortedProjects` in projects page
- [ ] Memoize `filteredRenders` and `sortedRenders` in project detail page
- [ ] Fix O(n*m) chain-render mapping with Map-based lookup
- [ ] Memoize user display info in dashboard layout

### Short-term Improvements
- [ ] Add `useCallback` to all event handlers
- [ ] Add `React.memo` to ProjectCard, ImageCard, ChainList
- [ ] Remove redundant project count query in dashboard page
- [ ] Memoize filtered projects in library client

### Long-term Optimizations
- [ ] Combine projects/chains API calls
- [ ] Optimize ActivityDAL with SQL UNION
- [ ] Add performance monitoring
- [ ] Consider virtualization for long lists

---

## 7. Performance Metrics to Monitor

After implementing fixes, monitor:
1. **Time to Interactive (TTI)** - Should decrease with memoization
2. **First Contentful Paint (FCP)** - Should improve with query optimization
3. **Component re-render frequency** - Should decrease with React.memo
4. **Database query count** - Should decrease with batch optimizations
5. **JavaScript execution time** - Should decrease with memoized calculations

---

## Conclusion

The dashboard infrastructure has a solid foundation with good batch query patterns in DAL services. However, there are significant opportunities to improve client-side performance through:

1. **Memoization** of expensive calculations (filtering, sorting, mapping)
2. **React.memo** for frequently rendered components
3. **useCallback** for event handlers
4. **Query optimization** to reduce redundant database calls

Implementing the high-priority fixes should result in noticeable performance improvements, especially for users with many projects and renders.

