-- ==============================================================================
-- Migration: 002_create_users.sql
-- Description: Creates the core authentication users table in standard PostgreSQL.
--              Stores credentials (secure password hashes) and application roles.
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'admin')),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.users IS 'Core authentication table holding user credentials and security roles.';
COMMENT ON COLUMN public.users.password_hash IS 'Bcrypt / Argon2 cryptographic hash of the user password. Plaintext is never stored.';
COMMENT ON COLUMN public.users.role IS 'Authorization role: customer or admin.';
