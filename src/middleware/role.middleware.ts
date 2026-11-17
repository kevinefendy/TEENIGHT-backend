
import { Request, Response, NextFunction } from "express";

import type { UserRole } from "../types/express";

export const authorize = (...roles: UserRole[]) => {
  return (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {

    if (!req.user) {
      res.status(401).json({
        success: false,
        message: "Silakan login terlebih dahulu",
      });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: "Kamu tidak memiliki akses ke fitur ini",
      });
      return;
    }

    next();
  };
};
