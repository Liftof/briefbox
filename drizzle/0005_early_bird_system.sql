-- ============================================
-- EARLY BIRD SYSTEM
-- Limit auto-generation to first 30 signups/day
-- ============================================

-- Add early bird flag to users
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "is_early_bird" boolean DEFAULT false;

-- Track daily signup counts for early bird detection
CREATE TABLE IF NOT EXISTS "daily_signup_counts" (
  "id" serial PRIMARY KEY,
  "date" date NOT NULL UNIQUE,
  "count" integer NOT NULL DEFAULT 0,
  "created_at" timestamp DEFAULT now()
);

-- Index for fast date lookup
CREATE INDEX IF NOT EXISTS "daily_signup_counts_date_idx" ON "daily_signup_counts" ("date");

-- ============================================
-- UPDATE FREE CREDITS: 3 → 2
-- ============================================

-- Update default for new users
ALTER TABLE "users" ALTER COLUMN "credits_remaining" SET DEFAULT 2;

-- Note: Existing users keep their current credits
-- If you want to update existing free users to 2 credits:
-- UPDATE "users" SET "credits_remaining" = 2 WHERE "plan" = 'free' AND "credits_remaining" = 3;

-- ============================================
-- BATCH GENERATION QUEUE (for 24h reactivation)
-- ============================================

CREATE TABLE IF NOT EXISTS "batch_generation_queue" (
  "id" serial PRIMARY KEY,
  "user_id" text NOT NULL,
  "brand_id" integer REFERENCES "brands"("id"),
  "status" text NOT NULL DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
  "scheduled_for" timestamp NOT NULL, -- When to process (signup + 24h)
  "prompt" text,
  "result_url" text, -- Generated image URL
  "error" text,
  "created_at" timestamp DEFAULT now(),
  "processed_at" timestamp
);

CREATE INDEX IF NOT EXISTS "batch_queue_status_idx" ON "batch_generation_queue" ("status", "scheduled_for");
CREATE INDEX IF NOT EXISTS "batch_queue_user_idx" ON "batch_generation_queue" ("user_id");
