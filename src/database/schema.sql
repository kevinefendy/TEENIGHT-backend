
-- ==========================================
-- 1. USERS
-- ==========================================

CREATE TABLE IF NOT EXISTS users (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    address TEXT,

    role VARCHAR(20) NOT NULL DEFAULT 'customer'
        CHECK (role IN ('admin', 'cashier', 'customer')),

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- 2. COLLECTIONS
-- ==========================================

CREATE TABLE IF NOT EXISTS collections (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- 3. PRODUCTS
-- ==========================================

CREATE TABLE IF NOT EXISTS products (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    collection_id INTEGER NOT NULL
        REFERENCES collections(id),

    name VARCHAR(150) NOT NULL,
    description TEXT,
    price NUMERIC(12,2) NOT NULL CHECK (price >= 0),

    order_type VARCHAR(20) NOT NULL
        CHECK (order_type IN ('ready_stock', 'pre_order')),

    po_duration_days INTEGER
        CHECK (po_duration_days IS NULL OR po_duration_days > 0),

    image_url TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- 4. PRODUCT VARIANTS
-- ==========================================

CREATE TABLE IF NOT EXISTS product_variants (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    product_id INTEGER NOT NULL
        REFERENCES products(id),

    size VARCHAR(5) NOT NULL
        CHECK (size IN ('S', 'M', 'L', 'XL')),

    stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),

    UNIQUE (product_id, size)
);

-- ==========================================
-- 5. ORDERS
-- ==========================================

CREATE TABLE IF NOT EXISTS orders (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    user_id INTEGER NOT NULL
        REFERENCES users(id),

    total_price NUMERIC(12,2) NOT NULL
        CHECK (total_price >= 0),

    shipping_address TEXT NOT NULL,
    payment_proof_url TEXT,
    tracking_number VARCHAR(100),

    status VARCHAR(20) NOT NULL DEFAULT 'pending'
        CHECK (
            status IN (
                'pending',
                'paid',
                'shipped',
                'completed',
                'cancelled'
            )
        ),

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- 6. ORDER ITEMS
-- ==========================================

CREATE TABLE IF NOT EXISTS order_items (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    order_id INTEGER NOT NULL
        REFERENCES orders(id) ON DELETE CASCADE,

    product_variant_id INTEGER NOT NULL
        REFERENCES product_variants(id),

    quantity INTEGER NOT NULL CHECK (quantity > 0),

    price_at_purchase NUMERIC(12,2) NOT NULL
        CHECK (price_at_purchase >= 0)
);

-- ==========================================
-- INDEXES
-- ==========================================

CREATE INDEX IF NOT EXISTS idx_products_collection
ON products(collection_id);

CREATE INDEX IF NOT EXISTS idx_orders_user
ON orders(user_id);

CREATE INDEX IF NOT EXISTS idx_orders_status
ON orders(status);
