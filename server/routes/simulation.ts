import { Router, Request, Response } from "express";
import { getSimVariables, updateSimVariables } from "../data/mockFlights";
import { autoCleanClosedFlightUsers } from "../services/firestoreSync";
import { FlightAdapterHub } from "../services/flightAdapter";
import { sendError } from "../services/errorResponse";

const router = Router();

// Route to fetch simulated variables
router.get("/state", async (req: Request, res: Response) => {
  // Security lock for production environment
  if (process.env.NODE_ENV === "production") {
    const headerKey = req.headers["x-simulation-api-key"] || req.headers["authorization"];
    const expectedKey = process.env.SIMULATION_API_KEY;

    if (!expectedKey || headerKey !== expectedKey) {
      return sendError(
        res,
        403,
        "FORBIDDEN",
        "Simulation state endpoints are disabled or require administrative API key in production."
      );
    }
  }

  const vars = getSimVariables();
  if (vars.flightNumber) {
    try {
      await FlightAdapterHub.getInstance().syncFlightNow(vars.flightNumber);
    } catch (e) {
      console.warn("Server-side initial simulator seed failed:", e);
    }
  }
  res.json(vars);
});

// Route to update simulated variables from the developer sidebar dashboard
router.post("/update", async (req: Request, res: Response) => {
  // Security lock for production environment
  if (process.env.NODE_ENV === "production") {
    const headerKey = req.headers["x-simulation-api-key"] || req.headers["authorization"];
    const expectedKey = process.env.SIMULATION_API_KEY;

    if (!expectedKey || headerKey !== expectedKey) {
      return sendError(
        res,
        403,
        "FORBIDDEN",
        "Simulation update endpoints are disabled or require administrative API key in production."
      );
    }
  }

  // 1. Whitelist Fields Validation & Sanitization
  const allowedFields = ["flightNumber", "boardingStatus", "securityQueueTime", "gate", "delayReason"];
  const receivedKeys = Object.keys(req.body);
  const invalidKeys = receivedKeys.filter(key => !allowedFields.includes(key));

  if (invalidKeys.length > 0) {
    return sendError(
      res,
      400,
      "VALIDATION_ERROR",
      `Yetkisiz veya geçersiz parametre saptandı: [${invalidKeys.join(", ")}]. Sadece şu alanlar güncellenebilir: ${allowedFields.join(", ")}`
    );
  }

  // Sanitize and structure the update payload
  const updatePayload: any = {};

  if (req.body.flightNumber !== undefined) {
    if (typeof req.body.flightNumber !== "string" || req.body.flightNumber.length > 15) {
      return sendError(
        res,
        400,
        "VALIDATION_ERROR",
        "flightNumber geçerli bir hava yolu uçuş kodu formatında olmalıdır (maks 15 karakter)."
      );
    }
    updatePayload.flightNumber = req.body.flightNumber.trim();
  }

  if (req.body.boardingStatus !== undefined) {
    const validStatusValues = ["Boarding Now", "Waiting", "Closed", "Delayed", "Cancelled"];
    if (!validStatusValues.includes(req.body.boardingStatus)) {
      return sendError(
        res,
        400,
        "VALIDATION_ERROR",
        `boardingStatus şu değerlerden biri olmalıdır: ${validStatusValues.join(", ")}`
      );
    }
    updatePayload.boardingStatus = req.body.boardingStatus;
  }

  if (req.body.securityQueueTime !== undefined) {
    const queueTime = Number(req.body.securityQueueTime);
    if (isNaN(queueTime) || queueTime < 0 || queueTime > 240) {
      return sendError(
        res,
        400,
        "VALIDATION_ERROR",
        "securityQueueTime 0 ile 240 dakika arasında geçerli bir sayı olmalıdır."
      );
    }
    updatePayload.securityQueueTime = Math.round(queueTime);
  }

  if (req.body.gate !== undefined) {
    if (typeof req.body.gate !== "string" || req.body.gate.length > 20) {
      return sendError(
        res,
        400,
        "VALIDATION_ERROR",
        "gate kapı tanımı maksimum 20 karakter uzunluğunda bir metin olmalıdır."
      );
    }
    updatePayload.gate = req.body.gate.trim();
  }

  if (req.body.delayReason !== undefined) {
    if (typeof req.body.delayReason !== "string" || req.body.delayReason.length > 500) {
      return sendError(
        res,
        400,
        "VALIDATION_ERROR",
        "delayReason (rötar gerekçesi) maksimum 500 karakter sınırına tabidir."
      );
    }
    updatePayload.delayReason = req.body.delayReason.trim();
  }

  const updated = updateSimVariables(updatePayload);
  if (updated.flightNumber) {
    await FlightAdapterHub.getInstance().syncFlightNow(updated.flightNumber);

    // Dynamic corporate push alert dispatch when flight status or gate alters
    const { dispatchFlightPushNotifications } = await import("../services/pushService");
    
    if (updatePayload.gate !== undefined) {
      await dispatchFlightPushNotifications(updated.flightNumber, "GATE_CHANGE", {
        title: "AeroPass - Kapı Güncellendi 🚪",
        body: `${updated.flightNumber} uçuşunuzun biniş kapısı ${updatePayload.gate} olarak güncellenmiştir. Lütfen panonuzu kontrol edin.`,
        gate: updatePayload.gate,
        boardingStatus: updated.boardingStatus
      });
    } else if (updatePayload.boardingStatus === "Delayed") {
      await dispatchFlightPushNotifications(updated.flightNumber, "DELAY", {
        title: "AeroPass - Uçuş Bilgilendirmesi ⚠️",
        body: `${updated.flightNumber} uçuşunda rötar veya operasyonel düzenleme mevcuttur. Detaylar ve kriz yönetimi için lütfen tıklayın.`,
        gate: updated.gate,
        boardingStatus: "Delayed"
      });
    } else if (updatePayload.boardingStatus === "Cancelled") {
      await dispatchFlightPushNotifications(updated.flightNumber, "CANCELLATION", {
        title: "AeroPass - Uçuş İPTAL Edildi 🚨",
        body: `${updated.flightNumber} uçuşunuz üzülerek iptal edilmiştir. Yolcu haklarınız ve alternatif uçuşlar için asistanınız hazır.`,
        gate: updated.gate,
        boardingStatus: "Cancelled"
      });
    } else if (updatePayload.boardingStatus === "Boarding Now") {
      await dispatchFlightPushNotifications(updated.flightNumber, "BOARDING", {
        title: "AeroPass - Uçuş Biniş Çağrısı ✈️",
        body: `${updated.flightNumber} uçuşu için biniş işlemleri başladı. En kısa sürede ${updated.gate || "G12"} kapısına yöneliniz!`,
        gate: updated.gate,
        boardingStatus: "Boarding Now"
      });
    }

    // Dynamic KVKK Data Retention policy - auto purge passenger records once flight departs/closes
    if (updated.boardingStatus === "Closed") {
      await autoCleanClosedFlightUsers(updated.flightNumber);
    }
  }
  res.json({ success: true, state: updated, variables: updated });
});

export default router;
