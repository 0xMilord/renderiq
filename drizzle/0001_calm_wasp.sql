ALTER TABLE "renders" DROP CONSTRAINT "renders_output_file_id_file_storage_id_fk";
--> statement-breakpoint
ALTER TABLE "renders" ALTER COLUMN "project_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "renders" ADD COLUMN "user_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "renders" ADD COLUMN "output_url" text;--> statement-breakpoint
ALTER TABLE "renders" ADD COLUMN "output_key" text;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "renders" ADD CONSTRAINT "renders_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "renders" DROP COLUMN IF EXISTS "output_file_id";