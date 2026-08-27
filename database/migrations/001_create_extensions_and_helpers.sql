-- ==============================================================================
-- Migration: 001_create_extensions_and_helpers.sql
-- Description: Enables required PostgreSQL extensions and creates reusable
--              helper functions (updated_at trigger function and is_admin check).
-- ==============================================================================

-- Enable UUID extension for generating UUIDv4 primary keys
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Generic function to automatically refresh updated_at timestamps on row modifications
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check whether a given user has the 'admin' role in public.profiles
-- Used inside Row Level Security (RLS) policies and security-definer triggers
CREATE OR REPLACE FUNCTION public.is_admin(check_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM public.profiles
        WHERE id = check_user_id
          AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;
