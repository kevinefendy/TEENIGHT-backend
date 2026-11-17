
import * as jwt from "jsonwebtoken";
import type { AuthUser, UserRole } from "../types/express";

// Mengambil secret dari .env
const getSecret = (): string => {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error("JWT_SECRET belum diatur");
  }

  return secret;
};

// Membuat token JWT
export const generateToken = (payload: AuthUser): string => {
  return jwt.sign(payload, getSecret(), {
    expiresIn: "1d",
  });
};

// Memeriksa role
const isValidRole = (role: unknown): role is UserRole => {
  return (
    role === "admin" ||
    role === "cashier" ||
    role === "customer"
  );
};

// Memverifikasi token JWT
export const verifyToken = (token: string): AuthUser => {
  const decoded = jwt.verify(token, getSecret());

  if (
    typeof decoded === "string" ||
    typeof decoded.id !== "number" ||
    typeof decoded.email !== "string" ||
    !isValidRole(decoded.role)
  ) {
    throw new Error("Token tidak valid");
  }

  return {
    id: decoded.id,
    email: decoded.email,
    role: decoded.role,
  };
};
