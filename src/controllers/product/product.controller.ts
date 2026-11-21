import { Request, Response } from "express";
import { unlink } from "fs/promises";
import { pool } from "../../config/db";

import {
  createProductSchema,
  updateProductSchema,
} from "../../validations/product/product.validation";

import {
  uploadToCloudinary,
  deleteFromCloudinary,
} from "../../utils/cloudinary.utils";

// Mengubah data angka dari form-data menjadi number
const normalizeProductBody = (body: any) => {
  const data = { ...body };

  if (data.collection_id !== undefined) {
    data.collection_id = Number(data.collection_id);
  }

  if (data.price !== undefined) {
    data.price = Number(data.price);
  }

  if (data.po_duration_days !== undefined) {
    data.po_duration_days =
      data.po_duration_days === ""
        ? null
        : Number(data.po_duration_days);
  }

  return data;
};

// Menghapus file sementara Multer
const removeTemporaryFile = async (filePath?: string) => {
  if (!filePath) return;

  try {
    await unlink(filePath);
  } catch (error) {
    console.error("Gagal menghapus file sementara:", error);
  }
};

// GET semua produk
export const getAllProducts = async (req: Request, res: Response) => {
  try {
    const result = await pool.query(`
      SELECT
        p.*,
        c.name AS collection_name
      FROM products p
      LEFT JOIN collections c ON p.collection_id = c.id
      ORDER BY p.created_at DESC
    `);

    return res.status(200).json({
      message: "Berhasil mengambil semua produk",
      data: result.rows,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Gagal mengambil produk",
    });
  }
};

// GET detail produk
export const getProductById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT p.*, c.name AS collection_name
       FROM products p
       LEFT JOIN collections c ON p.collection_id = c.id
       WHERE p.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Produk tidak ditemukan",
      });
    }

    return res.status(200).json({
      message: "Berhasil mengambil detail produk",
      data: result.rows[0],
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Gagal mengambil detail produk",
    });
  }
};

// POST tambah produk
export const createProduct = async (req: Request, res: Response) => {
  let uploadedPublicId: string | undefined;

  try {
    const body = normalizeProductBody(req.body);
    const validation = createProductSchema.safeParse(body);

    if (!validation.success) {
      return res.status(400).json({
        message: "Data produk tidak valid",
        errors: validation.error.flatten(),
      });
    }

    const {
      collection_id,
      name,
      description,
      price,
      order_type,
      po_duration_days,
      image_url,
    } = validation.data;

    let finalImageUrl = image_url ?? null;
    let imagePublicId: string | null = null;

    // Upload gambar jika admin mengirim file
    if (req.file) {
      const uploaded = await uploadToCloudinary(req.file.path);

      finalImageUrl = uploaded.image_url;
      imagePublicId = uploaded.public_id;
      uploadedPublicId = uploaded.public_id;
    }

    const result = await pool.query(
      `INSERT INTO products
       (collection_id, name, description, price, order_type,
        po_duration_days, image_url, image_public_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        collection_id,
        name,
        description ?? null,
        price,
        order_type,
        order_type === "pre_order" ? po_duration_days : null,
        finalImageUrl,
        imagePublicId,
      ]
    );

    uploadedPublicId = undefined;

    return res.status(201).json({
      message: "Produk berhasil ditambahkan",
      data: result.rows[0],
    });
  } catch (error: any) {
    console.error(error);

    // Jika database gagal setelah upload, hapus gambar yang telanjur diunggah
    if (uploadedPublicId) {
      try {
        await deleteFromCloudinary(uploadedPublicId);
      } catch (deleteError) {
        console.error("Gagal membersihkan gambar Cloudinary:", deleteError);
      }
    }

    if (error.code === "23503") {
      return res.status(400).json({
        message: "Collection tidak ditemukan",
      });
    }

    return res.status(500).json({
      message: "Gagal menambahkan produk",
    });
  } finally {
    await removeTemporaryFile(req.file?.path);
  }
};

// PATCH ubah produk
export const updateProduct = async (req: Request, res: Response) => {
  let uploadedPublicId: string | undefined;

  try {
    const { id } = req.params;
    const body = normalizeProductBody(req.body);
    const validation = updateProductSchema.safeParse(body);

    if (!validation.success) {
      return res.status(400).json({
        message: "Data produk tidak valid",
        errors: validation.error.flatten(),
      });
    }

    const data = validation.data;

    const existing = await pool.query(
      "SELECT * FROM products WHERE id = $1",
      [id]
    );

    if (existing.rows.length === 0) {
      return res.status(404).json({
        message: "Produk tidak ditemukan",
      });
    }

    const current = existing.rows[0];

    const nextOrderType = data.order_type ?? current.order_type;

    const nextDuration =
      data.po_duration_days !== undefined
        ? data.po_duration_days
        : current.po_duration_days;

    if (nextOrderType === "pre_order" && !nextDuration) {
      return res.status(400).json({
        message: "Durasi pre-order wajib diisi",
      });
    }

    if (
      nextOrderType === "ready_stock" &&
      data.po_duration_days
    ) {
      return res.status(400).json({
        message: "Ready stock tidak membutuhkan durasi pre-order",
      });
    }

    const fields: string[] = [];
    const values: any[] = [];

    Object.entries(data).forEach(([key, value]) => {
      if (key === "order_type" || key === "po_duration_days") {
        return;
      }

      values.push(value);
      fields.push(`${key} = $${values.length}`);
    });

    if (data.order_type !== undefined) {
      values.push(data.order_type);
      fields.push(`order_type = $${values.length}`);
    }

    if (
      data.order_type !== undefined ||
      data.po_duration_days !== undefined
    ) {
      values.push(
        nextOrderType === "ready_stock" ? null : nextDuration
      );

      fields.push(`po_duration_days = $${values.length}`);
    }

    // Upload gambar baru jika admin mengirim file
    if (req.file) {
      const uploaded = await uploadToCloudinary(req.file.path);

      uploadedPublicId = uploaded.public_id;

      values.push(uploaded.image_url);
      fields.push(`image_url = $${values.length}`);

      values.push(uploaded.public_id);
      fields.push(`image_public_id = $${values.length}`);
    }

    if (fields.length === 0) {
      return res.status(400).json({
        message: "Tidak ada perubahan data",
      });
    }

    values.push(id);

    const result = await pool.query(
      `UPDATE products
       SET ${fields.join(", ")}
       WHERE id = $${values.length}
       RETURNING *`,
      values
    );

    // Setelah database berhasil diperbarui, hapus gambar lama
    if (req.file && current.image_public_id) {
      try {
        await deleteFromCloudinary(current.image_public_id);
      } catch (deleteError) {
        console.error("Gagal menghapus gambar lama:", deleteError);
      }
    }

    uploadedPublicId = undefined;

    return res.status(200).json({
      message: "Produk berhasil diperbarui",
      data: result.rows[0],
    });
  } catch (error: any) {
    console.error(error);

    if (uploadedPublicId) {
      try {
        await deleteFromCloudinary(uploadedPublicId);
      } catch (deleteError) {
        console.error("Gagal membersihkan gambar Cloudinary:", deleteError);
      }
    }

    if (error.code === "23503") {
      return res.status(400).json({
        message: "Collection tidak ditemukan",
      });
    }

    return res.status(500).json({
      message: "Gagal memperbarui produk",
    });
  } finally {
    await removeTemporaryFile(req.file?.path);
  }
};

// DELETE hapus produk
export const deleteProduct = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      "DELETE FROM products WHERE id = $1 RETURNING *",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Produk tidak ditemukan",
      });
    }

    const deletedProduct = result.rows[0];

    // Hapus gambar dari Cloudinary jika produk memilikinya
    if (deletedProduct.image_public_id) {
      try {
        await deleteFromCloudinary(deletedProduct.image_public_id);
      } catch (deleteError) {
        console.error("Gagal menghapus gambar Cloudinary:", deleteError);
      }
    }

    return res.status(200).json({
      message: "Produk berhasil dihapus",
      data: deletedProduct,
    });
  } catch (error: any) {
    console.error(error);

    if (error.code === "23503") {
      return res.status(409).json({
        message: "Produk tidak dapat dihapus karena masih digunakan",
      });
    }

    return res.status(500).json({
      message: "Gagal menghapus produk",
    });
  }
};