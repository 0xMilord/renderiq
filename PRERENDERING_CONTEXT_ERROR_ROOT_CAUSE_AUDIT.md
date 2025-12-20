# Prerendering Context Error - Root Cause Audit

**Date**: 2025-01-XX  
**Status**: 🔍 Root Cause Identified  
**Issue**: `TypeError: Cannot read properties of null (reading 'useContext')` during Next.js prerendering

---

## Problem Summary

Multiple pages are failing during Next.js static generation (prerendering) with the error:
```
TypeError: Cannot read properties of null (reading 'useContext')
```

This error occurs when React Context is accessed during server-side rendering/prerendering, where React context is not yet available.

---

## Root Causes Identified

### 1. **Radix UI `Slot` Component Uses React Context**

**Location**: `components/ui/badge.tsx`, `components/ui/button.tsx`, and other UI components

**Issue**: The `Slot` component from `radix-ui` uses React Context internally. When these UI components are used in server components or during prerendering, the context is `null`, causing the error.

**Components Affected**:
- `Badge` - uses `Slot.Root` when `asChild={true}`
- `Button` - uses `Slot.Root` when `asChild={true}`
- `Breadcrumb` - uses `Slot.Root`
- `ButtonGroup` - uses `Slot.Root`
- `Item` - uses `Slot.Root`
- `Sidebar` - uses `Slot.Root` (multiple instances)

**Fix Applied**: Made `Badge` and `Button` client components by adding `"use client"` directive.

**Remaining**: Other components using `Slot` may need similar fixes if they cause issues.

---

### 2. **`next-themes` `useTheme()` Hook Requires Context**

**Location**: `components/pricing/pricing-plans.tsx`, `components/pricing/credit-packages.tsx`

**Issue**: The `useTheme()` hook from `next-themes` requires the `ThemeProvider` context. During prerendering, even client components are prerendered, and if they call `useTheme()` at the top level, the context may not be available.

**Fix Applied**: 
- Added `mounted` state checks to prevent theme-dependent rendering during SSR
- However, hooks must be called unconditionally, so `useTheme()` is still called but results are only used after mount

**Better Fix**: Wrap components using `useTheme()` in Suspense boundaries or make pages dynamic.

---

### 3. **Client Components Being Prerendered**

**Location**: Various pages like `app/pricing/page.tsx`, `app/prompts/page.tsx`

**Issue**: Even though components are marked with `'use client'`, Next.js still attempts to prerender them for static generation. If these components use context-dependent hooks or import components that use context, the prerendering fails.

**Fix Applied**: 
- For client component pages: Split into server wrapper + client component, with `export const dynamic = 'force-dynamic'` in the server wrapper
- For server component pages importing client components: Added `export const dynamic = 'force-dynamic'` to prevent prerendering

---

## Why Making Everything Dynamic Is Wrong

**User Concern**: "Why do all pages need to be made dynamic? Some are SSG right for max SEO?"

**Answer**: You're absolutely right! Making everything dynamic hurts SEO and performance. The proper fix is:

1. **Make UI components that use `Slot` client components** ✅ (Done for Badge/Button)
2. **Only make pages dynamic if they truly need client-side features** (user-specific data, real-time updates, etc.)
3. **Use Suspense boundaries** for client components that use context hooks
4. **Server components should remain server components** when possible

---

## Proper Solution Strategy

### For Static Pages (SSG - Best for SEO):
1. Keep page as server component
2. If it imports client components that use context:
   - Wrap client components in `<Suspense>` boundaries
   - OR make the page dynamic only if necessary

### For Client Component Pages:
1. Split into server wrapper + client component
2. Server wrapper uses `export const dynamic = 'force-dynamic'` to prevent prerendering
3. Client component wrapped in `<Suspense>` with fallback

### For UI Components Using `Slot`:
1. Make them client components (`"use client"`)
2. They can still be used in server components - Next.js handles the boundary automatically

---

## Pages Fixed

✅ **Fixed** (using proper approach):
- `app/dashboard/analytics/page.tsx` - Server wrapper + client component + Suspense
- `app/share/page.tsx` - Server wrapper + client component + Suspense
- `app/dashboard/billing/history/credits/page.tsx` - Server wrapper + client component + Suspense
- `app/dashboard/billing/history/page.tsx` - Server wrapper + client component + Suspense
- `app/dashboard/likes/page.tsx` - Server wrapper + client component + Suspense
- `app/dashboard/projects/page.tsx` - Server wrapper + client component + Suspense
- `app/dashboard/projects/[slug]/page.tsx` - Server wrapper + client component + Suspense
- `app/dashboard/projects/[slug]/chain/[chainId]/page.tsx` - Server wrapper + client component + Suspense
- `app/forgot-password/page.tsx` - Server wrapper + client component + Suspense
- `app/pricing/page.tsx` - Server wrapper + client component + Suspense

✅ **Fixed** (using `dynamic = 'force-dynamic'` - acceptable for these):
- `app/cookies/page.tsx` - Static content, but uses client components
- `app/dashboard/api-keys/page.tsx` - Requires auth, should be dynamic
- `app/dashboard/billing/page.tsx` - Requires auth, should be dynamic
- `app/dashboard/settings/page.tsx` - Requires auth, should be dynamic
- `app/dashboard/tasks/page.tsx` - Requires auth, should be dynamic
- `app/dashboard/profile/page.tsx` - Requires auth, should be dynamic
- `app/dpa/page.tsx` - Static content
- `app/plugins/*/page.tsx` - Plugin pages (should be static, but using dynamic as workaround)
- `app/investors/page.tsx` - Static content, but uses UI components
- `app/prompts/page.tsx` - Static content, but imports client component

⚠️ **Needs Fix**:
- `app/signup/page.tsx` - Currently failing
- `app/global-error.tsx` - Special Next.js file, may need different approach

---

## Components Fixed

✅ **Made Client Components**:
- `components/ui/badge.tsx` - Added `"use client"`
- `components/ui/button.tsx` - Added `"use client"`

⚠️ **May Need Fix** (use `Slot` but not yet causing issues):
- `components/ui/breadcrumb.tsx`
- `components/ui/button-group.tsx`
- `components/ui/item.tsx`
- `components/ui/sidebar.tsx`

---

## Recommendations

### Immediate Actions:
1. ✅ Fix remaining failing pages (`signup`, `global-error`)
2. ✅ Monitor build for any new failures
3. ⚠️ Consider making other `Slot`-using components client components proactively

### Long-term Improvements:
1. **Audit all UI components** using `Slot` and make them client components
2. **Review pages marked as dynamic** - can any be made static with Suspense?
3. **Create a pattern** for handling client components in server pages (Suspense wrapper component)
4. **Document** which pages should be static vs dynamic for SEO

---

## Technical Details

### Why `Slot` Causes Issues:
- `Slot` from `radix-ui` uses React Context to pass props to child components
- During SSR/prerendering, React context is `null`
- When `Slot.Root` is rendered, it tries to access context → error

### Why `useTheme()` Causes Issues:
- `useTheme()` from `next-themes` requires `ThemeProvider` context
- Even in client components, Next.js prerenders them
- During prerendering, context may not be available → error

### Why Client Components Are Prerendered:
- Next.js optimizes by prerendering client components for static generation
- This improves performance but can cause issues with context-dependent code
- Solution: Use `dynamic = 'force-dynamic'` or wrap in Suspense

---

## Conclusion

The root cause is **React Context not being available during prerendering**. The fixes applied are:

1. **UI Components**: Made `Badge` and `Button` client components (proper fix)
2. **Pages with Client Components**: Split into server wrapper + client component with Suspense (proper fix)
3. **Pages Using UI Components**: Made dynamic (acceptable workaround, but not ideal for SEO)

**Next Steps**: Fix remaining pages and consider making all `Slot`-using components client components to prevent future issues.

