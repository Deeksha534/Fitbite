-- ==============================================================================
-- Migration: 003_create_profiles.sql
-- Description: Creates the profiles table holding customer/admin display metadata,
--              separated cleanly from sensitive authentication credentials.
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
    full_name VARCHAR(255),
    phone VARCHAR(50),
    avatar_url TEXT,
    bio TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.profiles IS 'User profile metadata linked 1:1 with users. Keeps personal/display info decoupled from auth credentials.';
