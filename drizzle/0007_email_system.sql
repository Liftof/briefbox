-- ============================================
-- EMAIL SYSTEM
-- Scheduled transactional emails for Palette
-- ============================================

-- Table for scheduled emails
CREATE TABLE IF NOT EXISTS "scheduled_emails" (
  "id" serial PRIMARY KEY,
  "user_id" text NOT NULL,
  "user_email" text NOT NULL,
  "user_name" text,

  "email_type" text NOT NULL, -- 'welcome', 'engagement', 'conversion'
  "status" text NOT NULL DEFAULT 'pending', -- 'pending', 'sent', 'cancelled', 'failed'

  "scheduled_for" timestamp NOT NULL,
  "sent_at" timestamp,

  "metadata" jsonb,
  "error" text,
  "attempts" integer NOT NULL DEFAULT 0,

  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now()
);

-- Indexes for efficient cron processing
CREATE INDEX IF NOT EXISTS "scheduled_emails_status_time_idx"
  ON "scheduled_emails" ("status", "scheduled_for");
CREATE INDEX IF NOT EXISTS "scheduled_emails_user_idx"
  ON "scheduled_emails" ("user_id");
CREATE INDEX IF NOT EXISTS "scheduled_emails_type_status_idx"
  ON "scheduled_emails" ("email_type", "status");

-- Add email preferences to users table
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "email_unsubscribed" boolean DEFAULT false;
