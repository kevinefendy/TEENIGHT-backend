
import { z } from "zod";

// Validasi Registrasi Customer
export const registerSchema = z.object({
  name: z.string()
    .trim()
    .min(2, "Nama minimal 2 karakter")
    .max(100),

  email: z.string()
    .trim()
    .email("Format email tidak valid")
    .max(150),

  password: z.string()
    .min(8, "Password minimal 8 karakter")
    .max(72, "Password maksimal 72 karakter"),


  address: z.string()
    .trim()
    .max(1000)
    .optional(),
});

// Validasi Login
export const loginSchema = z.object({
  email: z.string()
    .trim()
    .email("Format email tidak valid"),

  password: z.string()
    .min(1, "Password wajib diisi"),
});
