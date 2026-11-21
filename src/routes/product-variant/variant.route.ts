
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

router.use(authenticate);

// Semua role yang login bisa melihat varian
router.get("/:productId/variants", getVariantsByProduct);

// Hanya admin yang bisa mengelola varian
router.post(
  "/:productId/variants",
  authorize("admin"),
  createVariant
);

router.patch(
  "/:productId/variants/:variantId",
  authorize("admin"),
  updateVariant
);

router.delete(
  "/:productId/variants/:variantId",
  authorize("admin"),
  deleteVariant
);

export default router;
