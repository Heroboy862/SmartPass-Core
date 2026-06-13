/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Router, Request, Response } from "express";
import { getWeatherForAirports } from "../services/weatherService";

const router = Router();

// Endpoint to fetch weather information for departure and destination airports
router.get("/info", (req: Request, res: Response) => {
  const from = (req.query.from as string) || "IST";
  const fromCity = (req.query.fromCity as string) || "İstanbul";
  const to = (req.query.to as string) || "LHR";
  const toCity = (req.query.toCity as string) || "Londra";

  try {
    const weatherData = getWeatherForAirports(from, fromCity, to, toCity);
    res.json(weatherData);
  } catch (error: any) {
    console.error("Error in weather route:", error);
    res.status(500).json({ error: "Havalimanı hava durumu bilgisi hesaplanamadı." });
  }
});

export default router;
