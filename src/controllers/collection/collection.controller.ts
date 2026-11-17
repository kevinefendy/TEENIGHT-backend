
import { Request, Response } from "express";
import { pool } from "../../config/db";

import {
  createCollectionSchema,
  updateCollectionSchema,
} from "../../validations/collection/collection.validation";

// ==========================================
// 1. GET ALL COLLECTIONS
// ==========================================

export const getAllCollections = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const result = await pool.query(
      `SELECT id, name, description, created_at
       FROM collections
       ORDER BY created_at DESC`
    );

    res.status(200).json({
      success: true,
      message: "Berhasil mengambil semua koleksi",
      data: result.rows,
    });
  } catch (error) {
    console.error("Get collections error:", error);

    res.status(500).json({
      success: false,
      message: "Gagal mengambil data koleksi",
    });
  }
};

// ==========================================
// 2. GET COLLECTION BY ID
// ==========================================

export const getCollectionById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      res.status(400).json({
        success: false,
        message: "ID koleksi tidak valid",
      });
      return;
    }

    const result = await pool.query(
      `SELECT id, name, description, created_at
       FROM collections
       WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({
        success: false,
        message: "Koleksi tidak ditemukan",
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Berhasil mengambil detail koleksi",
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Get collection error:", error);

    res.status(500).json({
      success: false,
      message: "Gagal mengambil detail koleksi",
    });
  }
};

// ==========================================
// 3. CREATE COLLECTION
// ==========================================

export const createCollection = async (
  req: Request,
  res: Response
): Promise<void> => {
  const validation = createCollectionSchema.safeParse(req.body);

  if (!validation.success) {
    res.status(400).json({
      success: false,
      message: "Data koleksi tidak valid",
      errors: validation.error.flatten().fieldErrors,
    });
    return;
  }

  try {
    const { name, description } = validation.data;

    const result = await pool.query(
      `INSERT INTO collections (name, description)
       VALUES ($1, $2)
       RETURNING id, name, description, created_at`,
      [name, description ?? null]
    );

    res.status(201).json({
      success: true,
      message: "Koleksi berhasil ditambahkan",
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Create collection error:", error);

    res.status(500).json({
      success: false,
      message: "Gagal menambahkan koleksi",
    });
  }
};

// ==========================================
// 4. UPDATE COLLECTION
// ==========================================

export const updateCollection = async (
  req: Request,
  res: Response
): Promise<void> => {
  const validation = updateCollectionSchema.safeParse(req.body);

  if (!validation.success) {
    res.status(400).json({
      success: false,
      message: "Data koleksi tidak valid",
      errors: validation.error.flatten().fieldErrors,
    });
    return;
  }

  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      res.status(400).json({
        success: false,
        message: "ID koleksi tidak valid",
      });
      return;
    }

    const { name, description } = validation.data;

    const updates: string[] = [];
    const values: (string | null)[] = [];

    if (name !== undefined) {
      values.push(name);
      updates.push(`name = $${values.length}`);
    }

    if (description !== undefined) {
      values.push(description);
      updates.push(`description = $${values.length}`);
    }

    values.push(String(id));

    const result = await pool.query(
      `UPDATE collections
       SET ${updates.join(", ")}
       WHERE id = $${values.length}
       RETURNING id, name, description, created_at`,
      values
    );

    if (result.rows.length === 0) {
      res.status(404).json({
        success: false,
        message: "Koleksi tidak ditemukan",
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Koleksi berhasil diperbarui",
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Update collection error:", error);

    res.status(500).json({
      success: false,
      message: "Gagal memperbarui koleksi",
    });
  }
};

// ==========================================
// 5. DELETE COLLECTION
// ==========================================

export const deleteCollection = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      res.status(400).json({
        success: false,
        message: "ID koleksi tidak valid",
      });
      return;
    }

    const result = await pool.query(
      `DELETE FROM collections
       WHERE id = $1
       RETURNING id, name`,
      [id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({
        success: false,
        message: "Koleksi tidak ditemukan",
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Koleksi berhasil dihapus",
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Delete collection error:", error);

    // Koleksi tidak bisa dihapus jika masih digunakan produk
    if ((error as { code?: string }).code === "23503") {
      res.status(409).json({
        success: false,
        message: "Koleksi masih digunakan oleh produk",
      });
      return;
    }

    res.status(500).json({
      success: false,
      message: "Gagal menghapus koleksi",
    });
  }
};
