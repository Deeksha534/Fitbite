-- ==============================================================================
-- Seed: 003_seed_sample_data.sql
-- Description: Inserts development seed data for local testing in standard PostgreSQL:
--              sample test users (admin and customer), profiles, and customer reviews.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. Development Test Users
-- Note: Passwords below are dummy bcrypt hashes for local development testing only.
-- Dev password for these sample accounts: "FitBite123!"
-- ------------------------------------------------------------------------------
INSERT INTO public.users (id, email, password_hash, role, is_active)
VALUES
    (
        'u0000000-0000-0000-0000-000000000001',
        'admin@fitbite.com',
        '$2a$12$K8yI5qL8uB2m1U6rC4.n5eV7aB0k1c9h3p2w5j4v8x7z6y5x4w3v2',
        'admin',
        true
    ),
    (
        'u0000000-0000-0000-0000-000000000002',
        'customer@fitbite.com',
        '$2a$12$K8yI5qL8uB2m1U6rC4.n5eV7aB0k1c9h3p2w5j4v8x7z6y5x4w3v2',
        'customer',
        true
    )
ON CONFLICT (email) DO UPDATE
SET role = EXCLUDED.role,
    is_active = EXCLUDED.is_active;

-- ------------------------------------------------------------------------------
-- 2. User Profiles
-- ------------------------------------------------------------------------------
INSERT INTO public.profiles (id, full_name, phone, avatar_url, bio)
VALUES
    (
        'u0000000-0000-0000-0000-000000000001',
        'FitBite Store Administrator',
        '+91 98765 00001',
        NULL,
        'Head of Store Operations and Nutrition Catalog Management'
    ),
    (
        'u0000000-0000-0000-0000-000000000002',
        'Sarah Jenkins',
        '+91 98765 00002',
        NULL,
        'Fitness enthusiast and marathon runner'
    )
ON CONFLICT (id) DO UPDATE
SET full_name = EXCLUDED.full_name,
    phone = EXCLUDED.phone;

-- ------------------------------------------------------------------------------
-- 3. Initialize Carts & Wishlists for Dev Users
-- ------------------------------------------------------------------------------
INSERT INTO public.carts (user_id)
VALUES
    ('u0000000-0000-0000-0000-000000000001'),
    ('u0000000-0000-0000-0000-000000000002')
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO public.wishlists (user_id)
VALUES
    ('u0000000-0000-0000-0000-000000000001'),
    ('u0000000-0000-0000-0000-000000000002')
ON CONFLICT (user_id) DO NOTHING;

-- ------------------------------------------------------------------------------
-- 4. Sample Verified Customer Reviews (Matches Testimonials from Legacy App)
-- ------------------------------------------------------------------------------
INSERT INTO public.reviews (product_id, user_id, rating, title, comment, is_verified_purchase)
VALUES
    (
        'p0000000-0000-0000-0000-000000000002',
        'u0000000-0000-0000-0000-000000000002',
        5,
        'Daily Marathon Training Addiction',
        'Finally, a protein bar that does not taste like cardboard! The Peanut Butter Fudge is my daily addiction before morning long runs.',
        true
    ),
    (
        'p0000000-0000-0000-0000-000000000004',
        'u0000000-0000-0000-0000-000000000002',
        5,
        'Perfect Workday Meal Replacement',
        'I use Caramel Coffee as a perfect meal replacement on busy workdays. Highly recommend for nutrition and delicious espresso taste.',
        true
    )
ON CONFLICT (product_id, user_id) DO UPDATE
SET rating = EXCLUDED.rating,
    title = EXCLUDED.title,
    comment = EXCLUDED.comment;
