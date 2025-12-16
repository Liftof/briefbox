-- Add new brand fields for better pain points and language detection

ALTER TABLE brands ADD COLUMN IF NOT EXISTS detected_language TEXT;
ALTER TABLE brands ADD COLUMN IF NOT EXISTS target_audience TEXT;
ALTER TABLE brands ADD COLUMN IF NOT EXISTS unique_value_proposition TEXT;
ALTER TABLE brands ADD COLUMN IF NOT EXISTS brand_story TEXT;
ALTER TABLE brands ADD COLUMN IF NOT EXISTS editorial_hooks JSONB;
