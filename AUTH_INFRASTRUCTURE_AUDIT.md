# Auth Infrastructure Audit Report

## Critical Issues Found

### 🚨 RACE CONDITIONS

#### 1. **Profile Creation Race Condition** (CRITICAL)
**Location:** Multiple places try to create profile simultaneously
- `/app/auth/callback/route.ts` - Creates profile after OAuth/email verification
- `lib/hooks/use-user-onboarding.ts` - Creates profile if missing
- `lib/services/auth.ts:signIn()` - Creates profile if missing on sign-in

**Problem:** All three can run at the same time, causing:
- Duplicate key errors
- Multiple credit initializations
- Inconsistent state

**Fix:** Use a single source of truth with proper locking/checking

#### 2. **Profile Fetch Race Condition**
**Location:** 
- `lib/stores/auth-store.ts:fetchUserProfile()` - Fetches profile
- `lib/hooks/use-user-onboarding.ts` - Also checks and creates profile

**Problem:** Both can run simultaneously, causing duplicate API calls

**Fix:** Centralize profile fetching in store, hook should only trigger it

### 🔄 DUPLICATE RESPONSIBILITIES

#### 1. **Profile Creation Logic Duplicated**
- Avatar generation: `/auth/callback` (lines 40-52) AND `UserOnboardingService` (lines 48-59)
- Fingerprint parsing: `/auth/callback` (lines 55-101) AND `user-onboarding.actions.ts` (lines 29-77)
- Credits initialization: Multiple places check and initialize

**Fix:** Move all logic to `UserOnboardingService`, call from single place

#### 2. **Credits Initialization Duplicated**
- `AuthService.signIn()` (lines 86-98) - Checks and initializes credits
- `UserOnboardingService.createUserProfile()` (lines 161-166) - Initializes credits
- `/auth/callback` (lines 124-136) - Fallback credits initialization

**Fix:** Only initialize in `UserOnboardingService.createUserProfile()`

#### 3. **Ambassador Referral Tracking Duplicated**
- `UserOnboardingService.createUserProfile()` (lines 189-205)
- `/auth/callback` (lines 146-160)

**Fix:** Only track in `UserOnboardingService.createUserProfile()`

### 🔁 SAME OPERATIONS DONE TWICE

#### 1. **Profile Creation on Sign-In**
- `AuthService.signIn()` creates profile if missing (lines 71-99)
- `useUserOnboarding()` hook also creates profile if missing

**Problem:** Both can run, causing duplicate creation attempts

#### 2. **Profile Fetching**
- `auth-store.fetchUserProfile()` fetches profile
- `useUserOnboarding()` hook also checks and creates profile

**Problem:** Redundant checks and potential race conditions

#### 3. **Fingerprint Cookie Parsing**
- `/auth/callback` parses fingerprint cookie (lines 55-101)
- `user-onboarding.actions.ts` also parses fingerprint cookie (lines 29-77)

**Fix:** Extract to utility function

## Recommended Fixes

### Priority 1: Fix Race Conditions

1. **Single Profile Creation Point**
   - Remove profile creation from `AuthService.signIn()`
   - Remove profile creation from `/auth/callback` (keep only for OAuth)
   - Use `useUserOnboarding()` hook as single client-side trigger
   - Add proper locking/checking in `UserOnboardingService`

2. **Centralize Profile Fetching**
   - Only `auth-store.fetchUserProfile()` should fetch
   - `useUserOnboarding()` should only trigger fetch, not duplicate it

### Priority 2: Remove Duplicates

1. **Extract Fingerprint Parsing**
   - Create `lib/utils/fingerprint-parser.ts`
   - Use in both places

2. **Remove Duplicate Credits Initialization**
   - Only initialize in `UserOnboardingService.createUserProfile()`
   - Remove from `AuthService.signIn()` and `/auth/callback`

3. **Remove Duplicate Ambassador Tracking**
   - Only track in `UserOnboardingService.createUserProfile()`
   - Remove from `/auth/callback`

### Priority 3: Simplify Flow

1. **Sign-Up Flow:**
   - Client: Sign up → Wait for email verification
   - Email verification → `/auth/callback` → Redirect only (no profile creation)
   - Client: `useUserOnboarding()` hook creates profile

2. **OAuth Flow:**
   - OAuth callback → `/auth/callback` → Create profile → Redirect
   - Client: `useUserOnboarding()` hook checks if profile exists

3. **Sign-In Flow:**
   - Sign in → `useUserOnboarding()` hook creates profile if missing
   - No server-side profile creation needed

## Files Modified

1. ✅ `lib/services/auth.ts` - Removed profile creation from signIn()
2. ✅ `app/auth/callback/route.ts` - Simplified, removed duplicates
3. ✅ `lib/hooks/use-user-onboarding.ts` - Fixed race condition, added profile check
4. ✅ `lib/services/user-onboarding.ts` - Added better race condition handling
5. ✅ `lib/utils/fingerprint-parser.ts` - NEW: Centralized fingerprint parsing
6. ✅ `lib/actions/user-onboarding.actions.ts` - Uses fingerprint parser utility

## Fixes Applied

### ✅ Fixed Race Conditions

1. **Profile Creation Race Condition**
   - Removed profile creation from `AuthService.signIn()`
   - Simplified `/auth/callback` to only create profile for OAuth/verified users
   - `useUserOnboarding()` hook now checks for existing profile before creating
   - Added duplicate key error handling in `UserOnboardingService`

2. **Profile Fetch Race Condition**
   - Hook now checks for existing profile before creating
   - Store's `fetchUserProfile()` is the primary fetcher
   - Hook only triggers creation if profile doesn't exist

### ✅ Removed Duplicates

1. **Fingerprint Parsing**
   - Created `lib/utils/fingerprint-parser.ts` utility
   - Both `/auth/callback` and `user-onboarding.actions.ts` now use it

2. **Credits Initialization**
   - Only initialized in `UserOnboardingService.createUserProfile()`
   - Removed from `AuthService.signIn()` and `/auth/callback`

3. **Ambassador Referral Tracking**
   - Only tracked in `UserOnboardingService.createUserProfile()`
   - Removed from `/auth/callback`

### ✅ Improved Flow

**Sign-Up Flow:**
1. Client: Sign up → Wait for email verification
2. Email verification → `/auth/callback` → Redirect only
3. Client: `useUserOnboarding()` hook creates profile

**OAuth Flow:**
1. OAuth callback → `/auth/callback` → Create profile → Redirect
2. Client: `useUserOnboarding()` hook checks if profile exists

**Sign-In Flow:**
1. Sign in → `useUserOnboarding()` hook creates profile if missing
2. No server-side profile creation needed

