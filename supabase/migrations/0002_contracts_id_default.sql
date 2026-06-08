-- ============================================================
-- Add a default ID generator to public.contracts.id
--
-- Why: app code currently generates pcm-${Date.now()}-${rand} manually on
-- every insert. Adding a default means the DB can supply a UUID-format string
-- automatically if the caller omits the id column, which is the standard
-- Postgres pattern and removes a class of "forgot to set id" insert failures.
--
-- Existing rows are unaffected; the DEFAULT only fires on new inserts that
-- don't supply an explicit id value.
-- ============================================================

ALTER TABLE public.contracts
  ALTER COLUMN id SET DEFAULT gen_random_uuid()::text;
