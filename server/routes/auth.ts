import { Router, Request, Response } from "express";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { adminDb, createAuditLog } from "../services/firestoreSync";
import { sendError } from "../services/errorResponse";
import { UserService } from "../services/userService";

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || "smartpass-super-secret-key-2026";

// Helper to securely hash passenger credentials
export function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

/**
 * Helper to normalize and slugify emails for secure Firestore document IDs
 */
export function getEmailDocId(email: string): string {
  return "usr_" + email.toLowerCase().trim().replace(/[^a-z0-9]/g, "_");
}

/**
 * 1. POST /api/auth/register
 * Corporate passenger profile onboarding secure database registration with signed JWT issuance.
 */
router.post("/register", async (req: Request, res: Response) => {
  const { email, password, name, accessibilityProfile } = req.body;

  if (!email || !password || !name) {
    return sendError(res, 400, "VALIDATION_ERROR", "E-posta, şifre ve isim alanları zorunludur.");
  }

  const cleanEmail = email.toLowerCase().trim();
  const docId = getEmailDocId(cleanEmail);

  try {
    const hashedPassword = hashPassword(password);
    const resolvedProfile = accessibilityProfile || {
      enabled: false,
      type: "none",
      kvkkChecked: true,
      preferredLanguage: "tr"
    };

    const userSvc = UserService.getInstance();
    const existingUser = await userSvc.getUserByEmail(cleanEmail);

    if (existingUser) {
      return sendError(res, 400, "USER_EXISTS", "Bu e-posta adresi ile kayıtlı bir kullanıcı zaten mevcut.");
    }

    // Register user securely through User Service Repository
    const newUser = await userSvc.createUser(cleanEmail, hashedPassword, name, resolvedProfile);

    // Generate signed JWT token
    const token = jwt.sign(
      { userId: newUser.id, email: newUser.email, name: newUser.name },
      JWT_SECRET,
      { expiresIn: "24h" }
    );

    // Record Immutable Audit Log
    try {
      await createAuditLog(
        "USER_PORTAL",
        newUser.name,
        "PROFILE_CREATE",
        `Yeni kurumsal yolcu kaydı oluşturuldu (${cleanEmail}). Güvenlik anahtarı imzalandı.`
      );
    } catch (auditErr: any) {
      console.warn("[AUTH] Failed to write registration audit log:", auditErr.message);
    }

    return res.status(200).json({
      success: true,
      token,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        accessibilityProfile: newUser.accessibilityProfile
      }
    });

  } catch (err: any) {
    console.error("[AUTH REGISTER] Error during registration:", err);
    return sendError(res, 500, "REGISTER_ERROR", "Kayıt işlemi sırasında sistemsel bir hata oluştu.");
  }
});

/**
 * 2. POST /api/auth/login
 * Validates cryptographically secured passenger credentials and issues high-security authorization bearer tokens.
 */
router.post("/login", async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return sendError(res, 400, "VALIDATION_ERROR", "E-posta ve şifre alanları zorunludur.");
  }

  const cleanEmail = email.toLowerCase().trim();
  const hashedPassword = hashPassword(password);

  try {
    const userSvc = UserService.getInstance();
    const matchedUser = await userSvc.validateUserCredentials(cleanEmail, hashedPassword);

    if (!matchedUser) {
      const userExists = await userSvc.getUserByEmail(cleanEmail);
      if (userExists) {
        return sendError(res, 401, "AUTH_FAILED", "Girilen e-posta şifre kombinasyonu hatalıdır.");
      } else {
        return sendError(res, 404, "USER_NOT_FOUND", "Bu kullanıcı kayıtlı değil veya yerel veritabanında bulunamadı.");
      }
    }

    // Generate signed JWT token
    const token = jwt.sign(
      { userId: matchedUser.id, email: matchedUser.email, name: matchedUser.name },
      JWT_SECRET,
      { expiresIn: "24h" }
    );

    // Record Immutable Audit Log
    try {
      await createAuditLog(
        "USER_PORTAL",
        matchedUser.name,
        "PROFILE_ACCESS",
        `Yolcu portala giriş yaptı. JWT doğrulama toketi başarıyla imzalandı.`
      );
    } catch (auditErr: any) {
      console.warn("[AUTH] Failed to write login audit log:", auditErr.message);
    }

    return res.status(200).json({
      success: true,
      token,
      user: {
        id: matchedUser.id,
        name: matchedUser.name,
        email: matchedUser.email,
        accessibilityProfile: matchedUser.accessibilityProfile || {
          enabled: false,
          type: "none",
          kvkkChecked: true,
          preferredLanguage: "tr"
        }
      }
    });

  } catch (err: any) {
    console.error("[AUTH LOGIN] Error during login:", err);
    return sendError(res, 500, "LOGIN_ERROR", "Giriş işlemi gerçekleştirilirken bir sunucu hatası oluştu.");
  }
});

export default router;
