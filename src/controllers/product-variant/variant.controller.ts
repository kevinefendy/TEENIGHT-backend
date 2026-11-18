
import { Request, Response } from "express";
import { pool } from "../../config/db";

import {
  createVariantSchema,
  updateVariantSchema,
} from "../../validations/product-variant/variant.validation";

// ==========================================
// 1. GET VARIANTS BY PRODUCT
// ==========================================

export const getVariantsByProduct = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const productId = Number(req.params.productId);

    if (!Number.isInteger(productId) || productId <= 0) {
      res.status(400).json({
        success: false,
        message: "ID produk tidak valid",
      });
      return;
    }

    // Periksa produk
    const product = await pool.query(
      `SELECT id, name, order_type, po_duration_days
       FROM products
       WHERE id = $1`,
      [productId]
    );

    if (product.rows.length === 0) {
      res.status(404).json({
        success: false,
        message: "Produk tidak ditemukan",
      });
      return;
    }

    // Ambil semua varian produk
    const result = await pool.query(
      `SELECT id, product_id, size, stock
       FROM product_variants
       WHERE product_id = $1
       ORDER BY
         CASE size
           WHEN 'S' THEN 1
           WHEN 'M' THEN 2
           WHEN 'L' THEN 3
           WHEN 'XL' THEN 4
         END`,
      [productId]
    );

    res.status(200).json({
      success: true,
      message: "Berhasil mengambil varian produk",
      data: {
        product: product.rows[0],
        variants: result.rows,
      },
    });
  } catch (error) {
    console.error("Get variants error:", error);

    res.status(500).json({
      success: false,
      message: "Gagal mengambil varian produk",
    });
  }
};

// ==========================================
// 2. CREATE VARIANT
// ==========================================

export const createVariant = async (
  req: Request,
  res: Response
): Promise<void> => {
  const validation = createVariantSchema.safeParse(req.body);

  if (!validation.success) {
    res.status(400).json({
      success: false,
      message: "Data varian tidak valid",
      errors: validation.error.flatten().fieldErrors,
    });
    return;
  }

  try {
    const productId = Number(req.params.productId);

    if (!Number.isInteger(productId) || productId <= 0) {
      res.status(400).json({
        success: false,
        message: "ID produk tidak valid",
      });
      return;
    }

    const { size, stock } = validation.data;

    // Periksa produk yang akan diberi varian
    const product = await pool.query(
      `SELECT id, order_type
       FROM products
       WHERE id = $1`,
      [productId]
    );

    if (product.rows.length === 0) {
      res.status(404).json({
        success: false,
        message: "Produk tidak ditemukan",
      });
      return;
    }

    // Simpan varian ke database
    const result = await pool.query(
      `INSERT INTO product_variants
       (product_id, size, stock)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [productId, size, stock]
    );

    res.status(201).json({
      success: true,
      message: "Varian produk berhasil ditambahkan",
      data: {
        ...result.rows[0],
        order_type: product.rows[0].order_type,
      },
    });
  } catch (error) {
    console.error("Create variant error:", error);

    const errorCode = (error as { code?: string }).code;

    if (errorCode === "23505") {
      res.status(409).json({
        success: false,
        message: "Ukuran tersebut sudah tersedia pada produk ini",
      });
      return;
    }

    res.status(500).json({
      success: false,
      message: "Gagal menambahkan varian produk",
    });
  }
};

// ==========================================
// 3. UPDATE VARIANT STOCK / QUOTA
// ==========================================

export const updateVariant = async (
  req: Request,
  res: Response
): Promise<void> => {
  const validation = updateVariantSchema.safeParse(req.body);

  if (!validation.success) {
    res.status(400).json({
      success: false,
      message: "Data varian tidak valid",
      errors: validation.error.flatten().fieldErrors,
    });
    return;
  }

  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      res.status(400).json({
        success: false,
        message: "ID varian tidak valid",
      });
      return;
    }

    const { stock } = validation.data;

    // Periksa varian
    const existing = await pool.query(
      `SELECT id
       FROM product_variants
       WHERE id = $1`,
      [id]
    );

    if (existing.rows.length === 0) {
      res.status(404).json({
        success: false,
        message: "Varian produk tidak ditemukan",
      });
      return;
    }

    // Perbarui stok atau kuota
    const result = await pool.query(
      `UPDATE product_variants
       SET stock = $1
       WHERE id = $2
       RETURNING *`,
      [stock, id]
    );

    res.status(200).json({
      success: true,
      message: "Stok atau kuota berhasil diperbarui",
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Update variant error:", error);

    res.status(500).json({
      success: false,
      message: "Gagal memperbarui varian produk",
    });
  }
};

// ==========================================
// 4. DELETE VARIANT
// ==========================================

export const deleteVariant = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      res.status(400).json({
        success: false,
        message: "ID varian tidak valid",
      });
      return;
    }

    const result = await pool.query(
      `DELETE FROM product_variants
       WHERE id = $1
       RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({
        success: false,
        message: "Varian produk tidak ditemukan",
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Varian produk berhasil dihapus",
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Delete variant error:", error);

    if ((error as { code?: string }).code === "23503") {
      res.status(409).json({
        success: false,
        message: "Varian tidak dapat dihapus karena sudah digunakan dalam pesanan",
      });
      return;
    }

    res.status(500).json({
      success: false,
      message: "Gagal menghapus varian produk",
    });
  }
};
