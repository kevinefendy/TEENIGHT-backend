import { authenticate } from "./middleware/auth.middleware";
import { authorize } from "./middleware/role.middleware";

import "dotenv/config";
import express from "express";

import { pool } from "./config/db";
import authRoutes from "./routes/auth/auth.route";
import userRoutes from "./routes/user/user.route";
import collectionRoutes from "./routes/collection/collection.route";
import variantRoutes from "./routes/product-variant/variant.route";
import productRoutes from "./routes/product/product.route";

const app = express();

// Test khusus Admin
app.get(
  "/api/test/admin",
  authenticate,
  authorize("admin"),
  (req, res) => {
    res.json({
      success: true,
      message: "Selamat datang Admin TEENIGHT",
    });
  }
);

// Test khusus Kasir
app.get(
  "/api/test/cashier",
  authenticate,
  authorize("cashier"),
  (req, res) => {
    res.json({
      success: true,
      message: "Selamat datang Kasir TEENIGHT",
    });
  }
);

// Test khusus Customer
app.get(
  "/api/test/customer",
  authenticate,
  authorize("customer"),
  (req, res) => {
    res.json({
      success: true,
      message: "Selamat datang Customer TEENIGHT",
    });
  }
);

app.use(express.json());

// ==========================================
// ROUTES
// ==========================================

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/collections", collectionRoutes);
app.use("/api/v1/products", productRoutes);
app.use("/api/v1/product-variants", variantRoutes);


// Tes koneksi Neon
app.get("/api/test-db", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT NOW() AS server_time"
    );

    res.status(200).json({
      success: true,
      message: "Berhasil terhubung ke Neon PostgreSQL",
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Database test error:", error);

    res.status(500).json({
      success: false,
      message: "Koneksi database gagal",
    });
  }
});

// Halaman utama
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "TEENIGHT API is running",
  });
});

// ==========================================
// START SERVER
// ==========================================

const PORT = Number(process.env.PORT) || 3000;

app.listen(PORT, () => {
  console.log(`server running on port ${PORT}`);
});
