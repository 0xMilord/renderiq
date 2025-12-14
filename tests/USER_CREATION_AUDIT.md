# User Creation Audit Report

**Date**: 2025-01-27  
**Status**: 🔴 **CRITICAL ISSUES IDENTIFIED**

---

## 🎯 Executive Summary

The test suite is failing due to **user creation and transaction isolation issues**. Users are being created but are not immediately visible when creating related records (projects, ambassadors, renders), causing foreign key constraint violations.

**Root Causes Identified**:
1. **Transaction Isolation**: Users inserted in one transaction are not visible in subsequent queries within the same test
2. **Missing Default on users.id**: Migration 0003 removed `DEFAULT gen_random_uuid()` to support Supabase auth.users.id, but this requires explicit UUIDs in tests
3. **Connection Pooling**: Different database connections may not see uncommitted transactions
4. **No Supabase Auth Integration in Tests**: Tests create users directly in `public.users`, but production uses `auth.users` → `public.users` sync

---

## 📊 Problem Analysis

### **Issue 1: User Not Found After Insert**

**Error Pattern**:
```
PostgresError: insert or update on table "projects" violates foreign key constraint "projects_user_id_users_id_fk"
detail: 'Key (user_id)=(xxx) is not present in table "users".'
```

**Root Cause**:
- `createTestUser()` inserts a user and returns it
- `createTestProject()` immediately tries to use that user ID
- The user insert may not be committed/visible yet due to transaction isolation

**Evidence**:
```typescript
// tests/fixtures/database.ts:232-296
export async function createTestUser(data?: Partial<NewUser>) {
  const [user] = await db.insert(schema.users).values({...}).returning();
  // User is returned, but may not be visible in next query
  return user;
}

// Later in test:
const user = await createTestUser(); // ✅ Returns user
const project = await createTestProject(user.id); // ❌ Fails: user not found
```

**Current Mitigation** (Insufficient):
- Added retry loops with delays (10-50ms)
- Added verification queries
- Still failing in some cases

---

### **Issue 2: Schema Mismatch Between Production and Tests**

**Production Flow**:
1. User signs up via Supabase Auth → `auth.users` table gets UUID
2. Webhook/callback creates record in `public.users` with same UUID
3. All foreign keys reference `public.users.id`

**Test Flow**:
1. Test directly inserts into `public.users` with random UUID
2. No `auth.users` record exists
3. Foreign keys should still work (they reference `public.users`)

**Problem**:
- Migration `0003_fix_users_id_constraint.sql` removed `DEFAULT gen_random_uuid()`
- This was done to allow Supabase `auth.users.id` values
- Tests now MUST provide explicit UUIDs (which we do)
- But the insert may not be immediately visible

---

### **Issue 3: Transaction Isolation Levels**

**PostgreSQL Default**: `READ COMMITTED`

**What This Means**:
- Each statement sees only committed data
- Uncommitted transactions are invisible
- BUT: Within a single transaction, you should see your own inserts

**The Problem**:
- `postgres-js` may be using connection pooling
- Different connections = different transactions
- Insert in connection A → Query in connection B = user not found

**Evidence**:
```typescript
// setupTestDB() creates a connection
testClient = postgres(connectionString, { max: 1, ... });

// But Drizzle may use a different connection internally
testDb = drizzle(testClient, { schema });
```

---

### **Issue 4: Retry Logic Not Sufficient**

**Current Approach**:
```typescript
// Retry 3-5 times with 10-50ms delays
for (let attempt = 0; attempt < 5; attempt++) {
  verifyUser = await db.select()...;
  if (verifyUser.length > 0) break;
  await new Promise(resolve => setTimeout(resolve, 50));
}
```

**Why It Fails**:
- If transaction isn't committed, retrying won't help
- Delays are arbitrary and may not be long enough
- Doesn't address root cause (transaction isolation)

---

## 🔧 Solutions Implemented

### **Solution 1: Migration 0030 - Test Database Setup**

**File**: `drizzle/0030_fix_test_db_users_setup.sql`

**Changes**:
1. ✅ Added `ensure_user_exists()` function for test helpers
2. ✅ Added trigger to ensure inserts are immediately visible
3. ✅ Added indexes for faster lookups
4. ✅ Added comments for documentation

**Usage**:
```sql
-- In test database, ensure user exists before creating projects
SELECT ensure_user_exists(
  'user-uuid-here',
  'test@example.com',
  'Test User'
);
```

---

### **Solution 2: Enhanced Test Fixtures**

**File**: `tests/fixtures/database.ts`

**Changes**:
1. ✅ Added explicit transaction handling
2. ✅ Added connection verification
3. ✅ Added better error messages
4. ✅ Added retry logic with exponential backoff

**Next Steps Needed**:
- Use `ensure_user_exists()` function in `createTestUser()`
- Add explicit transaction commits
- Verify connection pooling settings

---

### **Solution 3: Database Connection Configuration**

**Current**:
```typescript
testClient = postgres(connectionString, {
  max: 1,  // Single connection
  prepare: false,
  ssl: ...,
  connect_timeout: 5,
});
```

**Recommended**:
```typescript
testClient = postgres(connectionString, {
  max: 1,
  prepare: false,
  ssl: ...,
  connect_timeout: 5,
  // ✅ ADD: Ensure immediate commit visibility
  idle_timeout: 0,
  max_lifetime: 0,
  // ✅ ADD: Transaction isolation
  transform: {
    undefined: null,
  },
});
```

---

## 🎯 Recommended Fixes

### **Fix 1: Use Explicit Transactions in Tests**

```typescript
export async function createTestUser(data?: Partial<NewUser>) {
  const db = getTestDB();
  const client = getTestClient(); // Get raw postgres client
  
  // Use explicit transaction
  return await client.begin(async (sql) => {
    const [user] = await sql`
      INSERT INTO users (id, email, ...)
      VALUES (${userId}, ${email}, ...)
      RETURNING *
    `;
    
    // Explicit commit
    await sql`COMMIT`;
    
    return user;
  });
}
```

### **Fix 2: Use Database Function in Tests**

```typescript
export async function createTestUser(data?: Partial<NewUser>) {
  const db = getTestDB();
  const client = getTestClient();
  
  // Use ensure_user_exists function
  const [result] = await client`
    SELECT ensure_user_exists(
      ${userId}::UUID,
      ${email}::TEXT,
      ${name}::TEXT,
      ${isActive}::BOOLEAN,
      ${emailVerified}::BOOLEAN
    ) as user_id
  `;
  
  // Fetch the user
  const [user] = await db.select()
    .from(schema.users)
    .where(eq(schema.users.id, result.user_id))
    .limit(1);
  
  return user;
}
```

### **Fix 3: Add Connection Verification**

```typescript
export async function setupTestDB() {
  // ... existing setup ...
  
  // ✅ Verify connection is working
  await testClient`SELECT 1`;
  
  // ✅ Set transaction isolation (if needed)
  await testClient`SET TRANSACTION ISOLATION LEVEL READ COMMITTED`;
  
  // ✅ Verify users table exists and is accessible
  const tableCheck = await testClient`
    SELECT EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'users'
    )
  `;
  
  if (!tableCheck[0].exists) {
    throw new Error('Users table does not exist');
  }
}
```

---

## 📋 Test Database Setup Checklist

### **Before Running Tests**:

1. ✅ **Run Migration 0030**:
   ```bash
   psql $DATABASE_URL -f drizzle/0030_fix_test_db_users_setup.sql
   ```

2. ✅ **Verify users.id has no default**:
   ```sql
   SELECT column_default 
   FROM information_schema.columns 
   WHERE table_name = 'users' AND column_name = 'id';
   -- Should return NULL (no default)
   ```

3. ✅ **Verify ensure_user_exists function exists**:
   ```sql
   SELECT proname FROM pg_proc WHERE proname = 'ensure_user_exists';
   -- Should return 1 row
   ```

4. ✅ **Verify trigger exists**:
   ```sql
   SELECT tgname FROM pg_trigger WHERE tgname = 'users_after_insert';
   -- Should return 1 row
   ```

5. ✅ **Test the function**:
   ```sql
   SELECT ensure_user_exists(
     gen_random_uuid(),
     'test@example.com',
     'Test User'
   );
   -- Should return a UUID
   ```

---

## 🔍 Debugging Steps

### **If Users Still Not Found**:

1. **Check Transaction Status**:
   ```sql
   SELECT * FROM pg_stat_activity WHERE datname = 'renderiq_test';
   ```

2. **Check User Exists**:
   ```sql
   SELECT id, email FROM users WHERE id = 'user-uuid-here';
   ```

3. **Check Foreign Key Constraints**:
   ```sql
   SELECT 
     tc.constraint_name, 
     tc.table_name, 
     kcu.column_name,
     ccu.table_name AS foreign_table_name,
     ccu.column_name AS foreign_column_name
   FROM information_schema.table_constraints AS tc
   JOIN information_schema.key_column_usage AS kcu
     ON tc.constraint_name = kcu.constraint_name
   JOIN information_schema.constraint_column_usage AS ccu
     ON ccu.constraint_name = tc.constraint_name
   WHERE tc.constraint_type = 'FOREIGN KEY'
     AND tc.table_name = 'projects';
   ```

4. **Check Connection Pooling**:
   ```typescript
   // In test setup
   console.log('Connection pool size:', testClient.options.max);
   console.log('Current connections:', await testClient`SELECT count(*) FROM pg_stat_activity WHERE datname = current_database()`);
   ```

---

## 📊 Impact Assessment

### **Affected Tests**:
- ❌ `tests/unit/dal/ambassador.test.ts` - 3 failures
- ❌ `tests/integration/api/renders/inpaint.test.ts` - 3 failures
- ❌ `tests/integration/api/renders/route.test.ts` - 2 failures
- ❌ `tests/integration/api/plugins/renders.test.ts` - 2 failures
- ❌ `tests/integration/api/payments/verify-subscription.test.ts` - 1 failure

**Total**: ~11 test failures directly related to user creation

### **Indirect Impact**:
- All tests that create users → projects → renders are affected
- Tests that create users → ambassadors → referrals are affected
- Any test with foreign key dependencies on users

---

## ✅ Next Steps

1. **Immediate**: Run migration 0030 on test database
2. **Short-term**: Update `createTestUser()` to use `ensure_user_exists()` function
3. **Medium-term**: Add explicit transaction handling in test fixtures
4. **Long-term**: Consider using Supabase Local for more accurate test environment

---

## 📝 Notes

- **Production vs Test**: Production uses Supabase Auth, tests use direct inserts
- **Transaction Isolation**: PostgreSQL `READ COMMITTED` is standard, but may cause issues with connection pooling
- **Connection Pooling**: `postgres-js` with `max: 1` should prevent pooling issues, but verify
- **Migration 0003**: Removing default was correct for Supabase, but requires explicit UUIDs in tests

---

**End of Audit Report**

