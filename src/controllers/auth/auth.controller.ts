
import { Request, Response } from "express";
import { pool } from "../../config/db";

import {
  registerSchema,
  loginSchema,
} from "../../validations/auth/auth.validation";

import {
  hashPassword,
  comparePassword,
} from "../../utils/password.util";

import { generateToken } from "../../utils/jwt.util";
import type { AuthUser } from "../../types/express";

// ==========================================
// REGISTER CUSTOMER
// ==========================================


export const register = async (
  req: Request,
  res: Response
): Promise<void> => {
  const validation = registerSchema.safeParse(req.body);

  if (!validation.success) {
    res.status(400).json({
      success: false,
      message: "Data registrasi tidak valid",
      errors: validation.error.flatten().fieldErrors,
    });
    return;
  }

  try {
    const { name, email, password, address } = validation.data;

    const normalizedEmail = email.toLowerCase();

    // 1. Cek email sudah terdaftar atau belum
    const existingUser = await pool.query(
      "SELECT id FROM users WHERE email = $1 LIMIT 1",
      [normalizedEmail]
    );

    if (existingUser.rows.length > 0) {
      res.status(409).json({
        success: false,
        message: "Email sudah terdaftar",
      });
      return;
    }

    // 2. Hash password
    const hashedPassword = await hashPassword(password);

    // 3. Simpan user ke PostgreSQL
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
        "customer",
      ]
    );

    const user = result.rows[0];

    // 4. Buat JWT
    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    // 5. Kirim response
    res.status(201).json({
      success: true,
      message: "Registrasi berhasil",
      data: {
        user,
        token,
      },
    });
  } catch (error) {
    console.error("Register error:", error);

    if ((error as { code?: string }).code === "23505") {
      res.status(409).json({
        success: false,
        message: "Email sudah terdaftar",
      });
      return;
    }

    res.status(500).json({
      success: false,
      message: "Terjadi kesalahan pada server",
    });
  }
};

// ==========================================
// LOGIN ADMIN, KASIR, CUSTOMER
// ==========================================

export const login = async (
  req: Request,
  res: Response
): Promise<void> => {
  const validation = loginSchema.safeParse(req.body);

  if (!validation.success) {
    res.status(400).json({
      success: false,
      message: "Data login tidak valid",
      errors: validation.error.flatten().fieldErrors,
    });
    return;
  }

  try {
    const { email, password } = validation.data;

    // Mencari user berdasarkan email
    const result = await pool.query(
      `SELECT id, name, email, password, role
       FROM users
       WHERE email = $1
       LIMIT 1`,
      [email.toLowerCase()]
    );

    const user = result.rows[0];

    if (!user) {
      res.status(401).json({
        success: false,
        message: "Email atau password salah",
      });
      return;
    }

    // Membandingkan password dengan hash
    const isPasswordValid = await comparePassword(
      password,
      user.password
    );

    if (!isPasswordValid) {
      res.status(401).json({
        success: false,
        message: "Email atau password salah",
      });
      return;
    }

    // Membuat token berdasarkan role pengguna
    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role,
    } as AuthUser);

    res.status(200).json({
      success: true,
      message: "Login berhasil",
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
        token,
      },
    });
  } catch (error) {
    console.error("Login error:", error);

    res.status(500).json({
      success: false,
      message: "Terjadi kesalahan pada server",
    });
  }
};

// ==========================================
// GET PROFILE / ME
// ==========================================

export const getMe = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: "Silakan login terlebih dahulu",
      });
      return;
    }

    const result = await pool.query(
      `SELECT id, name, email, address, role, created_at
       FROM users
       WHERE id = $1
       LIMIT 1`,
      [req.user.id]
    );

    const user = result.rows[0];

    if (!user) {
      res.status(404).json({
        success: false,
        message: "Pengguna tidak ditemukan",
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Berhasil mengambil profil",
      data: user,
    });
  } catch (error) {
    console.error("Get profile error:", error);

    res.status(500).json({
      success: false,
      message: "Terjadi kesalahan pada server",
    });
  }
};
