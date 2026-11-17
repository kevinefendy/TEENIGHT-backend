
import { Request, Response } from "express";
import { pool } from "../../config/db";
import { hashPassword } from "../../utils/password.util";

import {
  createCashierSchema,
  updateUserRoleSchema,
} from "../../validations/user/user.validation";

// ==========================================
// 1. GET ALL USERS
// ==========================================

export const getAllUsers = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const result = await pool.query(
      `SELECT id, name, email, address, role, created_at
       FROM users
       ORDER BY created_at DESC`
    );

    res.status(200).json({
      success: true,
      message: "Berhasil mengambil data pengguna",
      data: result.rows,
    });
  } catch (error) {
    console.error("Get users error:", error);

    res.status(500).json({
      success: false,
      message: "Gagal mengambil data pengguna",
    });
  }
};

// ==========================================
// 2. GET USER BY ID
// ==========================================

export const getUserById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      res.status(400).json({
        success: false,
        message: "ID pengguna tidak valid",
      });
      return;
    }

    const result = await pool.query(
      `SELECT id, name, email, address, role, created_at
       FROM users
       WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({
        success: false,
        message: "Pengguna tidak ditemukan",
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Berhasil mengambil detail pengguna",
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Get user error:", error);

    res.status(500).json({
      success: false,
      message: "Gagal mengambil detail pengguna",
    });
  }
};

// ==========================================
// 3. CREATE CASHIER
// ==========================================

export const createCashier = async (
  req: Request,
  res: Response
): Promise<void> => {
  const validation = createCashierSchema.safeParse(req.body);

  if (!validation.success) {
    res.status(400).json({
      success: false,
      message: "Data Kasir tidak valid",
      errors: validation.error.flatten().fieldErrors,
    });
    return;
  }

  try {
    const { name, email, password, address } = validation.data;

    const normalizedEmail = email.toLowerCase();

    // Cek email yang sudah digunakan
    const existingUser = await pool.query(
      "SELECT id FROM users WHERE email = $1",
      [normalizedEmail]
    );

    if (existingUser.rows.length > 0) {
      res.status(409).json({
        success: false,
        message: "Email sudah terdaftar",
      });
      return;
    }

    // Hash password menggunakan bcrypt
    const hashedPassword = await hashPassword(password);

    // Simpan akun dengan role cashier
    const result = await pool.query(
      `INSERT INTO users
       (name, email, password, address, role)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, name, email, address, role, created_at`,
      [
        name,
        normalizedEmail,
        hashedPassword,
        address ?? null,
        "cashier",
      ]
    );

    res.status(201).json({
      success: true,
      message: "Akun Kasir berhasil dibuat",
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Create cashier error:", error);

    if ((error as { code?: string }).code === "23505") {
      res.status(409).json({
        success: false,
        message: "Email sudah terdaftar",
      });
      return;
    }

    res.status(500).json({
      success: false,
      message: "Gagal membuat akun Kasir",
    });
  }
};

// ==========================================
// 4. UPDATE USER ROLE
// ==========================================

export const updateUserRole = async (
  req: Request,
  res: Response
): Promise<void> => {
  const validation = updateUserRoleSchema.safeParse(req.body);

  if (!validation.success) {
    res.status(400).json({
      success: false,
      message: "Role pengguna tidak valid",
      errors: validation.error.flatten().fieldErrors,
    });
    return;
  }

  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      res.status(400).json({
        success: false,
        message: "ID pengguna tidak valid",
      });
      return;
    }

    // Admin tidak boleh mengubah role akun sendiri
    if (req.user?.id === id) {
      res.status(400).json({
        success: false,
        message: "Tidak dapat mengubah role akun sendiri",
      });
      return;
    }

    const { role } = validation.data;

    const result = await pool.query(
      `UPDATE users
       SET role = $1
       WHERE id = $2 AND role <> 'admin'
       RETURNING id, name, email, address, role`,
      [role, id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({
        success: false,
        message: "Pengguna tidak ditemukan atau tidak dapat diubah",
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Role pengguna berhasil diperbarui",
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Update role error:", error);

    res.status(500).json({
      success: false,
      message: "Gagal memperbarui role pengguna",
    });
  }
};
