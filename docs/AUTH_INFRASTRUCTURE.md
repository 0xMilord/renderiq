# Authentication Infrastructure Guide

**Last Updated**: November 2025  
**Status**: ✅ Production Ready

This document describes the complete authentication infrastructure, all files and their roles, and how to use authentication across the application.

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Core Files & Their Roles](#core-files--their-roles)
4. [Using Authentication](#using-authentication)
5. [Best Practices](#best-practices)
6. [Performance Optimizations](#performance-optimizations)
7. [Migration Patterns](#migration-patterns)

---

## Overview

The authentication infrastructure uses **Supabase Auth** with a **server-side caching layer** to minimize database calls and improve performance. The system is optimized for:

- ✅ **Server-side caching** (5-minute TTL) to reduce DB calls by 90%
- ✅ **Client-side state management** via Zustand store
- ✅ **Unified auth patterns** across server actions, API routes, and pages
- ✅ **Automatic cache invalidation** on logout and profile updates

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     CLIENT-SIDE LAYER                        │
├─────────────────────────────────────────────────────────────┤
│  Components → useAuth() Hook → Zustand Store (auth-store)   │
│                                                              │
│  - User state management                                     │
│  - Auth methods (signIn, signUp, signOut)                   │
│  - Passes userId to server actions (optimization)           │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼ (userId via FormData)
┌─────────────────────────────────────────────────────────────┐
│                    SERVER-SIDE LAYER                         │
├─────────────────────────────────────────────────────────────┤
│  Server Actions/API Routes/Server Pages                     │
│                                                              │
│  → getUserFromAction(userId)  OR  getCachedUser()          │
│                                                              │
│  → Auth Cache (5min TTL)                                    │
│     │                                                        │
│     └→ Supabase Auth (on cache miss)                       │
└─────────────────────────────────────────────────────────────┘
```

### Key Components

1. **Client Store** (`lib/stores/auth-store.ts`) - Zustand store for client-side auth state
2. **Auth Cache** (`lib/services/auth-cache.ts`) - Server-side in-memory cache (5min TTL)
3. **Auth Helper** (`lib/utils/get-user-from-action.ts`) - Unified helper for server actions
4. **Auth Service** (`lib/services/auth.ts`) - Business logic for auth operations
5. **Auth Actions** (`lib/actions/auth.actions.ts`) - Server actions for auth flows

---

## Core Files & Their Roles

### Client-Side Files

#### `lib/stores/auth-store.ts`
**Role**: Client-side authentication state management

**What it does**:
- Manages user state using Zustand
- Listens to Supabase auth state changes
- Provides auth methods (signIn, signUp, signOut)
- Stores user profile data

**Key Exports**:
```typescript
useAuthStore() // Zustand hook to access auth state
```

**Usage**:
```typescript
const { user, userProfile, loading, signIn, signOut } = useAuthStore();
```

---

#### `lib/hooks/use-auth.ts`
**Role**: Client-side auth hook (wrapper around store)

**What it does**:
- Provides convenient hook interface for components
- Integrates with router for redirects
- Calls server actions for auth operations

**Key Exports**:
```typescript
useAuth() // Hook for components
```

**Usage**:
```typescript
const { user, loading, signIn, signUp, signOut } = useAuth();
```

---

### Server-Side Files

#### `lib/services/auth-cache.ts` ⭐ **CORE CACHING LAYER**
**Role**: Server-side authentication caching

**What it does**:
- Caches user sessions in-memory (5-minute TTL)
- Prevents database hammering
- Automatically cleans up expired entries
- Provides cache invalidation functions

**Key Exports**:
```typescript
getCachedUser()              // Get user from cache or DB
invalidateUserCache(userId)  // Clear cache for specific user
clearAuthCache()             // Clear all cache
```

**When to use**: 
- ✅ API routes (GET/POST handlers)
- ✅ Server pages (page.tsx, layout.tsx)
- ✅ Server components that need auth

**Usage**:
```typescript
import { getCachedUser } from '@/lib/services/auth-cache';

const { user, fromCache } = await getCachedUser();
if (!user) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
```

---

#### `lib/utils/get-user-from-action.ts` ⭐ **SERVER ACTION HELPER**
**Role**: Unified helper for server actions

**What it does**:
- Accepts optional `userId` from client (FormData)
- Validates userId against cached auth
- Falls back to cached auth if userId not provided
- Returns user, userId, and cache status

**Key Exports**:
```typescript
getUserFromAction(userIdFromClient?) // Get user for server actions
```

**When to use**: 
- ✅ Server actions (form submissions)
- ✅ When client can pass userId (optimization)

**Usage**:
```typescript
import { getUserFromAction } from '@/lib/utils/get-user-from-action';

const userIdFromClient = formData.get('userId') as string | null;
const { user, userId, fromCache } = await getUserFromAction(userIdFromClient);

if (!user || !userId) {
  return { success: false, error: 'Authentication required' };
}
```

---

#### `lib/services/auth.ts`
**Role**: Authentication business logic

**What it does**:
- Handles sign in, sign up, sign out
- OAuth flows (Google, GitHub)
- Email verification
- Session management
- **Performs actual auth operations** (not just checking)

**Key Exports**:
```typescript
AuthService.signIn(email, password)
AuthService.signUp(email, password, name)
AuthService.signOut()
AuthService.signInWithOAuth(provider)
AuthService.getCurrentUser()
AuthService.refreshSession()
```

**When to use**: 
- ✅ Performing authentication (login/signup)
- ✅ NOT for checking auth status (use cache instead)

**Usage**:
```typescript
import { AuthService } from '@/lib/services/auth';

const result = await AuthService.signIn(email, password);
if (!result.success) {
  return { error: result.error };
}
```

**Note**: This service uses direct Supabase calls (correct - it's performing auth, not checking it).

---

#### `lib/actions/auth.actions.ts`
**Role**: Server actions for authentication

**What it does**:
- Bridge between client and AuthService
- Handles redirects after auth operations
- Provides server action interface for client components

**Key Exports**:
```typescript
signInAction(email, password)
signUpAction(email, password, name)
signOutAction()
signInWithGoogleAction()
signInWithGithubAction()
```

**Usage**:
```typescript
import { signInAction } from '@/lib/actions/auth.actions';

await signInAction(email, password);
```

---

#### `lib/supabase/server.ts` & `lib/supabase/client.ts`
**Role**: Supabase client instances

**What it does**:
- Creates Supabase clients for server/client
- Handles cookie management
- Provides type-safe Supabase access

**Usage**:
```typescript
// Server-side
import { createClient } from '@/lib/supabase/server';
const supabase = await createClient();

// Client-side
import { createClient } from '@/lib/supabase/client';
const supabase = createClient();
```

---

## Using Authentication

### 1. Server Actions

**When**: Form submissions, mutations, data operations

**Pattern**:
```typescript
'use server';

import { getUserFromAction } from '@/lib/utils/get-user-from-action';

export async function myServerAction(formData: FormData) {
  // Get userId from client if provided (optimization)
  const userIdFromClient = formData.get('userId') as string | null;
  
  // Get user using cached auth
  const { user, userId } = await getUserFromAction(userIdFromClient);
  
  if (!user || !userId) {
    return { success: false, error: 'Authentication required' };
  }
  
  // Use userId for your operation
  const result = await doSomething(userId);
  return { success: true, data: result };
}
```

**Client-side** (pass userId for optimization):
```typescript
'use client';

import { useAuthStore } from '@/lib/stores/auth-store';

const user = useAuthStore((state) => state.user);
const formData = new FormData();
formData.append('prompt', prompt);

// Pass userId to avoid DB call in server action
if (user?.id) {
  formData.append('userId', user.id);
}

await myServerAction(formData);
```

**Files using this pattern**:
- ✅ `lib/actions/render.actions.ts`
- ✅ `lib/actions/projects.actions.ts`
- ✅ `lib/actions/billing.actions.ts`
- ✅ `lib/actions/payment.actions.ts`
- ✅ All other server actions (12 files total)

---

### 2. API Routes

**When**: REST API endpoints (GET, POST, etc.)

**Pattern**:
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getCachedUser } from '@/lib/services/auth-cache';

export async function GET(request: NextRequest) {
  // Get user using cached auth
  const { user } = await getCachedUser();
  
  if (!user) {
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    );
  }
  
  // Use user.id for your operation
  const data = await fetchUserData(user.id);
  return NextResponse.json({ success: true, data });
}

export async function POST(request: NextRequest) {
  const { user } = await getCachedUser();
  
  if (!user) {
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    );
  }
  
  // Process request with user.id
  return NextResponse.json({ success: true });
}
```

**Files using this pattern**:
- ✅ `app/api/renders/route.ts`
- ✅ `app/api/video/route.ts`
- ✅ `app/api/projects/route.ts`
- ✅ `app/api/payments/*/route.ts`
- ✅ All other API routes (18 files total)

---

### 3. Server Pages

**When**: Server-rendered pages that need auth

**Pattern**:
```typescript
import { redirect } from 'next/navigation';
import { getCachedUser } from '@/lib/services/auth-cache';

export default async function MyPage() {
  // Get user using cached auth
  const { user } = await getCachedUser();
  
  if (!user) {
    redirect('/login');
  }
  
  // Use user.id for data fetching
  const data = await fetchUserData(user.id);
  
  return <div>Welcome, {user.email}!</div>;
}
```

**Files using this pattern**:
- ✅ `app/dashboard/page.tsx`
- ✅ `app/dashboard/library/page.tsx`
- ✅ `app/render/page.tsx`
- ✅ `app/canvas/page.tsx`

---

### 4. Server Components

**When**: Server components that need user data

**Pattern**:
```typescript
import { getCachedUser } from '@/lib/services/auth-cache';

export async function MyServerComponent() {
  const { user } = await getCachedUser();
  
  if (!user) {
    return <div>Please sign in</div>;
  }
  
  return <div>Hello, {user.email}!</div>;
}
```

---

### 5. Client Components

**When**: Client-side components that need auth state

**Pattern**:
```typescript
'use client';

import { useAuth } from '@/lib/hooks/use-auth';

export function MyComponent() {
  const { user, loading, signIn, signOut } = useAuth();
  
  if (loading) return <div>Loading...</div>;
  if (!user) return <div>Please sign in</div>;
  
  return (
    <div>
      <p>Welcome, {user.email}!</p>
      <button onClick={signOut}>Sign Out</button>
    </div>
  );
}
```

**For passing userId to server actions**:
```typescript
'use client';

import { useAuthStore } from '@/lib/stores/auth-store';
import { myServerAction } from '@/lib/actions/my.actions';

export function MyForm() {
  const user = useAuthStore((state) => state.user);
  
  const handleSubmit = async (formData: FormData) => {
    // Pass userId for optimization
    if (user?.id) {
      formData.append('userId', user.id);
    }
    
    await myServerAction(formData);
  };
  
  return <form action={handleSubmit}>...</form>;
}
```

---

### 6. Services

**When**: Service layer that needs user context

**Pattern**:
```typescript
import { getCachedUser } from '@/lib/services/auth-cache';

export class MyService {
  static async doSomething() {
    const { user } = await getCachedUser();
    
    if (!user) {
      throw new Error('Authentication required');
    }
    
    // Use user.id for service operations
    return await performOperation(user.id);
  }
}
```

**Note**: Services typically receive `userId` as a parameter rather than checking auth themselves. Auth checks are done in the calling layer (actions/routes).

---

## Best Practices

### ✅ DO

1. **Use cached auth helpers**
   - Server actions: `getUserFromAction(userId)`
   - API routes/pages: `getCachedUser()`

2. **Pass userId from client when possible**
   - Reduces server DB calls
   - Client store already has userId

3. **Invalidate cache on user data changes**
   - Profile updates
   - Logout
   - (Already implemented in auth service)

4. **Check auth early in your function**
   - Fail fast if not authenticated
   - Return appropriate error responses

5. **Use proper error responses**
   - 401 for unauthorized
   - Clear error messages

---

### ❌ DON'T

1. **Don't call `supabase.auth.getUser()` directly**
   - Use cached helpers instead
   - ❌ `const { data: { user } } = await supabase.auth.getUser();`
   - ✅ `const { user } = await getCachedUser();`

2. **Don't create Supabase client just for auth checks**
   - Use cached helpers instead
   - ❌ `const supabase = await createClient(); const { data: { user } } = await supabase.auth.getUser();`
   - ✅ `const { user } = await getCachedUser();`

3. **Don't forget to pass userId from client**
   - When available, pass it for optimization
   - Optional but recommended

4. **Don't cache user data in services**
   - Cache is already handled at the infrastructure level
   - Services should accept userId as parameter

---

## Performance Optimizations

### Caching Strategy

**Cache TTL**: 5 minutes  
**Cache Key**: `user:{userId}`  
**Cleanup**: Automatic every 60 seconds

**Cache Hit Rate**: ~90% (expected)  
**DB Call Reduction**: ~90%

### Client-Side Optimization

When client passes `userId` to server actions:
1. Server validates userId against cached auth
2. No DB call needed (if cache hit)
3. Faster response times

**Example**:
```typescript
// Client (has userId in store)
formData.append('userId', user.id);

// Server (validates against cache)
const { user, userId } = await getUserFromAction(userIdFromClient);
// ✅ Fast - no DB call if cache hit
```

---

## Cache Invalidation

Cache is automatically invalidated on:

1. **Logout** (`lib/services/auth.ts:198-202`)
   ```typescript
   await invalidateUserCache(userId);
   ```

2. **Profile Updates** (`lib/services/user-onboarding.ts:243-244`)
   ```typescript
   await invalidateUserCache(userId);
   ```

**Manual invalidation** (if needed):
```typescript
import { invalidateUserCache } from '@/lib/services/auth-cache';

await invalidateUserCache(userId);
```

---

## Migration Patterns

### Migrating Server Actions

**Before**:
```typescript
const supabase = await createClient();
const { data: { user }, error: authError } = await supabase.auth.getUser();

if (authError || !user) {
  return { success: false, error: 'Authentication required' };
}

const userId = user.id;
```

**After**:
```typescript
import { getUserFromAction } from '@/lib/utils/get-user-from-action';

const userIdFromClient = formData.get('userId') as string | null;
const { user, userId } = await getUserFromAction(userIdFromClient);

if (!user || !userId) {
  return { success: false, error: 'Authentication required' };
}
```

---

### Migrating API Routes

**Before**:
```typescript
const supabase = await createClient();
const { data: { user } } = await supabase.auth.getUser();

if (!user) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
```

**After**:
```typescript
import { getCachedUser } from '@/lib/services/auth-cache';

const { user } = await getCachedUser();

if (!user) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
```

---

### Migrating Server Pages

**Before**:
```typescript
const supabase = await createClient();
const { data: { user }, error } = await supabase.auth.getUser();

if (error || !user) {
  redirect('/login');
}
```

**After**:
```typescript
import { getCachedUser } from '@/lib/services/auth-cache';

const { user } = await getCachedUser();

if (!user) {
  redirect('/login');
}
```

---

## File Reference

### Client-Side Files

| File | Role | Used In |
|------|------|---------|
| `lib/stores/auth-store.ts` | Zustand auth state store | Client components |
| `lib/hooks/use-auth.ts` | Auth hook wrapper | Client components |
| `lib/supabase/client.ts` | Supabase client (browser) | Client-side Supabase calls |

### Server-Side Files

| File | Role | Used In |
|------|------|---------|
| `lib/services/auth-cache.ts` | Auth caching layer | API routes, server pages |
| `lib/utils/get-user-from-action.ts` | Server action helper | Server actions |
| `lib/services/auth.ts` | Auth business logic | Auth operations |
| `lib/actions/auth.actions.ts` | Auth server actions | Client components |
| `lib/supabase/server.ts` | Supabase client (server) | Server-side Supabase calls |

### Using Cached Auth

| Context | Use This | Import From |
|---------|----------|-------------|
| Server Actions | `getUserFromAction(userId)` | `@/lib/utils/get-user-from-action` |
| API Routes | `getCachedUser()` | `@/lib/services/auth-cache` |
| Server Pages | `getCachedUser()` | `@/lib/services/auth-cache` |
| Server Components | `getCachedUser()` | `@/lib/services/auth-cache` |

---

## Summary

### Quick Reference

**For Server Actions**:
```typescript
import { getUserFromAction } from '@/lib/utils/get-user-from-action';

const userIdFromClient = formData.get('userId') as string | null;
const { user, userId } = await getUserFromAction(userIdFromClient);
```

**For API Routes / Server Pages**:
```typescript
import { getCachedUser } from '@/lib/services/auth-cache';

const { user } = await getCachedUser();
```

**For Client Components**:
```typescript
import { useAuth } from '@/lib/hooks/use-auth';

const { user, loading, signIn, signOut } = useAuth();
```

**For Passing userId (Client)**:
```typescript
import { useAuthStore } from '@/lib/stores/auth-store';

const user = useAuthStore((state) => state.user);
if (user?.id) {
  formData.append('userId', user.id);
}
```

---

## Status

✅ **All server actions** (12 files) - Using cached auth  
✅ **All API routes** (18 files) - Using cached auth  
✅ **All server pages** (4 files) - Using cached auth  
✅ **Cache invalidation** - Implemented on logout & profile updates  
✅ **Client optimization** - Passing userId where applicable  

**Auth Infrastructure**: ✅ **Production Ready**

---

**Last Updated**: November 2025  
**Maintained By**: Development Team








