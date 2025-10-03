-- Add user_id column to renders table
ALTER TABLE "renders" ADD COLUMN "user_id" uuid REFERENCES "users"("id");

-- Add output_url column to renders table  
ALTER TABLE "renders" ADD COLUMN "output_url" text;

-- Add output_key column to renders table
ALTER TABLE "renders" ADD COLUMN "output_key" text;

-- Make project_id nullable
ALTER TABLE "renders" ALTER COLUMN "project_id" DROP NOT NULL;
