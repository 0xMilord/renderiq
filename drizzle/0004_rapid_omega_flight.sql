ALTER TABLE "project_versions" ALTER COLUMN "original_image_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "projects" ALTER COLUMN "original_image_id" DROP NOT NULL;