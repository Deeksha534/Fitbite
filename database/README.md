# FitBite Database Architecture & Schema Documentation

> **Database Engine:** Standard PostgreSQL 14+ (Provider-Independent)  
> **Schema Version:** 2.1.0 (Standard PostgreSQL + Express REST Architecture)  
> **Status:** Local Schema Definition & Migration Catalog (Phase 2)

---

## 1. Entity Relationship Diagram (ERD)

```mermaid
erDiagram
    USERS ||--o| PROFILES : "1:1 on users(id)"
    USERS ||--o{ ADDRESSES : "has many"
    USERS ||--o| CARTS : "owns 1"
    USERS ||--o| WISHLISTS : "owns 1"
    USERS ||--o{ ORDERS : "places many"
    USERS ||--o{ REVIEWS : "authors many"

    CATEGORIES ||--o{ PRODUCTS : "categorizes"
    PRODUCTS ||--o{ PRODUCT_IMAGES : "has gallery"
    PRODUCTS ||--o{ CART_ITEMS : "in cart"
    PRODUCTS ||--o{ WISHLIST_ITEMS : "in wishlist"
    PRODUCTS ||--o{ ORDER_ITEMS : "ordered as"
    PRODUCTS ||--o{ REVIEWS : "receives"

    CARTS ||--o{ CART_ITEMS : "contains"
    WISHLISTS ||--o{ WISHLIST_ITEMS : "contains"

    ORDERS ||--o{ ORDER_ITEMS : "contains"
    ADDRESSES ||--o{ ORDERS : "delivered to"

    USERS {
        uuid id PK
        varchar email UK
        varchar password_hash
        varchar role "customer | admin"
        boolean is_active
        timestamptz created_at
        timestamptz updated_at
    }

    PROFILES {
        uuid id PK "FK users(id)"
        varchar full_name
        varchar phone
        text avatar_url
        text bio
        timestamptz created_at
        timestamptz updated_at
    }

    CATEGORIES {
        uuid id PK
        varchar name UK
        varchar slug UK
        text description
        text image_url
        boolean is_active
        timestamptz created_at
        timestamptz updated_at
    }

    PRODUCTS {
        uuid id PK
        uuid category_id FK
        varchar name
        varchar slug UK
        text description
        numeric price
        numeric compare_at_price
        integer stock_quantity
        varchar flavor
        numeric protein_grams
        numeric fiber_grams
        numeric sugar_grams
        integer calories
        boolean is_featured
        boolean is_active
        timestamptz created_at
        timestamptz updated_at
    }

    PRODUCT_IMAGES {
        uuid id PK
        uuid product_id FK
        text image_url
        varchar alt_text
        integer display_order
        boolean is_primary
        timestamptz created_at
    }

    CARTS {
        uuid id PK
        uuid user_id FK,UK
        timestamptz created_at
        timestamptz updated_at
    }

    CART_ITEMS {
        uuid id PK
        uuid cart_id FK
        uuid product_id FK
        integer quantity
        timestamptz created_at
        timestamptz updated_at
    }

    WISHLISTS {
        uuid id PK
        uuid user_id FK,UK
        timestamptz created_at
        timestamptz updated_at
    }

    WISHLIST_ITEMS {
        uuid id PK
        uuid wishlist_id FK
        uuid product_id FK
        timestamptz created_at
    }

    ADDRESSES {
        uuid id PK
        uuid user_id FK
        varchar full_name
        varchar phone
        text street_address
        varchar apartment
        varchar city
        varchar state
        varchar postal_code
        varchar country
        boolean is_default
        timestamptz created_at
        timestamptz updated_at
    }

    ORDERS {
        uuid id PK
        varchar order_number UK
        uuid user_id FK
        uuid shipping_address_id FK
        jsonb shipping_address_snapshot
        numeric subtotal_amount
        numeric shipping_fee
        numeric discount_amount
        numeric total_amount
        varchar order_status
        varchar payment_status
        varchar payment_method
        varchar payment_reference_id
        text delivery_notes
        timestamptz created_at
        timestamptz updated_at
    }

    ORDER_ITEMS {
        uuid id PK
        uuid order_id FK
        uuid product_id FK
        varchar product_name_snapshot
        varchar product_flavor_snapshot
        text product_image_snapshot
        numeric unit_price_snapshot
        integer quantity
        numeric total_price
        timestamptz created_at
    }

    REVIEWS {
        uuid id PK
        uuid product_id FK
        uuid user_id FK
        integer rating "1-5"
        varchar title
        text comment
        boolean is_verified_purchase
        timestamptz created_at
        timestamptz updated_at
    }
```

---

## 2. Table Specifications & Constraints Matrix

| Table Name | Primary Key | Foreign Keys & Actions | Key Constraints |
|---|---|---|---|
| **`users`** | `id` (UUID) | None | `UNIQUE(email)`, `CHECK (role IN ('customer', 'admin'))`, `is_active` |
| **`profiles`** | `id` (UUID) | `id -> users(id)` `ON DELETE CASCADE` | 1:1 user profile metadata |
| **`categories`** | `id` (UUID) | None | `UNIQUE(name)`, `UNIQUE(slug)` |
| **`products`** | `id` (UUID) | `category_id -> categories(id)` `ON DELETE SET NULL` | `UNIQUE(slug)`, `CHECK(price >= 0)`, `CHECK(compare_at_price >= price)`, `CHECK(stock_quantity >= 0)` |
| **`product_images`** | `id` (UUID) | `product_id -> products(id)` `ON DELETE CASCADE` | None |
| **`carts`** | `id` (UUID) | `user_id -> users(id)` `ON DELETE CASCADE` | `UNIQUE(user_id)` (1 cart per user) |
| **`cart_items`** | `id` (UUID) | `cart_id -> carts(id)` `ON DELETE CASCADE`, `product_id -> products(id)` `ON DELETE CASCADE` | `UNIQUE(cart_id, product_id)`, `CHECK(quantity > 0)` |
| **`wishlists`** | `id` (UUID) | `user_id -> users(id)` `ON DELETE CASCADE` | `UNIQUE(user_id)` (1 wishlist per user) |
| **`wishlist_items`** | `id` (UUID) | `wishlist_id -> wishlists(id)` `ON DELETE CASCADE`, `product_id -> products(id)` `ON DELETE CASCADE` | `UNIQUE(wishlist_id, product_id)` |
| **`addresses`** | `id` (UUID) | `user_id -> users(id)` `ON DELETE CASCADE` | Single default address enforced via trigger |
| **`orders`** | `id` (UUID) | `user_id -> users(id)` `ON DELETE RESTRICT`, `shipping_address_id -> addresses(id)` `ON DELETE SET NULL` | `UNIQUE(order_number)`, `CHECK(order_status IN ('pending', 'confirmed', 'packed', 'shipped', 'delivered', 'cancelled'))`, `CHECK(payment_status IN ('unpaid', 'paid', 'failed', 'refunded'))`, `CHECK(payment_method IN ('cod', 'card', 'upi'))` |
| **`order_items`** | `id` (UUID) | `order_id -> orders(id)` `ON DELETE CASCADE`, `product_id -> products(id)` `ON DELETE SET NULL` | `CHECK(quantity > 0)`, `CHECK(unit_price_snapshot >= 0)` |
| **`reviews`** | `id` (UUID) | `product_id -> products(id)` `ON DELETE CASCADE`, `user_id -> users(id)` `ON DELETE CASCADE` | `UNIQUE(product_id, user_id)` (1 review per product per user), `CHECK(rating BETWEEN 1 AND 5)` |

---

## 3. Historical Pricing & Snapshot Architecture

### Why Snapshot Columns are Essential in E-Commerce
In a naive schema, order items join live against the `products` and `addresses` tables. This causes critical business errors:
1. **Price Alteration Bug:** If an item is purchased for ₹120 and the store later increases the price to ₹150, re-rendering an old receipt dynamically from `products.price` would incorrectly display ₹150.
2. **Product Deletion/Renaming Bug:** If a flavor is renamed or discontinued, old invoices break or become unreadable.
3. **Address Drift:** If a customer moves and updates their saved address, past deliveries would show the wrong historical destination.

### FitBite Snapshot Implementation
- **`orders.shipping_address_snapshot` (`jsonb`):** Freezes the exact full name, phone number, street address, city, state, and postal code at the instant of order placement.
- **`order_items.unit_price_snapshot` (`numeric`):** Freezes the exact unit cost paid.
- **`order_items.product_name_snapshot` (`varchar`):** Freezes the exact product title.
- **`order_items.product_flavor_snapshot` (`varchar`):** Freezes the exact flavor variation.
- **`order_items.product_image_snapshot` (`text`):** Freezes the product thumbnail for customer invoice rendering.

---

## 4. Controlled Order Lifecycle

```mermaid
stateDiagram-v2
    [*] --> pending : Customer Places Order

    pending --> confirmed : Payment Verified / COD Accepted
    pending --> cancelled : Customer / Admin Cancels

    confirmed --> packed : Warehouse Dispatches to Packing
    confirmed --> cancelled : Stock Discrepancy / Admin Cancels

    packed --> shipped : Handed to Courier (Tracking Number Assigned)

    shipped --> delivered : Delivered to Customer Destination

    delivered --> [*]
    cancelled --> [*]
```

---

## 5. Security & Authorization Architecture

### Standard Backend Authentication & Authorization Model
Rather than relying on proprietary database-level RLS, authorization is enforced in the **Node.js / Express** application layer:

```
Incoming Request
      ↓
authenticateToken Middleware (Verifies JWT via JWT_SECRET)
      ↓ (Sets req.user = { id, email, role })
requireAdmin Middleware (If route is admin-only; checks role === 'admin')
      ↓
Controller / Service Layer (Queries PostgreSQL with Parameterized SQL)
      ↓
PostgreSQL Returns Authoritative Data
```

---

## 6. Migration Execution Order

When running migrations against standard PostgreSQL, execute files in sequential numerical order:

```text
database/migrations/
├── 001_create_extensions_and_helpers.sql   # uuid-ossp, pgcrypto, set_updated_at()
├── 002_create_users.sql                    # users authentication credentials table
├── 003_create_profiles.sql                 # profiles linked to users(id)
├── 004_create_categories.sql               # categories
├── 005_create_products_and_images.sql      # products & product_images
├── 006_create_carts_and_items.sql          # carts & cart_items
├── 007_create_wishlists_and_items.sql      # wishlists & wishlist_items
├── 008_create_addresses.sql                # customer shipping addresses
├── 009_create_orders_and_items.sql         # orders & immutable order_items
├── 010_create_reviews.sql                  # customer reviews & ratings
├── 011_create_triggers.sql                 # default address handler, updated_at maintenance
└── 012_create_indexes.sql                  # Performance B-tree indexes
```

### Seed Data Execution Order

```text
database/seed/
├── 001_seed_categories.sql                 # Core product categories
├── 002_seed_products.sql                   # 4 core bars + Summer Starter Pack + images
└── 003_seed_sample_data.sql                # Dev test users (admin + customer) & reviews
```

---

*End of Database Documentation.*
