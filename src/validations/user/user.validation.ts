
import { z } from "zod";

// Validasi pembuatan akun Kasir
export const createCashierSchema = z.object({
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

// Validasi perubahan role
// Admin tidak dapat membuat Admin baru melalui endpoint ini.
export const updateUserRoleSchema = z.object({
  role: z.enum(["cashier", "customer"]),
});
