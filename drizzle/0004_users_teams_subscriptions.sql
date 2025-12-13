-- ============================================
-- USERS TABLE (extends Clerk data)
-- ============================================
CREATE TABLE IF NOT EXISTS "users" (
  "id" serial PRIMARY KEY,
  "clerk_id" text NOT NULL UNIQUE,
  "email" text NOT NULL,
  "name" text,
  "avatar_url" text,
  
  -- Subscription
  "plan" text NOT NULL DEFAULT 'free',
  "credits_remaining" integer NOT NULL DEFAULT 3,
  "credits_reset_at" timestamp,
  
  -- Stripe
  "stripe_customer_id" text,
  "stripe_subscription_id" text,
  "stripe_price_id" text,
  "stripe_current_period_end" timestamp,
  
  -- Team
  "team_id" integer,
  
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now()
);

-- ============================================
-- TEAMS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS "teams" (
  "id" serial PRIMARY KEY,
  "name" text NOT NULL,
  "owner_id" text NOT NULL,
  
  -- Credits pool
  "credits_pool" integer NOT NULL DEFAULT 150,
  "credits_reset_at" timestamp,
  
  -- Stripe
  "stripe_customer_id" text,
  "stripe_subscription_id" text,
  
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now()
);

-- ============================================
-- TEAM MEMBERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS "team_members" (
  "id" serial PRIMARY KEY,
  "team_id" integer NOT NULL REFERENCES "teams"("id") ON DELETE CASCADE,
  "user_id" text NOT NULL,
  "role" text NOT NULL DEFAULT 'member',
  
  -- Invitation
  "invited_by" text,
  "invited_at" timestamp DEFAULT now(),
  "accepted_at" timestamp,
  
  "created_at" timestamp DEFAULT now()
);

-- ============================================
-- ADD team_id TO BRANDS
-- ============================================
ALTER TABLE "brands" ADD COLUMN IF NOT EXISTS "team_id" integer REFERENCES "teams"("id");

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS "users_clerk_id_idx" ON "users" ("clerk_id");
CREATE INDEX IF NOT EXISTS "users_stripe_customer_id_idx" ON "users" ("stripe_customer_id");
CREATE INDEX IF NOT EXISTS "users_team_id_idx" ON "users" ("team_id");
CREATE INDEX IF NOT EXISTS "teams_owner_id_idx" ON "teams" ("owner_id");
CREATE INDEX IF NOT EXISTS "team_members_team_id_idx" ON "team_members" ("team_id");
CREATE INDEX IF NOT EXISTS "team_members_user_id_idx" ON "team_members" ("user_id");
CREATE INDEX IF NOT EXISTS "brands_team_id_idx" ON "brands" ("team_id");
