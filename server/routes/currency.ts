import { Router, Request, Response } from "express";
import { getLiveRates, getCurrencyInfo } from "../services/currencyService";

const router = Router();

// Endpoint to expose exchange rate information cleanly to frontends
router.get("/rate", async (req: Request, res: Response) => {
  const toCity = req.query.toCity as string || "Londra";
  const toCode = req.query.to as string || "LHR";
  
  const liveRates = await getLiveRates();
  const info = getCurrencyInfo(toCity, toCode, liveRates || undefined);
  res.json(info);
});

export default router;
