
import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../utils/jwt.util";

export const authenticate = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;

  // Memeriksa header Authorization
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({
      success: false,
      message: "Token tidak ditemukan",
    });
    return;
  }

  const token = authHeader.slice(7);

  try {
    // Memverifikasi token JWT
    const user = verifyToken(token);

    // Menyimpan informasi user ke request
    req.user = user;

    next();
  } catch {
    res.status(401).json({
      success: false,
      message: "Token tidak valid atau sudah kedaluwarsa",
    });
  }
};
