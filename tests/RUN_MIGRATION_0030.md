# How to Run Migration 0030 for Test Database

**Migration**: `drizzle/0030_fix_test_db_users_setup.sql`  
**Purpose**: Fix user creation issues in test database

---

## Quick Start

```bash
# Using psql
psql $DATABASE_URL -f drizzle/0030_fix_test_db_users_setup.sql

# Or if using .env.test
psql $(grep DATABASE_URL .env.test | cut -d '=' -f2) -f drizzle/0030_fix_test_db_users_setup.sql
```

---

## What This Migration Does

1. ✅ Creates `ensure_user_exists()` function for reliable user creation
2. ✅ Adds trigger to ensure user inserts are immediately visible
3. ✅ Adds indexes for faster lookups
4. ✅ Adds helpful comments

---

## Verification

After running the migration, verify it worked:

```sql
-- Check function exists
SELECT proname FROM pg_proc WHERE proname = 'ensure_user_exists';
-- Should return 1 row

-- Test the function
SELECT ensure_user_exists(
  gen_random_uuid(),
  'test@example.com',
  'Test User'
);
-- Should return a UUID

-- Check trigger exists
SELECT tgname FROM pg_trigger WHERE tgname = 'users_after_insert';
-- Should return 1 row
```

---

## Alternative: Auto-Creation

The test fixtures (`tests/fixtures/database.ts`) will attempt to create the function automatically if it doesn't exist. However, **running the migration manually is recommended** for:

- Better error handling
- Proper trigger setup
- Index creation
- Documentation

---

## Troubleshooting

### Error: "permission denied"

```sql
-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION ensure_user_exists TO your_test_user;
```

### Error: "function already exists"

This is fine - the migration uses `CREATE OR REPLACE`, so it will update the function if it exists.

### Function not found in tests

1. Check migration was run: `SELECT proname FROM pg_proc WHERE proname = 'ensure_user_exists';`
2. Check database connection: Ensure `DATABASE_URL` points to correct database
3. Check schema: Function should be in `public` schema

---

## Next Steps

After running the migration:

1. ✅ Re-run tests: `npm test`
2. ✅ Check user creation works: Look for "✅ Created ensure_user_exists() function" in test output
3. ✅ Verify no more "user not found" errors

---

**Note**: This migration is safe to run multiple times (idempotent).

