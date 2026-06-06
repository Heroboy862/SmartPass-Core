import { Router, Request, Response } from "express";
import { MOCK_BOARDINGS, getSimVariables } from "../data/mockFlights";
import { parseBoardingPassText } from "../services/bcbpParser";
import { syncFlightToFirestore } from "../services/firestoreSync";
import { sendError } from "../services/errorResponse";

const router = Router();

router.post("/", async (req: Request, res: Response) => {
  const { rawText } = req.body;
  if (!rawText || typeof rawText !== "string" || rawText.trim() === "") {
    return sendError(res, 400, "INVALID_BCBP", "Tarama kodu veya biniş kartı metni sağlanamadı veya boş gönderildi.");
  }

  const parseResult = parseBoardingPassText(rawText);

  if (parseResult.custom && parseResult.data) {
    const parsedData = parseResult.data;
    if (parsedData.flightNumber) {
      await syncFlightToFirestore(
        parsedData.flightNumber,
        parsedData.boardingStatus,
        parsedData.securityQueueTime,
        parsedData.gate,
        "Uçuş kartı taramasıyla canlı sistemlere bağlandı."
      );
    }
    return res.json(parsedData);
  }

  const flightId = parseResult.flightId || "TK1903";

  // Retrieve current active state for that flight, blending in the simulator state if matches flightNumber
  const baseData = { ...MOCK_BOARDINGS[flightId] };
  const simVariables = getSimVariables();

  if (baseData && baseData.flightNumber === simVariables.flightNumber) {
    baseData.boardingStatus = simVariables.boardingStatus;
    baseData.securityQueueTime = simVariables.securityQueueTime;
    baseData.gate = simVariables.gate;
  }

  if (baseData && baseData.flightNumber) {
    await syncFlightToFirestore(
      baseData.flightNumber,
      baseData.boardingStatus,
      baseData.securityQueueTime,
      baseData.gate,
      simVariables.flightNumber === baseData.flightNumber ? simVariables.delayReason : "Normal operasyonel akış sağlandı."
    );
  }

  res.json(baseData);
});

export default router;
