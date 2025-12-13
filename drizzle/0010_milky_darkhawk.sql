CREATE TABLE IF NOT EXISTS "canvas_file_versions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"file_id" uuid NOT NULL,
	"version" integer NOT NULL,
	"graph_id" uuid,
	"name" text,
	"description" text,
	"created_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "canvas_files" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"thumbnail_url" text,
	"thumbnail_key" text,
	"version" integer DEFAULT 1 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"is_archived" boolean DEFAULT false NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "plugin_api_keys" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" text NOT NULL,
	"key" text NOT NULL,
	"key_prefix" text NOT NULL,
	"scopes" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"expires_at" timestamp,
	"last_used_at" timestamp,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "plugin_api_keys_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "plugin_webhooks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"url" text NOT NULL,
	"secret" text NOT NULL,
	"events" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"last_triggered_at" timestamp,
	"failure_count" integer DEFAULT 0 NOT NULL,
	"last_failure_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "resumable_uploads" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"bucket" text NOT NULL,
	"file_path" text NOT NULL,
	"total_size" bigint NOT NULL,
	"uploaded_bytes" bigint DEFAULT 0 NOT NULL,
	"upload_url" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"status" text DEFAULT 'initialized' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "tool_analytics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tool_id" uuid NOT NULL,
	"user_id" uuid,
	"execution_id" uuid,
	"event_type" text NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "tool_executions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tool_id" uuid NOT NULL,
	"project_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"input_images" jsonb,
	"input_text" text,
	"input_settings" jsonb,
	"output_render_id" uuid,
	"output_url" text,
	"output_key" text,
	"output_file_id" uuid,
	"status" text DEFAULT 'pending' NOT NULL,
	"error_message" text,
	"processing_time" integer,
	"credits_cost" integer DEFAULT 0 NOT NULL,
	"execution_config" jsonb NOT NULL,
	"parent_execution_id" uuid,
	"batch_group_id" uuid,
	"batch_index" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"started_at" timestamp,
	"completed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "tool_settings_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tool_id" uuid NOT NULL,
	"user_id" uuid,
	"name" text NOT NULL,
	"description" text,
	"settings" jsonb NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	"is_public" boolean DEFAULT false NOT NULL,
	"usage_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "tools" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"category" text NOT NULL,
	"system_prompt" text NOT NULL,
	"input_type" text NOT NULL,
	"output_type" text NOT NULL,
	"icon" text,
	"color" text,
	"priority" text DEFAULT 'medium' NOT NULL,
	"status" text DEFAULT 'online' NOT NULL,
	"settings_schema" jsonb,
	"default_settings" jsonb,
	"seo_metadata" jsonb,
	"metadata" jsonb,
	"version" integer DEFAULT 1 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "tools_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "canvas_graphs" DROP CONSTRAINT "canvas_graphs_chain_id_unique";--> statement-breakpoint
ALTER TABLE "canvas_graphs" ALTER COLUMN "chain_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "subscription_plans" ALTER COLUMN "currency" SET DEFAULT 'INR';--> statement-breakpoint
ALTER TABLE "canvas_graphs" ADD COLUMN "file_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "payment_orders" ADD COLUMN "payment_provider" text DEFAULT 'razorpay' NOT NULL;--> statement-breakpoint
ALTER TABLE "payment_orders" ADD COLUMN "paddle_transaction_id" text;--> statement-breakpoint
ALTER TABLE "payment_orders" ADD COLUMN "paddle_subscription_id" text;--> statement-breakpoint
ALTER TABLE "payment_orders" ADD COLUMN "lemonsqueezy_order_id" text;--> statement-breakpoint
ALTER TABLE "payment_orders" ADD COLUMN "lemonsqueezy_subscription_id" text;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "platform" text DEFAULT 'render' NOT NULL;--> statement-breakpoint
ALTER TABLE "renders" ADD COLUMN "platform" text;--> statement-breakpoint
ALTER TABLE "renders" ADD COLUMN "metadata" jsonb;--> statement-breakpoint
ALTER TABLE "user_subscriptions" ADD COLUMN "payment_provider" text DEFAULT 'razorpay' NOT NULL;--> statement-breakpoint
ALTER TABLE "user_subscriptions" ADD COLUMN "paddle_subscription_id" text;--> statement-breakpoint
ALTER TABLE "user_subscriptions" ADD COLUMN "paddle_customer_id" text;--> statement-breakpoint
ALTER TABLE "user_subscriptions" ADD COLUMN "lemonsqueezy_subscription_id" text;--> statement-breakpoint
ALTER TABLE "user_subscriptions" ADD COLUMN "lemonsqueezy_customer_id" text;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "canvas_file_versions" ADD CONSTRAINT "canvas_file_versions_file_id_canvas_files_id_fk" FOREIGN KEY ("file_id") REFERENCES "public"."canvas_files"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "canvas_file_versions" ADD CONSTRAINT "canvas_file_versions_graph_id_canvas_graphs_id_fk" FOREIGN KEY ("graph_id") REFERENCES "public"."canvas_graphs"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "canvas_file_versions" ADD CONSTRAINT "canvas_file_versions_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "canvas_files" ADD CONSTRAINT "canvas_files_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "canvas_files" ADD CONSTRAINT "canvas_files_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "plugin_api_keys" ADD CONSTRAINT "plugin_api_keys_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "plugin_webhooks" ADD CONSTRAINT "plugin_webhooks_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "resumable_uploads" ADD CONSTRAINT "resumable_uploads_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "tool_analytics" ADD CONSTRAINT "tool_analytics_tool_id_tools_id_fk" FOREIGN KEY ("tool_id") REFERENCES "public"."tools"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "tool_analytics" ADD CONSTRAINT "tool_analytics_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "tool_analytics" ADD CONSTRAINT "tool_analytics_execution_id_tool_executions_id_fk" FOREIGN KEY ("execution_id") REFERENCES "public"."tool_executions"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "tool_executions" ADD CONSTRAINT "tool_executions_tool_id_tools_id_fk" FOREIGN KEY ("tool_id") REFERENCES "public"."tools"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "tool_executions" ADD CONSTRAINT "tool_executions_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "tool_executions" ADD CONSTRAINT "tool_executions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "tool_executions" ADD CONSTRAINT "tool_executions_output_render_id_renders_id_fk" FOREIGN KEY ("output_render_id") REFERENCES "public"."renders"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "tool_executions" ADD CONSTRAINT "tool_executions_output_file_id_file_storage_id_fk" FOREIGN KEY ("output_file_id") REFERENCES "public"."file_storage"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "tool_executions" ADD CONSTRAINT "tool_executions_parent_execution_id_tool_executions_id_fk" FOREIGN KEY ("parent_execution_id") REFERENCES "public"."tool_executions"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "tool_settings_templates" ADD CONSTRAINT "tool_settings_templates_tool_id_tools_id_fk" FOREIGN KEY ("tool_id") REFERENCES "public"."tools"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "tool_settings_templates" ADD CONSTRAINT "tool_settings_templates_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "canvas_graphs" ADD CONSTRAINT "canvas_graphs_file_id_canvas_files_id_fk" FOREIGN KEY ("file_id") REFERENCES "public"."canvas_files"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "idx_canvas_graphs_file_id_unique" ON "canvas_graphs" USING btree ("file_id");--> statement-breakpoint
ALTER TABLE "user_subscriptions" ADD CONSTRAINT "user_subscriptions_paddle_subscription_id_unique" UNIQUE("paddle_subscription_id");--> statement-breakpoint
ALTER TABLE "user_subscriptions" ADD CONSTRAINT "user_subscriptions_lemonsqueezy_subscription_id_unique" UNIQUE("lemonsqueezy_subscription_id");