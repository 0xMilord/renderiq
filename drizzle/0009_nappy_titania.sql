CREATE TABLE IF NOT EXISTS "ambassador_commissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ambassador_id" uuid NOT NULL,
	"referral_id" uuid NOT NULL,
	"subscription_id" uuid NOT NULL,
	"payment_order_id" uuid,
	"period_start" timestamp NOT NULL,
	"period_end" timestamp NOT NULL,
	"subscription_amount" numeric(10, 2) NOT NULL,
	"discount_amount" numeric(10, 2) DEFAULT '0.00' NOT NULL,
	"commission_percentage" numeric(5, 2) NOT NULL,
	"commission_amount" numeric(10, 2) NOT NULL,
	"currency" text DEFAULT 'USD' NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"payout_period_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ambassador_links" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ambassador_id" uuid NOT NULL,
	"code" text NOT NULL,
	"url" text NOT NULL,
	"campaign_name" text,
	"description" text,
	"click_count" integer DEFAULT 0 NOT NULL,
	"signup_count" integer DEFAULT 0 NOT NULL,
	"conversion_count" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ambassador_payouts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ambassador_id" uuid NOT NULL,
	"period_start" timestamp NOT NULL,
	"period_end" timestamp NOT NULL,
	"total_commissions" numeric(10, 2) DEFAULT '0.00' NOT NULL,
	"commission_count" integer DEFAULT 0 NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"payment_method" text,
	"payment_reference" text,
	"paid_at" timestamp,
	"paid_by" uuid,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ambassador_referrals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ambassador_id" uuid NOT NULL,
	"referred_user_id" uuid NOT NULL,
	"link_id" uuid,
	"referral_code" text NOT NULL,
	"signup_at" timestamp DEFAULT now() NOT NULL,
	"first_subscription_at" timestamp,
	"subscription_id" uuid,
	"total_commission_earned" numeric(10, 2) DEFAULT '0.00' NOT NULL,
	"commission_months_remaining" integer DEFAULT 6 NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ambassador_volume_tiers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tier_name" text NOT NULL,
	"min_referrals" integer NOT NULL,
	"discount_percentage" numeric(5, 2) NOT NULL,
	"commission_percentage" numeric(5, 2),
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "ambassador_volume_tiers_tier_name_unique" UNIQUE("tier_name")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ambassadors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"code" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"discount_percentage" numeric(5, 2) DEFAULT '20.00' NOT NULL,
	"commission_percentage" numeric(5, 2) DEFAULT '25.00' NOT NULL,
	"commission_duration_months" integer DEFAULT 6 NOT NULL,
	"total_referrals" integer DEFAULT 0 NOT NULL,
	"total_earnings" numeric(10, 2) DEFAULT '0.00' NOT NULL,
	"pending_earnings" numeric(10, 2) DEFAULT '0.00' NOT NULL,
	"paid_earnings" numeric(10, 2) DEFAULT '0.00' NOT NULL,
	"application_data" jsonb,
	"approved_by" uuid,
	"approved_at" timestamp,
	"rejected_reason" text,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "ambassadors_user_id_unique" UNIQUE("user_id"),
	CONSTRAINT "ambassadors_code_unique" UNIQUE("code")
);
--> statement-breakpoint
ALTER TABLE "credit_packages" ADD COLUMN "pricing_tier" text DEFAULT 'standard' NOT NULL;--> statement-breakpoint
ALTER TABLE "credit_packages" ADD COLUMN "price_per_credit" numeric(10, 2) DEFAULT '5.00' NOT NULL;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ambassador_commissions" ADD CONSTRAINT "ambassador_commissions_ambassador_id_ambassadors_id_fk" FOREIGN KEY ("ambassador_id") REFERENCES "public"."ambassadors"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ambassador_commissions" ADD CONSTRAINT "ambassador_commissions_referral_id_ambassador_referrals_id_fk" FOREIGN KEY ("referral_id") REFERENCES "public"."ambassador_referrals"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ambassador_commissions" ADD CONSTRAINT "ambassador_commissions_subscription_id_user_subscriptions_id_fk" FOREIGN KEY ("subscription_id") REFERENCES "public"."user_subscriptions"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ambassador_commissions" ADD CONSTRAINT "ambassador_commissions_payment_order_id_payment_orders_id_fk" FOREIGN KEY ("payment_order_id") REFERENCES "public"."payment_orders"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ambassador_commissions" ADD CONSTRAINT "ambassador_commissions_payout_period_id_ambassador_payouts_id_fk" FOREIGN KEY ("payout_period_id") REFERENCES "public"."ambassador_payouts"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ambassador_links" ADD CONSTRAINT "ambassador_links_ambassador_id_ambassadors_id_fk" FOREIGN KEY ("ambassador_id") REFERENCES "public"."ambassadors"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ambassador_payouts" ADD CONSTRAINT "ambassador_payouts_ambassador_id_ambassadors_id_fk" FOREIGN KEY ("ambassador_id") REFERENCES "public"."ambassadors"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ambassador_payouts" ADD CONSTRAINT "ambassador_payouts_paid_by_users_id_fk" FOREIGN KEY ("paid_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ambassador_referrals" ADD CONSTRAINT "ambassador_referrals_ambassador_id_ambassadors_id_fk" FOREIGN KEY ("ambassador_id") REFERENCES "public"."ambassadors"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ambassador_referrals" ADD CONSTRAINT "ambassador_referrals_referred_user_id_users_id_fk" FOREIGN KEY ("referred_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ambassador_referrals" ADD CONSTRAINT "ambassador_referrals_link_id_ambassador_links_id_fk" FOREIGN KEY ("link_id") REFERENCES "public"."ambassador_links"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ambassador_referrals" ADD CONSTRAINT "ambassador_referrals_subscription_id_user_subscriptions_id_fk" FOREIGN KEY ("subscription_id") REFERENCES "public"."user_subscriptions"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ambassadors" ADD CONSTRAINT "ambassadors_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ambassadors" ADD CONSTRAINT "ambassadors_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
