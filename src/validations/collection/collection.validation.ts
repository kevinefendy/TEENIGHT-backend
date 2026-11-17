import { z } from "zod";

// Validasi tambah koleksi
export const createCollectionSchema = z.object({
  name: z.string()
    .trim()
    .min(2, "Nama koleksi minimal 2 karakter")
    .max(100, "Nama koleksi maksimal 100 karakter"),

  description: z.string()
    .trim()
    .max(1000, "Deskripsi maksimal 1000 karakter")
    .nullable()
    .optional(),
});

// Validasi update koleksi
export const updateCollectionSchema = createCollectionSchema
  .partial()
  .refine(
    (data) => Object.keys(data).length > 0,
    "Minimal satu data harus diisi"
  );
