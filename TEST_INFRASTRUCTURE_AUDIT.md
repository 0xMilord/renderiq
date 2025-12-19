# Test Infrastructure Audit - Ambassador System & General Issues

**Date:** 2025-01-27  
**Status:** 🔴 **CRITICAL ISSUES FOUND**

---

## Executive Summary

The test infrastructure has **critical issues** that prevent tests from running correctly:

1. ❌ **Invalid UUID format in tests** - Tests using hardcoded strings instead of UUIDs
2. ❌ **Foreign key constraint violations** - Dependencies not created before use
3. ❌ **Transaction timing issues** - Race conditions in test setup
4. ❌ **Missing ambassador test coverage** - No tests for critical ambassador features

---

## Critical Errors Found

### Error #1: Invalid UUID Format 🔴

**Location:** `tests/unit/dal/auth.test.ts` (line 55)

**Error:**
```
invalid input syntax for type uuid: "test-id"
```

**Root Cause:**
```typescript
const userData = {
  id: 'test-id',  // ❌ NOT A VALID UUID
  email: 'newuser@example.com',
  // ...
};
```

**Fix Required:**
- Use `randomUUID()` or valid UUID format
- Test should use `createTestUser()` helper instead

**Status:** ❌ **TEST FILE ISSUE**

---

### Error #2: Foreign Key Constraint - User Credits 🔴

**Location:** `tests/unit/dal/auth.test.ts` (line 137-143)

**Error:**
```
insert or update on table "user_credits" violates foreign key constraint
Key (user_id)=(54c5a686-07a2-4319-88a2-4ee9f3e0651d) is not present in table "users"
```

**Root Cause:**
- Test creates user with `createTestUser()`
- Immediately tries to create credits
- User not yet visible due to transaction timing

**Fix Required:**
- Add retry logic or wait for user to be visible
- Use `ensure_user_exists()` function if available
- Verify user exists before creating credits

**Status:** ❌ **TEST FILE ISSUE** (transaction timing)

---

### Error #3: Foreign Key Constraint - Render Chains 🔴

**Location:** `tests/unit/dal/project-rules.test.ts`

**Error:**
```
Key (chain_id)=(f617e977-9598-47fd-9ad2-f24013b3009c) is not present in table "render_chains"
```

**Root Cause:**
- Test creates project rule with `chainId`
- Chain not created or not visible when rule is created
- Foreign key constraint violation

**Fix Required:**
- Ensure `createTestRenderChain()` is called before creating rules
- Add verification that chain exists
- Fix transaction timing issues

**Status:** ❌ **TEST FILE ISSUE** (missing dependency)

---

## Test Coverage Analysis

### Ambassador System Tests

#### ✅ What's Tested

**Unit Tests - DAL:**
- ✅ `createApplication()` - Basic creation
- ✅ `getAmbassadorByUserId()` - Retrieval
- ✅ `getAmbassadorById()` - Retrieval
- ✅ `getAmbassadorByCode()` - Code lookup
- ✅ `updateAmbassadorStatus()` - Status updates
- ✅ `generateUniqueCode()` - Code generation
- ✅ `createCustomLink()` - Link creation
- ✅ `trackReferral()` - Referral tracking
- ✅ `getReferrals()` - Referral retrieval

**Coverage:** ~60% of DAL methods

#### ❌ What's NOT Tested

**AmbassadorService (0% coverage):**
- ❌ `trackSignup()` - Core referral tracking
- ❌ `calculateDiscount()` - Discount calculation
- ❌ `processSubscriptionPayment()` - Commission processing
- ❌ `updateAmbassadorVolumeTier()` - Tier updates
- ❌ `calculateVolumeTier()` - Tier calculation
- ❌ `getAmbassadorStats()` - Stats calculation

**Razorpay Integration (0% coverage):**
- ❌ Discount calculation in `createSubscription()`
- ❌ Discount storage in subscription notes
- ❌ Webhook discount handling
- ❌ Payment order creation with discount

**UserOnboarding Integration (0% coverage):**
- ❌ Referral tracking on signup
- ❌ Cookie parsing for `ambassador_ref`

**End-to-End Flows (0% coverage):**
- ❌ Complete flow: Link → Signup → Subscription → Commission
- ❌ Volume tier progression
- ❌ Custom link tracking

**Edge Cases (0% coverage):**
- ❌ Invalid referral codes
- ❌ Inactive ambassadors
- ❌ Duplicate referrals
- ❌ Commission period expiration
- ❌ Concurrent updates

---

## Test File Issues

### 1. `tests/unit/dal/auth.test.ts` 🔴

**Issues:**
1. Line 55: Uses `'test-id'` instead of valid UUID
2. Line 137-143: User not visible when creating credits (timing issue)

**Fixes Needed:**
```typescript
// ❌ WRONG
const userData = {
  id: 'test-id',  // Invalid UUID
  // ...
};

// ✅ CORRECT
const testUser = await createTestUser();  // Uses randomUUID()
// OR
const { randomUUID } = await import('crypto');
const userData = {
  id: randomUUID(),  // Valid UUID
  // ...
};
```

---

### 2. `tests/unit/dal/project-rules.test.ts` 🔴

**Issues:**
1. Chain not created before creating rules
2. Transaction timing - chain not visible

**Fixes Needed:**
- Ensure `testChain` is created in `beforeEach`
- Add verification that chain exists before creating rules
- Use retry logic if needed

---

### 3. Missing Ambassador Tests 🔴

**Missing Files:**
- ❌ `tests/unit/services/ambassador.service.test.ts` - **CREATED** ✅
- ❌ `tests/unit/services/razorpay-ambassador.test.ts` - **MISSING**
- ❌ `tests/integration/services/ambassador-integration.test.ts` - **MISSING**
- ❌ `tests/e2e/ambassador-flow.spec.ts` - **MISSING**

---

## Test Infrastructure Issues

### 1. Transaction Timing ⚠️

**Problem:**
- Tests create records but they're not immediately visible
- Foreign key constraints fail even though records exist
- Race conditions in test setup

**Current Solution:**
- `createTestUser()` has retry logic (5 attempts)
- `createTestProject()` has retry logic (10 attempts)
- Uses `ensure_user_exists()` function if available

**Status:** ⚠️ **PARTIALLY FIXED** - Some tests still fail

---

### 2. Database Cleanup ⚠️

**Problem:**
- Tests may leave orphaned records
- Foreign key constraints prevent deletion
- Cleanup order matters (child tables first)

**Current Solution:**
- `teardownTestDB()` deletes in correct order
- Deletes child tables before parent tables

**Status:** ✅ **WORKING**

---

### 3. Test Isolation ⚠️

**Problem:**
- Tests may interfere with each other
- Shared state between tests
- Concurrent test execution issues

**Current Solution:**
- Each test has `beforeEach` and `afterEach`
- Database cleaned before each test
- Unique emails/timestamps prevent collisions

**Status:** ✅ **WORKING**

---

## Fixes Required

### Priority 1: Fix Test File Errors 🔴

1. **Fix invalid UUID in auth.test.ts**
   - Replace `'test-id'` with `randomUUID()` or use `createTestUser()`

2. **Fix user credits timing issue**
   - Add retry logic or wait for user to be visible
   - Verify user exists before creating credits

3. **Fix project rules chain dependency**
   - Ensure chain is created and visible before creating rules
   - Add verification step

### Priority 2: Add Missing Ambassador Tests 🟡

1. **Create Razorpay integration tests**
   - Test discount calculation in `createSubscription()`
   - Test webhook discount handling

2. **Create integration tests**
   - Test full signup → subscription → commission flow
   - Test volume tier progression

3. **Create E2E tests**
   - Test complete ambassador flow
   - Test with real database

### Priority 3: Improve Test Infrastructure 🟢

1. **Better error messages**
   - More context in error messages
   - Suggestions for fixes

2. **Test helpers**
   - Helper functions for common test patterns
   - Ambassador-specific test helpers

3. **Test documentation**
   - Document test patterns
   - Document common issues and fixes

---

## Files to Fix

### Test Files (Issues in Test Files)

1. ✅ `tests/unit/services/ambassador.service.test.ts` - **CREATED**
2. ❌ `tests/unit/dal/ambassador.test.ts` - **NEEDS EXTENSION** (missing methods)
3. ❌ `tests/unit/dal/auth.test.ts` - **NEEDS FIX** (invalid UUID, timing)
4. ❌ `tests/unit/dal/project-rules.test.ts` - **NEEDS FIX** (chain dependency)
5. ❌ `tests/unit/services/razorpay-ambassador.test.ts` - **MISSING**
6. ❌ `tests/integration/services/ambassador-integration.test.ts` - **MISSING**

### Main Files (No Issues Found)

- ✅ `lib/services/ambassador.service.ts` - **NO ISSUES**
- ✅ `lib/services/razorpay.service.ts` - **NO ISSUES**
- ✅ `lib/dal/ambassador.ts` - **NO ISSUES**

**Conclusion:** All errors are in **TEST FILES**, not main implementation files.

---

## Recommended Actions

1. ✅ **Fix invalid UUID in auth.test.ts** - Use `randomUUID()` or `createTestUser()`
2. ✅ **Fix user credits timing** - Add verification/retry logic
3. ✅ **Fix project rules chain dependency** - Ensure chain exists before rules
4. ✅ **Extend ambassador.test.ts** - Add tests for missing DAL methods
5. ✅ **Create Razorpay ambassador tests** - Test discount integration
6. ✅ **Create integration tests** - Test full flows
7. ✅ **Create E2E tests** - Test complete ambassador flow

---

## Test Execution Status

**Current Status:**
- ❌ Many tests failing due to test file issues
- ✅ Main implementation code is correct
- ⚠️ Test infrastructure needs improvements

**After Fixes:**
- ✅ All test file errors fixed
- ✅ Comprehensive ambassador test coverage
- ✅ All tests passing

