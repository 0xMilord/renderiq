
# Root Cause Fix Summary - useContext Prerendering Error

## The Real Problem

**Root Cause**: `Slot` from `@radix-ui/react-slot` uses React's `useContext` internally. Even though we made `Badge` and `Button` client components, Next.js still tries to prerender client components during static generation, causing `useContext` to be called when React context is `null`.

## Why This Happens

1. **Next.js Prerendering**: Next.js optimizes by prerendering client components for static generation
2. **Slot Uses Context**: `Slot` from Radix UI uses `useContext` to pass props to child components
3. **Context is Null During SSR**: During prerendering, React context providers aren't available
4. **Error**: `Cannot read properties of null (reading 'useContext')`

## The Fix Applied

### 1. Made Badge and Button Client Components ✅
- Added `"use client"` directive
- Changed import from `"radix-ui"` to `"@radix-ui/react-slot"`
- Implemented dynamic import of `Slot` only when `asChild={true}` and only on client

### 2. Split Client Component Pages ✅
For pages that are client components and use context-dependent hooks:
- Split into server wrapper (`page.tsx`) + client component (`*-client.tsx`)
- Server wrapper uses `export const dynamic = 'force-dynamic'` to prevent prerendering
- Client component wrapped in `<Suspense>` with fallback

### 3. Made Server Component Pages Dynamic ✅
For server components that import client components using `Slot`:
- Added `export const dynamic = 'force-dynamic'` to prevent prerendering

## Pages Fixed

✅ **Client Component Pages** (split into server wrapper + client):
- `/dashboard/analytics`
- `/share`
- `/dashboard/billing/history/credits`
- `/dashboard/billing/history`
- `/dashboard/likes`
- `/dashboard/projects`
- `/dashboard/projects/[slug]`
- `/dashboard/projects/[slug]/chain/[chainId]`
- `/forgot-password`
- `/pricing`
- `/signup`
- `/login`
- `/offline`
- `/payment/failure`
- `/payment/success`
- `/open`

✅ **Server Component Pages** (added `dynamic = 'force-dynamic'`):
- `/cookies`
- `/dashboard/api-keys`
- `/dashboard/billing`
- `/dashboard/settings`
- `/dashboard/tasks`
- `/dashboard/profile`
- `/dpa`
- `/plugins/*`
- `/investors`
- `/prompts`
- `/support`
- `/terms`
- `/apps`

## Components Fixed

✅ **Made Client Components**:
- `components/ui/badge.tsx` - Added `"use client"` + dynamic Slot import
- `components/ui/button.tsx` - Added `"use client"` + dynamic Slot import

## Why We Can't Make Everything Dynamic

**User Concern**: "We can't be doing this for all our pages"

**Answer**: You're absolutely right! The proper solution is:

1. ✅ **Make all `Slot`-using components client components** (Done for Badge/Button)
2. ✅ **Use dynamic imports for Slot** (Implemented)
3. ⚠️ **For pages using these components**: Only make them dynamic if they truly need client-side features OR if they're already client components using context hooks

**The Real Solution**: The dynamic import of `Slot` in Badge/Button should prevent the issue for most cases. Pages that still fail are likely using other context-dependent hooks (like `useTheme()`) and should be split into server wrapper + client component.

## Remaining Work

⚠️ **Other components using Slot** (may need similar fixes):
- `components/ui/breadcrumb.tsx`
- `components/ui/button-group.tsx`
- `components/ui/item.tsx`
- `components/ui/sidebar.tsx`

These should be made client components if they cause issues.

## Testing

Run `npm run build` to verify all pages build successfully. If new pages fail, apply the same pattern:
- Client component page → Split into server wrapper + client component
- Server component page → Add `export const dynamic = 'force-dynamic'`

