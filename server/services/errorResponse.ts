import { Response } from "express";
import crypto from "crypto";

/**
 * Standardized ApiError structure based on enterprise guidelines:
 * { "error": { "code": "INVALID_BCBP", "message": "...", "requestId": "..." } }
 */
export interface ErrorDetail {
  code: string;
  message: string;
  requestId: string;
}

export interface StandardErrorResponse {
  error: ErrorDetail;
}

/**
 * Sends a standardized API error response.
 * 
 * @param res Express response object
 * @param statusCode HTTP Status Code (e.g., 400, 401, 403, 404, 500)
 * @param code High-level string error identifier (e.g. 'INVALID_BCBP', 'VALIDATION_ERROR', 'NOT_FOUND')
 * @param message Human-readable error description
 * @param customRequestId Optional request ID if already tracked in request headers or context
 */
export function sendError(
  res: Response,
  statusCode: number,
  code: string,
  message: string,
  customRequestId?: string
): Response<StandardErrorResponse> {
  const requestId = customRequestId || `req-${crypto.randomBytes(8).toString("hex")}`;
  
  return res.status(statusCode).json({
    error: {
      code: code.toUpperCase(),
      message,
      requestId
    }
  });
}
