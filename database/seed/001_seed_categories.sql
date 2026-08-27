-- ==============================================================================
-- Seed: 001_seed_categories.sql
-- Description: Inserts foundational product categories for FitBite.
-- ==============================================================================

INSERT INTO public.categories (id, name, slug, description, is_active)
VALUES
    ('c0000000-0000-0000-0000-000000000001', 'Protein Bars', 'protein-bars', 'High-protein snack bars designed for workout recovery and daily nutrition.', true),
    ('c0000000-0000-0000-0000-000000000002', 'Starter Packs & Bundles', 'starter-packs', 'Value bundles and multi-flavor starter packs for fitness enthusiasts.', true),
    ('c0000000-0000-0000-0000-000000000003', 'Energy Bites', 'energy-bites', 'Pre-workout bite-sized energy boosters made with wholesome natural ingredients.', true),
    ('c0000000-0000-0000-0000-000000000004', 'Vegan Series', 'vegan-series', '100% plant-powered, dairy-free, and gluten-free protein bars.', true)
ON CONFLICT (slug) DO UPDATE
SET name = EXCLUDED.name,
    description = EXCLUDED.description,
    is_active = EXCLUDED.is_active;
