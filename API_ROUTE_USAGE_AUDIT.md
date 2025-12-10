# API Route Usage Audit Report

**Date**: 2025-01-27  
**Status**: 🔍 **AUDIT COMPLETE** - Found 2 remaining API route usages

---

## 🔴 Remaining API Route Usages Found

### 1. **`app/dashboard/layout.tsx`** - Uses `/api/projects` and `/api/projects/chains`
**Location**: Lines 267-268
**Current Code**:
```typescript
const [projectsRes, chainsRes] = await Promise.all([
  fetch('/api/projects'),
  fetch('/api/projects/chains')
]);
```

**Server Actions Available**:
- ✅ `getUserProjects()` - Available in `lib/actions/projects.actions.ts`
- ⚠️ Need to check if there's a server action for chains

**Recommendation**: Migrate to server actions

---

### 2. **`components/chat/unified-chat-interface.tsx`** - Uses `/api/renders`
**Location**: Lines 1464-1466
**Current Code**:
```typescript
const apiUrl = typeof window !== 'undefined' 
  ? `${window.location.origin}/api/renders`
  : '/api/renders';
```

**Server Action Available**:
- ✅ `createRenderAction()` - Available in `lib/actions/render.actions.ts`

**Note**: This is a complex component with retry logic and FormData handling. The API route has security/rate limiting features, but the server action should work for internal usage.

**Recommendation**: Migrate to server action for internal usage

---

## ✅ Already Migrated (No Action Needed)

### 1. **`/api/billing/plan-limits`**
- ✅ Migrated in `lib/hooks/use-plan-limits.ts`
- ✅ Now uses `getUserPlanLimits()` server action

### 2. **`/api/billing/check-limit`**
- ✅ Migrated in `lib/hooks/use-plan-limits.ts`
- ✅ Now uses `checkProjectLimit()`, `checkRenderLimit()`, etc. server actions

### 3. **`/api/billing/plans`**
- ✅ Migrated in `components/billing/upgrade-modal.tsx`
- ✅ Now uses `getSubscriptionPlansAction()` server action

### 4. **`/api/billing/credit-packages`**
- ✅ Migrated in `components/billing/upgrade-modal.tsx`
- ✅ Now uses `getCreditPackagesAction()` server action

### 5. **`/api/credits/transactions`**
- ✅ Migrated in `lib/hooks/use-credit-transactions.ts`
- ✅ Now uses `getCreditTransactionsAction()` server action

### 6. **`/api/renders` (in hooks)**
- ✅ Migrated in `lib/hooks/use-node-execution.ts`
- ✅ Migrated in `lib/hooks/use-optimistic-generation.ts`
- ✅ Migrated in `lib/hooks/use-upscaling.ts`
- ✅ Now uses `createRenderAction()` server action

---

## 📊 Summary

**Total API Routes Checked**: 7  
**Already Migrated**: 5  
**Still Using API Routes**: 2  
**Migration Needed**: 2

---

## 🎯 Next Steps

1. **Migrate `app/dashboard/layout.tsx`**:
   - Replace `/api/projects` with `getUserProjects()` server action
   - Check if there's a server action for chains, or create one

2. **Migrate `components/chat/unified-chat-interface.tsx`**:
   - Replace `/api/renders` with `createRenderAction()` server action
   - Update retry logic to work with server actions
   - Test FormData handling with server actions

---

**Report Generated**: 2025-01-27

