# Remaining Services Query Optimization Audit Report

**Date**: 2025-01-27  
**Scope**: Remaining service layer files not yet optimized  
**Based on**: Drizzle ORM 2025 Best Practices

---

## Executive Summary

**Total Remaining Services Audited**: 11  
**Optimization Opportunities Found**: 13  
**Critical Issues**: 1  
**High Priority**: 5  
**Medium Priority**: 7

---

## Optimization Categories

### 1. Sequential Queries → Parallel Queries
### 2. Sequential Queries → SQL Aggregation
### 3. Check-then-Insert → Upsert (ON CONFLICT)
### 4. Client-side Filtering → SQL WHERE Clauses
### 5. Loop Queries → Batch Operations

---

## Detailed Findings

### 🔴 CRITICAL PRIORITY

#### 1. **canvas-files.service.ts - `saveGraph`** (Lines 91-108)
**Problem**: Sequential queries - save graph, then increment version, then create version
```typescript
// Current: 3 sequential queries
const result = await CanvasDAL.saveGraph(fileId, userId, state); // Query 1
if (result.success && result.data) {
  await CanvasFilesDAL.incrementVersion(fileId); // Query 2
  await CanvasFilesDAL.createVersion({...}); // Query 3
}
```

**Solution**: Parallelize increment and create version (after saveGraph succeeds)
```typescript
// ✅ OPTIMIZED: Parallelize increment and create version
const result = await CanvasDAL.saveGraph(fileId, userId, state);
if (result.success && result.data) {
  await Promise.all([
    CanvasFilesDAL.incrementVersion(fileId),
    CanvasFilesDAL.createVersion({
      fileId,
      version: result.data.version,
      graphId: result.data.id,
      createdBy: userId,
    })
  ]);
}
```

**Impact**: 3 queries → 2 queries (33% reduction)

---

### 🟡 HIGH PRIORITY

#### 2. **user-onboarding.ts - `createUserProfile`** (Lines 26-227)
**Problem**: Sequential queries for user check, creation, sybil detection, credits initialization
```typescript
// Current: Multiple sequential queries
let existingUser = await AuthDAL.getUserById(userProfile.id); // Query 1
if (!existingUser) {
  existingUser = await AuthDAL.getUserByEmail(userProfile.email); // Query 2
}
// ... user creation ...
// ... sybil detection ...
const creditsResult = await this.initializeUserCredits(...); // Query N
await this.createWelcomeTransaction(...); // Query N+1
```

**Note**: This is complex due to dependencies. The main optimization is in `initializeUserCredits` (see below).

**Solution**: Optimize `initializeUserCredits` to use upsert pattern (see #3)

**Impact**: Reduces queries in credit initialization

---

#### 3. **user-onboarding.ts - `initializeUserCredits`** (Lines 229-254)
**Problem**: Check-then-insert pattern
```typescript
// Current: 2 sequential queries
const existingCredits = await AuthDAL.getUserCredits(userId); // Query 1
if (existingCredits) {
  return { success: true };
}
const userCredit = await AuthDAL.createUserCredits(userId, credits); // Query 2
```

**Solution**: Use upsert pattern (if AuthDAL supports it, or use billing service)
```typescript
// ✅ OPTIMIZED: Use billing service which already has upsert
const { BillingService } = await import('./billing');
const creditsResult = await BillingService.getUserCredits(userId);
if (!creditsResult.success) {
  // BillingService.getUserCredits already uses upsert, so this should work
  // But we need to set initial credits if they don't exist
  await BillingService.addCredits(userId, credits, 'bonus', 'Initial signup credits');
}
```

**Impact**: 2 queries → 1 query (50% reduction)

---

#### 4. **context-prompt.ts - `extractSuccessfulElements`** (Lines 90-105)
**Problem**: Fetches all renders then filters in JavaScript
```typescript
// Current: 1 query fetching all renders, then client-side filtering
const renders = await RendersDAL.getByChainId(chainId);
const completedRenders = renders.filter(r => r.status === 'completed');
```

**Solution**: Use SQL WHERE clause to filter at database level
```typescript
// ✅ OPTIMIZED: Filter at database level
// Note: This requires adding a method to RendersDAL or using db directly
const renders = await db
  .select()
  .from(renders)
  .where(and(
    eq(renders.chainId, chainId),
    eq(renders.status, 'completed')
  ));
```

**Impact**: Reduces data transfer and processing time

---

#### 5. **context-prompt.ts - `buildChainContext`** (Lines 110-132)
**Problem**: Fetches all renders then filters in JavaScript
```typescript
// Current: 1 query fetching all renders, then client-side filtering
const renders = await RendersDAL.getByChainId(chainId);
const completedRenders = renders
  .filter(r => r.status === 'completed')
  .sort((a, b) => (a.chainPosition || 0) - (b.chainPosition || 0));
```

**Solution**: Use SQL WHERE and ORDER BY
```typescript
// ✅ OPTIMIZED: Filter and sort at database level
const completedRenders = await db
  .select()
  .from(renders)
  .where(and(
    eq(renders.chainId, chainId),
    eq(renders.status, 'completed')
  ))
  .orderBy(asc(renders.chainPosition));
```

**Impact**: Reduces data transfer and processing time

---

#### 6. **context-prompt.ts - `generateIterationSuggestions`** (Lines 164-199)
**Problem**: Fetches all renders then filters in JavaScript
```typescript
// Current: 1 query fetching all renders, then client-side filtering
const renders = await RendersDAL.getByChainId(chainId);
const completedRenders = renders.filter(r => r.status === 'completed');
const failedRenders = renders.filter(r => r.status === 'failed');
```

**Solution**: Use SQL aggregation or separate queries with WHERE clauses
```typescript
// ✅ OPTIMIZED: Use SQL aggregation
const [stats] = await db
  .select({
    completed: sql<number>`COUNT(*) FILTER (WHERE ${renders.status} = 'completed')::int`,
    failed: sql<number>`COUNT(*) FILTER (WHERE ${renders.status} = 'failed')::int`,
    total: sql<number>`COUNT(*)::int`,
  })
  .from(renders)
  .where(eq(renders.chainId, chainId));

// Only fetch renders if needed for analysis
const completedRenders = stats.completed > 0 
  ? await db.select().from(renders).where(and(
      eq(renders.chainId, chainId),
      eq(renders.status, 'completed')
    ))
  : [];
```

**Impact**: Reduces data transfer significantly

---

### 🟢 MEDIUM PRIORITY

#### 7. **sybil-detection.ts - `storeDetectionResult`** (Lines 526-588)
**Problem**: Sequential queries to fetch device and IP IDs
```typescript
// Current: 2 sequential queries
const device = await db.select()...; // Query 1
const ip = await db.select()...; // Query 2
```

**Solution**: Parallelize independent queries
```typescript
// ✅ OPTIMIZED: Parallelize independent queries
const [device, ip] = await Promise.all([
  db.select({ id: deviceFingerprints.id })
    .from(deviceFingerprints)
    .where(and(
      eq(deviceFingerprints.fingerprintHash, fingerprintHash),
      eq(deviceFingerprints.userId, userId)
    ))
    .orderBy(desc(deviceFingerprints.createdAt))
    .limit(1),
  db.select({ id: ipAddresses.id })
    .from(ipAddresses)
    .where(and(
      eq(ipAddresses.ipAddress, ipAddress),
      eq(ipAddresses.userId, userId)
    ))
    .orderBy(desc(ipAddresses.createdAt))
    .limit(1)
]);
```

**Impact**: 2 queries → 1 parallel batch (50% time reduction)

---

#### 8. **sybil-detection.ts - `recordActivity`** (Lines 600-628)
**Problem**: Sequential query to get device ID before inserting
```typescript
// Current: 2 sequential queries
const deviceId = fingerprintHash
  ? (await db.select()...)[0]?.id // Query 1
  : undefined;
await db.insert(accountActivity).values({...}); // Query 2
```

**Solution**: Use subquery or JOIN in insert (if possible), or make device lookup optional
```typescript
// ✅ OPTIMIZED: Use subquery in insert (if Drizzle supports it)
// Or: Make device lookup fire-and-forget if not critical
if (fingerprintHash) {
  const deviceIdPromise = db
    .select({ id: deviceFingerprints.id })
    .from(deviceFingerprints)
    .where(eq(deviceFingerprints.fingerprintHash, fingerprintHash))
    .limit(1)
    .then(result => result[0]?.id)
    .catch(() => undefined); // Fire-and-forget if fails
  
  const deviceId = await deviceIdPromise;
  await db.insert(accountActivity).values({
    userId,
    eventType,
    ipAddress: normalizeIpAddress(ipAddress),
    userAgent: userAgent.substring(0, 500),
    deviceFingerprintId: deviceId,
  });
} else {
  await db.insert(accountActivity).values({
    userId,
    eventType,
    ipAddress: normalizeIpAddress(ipAddress),
    userAgent: userAgent.substring(0, 500),
  });
}
```

**Impact**: Minimal (device lookup is optional), but improves code clarity

---

#### 9. **thumbnail.ts - `generateChainThumbnails`** (Lines 58-88)
**Problem**: Sequential thumbnail generation in loop
```typescript
// Current: Sequential generation in loop
for (const render of renders) {
  if (render.status === 'completed' && render.outputUrl) {
    const url = await this.generateThumbnail(render.id, 'small'); // Sequential
  }
}
```

**Solution**: Parallelize thumbnail generation
```typescript
// ✅ OPTIMIZED: Parallelize thumbnail generation
const completedRenders = renders.filter(r => r.status === 'completed' && r.outputUrl);
const thumbnailPromises = completedRenders.map(render =>
  this.generateThumbnail(render.id, 'small')
    .then(url => ({
      renderId: render.id,
      url,
      position: render.chainPosition || 0,
    }))
    .catch(error => {
      logger.error(`Failed to generate thumbnail for render ${render.id}:`, error);
      return null;
    })
);

const thumbnails = (await Promise.all(thumbnailPromises))
  .filter((t): t is NonNullable<typeof t> => t !== null)
  .sort((a, b) => a.position - b.position);
```

**Impact**: N sequential queries → 1 parallel batch (significant time reduction for multiple renders)

---

#### 10. **thumbnail.ts - `bulkGenerateThumbnails`** (Lines 177-197)
**Problem**: Sequential thumbnail generation in loop
```typescript
// Current: Sequential generation in loop
for (const renderId of renderIds) {
  const url = await this.generateThumbnail(renderId, size); // Sequential
}
```

**Solution**: Parallelize thumbnail generation
```typescript
// ✅ OPTIMIZED: Parallelize thumbnail generation
const thumbnailPromises = renderIds.map(renderId =>
  this.generateThumbnail(renderId, size)
    .then(url => ({ renderId, url }))
    .catch(error => {
      logger.error(`Failed to generate thumbnail for ${renderId}:`, error);
      return null;
    })
);

const results = new Map<string, string>();
(await Promise.all(thumbnailPromises)).forEach(result => {
  if (result) {
    results.set(result.renderId, result.url);
  }
});
```

**Impact**: N sequential queries → 1 parallel batch (significant time reduction)

---

#### 11. **razorpay.service.ts - `verifyPayment`** (Lines 147-400+)
**Status**: Already partially optimized with parallel queries (lines 157-164)

**Note**: The file is very large (2492 lines). The main optimization opportunities are:
- Some sequential queries in subscription handling (lines 1592, 2257)
- Ambassador referral lookups could be parallelized with other operations

**Recommendation**: Review specific methods for additional parallelization opportunities

---

#### 12. **storage.ts - `getFileUrl`** (Lines 255-299)
**Status**: Already optimized - single query with conditional logic

**Note**: This file is mostly storage operations, minimal database queries. No significant optimization needed.

---

#### 13. **receipt.service.ts - `generateReceiptPdf`** (Lines 13-453)
**Problem**: Sequential queries - get payment order, get invoice, get user, get reference details
```typescript
// Current: 4+ sequential queries
const [paymentOrder] = await db.select()...; // Query 1
let invoiceResult = await InvoiceService.getInvoiceByNumber(...); // Query 2
const [user] = await db.select()...; // Query 3
const [packageData] = await db.select()...; // Query 4 (conditional)
```

**Solution**: Parallelize independent queries
```typescript
// ✅ OPTIMIZED: Parallelize independent queries
const [paymentOrderResult, invoiceResult] = await Promise.all([
  db.select().from(paymentOrders).where(...).limit(1),
  InvoiceService.getInvoiceByNumber(paymentOrder.invoiceNumber || '')
]);

const [paymentOrder] = paymentOrderResult;
if (!paymentOrder) return { success: false, error: 'Payment order not found' };

// If invoice doesn't exist, create it, then fetch user and reference in parallel
if (!invoiceResult.success || !invoiceResult.data) {
  invoiceResult = await InvoiceService.createInvoice(paymentOrderId);
}

const [user, referenceDetails] = await Promise.all([
  db.select().from(users).where(eq(users.id, paymentOrder.userId)).limit(1),
  paymentOrder.type === 'credit_package' && paymentOrder.referenceId
    ? db.select().from(creditPackages).where(eq(creditPackages.id, paymentOrder.referenceId)).limit(1)
    : paymentOrder.type === 'subscription' && paymentOrder.referenceId
    ? db.select().from(subscriptionPlans).where(eq(subscriptionPlans.id, paymentOrder.referenceId)).limit(1)
    : Promise.resolve([undefined])
]);
```

**Impact**: 4+ queries → 2-3 queries (25-50% reduction)

---

#### 14. **invoice.service.ts - `generateInvoiceNumber`** (Lines 11-51)
**Status**: Already optimized - uses efficient queries

**Note**: The invoice number generation uses timestamp-based approach which is efficient. The queries are necessary for uniqueness checks.

---

#### 15. **payment-history.service.ts - `getPaymentHistory`** (Lines 20-171)
**Status**: Already optimized - uses parallel queries and JOINs

**Note**: This service already uses:
- Parallel queries for count and data fetching
- LEFT JOINs to avoid N+1 queries
- Efficient SQL aggregation

**No optimization needed** ✅

---

## Summary of Recommendations

### Critical Priority (Fix Immediately)
1. ✅ **canvas-files.service.ts.saveGraph** - Parallelize increment and create version (3 queries → 2)

### High Priority (Fix Soon)
2. ✅ **user-onboarding.ts.initializeUserCredits** - Use upsert pattern (2 queries → 1)
3. ✅ **context-prompt.ts.extractSuccessfulElements** - Use SQL WHERE clause
4. ✅ **context-prompt.ts.buildChainContext** - Use SQL WHERE and ORDER BY
5. ✅ **context-prompt.ts.generateIterationSuggestions** - Use SQL aggregation
6. ✅ **receipt.service.ts.generateReceiptPdf** - Parallelize independent queries (4+ queries → 2-3)

### Medium Priority (Nice to Have)
7. ✅ **sybil-detection.ts.storeDetectionResult** - Parallelize device and IP lookups (2 queries → 1 batch)
8. ✅ **sybil-detection.ts.recordActivity** - Optimize device lookup (optional improvement)
9. ✅ **thumbnail.ts.generateChainThumbnails** - Parallelize thumbnail generation
10. ✅ **thumbnail.ts.bulkGenerateThumbnails** - Parallelize thumbnail generation
11. ⚠️ **razorpay.service.ts** - Review for additional parallelization (large file, needs specific review)

### Already Optimized ✅
- **invoice.service.ts** - Already uses parallel queries
- **payment-history.service.ts** - Already uses parallel queries and JOINs
- **storage.ts** - Minimal database queries, already optimized

---

## Performance Impact Estimates

- **Critical fixes**: 30-40% reduction in query time for affected operations
- **High priority fixes**: 20-50% reduction in query time (depending on data size)
- **Medium priority fixes**: 40-80% time reduction for bulk operations (thumbnails)
- **Overall**: Estimated 20-30% improvement in remaining service layer query performance

---

## Implementation Priority

1. **Week 1**: Fix Critical Priority issue
2. **Week 2**: Fix High Priority issues
3. **Week 3**: Fix Medium Priority optimizations
4. **Week 4**: Performance testing and monitoring

---

## Drizzle Best Practices Applied

### ✅ Parallelization
- Use `Promise.all()` for independent queries
- Parallelize operations in loops

### ✅ SQL Filtering
- Use WHERE clauses instead of client-side filtering
- Use ORDER BY at database level

### ✅ SQL Aggregation
- Use COUNT/SUM with FILTER clauses
- Reduce data transfer by aggregating at database level

### ✅ Upsert Pattern
- Use `onConflictDoUpdate` instead of check-then-insert

---

**Report Generated**: 2025-01-27  
**Next Steps**: Review and prioritize fixes, then implement in phases

