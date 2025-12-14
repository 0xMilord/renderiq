# Supabase Auth Constraint Fix

**Issue**: `users_id_auth_users_id_fk` foreign key constraint prevents test user creation

---

## Problem

Supabase adds a foreign key constraint that requires `public.users.id` to exist in `auth.users.id` first:

```sql
ALTER TABLE users 
ADD CONSTRAINT users_id_auth_users_id_fk 
FOREIGN KEY (id) REFERENCES auth.users(id);
```

**This breaks test databases** because:
- Tests create users directly in `public.users`
- No corresponding `auth.users` record exists
- Foreign key constraint violation occurs

---

## Solution

Migration 0030 now:
1. ✅ Drops the `users_id_auth_users_id_fk` constraint if it exists
2. ✅ Creates `ensure_user_exists()` function for reliable user creation
3. ✅ Adds indexes and triggers

**Test fixtures** also:
- ✅ Automatically drop the constraint in `setupTestDB()`
- ✅ Create the function if missing

---

## How to Fix

### **Option 1: Run Migration 0030** (Recommended)

```bash
psql $DATABASE_URL -f drizzle/0030_fix_test_db_users_setup.sql
```

This will:
- Drop the Supabase constraint
- Create helper functions
- Add indexes

### **Option 2: Manual Fix**

```sql
-- Drop the constraint
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_id_auth_users_id_fk;
```

### **Option 3: Auto-Fix** (Already Implemented)

The test fixtures (`tests/fixtures/database.ts`) will automatically:
- Check for the constraint
- Drop it if found
- Create helper functions

**Note**: Auto-fix runs on every test run, but running the migration once is more efficient.

---

## Verification

After running the migration:

```sql
-- Check constraint is gone
SELECT constraint_name 
FROM information_schema.table_constraints 
WHERE constraint_name = 'users_id_auth_users_id_fk';
-- Should return 0 rows

-- Check function exists
SELECT proname FROM pg_proc WHERE proname = 'ensure_user_exists';
-- Should return 1 row
```

---

## Production vs Test

### **Production** (Supabase):
- ✅ Keep the constraint (enforces auth.users → public.users sync)
- ✅ Users created via Supabase Auth
- ✅ Webhook creates public.users record

### **Test Databases**:
- ❌ Drop the constraint (allows direct user creation)
- ✅ Create users directly in public.users
- ✅ No auth.users needed

---

## Important Notes

1. **Migration 0030 is idempotent**: Safe to run multiple times
2. **Auto-fix is best-effort**: May fail if no permissions
3. **Production databases**: Don't run this migration on production!
4. **Test databases only**: This fix is specifically for test environments

---

## Troubleshooting

### **Still getting constraint error**:

1. Check if constraint exists:
   ```sql
   SELECT * FROM information_schema.table_constraints 
   WHERE constraint_name = 'users_id_auth_users_id_fk';
   ```

2. Manually drop it:
   ```sql
   ALTER TABLE users DROP CONSTRAINT users_id_auth_users_id_fk;
   ```

3. Verify it's gone:
   ```sql
   SELECT constraint_name FROM information_schema.table_constraints 
   WHERE constraint_name = 'users_id_auth_users_id_fk';
   -- Should return 0 rows
   ```

### **Permission denied**:

```sql
-- Grant necessary permissions
GRANT ALTER ON TABLE users TO your_test_user;
```

---

**End of Document**

