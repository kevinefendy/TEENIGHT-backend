import express from "express";
import { pool } from "./config/db";

const app = express();

app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "TEENIGHT API is running",
  });
});

// Tes koneksi database
app.get("/api/test-db", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT NOW() AS server_time"
    );

    res.json({
      success: true,
      message: "Berhasil terhubung ke Neon PostgreSQL",
      data: result.rows[0],
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Koneksi database gagal",
    });
  }
});

const PORT = Number(process.env.PORT) || 3000;

app.listen(PORT, () => {
  console.log(`Server berjalan di port ${PORT}`);
});