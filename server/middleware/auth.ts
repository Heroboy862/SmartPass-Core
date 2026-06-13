import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { sendError } from "../services/errorResponse";

const JWT_SECRET = process.env.JWT_SECRET || "smartpass-super-secret-key-2026";

/**
 * Standard corporate-grade JWT authorization checker.
 * Validates 'Authorization: Bearer <token>' header or rejects immediately.
 */
export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    console.warn(`[GÜVENLİK İHLALİ] Oturum doğrulama başlığı bulunamadı: ${req.method} ${req.path}`);
    return sendError(res, 401, "UNAUTHORIZED", "Erişim yetkiniz bulunmamaktadır. Lütfen sisteme giriş yapınız.");
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    (req as any).user = decoded;
    next();
  } catch (err: any) {
    console.error(`[GÜVENLİK İHLALİ] JWT doğrulanamadı:`, err.message);
    return sendError(res, 401, "INVALID_TOKEN", "Oturum anahtarınız geçersiz veya süresi dolmuş. Lütfen tekrar giriş yapınız.");
  }
}
