-- ==============================================================================
-- Migration: 001_create_extensions_and_helpers.sql
-- Description: Enables standard PostgreSQL extensions (uuid-ossp, pgcrypto)
--              and creates the reusable updated_at timestamp trigger function.
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
$$ LANGUAGE plpgsql;
