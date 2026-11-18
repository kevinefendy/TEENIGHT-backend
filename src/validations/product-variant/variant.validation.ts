
import { z } from "zod";

// Validasi tambah varian
export const createVariantSchema = z.object({
  size: z.enum(["S", "M", "L", "XL"]),

  stock: z.number()
    .int("Stok harus berupa bilangan bulat")
    .min(0, "Stok tidak boleh negatif")
    .default(0),
});

// Validasi update varian
export const updateVariantSchema = z.object({
  size: z.enum(["S", "M", "L", "XL"]).optional(),

  stock: z.number()
    .int("Stok harus berupa bilangan bulat")
    .min(0, "Stok tidak boleh negatif")
    .optional(),
}).refine(
  (data) => Object.keys(data).length > 0,
  "Minimal satu data varian harus diisi"
);
