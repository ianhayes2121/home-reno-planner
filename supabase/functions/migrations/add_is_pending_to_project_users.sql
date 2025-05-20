
-- Add is_pending column to project_users table to track invitation status
ALTER TABLE public.project_users ADD COLUMN IF NOT EXISTS is_pending BOOLEAN NOT NULL DEFAULT FALSE;
