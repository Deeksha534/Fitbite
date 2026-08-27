-- ==============================================================================
-- Seed: 003_seed_sample_data.sql
-- Description: Sample development data and instructions for assigning the initial
--              administrator role in public.profiles.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. How to Elevate Your First User to Administrator
-- ------------------------------------------------------------------------------
-- After signing up with your email (e.g. admin@fitbite.com) in Supabase Auth,
-- run the following command in the Supabase SQL Editor to grant admin rights:
--
-- UPDATE public.profiles
-- SET role = 'admin'
-- WHERE email = 'YOUR_ADMIN_EMAIL@fitbite.com';
-- ------------------------------------------------------------------------------

-- ------------------------------------------------------------------------------
-- 2. Optional: Seed Initial Reviews (Matches Testimonials from Legacy index.html)
-- Note: Requires at least one user profile in public.profiles to link foreign key.
-- ------------------------------------------------------------------------------
DO $$
DECLARE
    first_user_id UUID;
BEGIN
    SELECT id INTO first_user_id FROM public.profiles LIMIT 1;

    IF first_user_id IS NOT NULL THEN
        -- Review 1 (Peanut Butter Fudge)
        INSERT INTO public.reviews (product_id, user_id, rating, title, comment, is_verified_purchase)
        VALUES (
            'p0000000-0000-0000-0000-000000000002',
            first_user_id,
            5,
            'Daily Marathon Training Addiction',
            'Finally, a protein bar that doesn''t taste like cardboard! The Peanut Butter Fudge is my daily go-to before morning long runs.',
            true
        )
        ON CONFLICT (product_id, user_id) DO NOTHING;

        -- Review 2 (Caramel Coffee)
        INSERT INTO public.reviews (product_id, user_id, rating, title, comment, is_verified_purchase)
        VALUES (
            'p0000000-0000-0000-0000-000000000004',
            first_user_id,
            5,
            'Perfect Workday Meal Replacement',
            'I use Caramel Coffee as a quick breakfast on busy workdays. Clean energy without the sugar crash. Highly recommend!',
            true
        )
        ON CONFLICT (product_id, user_id) DO NOTHING;
    END IF;
END $$;
