
import { Router } from "express";

import {
  getVariantsByProduct,
  createVariant,
  updateVariant,
  deleteVariant,
} from "../../controllers/product-variant/variant.controller";

import { authenticate } from "../../middleware/auth.middleware";
import { authorize } from "../../middleware/role.middleware";

const router = Router();

// Semua endpoint wajib login
router.use(authenticate);

// Semua role dapat melihat varian produk
router.get("/product/:productId", getVariantsByProduct);

// Khusus Admin: menambahkan varian
router.post(
  "/product/:productId",
  authorize("admin"),
  createVariant
);

// Khusus Admin: mengubah stok atau kuota
router.patch(
  "/:id",
  authorize("admin"),
  updateVariant
);

// Khusus Admin: menghapus varian
router.delete(
  "/:id",
  authorize("admin"),
  deleteVariant
);

export default router;
