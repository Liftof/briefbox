CREATE TABLE "brands" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text,
	"name" text NOT NULL,
	"url" text NOT NULL,
	"tagline" text,
	"description" text,
	"industry" text,
	"logo" text,
	"colors" jsonb,
	"fonts" jsonb,
	"aesthetic" jsonb,
	"tone_voice" jsonb,
	"values" jsonb,
	"features" jsonb,
	"services" jsonb,
	"key_points" jsonb,
	"visual_motifs" jsonb,
	"marketing_angles" jsonb,
	"background_prompts" jsonb,
	"labeled_images" jsonb,
	"backgrounds" jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "campaigns" (
	"id" serial PRIMARY KEY NOT NULL,
	"brand_id" serial NOT NULL,
	"user_id" text,
	"name" text NOT NULL,
	"description" text,
	"status" text DEFAULT 'active',
	"start_date" timestamp,
	"end_date" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "generations" (
	"id" serial PRIMARY KEY NOT NULL,
	"brand_id" serial NOT NULL,
	"campaign_id" serial NOT NULL,
	"user_id" text,
	"type" text,
	"prompt" text,
	"image_url" text NOT NULL,
	"format" text,
	"liked" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "posts" (
	"id" serial PRIMARY KEY NOT NULL,
	"brand_id" serial NOT NULL,
	"campaign_id" serial NOT NULL,
	"user_id" text,
	"content" text,
	"media_url" text NOT NULL,
	"platform" text,
	"scheduled_date" timestamp,
	"status" text DEFAULT 'draft',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "generations" ADD CONSTRAINT "generations_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "generations" ADD CONSTRAINT "generations_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "posts" ADD CONSTRAINT "posts_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "posts" ADD CONSTRAINT "posts_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE no action ON UPDATE no action;