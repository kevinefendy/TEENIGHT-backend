
import { z } from "zod";

const variantBaseSchema = z.object({
  size: z.enum(["S", "M", "L", "XL"]),
  stock: z.number().int().min(0, "Stok tidak boleh negatif"),
});

export const createVariantSchema = variantBaseSchema;

export const updateVariantSchema = z
  .object({
    size: z.enum(["S", "M", "L", "XL"]).optional(),
    stock: z.number().int().min(0, "Stok tidak boleh negatif").optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "Minimal satu data harus diubah",
  });
