
import { Router } from "express";
import {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} from "../../controllers/product/product.controller";
import { authenticate } from "../../middleware/auth.middleware";
import { authorize } from "../../middleware/role.middleware";

const router = Router();

router.use(authenticate);

// Semua role yang sudah login bisa melihat produk
router.get("/", getAllProducts);
router.get("/:id", getProductById);

// Hanya admin yang bisa mengelola produk
router.post("/", authorize("admin"), createProduct);
router.patch("/:id", authorize("admin"), updateProduct);
router.delete("/:id", authorize("admin"), deleteProduct);

export default router;
