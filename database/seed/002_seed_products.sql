-- ==============================================================================
-- Seed: 002_seed_products.sql
-- Description: Seeds the core FitBite protein bar catalog and gallery images
--              mapped directly from legacy HTML assets and nutritional facts.
-- ==============================================================================

-- 1. Insert Products
INSERT INTO public.products (
    id,
    category_id,
    name,
    slug,
    description,
    price,
    compare_at_price,
    stock_quantity,
    flavor,
    protein_grams,
    fiber_grams,
    sugar_grams,
    calories,
    is_featured,
    is_active
)
VALUES
    (
        'p0000000-0000-0000-0000-000000000001',
        'c0000000-0000-0000-0000-000000000001',
        'Chocolate Almond Crunch Bar',
        'chocolate-almond-crunch',
        'Rich dark chocolate protein bar packed with crunchy roasted California almonds and whey protein isolate. Designed for post-workout muscle repair and sustained clean energy.',
        120.00,
        150.00,
        150,
        'Chocolate Almond',
        20.0,
        4.0,
        2.5,
        210,
        true,
        true
    ),
    (
        'p0000000-0000-0000-0000-000000000002',
        'c0000000-0000-0000-0000-000000000001',
        'Peanut Butter Fudge Bar',
        'peanut-butter-fudge',
        'Creamy slow-roasted peanut butter fudge bar with zero added refined sugar and a touch of raw organic honey. High in healthy fats and leucine for optimal performance.',
        125.00,
        160.00,
        120,
        'Peanut Butter Fudge',
        22.0,
        3.5,
        1.8,
        225,
        true,
        true
    ),
    (
        'p0000000-0000-0000-0000-000000000003',
        'c0000000-0000-0000-0000-000000000001',
        'Berry Blast Bar',
        'berry-blast',
        'Refreshing antioxidant power bar crafted with real freeze-dried strawberries, blueberries, raspberries, and prebiotic dietary fiber.',
        110.00,
        140.00,
        180,
        'Wild Berry',
        18.0,
        5.0,
        3.0,
        195,
        true,
        true
    ),
    (
        'p0000000-0000-0000-0000-000000000004',
        'c0000000-0000-0000-0000-000000000001',
        'Caramel Coffee Delight Bar',
        'caramel-coffee-delight',
        'Arabica espresso infused protein bar layered with salted caramel crunch. Provides zero-crash morning alertness and guilt-free afternoon snacking.',
        130.00,
        170.00,
        95,
        'Caramel Coffee',
        20.0,
        4.0,
        2.0,
        215,
        true,
        true
    ),
    (
        'p0000000-0000-0000-0000-000000000005',
        'c0000000-0000-0000-0000-000000000002',
        'Summer Starter Pack (4-Bar Variety Bundle)',
        'summer-starter-pack',
        'The complete FitBite collection! Includes 1x Chocolate Almond, 1x Peanut Fudge, 1x Berry Blast, and 1x Caramel Coffee Delight at an exclusive 50% discount.',
        349.00,
        699.00,
        50,
        'Variety Pack',
        80.0,
        16.5,
        9.3,
        845,
        true,
        true
    )
ON CONFLICT (slug) DO UPDATE
SET name = EXCLUDED.name,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    compare_at_price = EXCLUDED.compare_at_price,
    stock_quantity = EXCLUDED.stock_quantity,
    flavor = EXCLUDED.flavor,
    protein_grams = EXCLUDED.protein_grams,
    fiber_grams = EXCLUDED.fiber_grams,
    sugar_grams = EXCLUDED.sugar_grams,
    calories = EXCLUDED.calories,
    is_featured = EXCLUDED.is_featured,
    is_active = EXCLUDED.is_active;

-- 2. Insert Gallery Images
INSERT INTO public.product_images (product_id, image_url, alt_text, display_order, is_primary)
VALUES
    ('p0000000-0000-0000-0000-000000000001', '/images/choco-almond.jpeg', 'Chocolate Almond Crunch Protein Bar wrapper and ingredients', 0, true),
    ('p0000000-0000-0000-0000-000000000002', '/images/peanut-fudge.jpeg', 'Peanut Butter Fudge Protein Bar wrapper and texture', 0, true),
    ('p0000000-0000-0000-0000-000000000003', '/images/berry-blast.jpeg', 'Berry Blast Antioxidant Protein Bar wrapper and berries', 0, true),
    ('p0000000-0000-0000-0000-000000000004', '/images/caramel-coffee.jpeg', 'Caramel Coffee Delight Protein Bar wrapper and coffee beans', 0, true),
    ('p0000000-0000-0000-0000-000000000005', '/images/protein-combo.jpeg', 'FitBite Summer Starter Pack Multi-Flavor Protein Bar Bundle', 0, true)
ON CONFLICT DO NOTHING;
