
import { Router } from "express";

import {
  getAllUsers,
  getUserById,
  createCashier,
  updateUserRole,
} from "../../controllers/user/user.controller";

import { authenticate } from "../../middleware/auth.middleware";
import { authorize } from "../../middleware/role.middleware";

const router = Router();

// Semua endpoint di bawah wajib login dan khusus Admin
router.use(authenticate);
router.use(authorize("admin"));

// Melihat semua pengguna
router.get("/", getAllUsers);

// Membuat akun Kasir
router.post("/cashiers", createCashier);

// Melihat detail pengguna
router.get("/:id", getUserById);

// Mengubah role pengguna
router.patch("/:id/role", updateUserRole);

export default router;
