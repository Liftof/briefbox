-- Add new columns to generations table
ALTER TABLE "generations" ADD COLUMN IF NOT EXISTS "template_id" text;
ALTER TABLE "generations" ADD COLUMN IF NOT EXISTS "brand_name" text;
ALTER TABLE "generations" ADD COLUMN IF NOT EXISTS "folder_id" text;
ALTER TABLE "generations" ADD COLUMN IF NOT EXISTS "feedback" jsonb;

-- Make user_id NOT NULL (with default for existing rows)
UPDATE "generations" SET "user_id" = 'legacy_user' WHERE "user_id" IS NULL;
ALTER TABLE "generations" ALTER COLUMN "user_id" SET NOT NULL;

-- Create folders table
CREATE TABLE IF NOT EXISTS "folders" (
  "id" serial PRIMARY KEY,
  "external_id" text NOT NULL,
  "user_id" text NOT NULL,
  "name" text NOT NULL,
  "color" text DEFAULT '#6B7280',
  "created_at" timestamp DEFAULT now()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS "generations_user_id_idx" ON "generations" ("user_id");
CREATE INDEX IF NOT EXISTS "generations_folder_id_idx" ON "generations" ("folder_id");
CREATE INDEX IF NOT EXISTS "folders_user_id_idx" ON "folders" ("user_id");
CREATE INDEX IF NOT EXISTS "folders_external_id_idx" ON "folders" ("external_id");
