
import {
  mysqlTable,
  int,
  varchar,
  text,
  decimal,
  timestamp,
  mysqlEnum,
} from "drizzle-orm/mysql-core";

// ==========================================
// 1. USERS
// Menyimpan akun Admin, Kasir, Customer
// ==========================================

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),

  name: varchar("name", { length: 100 }).notNull(),

  email: varchar("email", { length: 150 })
    .notNull()
    .unique(),

  password: varchar("password", { length: 255 }).notNull(),

  phone: varchar("phone", { length: 20 }),

  address: text("address"),

  role: mysqlEnum("role", [
    "admin",
    "cashier",
    "customer",
  ])
    .notNull()
    .default("customer"),

  createdAt: timestamp("created_at")
    .defaultNow()
    .notNull(),
});

// ==========================================
// 2. COLLECTIONS
// Menyimpan koleksi produk
// ==========================================

export const collections = mysqlTable("collections", {
  id: int("id").autoincrement().primaryKey(),

  name: varchar("name", { length: 100 }).notNull(),

  description: text("description"),

  createdAt: timestamp("created_at")
    .defaultNow()
    .notNull(),
});

// ==========================================
// 3. PRODUCTS
// Menyimpan informasi produk
// ==========================================

export const products = mysqlTable("products", {
  id: int("id").autoincrement().primaryKey(),

  collectionId: int("collection_id")
    .notNull()
    .references(() => collections.id),

  name: varchar("name", { length: 150 }).notNull(),

  description: text("description"),

  price: decimal("price", {
    precision: 12,
    scale: 2,
  }).notNull(),

  orderType: mysqlEnum("order_type", [
    "ready_stock",
    "pre_order",
  ]).notNull(),

  poDurationDays: int("po_duration_days"),

  imageUrl: varchar("image_url", { length: 255 }),

  createdAt: timestamp("created_at")
    .defaultNow()
    .notNull(),
});

// ==========================================
// 4. PRODUCT VARIANTS
// Menyimpan ukuran, stok, dan kuota produk
// ==========================================

export const productVariants = mysqlTable("product_variants", {
  id: int("id").autoincrement().primaryKey(),

  productId: int("product_id")
    .notNull()
    .references(() => products.id),

  size: mysqlEnum("size", [
    "S",
    "M",
    "L",
    "XL",
  ]).notNull(),

  stock: int("stock")
    .notNull()
    .default(0),
});

// ==========================================
// 5. ORDERS
// Menyimpan pesanan pelanggan
// ==========================================

export const orders = mysqlTable("orders", {
  id: int("id").autoincrement().primaryKey(),

  userId: int("user_id")
    .notNull()
    .references(() => users.id),

  totalPrice: decimal("total_price", {
    precision: 12,
    scale: 2,
  }).notNull(),

  shippingAddress: text("shipping_address").notNull(),

  paymentProofUrl: varchar("payment_proof_url", {
    length: 255,
  }),

  trackingNumber: varchar("tracking_number", {
    length: 100,
  }),

  status: mysqlEnum("status", [
    "pending",
    "paid",
    "shipped",
    "completed",
    "cancelled",
  ])
    .notNull()
    .default("pending"),

  createdAt: timestamp("created_at")
    .defaultNow()
    .notNull(),
});

// ==========================================
// 6. ORDER ITEMS
// Menyimpan detail produk dalam pesanan
// ==========================================

export const orderItems = mysqlTable("order_items", {
  id: int("id").autoincrement().primaryKey(),

  orderId: int("order_id")
    .notNull()
    .references(() => orders.id),

  productVariantId: int("product_variant_id")
    .notNull()
    .references(() => productVariants.id),

  quantity: int("quantity").notNull(),

  priceAtPurchase: decimal("price_at_purchase", {
    precision: 12,
    scale: 2,
  }).notNull(),
});
