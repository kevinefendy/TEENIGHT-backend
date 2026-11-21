
import { Request, Response } from "express";
import { pool } from "../../config/db";
import {
  createVariantSchema,
  updateVariantSchema,
} from "../../validations/product-variant/variant.validation";

// GET semua varian berdasarkan produk
export const getVariantsByProduct = async (
  req: Request,
  res: Response
) => {
  try {
    const { productId } = req.params;

    const product = await pool.query(
      "SELECT id FROM products WHERE id = $1",
      [productId]
    );

    if (product.rows.length === 0) {
      return res.status(404).json({
        message: "Produk tidak ditemukan",
      });
    }

    const result = await pool.query(
      `SELECT * FROM product_variants
       WHERE product_id = $1
       ORDER BY id ASC`,
      [productId]
    );

    return res.status(200).json({
      message: "Berhasil mengambil varian produk",
      data: result.rows,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Gagal mengambil varian produk",
    });
  }
};

// POST tambah varian
export const createVariant = async (
  req: Request,
  res: Response
) => {
  try {
    const { productId } = req.params;

    const validation = createVariantSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        message: "Data varian tidak valid",
        errors: validation.error.flatten(),
      });
    }

    const { size, stock } = validation.data;

    const product = await pool.query(
      "SELECT id FROM products WHERE id = $1",
      [productId]
    );

    if (product.rows.length === 0) {
      return res.status(404).json({
        message: "Produk tidak ditemukan",
      });
    }

    const result = await pool.query(
      `INSERT INTO product_variants (product_id, size, stock)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [productId, size, stock]
    );

    return res.status(201).json({
      message: "Varian produk berhasil ditambahkan",
      data: result.rows[0],
    });
  } catch (error: any) {
    if (error.code === "23505") {
      return res.status(409).json({
        message: "Ukuran tersebut sudah tersedia untuk produk ini",
      });
    }

    if (error.code === "23503") {
      return res.status(404).json({
        message: "Produk tidak ditemukan",
      });
    }

    return res.status(500).json({
      message: "Gagal menambahkan varian produk",
    });
  }
};

// PATCH ubah varian
export const updateVariant = async (
  req: Request,
  res: Response
) => {
  try {
    const { productId, variantId } = req.params;

    const validation = updateVariantSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        message: "Data varian tidak valid",
        errors: validation.error.flatten(),
      });
    }

    const existing = await pool.query(
      `SELECT * FROM product_variants
       WHERE id = $1 AND product_id = $2`,
      [variantId, productId]
    );

    if (existing.rows.length === 0) {
      return res.status(404).json({
        message: "Varian produk tidak ditemukan",
      });
    }

    const data = validation.data;
    const fields: string[] = [];
    const values: any[] = [];

    Object.entries(data).forEach(([key, value]) => {
      values.push(value);
      fields.push(`${key} = $${values.length}`);
    });

    values.push(variantId);
    values.push(productId);

    const result = await pool.query(
      `UPDATE product_variants
       SET ${fields.join(", ")}
       WHERE id = $${values.length - 1}
       AND product_id = $${values.length}
       RETURNING *`,
      values
    );

    return res.status(200).json({
      message: "Varian produk berhasil diperbarui",
      data: result.rows[0],
    });
  } catch (error: any) {
    if (error.code === "23505") {
      return res.status(409).json({
        message: "Ukuran tersebut sudah tersedia untuk produk ini",
      });
    }

    return res.status(500).json({
      message: "Gagal memperbarui varian produk",
    });
  }
};

// DELETE hapus varian
export const deleteVariant = async (
  req: Request,
  res: Response
) => {
  try {
    const { productId, variantId } = req.params;

    const result = await pool.query(
      `DELETE FROM product_variants
       WHERE id = $1 AND product_id = $2
       RETURNING *`,
      [variantId, productId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Varian produk tidak ditemukan",
      });
    }

    return res.status(200).json({
      message: "Varian produk berhasil dihapus",
      data: result.rows[0],
    });
  } catch (error: any) {
    if (error.code === "23503") {
      return res.status(409).json({
        message: "Varian tidak dapat dihapus karena masih digunakan",
      });
    }

    return res.status(500).json({
      message: "Gagal menghapus varian produk",
    });
  }
};
