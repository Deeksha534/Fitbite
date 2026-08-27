-- ==============================================================================
-- Migration: 005_create_products_and_images.sql
-- Description: Creates the products catalog table and product_images gallery table.
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
    compare_at_price NUMERIC(10, 2) CHECK (compare_at_price >= price),
    stock_quantity INTEGER NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
    flavor VARCHAR(100),
    protein_grams NUMERIC(5, 1) NOT NULL DEFAULT 0 CHECK (protein_grams >= 0),
    fiber_grams NUMERIC(5, 1) NOT NULL DEFAULT 0 CHECK (fiber_grams >= 0),
    sugar_grams NUMERIC(5, 1) NOT NULL DEFAULT 0 CHECK (sugar_grams >= 0),
    calories INTEGER NOT NULL DEFAULT 0 CHECK (calories >= 0),
    is_featured BOOLEAN NOT NULL DEFAULT false,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.products IS 'Core catalog of protein bars, nutritional supplements, and packs.';

CREATE TABLE IF NOT EXISTS public.product_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    alt_text VARCHAR(255),
    display_order INTEGER NOT NULL DEFAULT 0,
    is_primary BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.product_images IS 'Gallery images for products with display order and primary thumbnail flag.';
