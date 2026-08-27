-- ==============================================================================
-- Migration: 002_create_profiles.sql
-- Description: Creates the profiles table extending auth.users with application
--              metadata and role-based authorization (customer vs admin).
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT,
    phone TEXT,
    role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'admin')),
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add descriptive comment for Supabase Studio and schema inspectors
COMMENT ON TABLE public.profiles IS 'User application profiles linked 1:1 with Supabase Auth users (auth.users).';
COMMENT ON COLUMN public.profiles.role IS 'Application role: customer (default) or admin. Cannot be modified by non-admin users.';
