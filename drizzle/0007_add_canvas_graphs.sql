--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "canvas_graphs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"chain_id" uuid NOT NULL,
	"project_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"nodes" jsonb NOT NULL,
	"connections" jsonb NOT NULL,
	"viewport" jsonb,
	"version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "canvas_graphs_chain_id_unique" UNIQUE("chain_id")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "canvas_graphs" ADD CONSTRAINT "canvas_graphs_chain_id_render_chains_id_fk" FOREIGN KEY ("chain_id") REFERENCES "public"."render_chains"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "canvas_graphs" ADD CONSTRAINT "canvas_graphs_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "canvas_graphs" ADD CONSTRAINT "canvas_graphs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "canvas_graphs_chain_id_idx" ON "canvas_graphs"("chain_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "canvas_graphs_project_id_idx" ON "canvas_graphs"("project_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "canvas_graphs_user_id_idx" ON "canvas_graphs"("user_id");

