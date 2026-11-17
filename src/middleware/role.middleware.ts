
import { Request, Response, NextFunction } from "express";

import type { UserRole } from "../types/express";

// Middleware pembatasan role pengguna
export const authorize = (...roles: UserRole[]) => {
  return (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {

    // Memeriksa apakah pengguna sudah login
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: "Silakan login terlebih dahulu",
      });
      return;
    }

    // Memeriksa apakah role pengguna diizinkan
    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: "Kamu tidak memiliki akses ke fitur ini",
      });
      return;
    }

    // Jika role sesuai, lanjutkan ke controller
    next();
  };
};
