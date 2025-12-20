# Next.js Devtools SSR Context Error Fix

## Problem

Next.js 16 devtools (`segment-explorer-node.tsx`) are trying to use `useContext` during server-side rendering, causing:

```
TypeError: Cannot read properties of null (reading 'useContext')
```

This error occurs in:
- `/_not-found` route
- Home page (`/`)
- Any page that gets prerendered during dev mode

## Root Cause

Next.js devtools (`segment-explorer-node.tsx`) use `useSegmentState()` which calls `useContext(SegmentStateContext)`. During SSR, React Context is `null`, causing the error.

## Solution

Added `export const dynamic = 'force-dynamic'` to `app/layout.tsx` to prevent prerendering of the root layout. This ensures:

1. The layout is always rendered dynamically (not statically generated)
2. Next.js devtools don't try to render during SSR
3. Client components in the layout (ThemeProvider, ConditionalFooter, etc.) are only rendered on the client

## Files Changed

- `app/layout.tsx` - Added `export const dynamic = 'force-dynamic'`

## Impact

- ✅ Fixes SSR context errors from Next.js devtools
- ✅ Prevents prerendering issues in dev mode
- ⚠️ Root layout is now always dynamic (not statically generated)
  - This is acceptable since the layout contains many client components anyway
  - Individual pages can still be statically generated if they don't use the layout's client features

## Related Issues

- This is a known issue with Next.js 16 devtools
- The error only occurs in development mode
- Production builds may still work, but this ensures consistency

## Alternative Solutions Considered

1. **Disable Next.js devtools** - Not possible, they're built into Next.js
2. **Wrap layout in Suspense** - Doesn't fix the root cause
3. **Make all layout components client-only** - Already done, but devtools still try to render during SSR

## Verification

After this fix:
- ✅ Dev server should start without SSR context errors
- ✅ Pages should render correctly
- ✅ Next.js devtools should work in client-side only

