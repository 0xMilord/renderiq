# SSR React Context Error Fix

**Date**: 2025-01-XX  
**Status**: ✅ Fixed  
**Issue**: "Cannot read properties of null (reading 'useContext')" error during SSR

---

## Problem

The application was throwing a React error during server-side rendering:
```
TypeError: Cannot read properties of null (reading 'useContext')
```

This error occurs when:
1. React hooks are called during SSR where React context is null
2. Zustand stores with `persist` middleware try to access `localStorage` during SSR
3. Components using these stores are rendered on the server

## Root Causes

1. **Zustand Persist Middleware**: Stores using `createJSONStorage(() => localStorage)` were trying to access `localStorage` during SSR, where it doesn't exist.

2. **SSR Rendering**: The `UnifiedChatInterface` component was being rendered on the server, causing hooks to be called before React context was available.

3. **Multiple tldraw Instances**: The error log also showed multiple instances of tldraw libraries, which can cause context issues.

## Solutions Implemented

### 1. Created Safe Storage Wrapper

**File**: `lib/utils/safe-storage.ts` (NEW)

**Purpose**: Provides a safe storage wrapper that checks for `window` before accessing `localStorage`.

```typescript
export function getSafeStorage() {
  if (typeof window === 'undefined') {
    // Return a no-op storage for SSR
    return {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {},
    };
  }
  return localStorage;
}
```

### 2. Updated Zustand Stores

**Files Modified**:
- `lib/stores/chat-store.ts`
- `lib/stores/canvas-store.ts`

**Changes**: Replaced `localStorage` with `getSafeStorage()` in `createJSONStorage()` calls:

```typescript
// Before:
storage: createJSONStorage(() => localStorage),

// After:
storage: createJSONStorage(() => getSafeStorage()),
```

### 3. Added Client-Side Mount Check

**File**: `components/chat/unified-chat-interface.tsx`

**Changes**: Added a mount check to prevent SSR rendering:

```typescript
// ✅ FIX: Ensure we're on the client side (prevent SSR errors)
const [isMounted, setIsMounted] = useState(false);

useEffect(() => {
  setIsMounted(true);
}, []);

// Don't render until mounted (prevents SSR hydration mismatches)
if (!isMounted) {
  return (
    <div className="flex items-center justify-center p-8">
      <div className="text-muted-foreground">Loading chat...</div>
    </div>
  );
}
```

## How It Works

### Safe Storage Flow

```
Component renders on server
  ↓
Zustand store initializes
  ↓
Persist middleware calls getSafeStorage()
  ↓
getSafeStorage() checks typeof window === 'undefined'
  ↓
Returns no-op storage (no localStorage access)
  ↓
No error ✅
```

### Client-Side Mount Flow

```
Component renders on server
  ↓
isMounted = false
  ↓
Returns loading placeholder (no hooks called)
  ↓
Component hydrates on client
  ↓
useEffect sets isMounted = true
  ↓
Component re-renders with full functionality
  ↓
Hooks called safely ✅
```

## Testing

- [x] No SSR errors in console
- [x] Component renders correctly on client
- [x] Zustand stores work correctly
- [x] localStorage persistence works
- [x] No hydration mismatches

## Files Modified

1. **lib/utils/safe-storage.ts** (NEW)
   - Safe storage wrapper for SSR

2. **lib/stores/chat-store.ts**
   - Updated to use `getSafeStorage()`

3. **lib/stores/canvas-store.ts**
   - Updated to use `getSafeStorage()`

4. **components/chat/unified-chat-interface.tsx**
   - Added client-side mount check

## Related Issues

- ✅ "Cannot read properties of null (reading 'useContext')" (FIXED)
- ✅ SSR hydration errors (FIXED)
- ⚠️ Multiple tldraw instances (warned but not blocking)

## Future Improvements

1. **Apply to All Stores**: Update other Zustand stores to use `getSafeStorage()`:
   - `project-chain-store.ts`
   - `chat-settings-store.ts`
   - `ui-preferences-store.ts`
   - `tool-settings-store.ts`
   - `search-filter-store.ts`

2. **Bundle Configuration**: Check Next.js/webpack config to resolve multiple tldraw instances

3. **SSR Optimization**: Consider using dynamic imports with `ssr: false` for heavy client-only components

---

## Conclusion

The SSR React context error has been fixed by:
1. Creating a safe storage wrapper that prevents localStorage access during SSR
2. Adding a client-side mount check to prevent hooks from being called during SSR
3. Ensuring Zustand stores handle SSR gracefully

The application should now render correctly on both server and client without React context errors.

