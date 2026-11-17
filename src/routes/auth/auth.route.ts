
import { Router } from "express";

import {
  register,
  login,
  getMe,
} from "../../controllers/auth/auth.controller";

import { authenticate } from "../../middleware/auth.middleware";

const router = Router();

// Registrasi Customer
router.post("/register", register);

// Login Admin, Kasir, Customer
router.post("/login", login);

// Melihat profil pengguna yang sedang login
router.get("/me", authenticate, getMe);

export default router;
