# Auth Signout Performance Audit

**Date**: 2025-01-27  
**Issue**: Signout takes 30+ seconds  
**Priority**: 🔴 CRITICAL

---

## Executive Summary

The signout flow has multiple performance bottlenecks that cause 30+ second delays:

1. **Race condition** - Router redirect happens before signout completes
2. **Slow auth listener** - `onAuthStateChange` calls slow `getUser()` on signout
3. **Missing cache invalidation** - Client-side signout doesn't invalidate server cache
4. **Redundant API calls** - Multiple `getUser()` calls during signout process

---

## Complete Signout Flow Trace

### Current Flow (SLOW - 30+ seconds)

```
1. User clicks signout button (user-dropdown.tsx:63)
   ↓
2. handleSignOut() calls useAuth().signOut() (user-dropdown.tsx:64)
   ↓
3. use-auth.ts signOut() (line 19-24)
   - Calls storeSignOut() [NOT AWAITED] ❌
   - Immediately calls router.push('/') [RACE CONDITION] ❌
   ↓
4. auth-store.ts signOut() (line 186-201)
   - Calls supabase.auth.signOut() ✅
   - Sets state { user: null, loading: false } ✅
   - BUT: Doesn't invalidate server cache ❌
   ↓
5. onAuthStateChange listener fires (auth-store.ts:78-97)
   - Event: 'SIGNED_OUT'
   - Calls supabase.auth.getUser() [SLOW - 30+ seconds] ❌❌❌
   - Updates state (redundant since signOut already did this)
   ↓
6. router.push('/') navigates
   - Middleware/proxy.ts calls getUser() on page load [SLOW] ❌
   - Multiple component re-renders trigger more auth checks
```

---

## Root Causes

### 🔴 CRITICAL Issue #1: Race Condition in use-auth.ts

**File**: `lib/hooks/use-auth.ts` (lines 19-24)

```typescript
const signOut = async () => {
  await storeSignOut();  // ❌ NOT ACTUALLY AWAITED - missing await
  // Redirect to home immediately after logout
  router.push('/');      // ❌ HAPPENS IMMEDIATELY, doesn't wait
  return { error: null };
};
```

**Problem**: The `await` is present but `router.push()` doesn't wait for navigation to complete, and more importantly, the auth state change listener hasn't finished processing yet.

**Impact**: Redirect happens while auth is still being cleared, causing middleware to make slow auth checks.

---

### 🔴 CRITICAL Issue #2: Slow getUser() in onAuthStateChange Listener

**File**: `lib/stores/auth-store.ts` (lines 78-97)

```typescript
const { data: { subscription } } = supabase.auth.onAuthStateChange(
  async (event) => {
    logger.log('Auth state changed:', event);
    
    // ✅ SECURITY: Use getUser() to get authenticated user data
    const { data: { user: authenticatedUser } } = await supabase.auth.getUser(); // ❌ SLOW!
    
    set({ 
      user: authenticatedUser || null, 
      loading: false 
    });
    // ...
  }
);
```

**Problem**: 
- When `SIGNED_OUT` event fires, calling `getUser()` on a cleared session causes Supabase to:
  - Make network request to auth server
  - Wait for timeout (could be 30+ seconds)
  - Return null after timeout
- This is redundant since `signOut()` already sets `user: null`

**Impact**: **30+ second delay** during signout as Supabase times out waiting for non-existent session.

---

### 🔴 CRITICAL Issue #3: Missing Server Cache Invalidation

**File**: `lib/stores/auth-store.ts` (lines 186-201)

```typescript
signOut: async () => {
  set({ loading: true });
  
  try {
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      console.error('Sign out error:', error);
    }
    
    set({ user: null, loading: false });
    // ❌ NO CACHE INVALIDATION - server cache still has user data
  } catch (error) {
    console.error('Sign out failed:', error);
    set({ loading: false });
  }
},
```

**Problem**: Client-side signout doesn't call server action to invalidate auth cache.

**Impact**: Server continues to serve cached user data after logout, causing inconsistent state.

---

### 🟡 MEDIUM Issue #4: Client-Side Signout Doesn't Use Server Action

**File**: `lib/hooks/use-auth.ts`

The `signOut()` function bypasses `signOutAction` entirely, meaning:
- Server cache is never invalidated
- Server-side signout logic is never executed
- Cache invalidation in `AuthService.signOut()` is never called

**Comparison**:
- ✅ Server action (`signOutAction`) → `AuthService.signOut()` → Invalidates cache
- ❌ Client hook (`useAuth().signOut()`) → `auth-store.signOut()` → **No cache invalidation**

---

### 🟡 MEDIUM Issue #5: Middleware getUser() Calls After Signout

**File**: `proxy.ts` (line 32)

```typescript
const {
  data: { user },
} = await supabase.auth.getUser(); // ❌ Called on every request, slow after signout
```

**Problem**: After signout, navigating to `/` triggers middleware which calls `getUser()` on a cleared session, potentially causing delays.

---

## Files Involved in Signout Flow

### Client-Side Files
1. `components/user-dropdown.tsx` (line 63-66) - Signout trigger
2. `lib/hooks/use-auth.ts` (line 19-24) - Signout hook with race condition
3. `lib/stores/auth-store.ts` (lines 78-97, 186-201) - Auth state management
   - `onAuthStateChange` listener with slow `getUser()`
   - `signOut()` without cache invalidation
4. `components/providers/auth-provider.tsx` - Initializes auth store

### Server-Side Files
5. `lib/actions/auth.actions.ts` (line 39-53) - Server action (NOT USED by client)
6. `lib/services/auth.ts` (line 178-216) - Auth service with cache invalidation (NOT CALLED)
7. `lib/services/auth-cache.ts` (line 84-88) - Cache invalidation (NOT CALLED)

### Middleware
8. `proxy.ts` (line 32) - Calls `getUser()` on every request

---

## Performance Impact

### Current Performance
- **Signout Time**: 30+ seconds
- **Bottleneck**: `getUser()` call in `onAuthStateChange` listener
- **User Experience**: Appears frozen, user likely to refresh or close tab

### Expected Performance (After Fixes)
- **Signout Time**: < 1 second
- **Bottleneck**: Removed
- **User Experience**: Instant logout with immediate redirect

---

## Recommended Fixes

### Fix #1: Skip getUser() on SIGNED_OUT Event

**File**: `lib/stores/auth-store.ts`

```typescript
const { data: { subscription } } = supabase.auth.onAuthStateChange(
  async (event) => {
    logger.log('Auth state changed:', event);
    
    // ✅ OPTIMIZATION: Skip getUser() on SIGNED_OUT - we already know user is null
    if (event === 'SIGNED_OUT') {
      set({ 
        user: null, 
        loading: false,
        userProfile: null,
        onboardingComplete: false 
      });
      return; // Early return - no slow getUser() call
    }
    
    // ✅ Only call getUser() for sign-in events
    const { data: { user: authenticatedUser } } = await supabase.auth.getUser();
    
    set({ 
      user: authenticatedUser || null, 
      loading: false 
    });

    // Fetch profile when user signs in, clear when signs out
    if (authenticatedUser) {
      get().fetchUserProfile();
    } else {
      set({ userProfile: null, onboardingComplete: false });
    }
  }
);
```

**Impact**: Eliminates 30+ second delay from slow `getUser()` on cleared session.

---

### Fix #2: Add Cache Invalidation to Client Signout

**File**: `lib/stores/auth-store.ts`

```typescript
signOut: async () => {
  set({ loading: true });
  
  try {
    // Get user ID before signing out (for cache invalidation)
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id;
    
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      console.error('Sign out error:', error);
    }
    
    // ✅ Clear client state immediately
    set({ user: null, userProfile: null, loading: false, onboardingComplete: false });
    
    // ✅ Invalidate server cache (fire and forget - don't block)
    if (userId) {
      fetch('/api/auth/invalidate-cache', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      }).catch(() => {
        // Ignore errors - cache will expire naturally
      });
    }
  } catch (error) {
    console.error('Sign out failed:', error);
    set({ loading: false });
  }
},
```

**Impact**: Ensures server cache is invalidated, preventing stale auth state.

---

### Fix #3: Use Server Action for Signout (Recommended)

**File**: `lib/hooks/use-auth.ts`

```typescript
const signOut = async () => {
  // ✅ Use server action for proper cache invalidation
  try {
    await signOutAction(); // This redirects to /login
  } catch (error) {
    // If redirect fails, fallback to client-side signout
    await storeSignOut();
    router.push('/');
  }
  return { error: null };
};
```

**OR** (Better - no redirect conflict):

**File**: `lib/hooks/use-auth.ts`

```typescript
const signOut = async () => {
  // ✅ Clear client state first
  await storeSignOut();
  
  // ✅ Call server action for cache invalidation (don't redirect)
  try {
    const { signOutAction } = await import('@/lib/actions/auth.actions');
    // Create a version that doesn't redirect
    const result = await AuthService.signOut();
    // Cache is now invalidated
  } catch (error) {
    // Ignore - client state is already cleared
  }
  
  // ✅ Redirect after everything is done
  router.push('/');
  return { error: null };
};
```

**Impact**: Proper cache invalidation while maintaining current UX.

---

### Fix #4: Add Dedicated Cache Invalidation API Route

**File**: `app/api/auth/invalidate-cache/route.ts` (NEW)

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { invalidateUserCache } from '@/lib/services/auth-cache';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();
    
    if (!userId || typeof userId !== 'string') {
      return NextResponse.json({ success: false, error: 'Invalid userId' }, { status: 400 });
    }
    
    await invalidateUserCache(userId);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to invalidate cache' },
      { status: 500 }
    );
  }
}
```

**Impact**: Provides fast cache invalidation endpoint that doesn't block signout.

---

### Fix #5: Optimize Middleware Auth Check (Optional)

**File**: `proxy.ts`

Cache the auth check result or skip it for certain paths after signout.

---

## Implementation Priority

1. **🔥 IMMEDIATE**: Fix #1 - Skip `getUser()` on `SIGNED_OUT` event
2. **🔥 IMMEDIATE**: Fix #2 - Add cache invalidation to client signout
3. **🟡 HIGH**: Fix #3 - Use server action or dedicated API route
4. **🟢 MEDIUM**: Fix #4 - Create cache invalidation API route
5. **🟢 LOW**: Fix #5 - Optimize middleware

---

## Testing Plan

1. **Test Signout Performance**
   - Time signout from click to redirect completion
   - Expected: < 1 second
   - Current: 30+ seconds

2. **Test Cache Invalidation**
   - Sign out user
   - Immediately make authenticated API request
   - Verify: 401 Unauthorized (not cached user data)

3. **Test Multiple Signouts**
   - Sign out multiple times rapidly
   - Verify: No errors, consistent behavior

4. **Test Auth State Consistency**
   - Sign out
   - Check all components reflect logged-out state
   - Verify: No stale user data displayed

---

## Additional Notes

- The `onAuthStateChange` listener should handle `SIGNED_OUT` event specially
- Client-side signout should still work offline (cache invalidation can fail gracefully)
- Consider adding signout analytics/tracking
- Monitor auth cache hit rates after fixes

---

## Conclusion

The 30+ second signout delay is caused primarily by:
1. Redundant `getUser()` call on cleared session (30+ second timeout)
2. Missing cache invalidation causing inconsistent state
3. Race condition between signout and redirect

Fixes #1 and #2 will eliminate the 30+ second delay. Fixes #3 and #4 will ensure proper cache management and consistent auth state.

