import { rateLimit } from "express-rate-limit";
import crypto from "crypto";

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 mins
  limit: 180, // Allow up to 180 requests per 15 mins per IP
  standardHeaders: "draft-7",
  legacyHeaders: false,
  handler: (req, res) => {
    const requestId = `req-${crypto.randomBytes(8).toString("hex")}`;
    res.status(429).json({
      error: {
        code: "RATE_LIMIT_EXCEEDED",
        message: "Çok fazla istek gönderdiniz. Güvenlik koruması nedeniyle geçici olarak engellendiniz. Lütfen 15 dakika sonra tekrar deneyiniz.",
        requestId
      }
    });
  }
});

/**
 * AI API Specific rate limiter - Gemini Cost and abuse protection.
 * Allows up to 30 requests per 15 minutes per IP address.
 */
export const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 mins
  limit: 30, // Allow up to 30 requests per 15 mins per IP for Gemini security
  standardHeaders: "draft-7",
  legacyHeaders: false,
  handler: (req, res) => {
    const requestId = `req-${crypto.randomBytes(8).toString("hex")}`;
    res.status(429).json({
      error: {
        code: "AI_RATE_LIMIT_EXCEEDED",
        message: "Gemini yapay zeka asistanı için tanımlanan kullanım veya maliyet sınırını aştınız. Lütfen bir süre sonra tekrar deneyiniz.",
        requestId
      }
    });
  }
});
