
import "dotenv/config";
import { Pool } from "pg";

// Periksa koneksi database
if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL belum diatur");
}

// Membuat koneksi pool ke Neon PostgreSQL
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

// Menangani error koneksi
pool.on("error", (error) => {
  console.error("Database connection error:", error);
});
