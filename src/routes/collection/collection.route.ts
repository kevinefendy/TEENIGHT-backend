
import { Router } from "express";

import {
  getAllCollections,
  getCollectionById,
  createCollection,
  updateCollection,
  deleteCollection,
} from "../../controllers/collection/collection.controller";

import { authenticate } from "../../middleware/auth.middleware";
import { authorize } from "../../middleware/role.middleware";

const router = Router();

// Semua endpoint membutuhkan login
router.use(authenticate);

// Admin, Kasir, Customer: melihat semua koleksi
router.get("/", getAllCollections);

// Admin, Kasir, Customer: melihat detail koleksi
router.get("/:id", getCollectionById);

// Khusus Admin: menambahkan koleksi
router.post(
  "/",
  authorize("admin"),
  createCollection
);

// Khusus Admin: mengubah koleksi
router.patch(
  "/:id",
  authorize("admin"),
  updateCollection
);

// Khusus Admin: menghapus koleksi
router.delete(
  "/:id",
  authorize("admin"),
  deleteCollection
);

export default router;
