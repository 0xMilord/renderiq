# Actions Query Optimization Audit Report

**Date**: 2025-01-27  
**Scope**: All server actions that use optimized services  
**Based on**: Drizzle ORM 2025 Best Practices

---

## Executive Summary

**Total Actions Audited**: 19 action files  
**Optimization Opportunities Found**: 3  
**Critical Bugs Found**: 1  
**High Priority**: 2  
**Medium Priority**: 1

---

## Detailed Findings

### 🔴 CRITICAL BUG

#### 1. **render.actions.ts - `createRenderAction`** (Line 292)
**Problem**: Undefined variable `chainRenders` is referenced
```typescript
// Current: chainRenders is used but never defined
if (chainRenders.length > 0) { // ❌ ERROR: chainRenders is undefined
  const mostRecentRender = chainRenders.filter(...)
}
```

**Solution**: Fetch chain renders when needed
```typescript
// ✅ FIXED: Fetch chain renders when needed
if (referenceRenderId && referenceRenderId.startsWith('temp-')) {
  logger.log('⚠️ Temporary reference render ID detected, using most recent render in chain');
  if (finalChainId) {
    const chainRenders = await RendersDAL.getByChainId(finalChainId);
    if (chainRenders.length > 0) {
      // ... rest of logic
    }
  }
}
```

**Impact**: Fixes runtime error

---

### 🟡 HIGH PRIORITY

#### 2. **render.actions.ts - `createRenderAction`** (Lines 260-279)
**Problem**: Sequential queries - get project, then get/create chain, then get position
```typescript
// Current: 3 sequential queries
const project = await ProjectsDAL.getById(projectId); // Query 1
const defaultChain = await RenderChainService.getOrCreateDefaultChain(...); // Query 2
const chainPosition = await RenderChainService.getNextChainPosition(...); // Query 3
```

**Note**: These have dependencies (need project to get/create chain, need chain to get position), but we can optimize by fetching chain renders in parallel with position if chainId is provided.

**Solution**: If chainId is provided, parallelize chain position and chain renders fetch
```typescript
// ✅ OPTIMIZED: Parallelize when chainId is provided
const project = await ProjectsDAL.getById(projectId);
if (!project || project.userId !== userId) {
  return { success: false, error: 'Project not found or access denied' };
}

let finalChainId = chainId;
let chainPosition: number;
let chainRenders: any[] = [];

if (!finalChainId) {
  // Need to create chain first
  const defaultChain = await RenderChainService.getOrCreateDefaultChain(projectId, project.name);
  finalChainId = defaultChain.id;
  chainPosition = await RenderChainService.getNextChainPosition(finalChainId);
} else {
  // ✅ OPTIMIZED: Parallelize position and renders fetch when chainId is known
  [chainPosition, chainRenders] = await Promise.all([
    RenderChainService.getNextChainPosition(finalChainId),
    RendersDAL.getByChainId(finalChainId)
  ]);
}
```

**Impact**: 2 queries → 1 parallel batch when chainId is provided (50% time reduction)

---

#### 3. **render.actions.ts - `processRenderAsync`** (Lines 790-796)
**Problem**: Sequential queries - get project, then check pro status
```typescript
// Current: 2 sequential queries
const project = await ProjectsDAL.getById(renderData.projectId); // Query 1
const isPro = await BillingDAL.isUserPro(renderData.userId); // Query 2
```

**Solution**: Parallelize independent queries
```typescript
// ✅ OPTIMIZED: Parallelize independent queries
const [project, isPro] = await Promise.all([
  ProjectsDAL.getById(renderData.projectId),
  BillingDAL.isUserPro(renderData.userId)
]);
```

**Impact**: 2 queries → 1 parallel batch (50% time reduction)

---

### 🟢 MEDIUM PRIORITY

#### 4. **canvas-files.actions.ts - `saveCanvasGraphAction`** (Lines 307-333)
**Problem**: Sequential - save graph, then get file for revalidation
```typescript
// Current: 2 sequential queries
const result = await CanvasFilesService.saveGraph(fileId, user.id, state); // Query 1 (already optimized)
const file = await CanvasFilesService.getFileById(fileId); // Query 2 (for revalidation)
```

**Note**: The saveGraph is already optimized. The getFileById is only for revalidation path. This is acceptable as-is, but could be optimized if we return file data from saveGraph.

**Solution**: Return file data from saveGraph or make revalidation optional
```typescript
// ✅ OPTIMIZED: Make revalidation optional or return file from saveGraph
const result = await CanvasFilesService.saveGraph(fileId, user.id, state);
if (result.success && result.data) {
  // Revalidate with projectId from result if available, or fetch file
  // This is a minor optimization - current approach is acceptable
}
```

**Impact**: Minimal (revalidation is non-critical)

---

## Summary of Recommendations

### Critical Priority (Fix Immediately)
1. ✅ **render.actions.ts.createRenderAction** - Fix undefined `chainRenders` variable

### High Priority (Fix Soon)
2. ✅ **render.actions.ts.createRenderAction** - Parallelize chain position and renders fetch when chainId provided
3. ✅ **render.actions.ts.processRenderAsync** - Parallelize project and pro status fetch

### Medium Priority (Nice to Have)
4. ⚠️ **canvas-files.actions.ts.saveCanvasGraphAction** - Minor optimization for revalidation

---

## Performance Impact Estimates

- **Critical fix**: Prevents runtime error
- **High priority fixes**: 50% time reduction for affected operations
- **Overall**: Estimated 10-15% improvement in render action performance

---

## Drizzle Best Practices Applied

### ✅ Parallelization
- Use `Promise.all()` for independent queries
- Parallelize when dependencies allow

---

**Report Generated**: 2025-01-27  
**Next Steps**: Fix critical bug and implement high priority optimizations

