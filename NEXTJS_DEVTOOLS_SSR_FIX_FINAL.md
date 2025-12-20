# Next.js Devtools SSR Context Error - Final Fix

## Problem

Next.js 16 devtools (`segment-explorer-node.tsx`) are trying to use `useContext` during server-side rendering, causing:

```
TypeError: Cannot read properties of null (reading 'useContext')
```

This error occurs on:
- `/_not-found` route (most common)
- Home page (`/`) during dev mode
- Any route that triggers Next.js's internal routing components

## Root Cause

Next.js devtools (`segment-explorer-node.tsx`) use `useSegmentState()` which calls `useContext(SegmentStateContext)`. During SSR, React Context is `null`, causing the error.

The devtools are injected at the `layout-router.js` level, which is internal to Next.js and runs during SSR even when pages are marked as dynamic.

## Solution Applied

1. **Created `app/not-found.tsx`** as a client component with mounted check
   - Prevents SSR rendering of the not-found page
   - Uses `useState` + `useEffect` to only render after client mount
   - This prevents Next.js devtools from trying to render during SSR

2. **Added `export const dynamic = 'force-dynamic'`** to `app/layout.tsx`
   - Forces the root layout to be dynamically rendered
   - Prevents static generation which triggers devtools SSR

3. **Mounted check pattern** in `not-found.tsx`
   - Returns a loading state during SSR
   - Only renders the actual content after client-side mount
   - This completely bypasses SSR for the not-found page

## Files Changed

- `app/not-found.tsx` - Created as client component with mounted check
- `app/layout.tsx` - Added `export const dynamic = 'force-dynamic'`
- `next.config.ts` - Added experimental config (placeholder for future fixes)

## Why This Works

The mounted check pattern ensures that:
1. During SSR, the component returns early with a simple loading state
2. Next.js devtools don't try to render the component tree during SSR
3. After client-side hydration, the component renders normally
4. Devtools can then render on the client where context is available

## Alternative Solutions Considered

1. **Disable Next.js devtools** - Not possible, they're built into Next.js
2. **Wrap layout in Suspense** - Doesn't fix the root cause
3. **Make all layout components client-only** - Already done, but devtools still render during SSR
4. **Use dynamic imports with `ssr: false`** - Would break the layout structure

## Verification

After this fix:
- ✅ `/_not-found` route should not cause SSR errors
- ✅ Dev server should start without context errors
- ✅ Pages should render correctly
- ✅ Next.js devtools should work in client-side only

## Known Limitations

- The mounted check adds a brief loading state on first render
- This is acceptable for error pages (not-found, etc.)
- Production builds may not have this issue (devtools are dev-only)

## Future Improvements

- Monitor Next.js updates for a fix to devtools SSR
- Consider removing mounted check if Next.js fixes the issue
- Keep `dynamic = 'force-dynamic'` on layout until confirmed fixed

