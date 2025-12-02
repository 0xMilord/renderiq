-- Add project_rules table for chain-specific rules
CREATE TABLE IF NOT EXISTS "project_rules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"chain_id" uuid NOT NULL,
	"rule" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

-- Add foreign key constraint
DO $$ BEGIN
 ALTER TABLE "project_rules" ADD CONSTRAINT "project_rules_chain_id_render_chains_id_fk" FOREIGN KEY ("chain_id") REFERENCES "render_chains"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS "project_rules_chain_id_idx" ON "project_rules" ("chain_id");
CREATE INDEX IF NOT EXISTS "project_rules_is_active_idx" ON "project_rules" ("is_active");

