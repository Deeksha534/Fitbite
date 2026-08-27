-- ==============================================================================
-- Migration: 009_create_orders_and_items.sql
-- Description: Creates the orders and order_items tables with normalized
--              relations, state lifecycle checks, and historical pricing snapshots.
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number VARCHAR(100) NOT NULL UNIQUE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
    shipping_address_id UUID REFERENCES public.addresses(id) ON DELETE SET NULL,
    shipping_address_snapshot JSONB NOT NULL,
    subtotal_amount NUMERIC(10, 2) NOT NULL CHECK (subtotal_amount >= 0),
    shipping_fee NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (shipping_fee >= 0),
    discount_amount NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (discount_amount >= 0),
    total_amount NUMERIC(10, 2) NOT NULL CHECK (total_amount >= 0),
    order_status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (
        order_status IN ('pending', 'confirmed', 'packed', 'shipped', 'delivered', 'cancelled')
    ),
    payment_status VARCHAR(50) NOT NULL DEFAULT 'unpaid' CHECK (
        payment_status IN ('unpaid', 'paid', 'failed', 'refunded')
    ),
    payment_method VARCHAR(50) NOT NULL CHECK (
        payment_method IN ('cod', 'card', 'upi')
    ),
    payment_reference_id VARCHAR(255),
    delivery_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.orders IS 'Store orders with financial totals, delivery snapshots, and status tracking.';
COMMENT ON COLUMN public.orders.shipping_address_snapshot IS 'Frozen JSON snapshot of delivery address at the exact moment of checkout.';
COMMENT ON COLUMN public.orders.order_status IS 'Controlled order lifecycle: pending -> confirmed -> packed -> shipped -> delivered (or cancelled).';

CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    product_name_snapshot VARCHAR(255) NOT NULL,
    product_flavor_snapshot VARCHAR(100),
    product_image_snapshot TEXT,
    unit_price_snapshot NUMERIC(10, 2) NOT NULL CHECK (unit_price_snapshot >= 0),
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    total_price NUMERIC(10, 2) NOT NULL CHECK (total_price >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.order_items IS 'Line items for orders preserving immutable historical unit prices, names, and images.';
