
import { z } from "zod";

export const createProductSchema = z
  .object({
    collection_id: z.coerce.number().int().positive(),

    name: z
      .string()
      .trim()
      .min(1, "Nama produk wajib diisi"),

    description: z
      .string()
      .trim()
      .nullable()
      .optional(),

    price: z.coerce
      .number()
      .positive("Harga harus lebih dari 0"),

    order_type: z.enum(["ready_stock", "pre_order"]),

    po_duration_days: z.preprocess(
      (value) => value === "" ? null : value,
      z.coerce.number().int().positive().nullable().optional()
    ),

    image_url: z.string().url().nullable().optional(),
  })
  .superRefine((data, ctx) => {
    if (
      data.order_type === "pre_order" &&
      !data.po_duration_days
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["po_duration_days"],
        message: "Durasi pre-order wajib diisi",
      });
    }

    if (
      data.order_type === "ready_stock" &&
      data.po_duration_days
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["po_duration_days"],
        message: "Ready stock tidak membutuhkan durasi pre-order",
      });
    }
  });

export const updateProductSchema = z
  .object({
    collection_id: z.coerce.number().int().positive().optional(),

    name: z.string().trim().min(1).optional(),

    description: z.string().trim().nullable().optional(),

    price: z.coerce.number().positive().optional(),

    order_type: z.enum(["ready_stock", "pre_order"]).optional(),

    po_duration_days: z.preprocess(
      (value) => value === "" ? null : value,
      z.coerce.number().int().positive().nullable().optional()
    ),

    image_url: z.string().url().nullable().optional(),
  })
  .refine(
    (data) => Object.keys(data).length > 0,
    {
      message: "Minimal satu data harus diubah",
    }
  );
