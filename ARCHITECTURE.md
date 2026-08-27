# FitBite Architecture Documentation

> **Document Version:** 2.0.0 (Standard Full-Stack Architecture)  
> **Target Stack:** React (Vite) + Node.js (Express REST API) + PostgreSQL  
> **Status:** Architectural Reference (Provider-Independent)

---

## 1. High-Level Architectural Flow

```
┌─────────────────────────────────────────────────────────┐
│                     React Frontend                      │
│                  (Vite SPA Client)                      │
│   • UI Views, Routing, State Management & Interactivity │
└────────────────────────────┬────────────────────────────┘
                             │
                             │ HTTPS / REST (JSON + JWT Bearer Token)
                             ▼
┌─────────────────────────────────────────────────────────┐
│                    Express REST API                     │
│                  (Node.js Backend)                      │
│   • Auth & RBAC Middleware, Input Validation (Zod/Joi)  │
│   • Password Hashing (bcrypt / Argon2) & JWT Signing    │
│   • Canonical Pricing, Inventory, & Order Processing    │
└────────────────────────────┬────────────────────────────┘
                             │
                             │ PostgreSQL Client (pg / node-postgres)
                             ▼
┌─────────────────────────────────────────────────────────┐
│                   PostgreSQL Database                   │
│                    (Database Layer)                     │
│   • Normalized Relational Tables & Foreign Keys         │
│   • Check Constraints & Automatic Trigger Functions     │
└─────────────────────────────────────────────────────────┘
```

---

## 2. Layer Responsibilities

### 2.1 Frontend Layer (React + Vite)
- **Role:** Single Page Application (SPA) responsible for presentation, navigation, and user experience.
- **Key Responsibilities:**
  - Rendering responsive UI components using design tokens.
  - Client-side routing with `react-router-dom` (Public, Protected Customer, and Admin routes).
  - Managing application state (Auth, Cart, Wishlist, Notifications) with Context / Zustand.
  - Communicating with the Express backend via Axios / Fetch client with Bearer token authentication.
  - Form validation, error handling, and visual feedback for users.
- **Security Constraints:**
  - **Never perform canonical price or total calculations.**
  - **Never connect directly to the database.**
  - **Never receive database credentials, connection strings, or JWT secrets.**

### 2.2 Backend Layer (Node.js + Express)
- **Role:** Centralized API Gateway, authentication provider, business logic controller, and security boundary.
- **Key Responsibilities:**
  - **Authentication:** Managing user registration, password hashing (bcrypt), credential verification, and signing JSON Web Tokens (JWT).
  - **Authorization & RBAC:** Verifying JWT tokens on incoming requests, checking user roles (`customer` vs `admin`), and blocking unauthorized operations.
  - **Input Validation & Sanitization:** Validating all incoming payloads with Zod / Joi schemas.
  - **E-Commerce Business Rules:**
    - **Canonical Price Calculation:** Computing subtotal, shipping fees, discounts, and total cost on the server from authoritative product records.
    - **Inventory Verification:** Confirming stock levels before order creation and decrementing stock quantities atomically within database transactions.
    - **Order Lifecycle Management:** Managing transitions (`pending` → `confirmed` → `packed` → `shipped` → `delivered` → `cancelled`).
  - Standardized RESTful endpoints and centralized error handling middleware.

### 2.3 Database Layer (PostgreSQL)
- **Role:** Persistent, relational, ACID-compliant source of truth.
- **Key Responsibilities:**
  - Storing normalized entities (`users`, `profiles`, `categories`, `products`, `product_images`, `carts`, `cart_items`, `wishlists`, `wishlist_items`, `addresses`, `orders`, `order_items`, `reviews`).
  - Enforcing data integrity with primary keys, foreign keys, unique constraints, and check constraints.
  - Maintaining automated timestamps via PostgreSQL trigger functions (`set_updated_at()`).
  - Preserving immutable historical pricing records in `order_items` independent of future product catalog edits.

---

## 3. Authentication & Authorization Flow

### 3.1 Authentication Pipeline

```
React Client Form
       ↓ (POST /api/v1/auth/login with email & password)
Express Auth Controller
       ↓ (SELECT * FROM users WHERE email = $1)
PostgreSQL users Table
       ↓ (Returns user record with password_hash)
bcrypt.compare(plaintextPassword, password_hash)
       ↓ (If valid: sign JWT with payload { id, email, role })
Express Returns JWT Token + User Profile Info to Client
```

### 3.2 Authorization Pipeline (Protected Routes)

```
React Client Request
       ↓ (Headers: Authorization: Bearer <JWT>)
Express authenticateToken Middleware
       ↓ (jwt.verify(token, JWT_SECRET))
Extracted User Context: req.user = { id, email, role }
       ↓
Express requireAdmin Middleware (if admin route)
       ↓ (Check req.user.role === 'admin')
Controller / Service Execution
       ↓ (Execute PostgreSQL parameterized query)
Response Returned to Client
```

---

## 4. Separation of `users` vs. `profiles`

The database separates user authentication data (`users`) from display metadata (`profiles`):

```text
public.users (Authentication & Security)
├── id (UUID PK)
├── email (Unique Identifier)
├── password_hash (Bcrypt Hash)
├── role ('customer' | 'admin')
└── is_active (Account status)

public.profiles (Public / Display Metadata)
├── id (UUID PK, FK -> users.id)
├── full_name (Customer Name)
├── phone (Contact Number)
├── avatar_url (Profile Image)
└── bio (Personal description)
```

### Architectural Rationale:
1. **Principle of Least Privilege:** APIs that list customer reviews or public profiles only query `profiles` and never risk accidentally exposing `password_hash` or security flags.
2. **Auditability & Isolation:** Password changes, security status updates, and role modifications touch the `users` table, while profile changes touch `profiles`.
3. **Database Performance:** Keeps core authentication lookup rows compact and fast to index.

---

## 5. Customer vs. Admin Separation (RBAC)

| Capability / Resource | Customer Role | Admin Role | Enforced By |
|---|---|---|---|
| Browse Catalog & Search Products | Read Only | Read Only | Public Route |
| Manage Personal Cart & Wishlist | Read / Write Own | Read / Write Own | `authenticateToken` + User ID check |
| Manage Saved Addresses | Read / Write Own | Read / Write Own | `authenticateToken` + User ID check |
| Place Orders & View Personal History | Own Orders Only | All Store Orders | `authenticateToken` Service check |
| Track Live Order Status | Own Orders Only | All Orders | `authenticateToken` Service check |
| Create / Edit / Delete Products | **Forbidden (403)** | **Full Access** | `requireAdmin` Middleware |
| View All Customer Orders | **Forbidden (403)** | **Full Access** | `requireAdmin` Middleware |
| Update Order Fulfillment Status | **Forbidden (403)** | **Full Access** | `requireAdmin` Middleware |
| Store Metrics & Analytics | **Forbidden (403)** | **Full Access** | `requireAdmin` Middleware |

---

## 6. Credential Isolation & Environment Architecture

> [!IMPORTANT]
> **Database connection credentials (`DATABASE_URL`) and signing keys (`JWT_SECRET`) reside exclusively on the server.**

1. **Client Isolation:** The React frontend runs in the user's browser and only interacts with our Express REST API endpoints via HTTPS.
2. **Server Secrets:** `DATABASE_URL` and `JWT_SECRET` are read by Node.js from `backend/.env` (which is git-ignored).
3. **SQL Injection Defense:** All database queries in the backend use parameterized queries (`$1, $2, ...`) via `node-postgres` (`pg`), preventing SQL injection.

---

*This architecture document serves as the updated design reference for the provider-independent PostgreSQL + Express stack.*
