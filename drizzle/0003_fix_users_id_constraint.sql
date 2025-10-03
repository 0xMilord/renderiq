-- Remove the DEFAULT gen_random_uuid() constraint from users.id
-- This allows us to insert our own UUID values (like Supabase user IDs)
ALTER TABLE "users" ALTER COLUMN "id" DROP DEFAULT;
