-- Add slug field to projects table
ALTER TABLE "projects" ADD COLUMN "slug" text NOT NULL DEFAULT '';

-- Create unique index on slug
CREATE UNIQUE INDEX "projects_slug_unique" ON "projects" ("slug");

-- Update existing projects with generated slugs
UPDATE "projects" SET "slug" = LOWER(REGEXP_REPLACE(REGEXP_REPLACE("name", '[^a-zA-Z0-9\s]', '', 'g'), '\s+', '-', 'g')) || '-' || EXTRACT(EPOCH FROM "created_at")::text;

-- Remove the default value constraint
ALTER TABLE "projects" ALTER COLUMN "slug" DROP DEFAULT;
