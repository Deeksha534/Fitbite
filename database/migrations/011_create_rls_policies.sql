-- ==============================================================================
-- Migration: 011_create_rls_policies.sql
-- Description: Enables Row Level Security (RLS) across all tables and establishes
--              granular policies for Customers, Public browsing, and Administrators.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. Enable RLS on All Tables
-- ------------------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- 2. Profiles Policies
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can read own profile or admin reads all" ON public.profiles;
CREATE POLICY "Users can read own profile or admin reads all"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id OR public.is_admin());

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id OR public.is_admin())
    WITH CHECK (auth.uid() = id OR public.is_admin());

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile"
    ON public.profiles FOR INSERT
    WITH CHECK (auth.uid() = id OR auth.uid() IS NULL);

-- ------------------------------------------------------------------------------
-- 3. Categories Policies
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Public can view active categories" ON public.categories;
CREATE POLICY "Public can view active categories"
    ON public.categories FOR SELECT
    USING (is_active = true OR public.is_admin());

DROP POLICY IF EXISTS "Admins can manage categories" ON public.categories;
CREATE POLICY "Admins can manage categories"
    ON public.categories FOR ALL
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- ------------------------------------------------------------------------------
-- 4. Products & Product Images Policies
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Public can view active products" ON public.products;
CREATE POLICY "Public can view active products"
    ON public.products FOR SELECT
    USING (is_active = true OR public.is_admin());

DROP POLICY IF EXISTS "Admins can manage products" ON public.products;
CREATE POLICY "Admins can manage products"
    ON public.products FOR ALL
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Public can view product images" ON public.product_images;
CREATE POLICY "Public can view product images"
    ON public.product_images FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Admins can manage product images" ON public.product_images;
CREATE POLICY "Admins can manage product images"
    ON public.product_images FOR ALL
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- ------------------------------------------------------------------------------
-- 5. Carts & Cart Items Policies
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can access own cart" ON public.carts;
CREATE POLICY "Users can access own cart"
    ON public.carts FOR ALL
    USING (user_id = auth.uid() OR public.is_admin())
    WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can view own cart items" ON public.cart_items;
CREATE POLICY "Users can view own cart items"
    ON public.cart_items FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM public.carts
        WHERE carts.id = cart_items.cart_id
          AND (carts.user_id = auth.uid() OR public.is_admin())
    ));

DROP POLICY IF EXISTS "Users can insert own cart items" ON public.cart_items;
CREATE POLICY "Users can insert own cart items"
    ON public.cart_items FOR INSERT
    WITH CHECK (EXISTS (
        SELECT 1 FROM public.carts
        WHERE carts.id = cart_items.cart_id
          AND carts.user_id = auth.uid()
    ));

DROP POLICY IF EXISTS "Users can update own cart items" ON public.cart_items;
CREATE POLICY "Users can update own cart items"
    ON public.cart_items FOR UPDATE
    USING (EXISTS (
        SELECT 1 FROM public.carts
        WHERE carts.id = cart_items.cart_id
          AND carts.user_id = auth.uid()
    ))
    WITH CHECK (EXISTS (
        SELECT 1 FROM public.carts
        WHERE carts.id = cart_items.cart_id
          AND carts.user_id = auth.uid()
    ));

DROP POLICY IF EXISTS "Users can delete own cart items" ON public.cart_items;
CREATE POLICY "Users can delete own cart items"
    ON public.cart_items FOR DELETE
    USING (EXISTS (
        SELECT 1 FROM public.carts
        WHERE carts.id = cart_items.cart_id
          AND carts.user_id = auth.uid()
    ));

-- ------------------------------------------------------------------------------
-- 6. Wishlists & Wishlist Items Policies
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can access own wishlist" ON public.wishlists;
CREATE POLICY "Users can access own wishlist"
    ON public.wishlists FOR ALL
    USING (user_id = auth.uid() OR public.is_admin())
    WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can view own wishlist items" ON public.wishlist_items;
CREATE POLICY "Users can view own wishlist items"
    ON public.wishlist_items FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM public.wishlists
        WHERE wishlists.id = wishlist_items.wishlist_id
          AND (wishlists.user_id = auth.uid() OR public.is_admin())
    ));

DROP POLICY IF EXISTS "Users can insert own wishlist items" ON public.wishlist_items;
CREATE POLICY "Users can insert own wishlist items"
    ON public.wishlist_items FOR INSERT
    WITH CHECK (EXISTS (
        SELECT 1 FROM public.wishlists
        WHERE wishlists.id = wishlist_items.wishlist_id
          AND wishlists.user_id = auth.uid()
    ));

DROP POLICY IF EXISTS "Users can delete own wishlist items" ON public.wishlist_items;
CREATE POLICY "Users can delete own wishlist items"
    ON public.wishlist_items FOR DELETE
    USING (EXISTS (
        SELECT 1 FROM public.wishlists
        WHERE wishlists.id = wishlist_items.wishlist_id
          AND wishlists.user_id = auth.uid()
    ));

-- ------------------------------------------------------------------------------
-- 7. Addresses Policies
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view own addresses" ON public.addresses;
CREATE POLICY "Users can view own addresses"
    ON public.addresses FOR SELECT
    USING (user_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "Users can insert own addresses" ON public.addresses;
CREATE POLICY "Users can insert own addresses"
    ON public.addresses FOR INSERT
    WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own addresses" ON public.addresses;
CREATE POLICY "Users can update own addresses"
    ON public.addresses FOR UPDATE
    USING (user_id = auth.uid() OR public.is_admin())
    WITH CHECK (user_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "Users can delete own addresses" ON public.addresses;
CREATE POLICY "Users can delete own addresses"
    ON public.addresses FOR DELETE
    USING (user_id = auth.uid() OR public.is_admin());

-- ------------------------------------------------------------------------------
-- 8. Orders & Order Items Policies
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view own orders or admin views all" ON public.orders;
CREATE POLICY "Users can view own orders or admin views all"
    ON public.orders FOR SELECT
    USING (user_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "Users can create own orders" ON public.orders;
CREATE POLICY "Users can create own orders"
    ON public.orders FOR INSERT
    WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins can update orders or users cancel pending" ON public.orders;
CREATE POLICY "Admins can update orders or users cancel pending"
    ON public.orders FOR UPDATE
    USING (
        public.is_admin() OR 
        (user_id = auth.uid() AND order_status = 'pending')
    )
    WITH CHECK (
        public.is_admin() OR 
        (user_id = auth.uid() AND order_status = 'cancelled')
    );

DROP POLICY IF EXISTS "Users can view own order items" ON public.order_items;
CREATE POLICY "Users can view own order items"
    ON public.order_items FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM public.orders
        WHERE orders.id = order_items.order_id
          AND (orders.user_id = auth.uid() OR public.is_admin())
    ));

DROP POLICY IF EXISTS "Users can insert own order items" ON public.order_items;
CREATE POLICY "Users can insert own order items"
    ON public.order_items FOR INSERT
    WITH CHECK (EXISTS (
        SELECT 1 FROM public.orders
        WHERE orders.id = order_items.order_id
          AND orders.user_id = auth.uid()
    ));

-- ------------------------------------------------------------------------------
-- 9. Reviews Policies
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Public can view reviews" ON public.reviews;
CREATE POLICY "Public can view reviews"
    ON public.reviews FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Authenticated users can create reviews" ON public.reviews;
CREATE POLICY "Authenticated users can create reviews"
    ON public.reviews FOR INSERT
    WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own reviews" ON public.reviews;
CREATE POLICY "Users can update own reviews"
    ON public.reviews FOR UPDATE
    USING (user_id = auth.uid() OR public.is_admin())
    WITH CHECK (user_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "Users can delete own reviews or admin moderates" ON public.reviews;
CREATE POLICY "Users can delete own reviews or admin moderates"
    ON public.reviews FOR DELETE
    USING (user_id = auth.uid() OR public.is_admin());
