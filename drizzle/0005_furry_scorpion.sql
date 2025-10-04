ALTER TABLE "renders" ADD COLUMN "uploaded_image_url" text;--> statement-breakpoint
ALTER TABLE "renders" ADD COLUMN "uploaded_image_key" text;--> statement-breakpoint
ALTER TABLE "renders" ADD COLUMN "uploaded_image_id" uuid;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "renders" ADD CONSTRAINT "renders_uploaded_image_id_file_storage_id_fk" FOREIGN KEY ("uploaded_image_id") REFERENCES "public"."file_storage"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
