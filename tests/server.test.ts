import { test } from "node:test";
import assert from "node:assert";

// Set localized sandbox env parameters to make unit assertions 100% deterministic 
// regardless of custom host overrides
process.env.FALLBACK_USD = "38.85";
process.env.FALLBACK_EUR = "42.20";
process.env.FALLBACK_GBP = "50.45";
process.env.FALLBACK_RUB = "0.39";

import { 
  parseBoardingPassText, 
  getCurrencyInfo, 
  getRuleBasedFallbackResponse 
} from "../server.ts";

test("Boarding Pass Parser - Predefined mapping tests", () => {
  // 1. Selim / TK1903
  const selimRes = parseBoardingPassText("SELIM");
  assert.strictEqual(selimRes.custom, false);
  assert.strictEqual(selimRes.flightId, "TK1903");

  // 2. Elif / PC2026
  const elifRes = parseBoardingPassText("PC-2026");
  assert.strictEqual(elifRes.custom, false);
  assert.strictEqual(elifRes.flightId, "PC2026");

  // 3. Dmitry / TK2108
  const dmitryRes = parseBoardingPassText("DMITRY");
  assert.strictEqual(dmitryRes.custom, false);
  assert.strictEqual(dmitryRes.flightId, "TK2108");

  // 4. Can / AJ4112
  const canRes = parseBoardingPassText("AJ-4112");
  assert.strictEqual(canRes.custom, false);
  assert.strictEqual(canRes.flightId, "AJ4112");
});

test("Boarding Pass Parser - Raw IATA BCBP manually string-parse tests", () => {
  // Typical binary format: M1[Passenger_Name]P[PNR] [Origin_Dest_Carrier_FlightNum] ...
  const bcbpString = "M1YILMAZ/SELIM E ABC1234 ISTLHRTK 1903 120Y012A0001 147";
  const result = parseBoardingPassText(bcbpString);

  assert.strictEqual(result.custom, true);
  assert.ok(result.data);
  
  const dat = result.data;
  assert.strictEqual(dat.passengerName, "YILMAZ SELIM");
  assert.strictEqual(dat.flightNumber, "TK-1903");
  assert.strictEqual(dat.from, "IST");
  assert.strictEqual(dat.to, "LHR");
  assert.strictEqual(dat.fromCity, "İstanbul");
  assert.strictEqual(dat.toCity, "Londra");
  assert.strictEqual(dat.airline, "Turkish Airlines");
  assert.strictEqual(dat.airportOperator, "İGA");
  assert.strictEqual(dat.gate, "A-01");
});

test("Boarding Pass Parser - Standard input edge cases", () => {
  const resultEmpty = parseBoardingPassText("");
  assert.strictEqual(resultEmpty.custom, false);
  assert.strictEqual(resultEmpty.flightId, "TK1903");

  const resultGibberish = parseBoardingPassText("RANDOM GIBBERISH STRING WITHOUT IATA PATTERNS");
  assert.strictEqual(resultGibberish.custom, false);
  assert.strictEqual(resultGibberish.flightId, "TK1903");
});

test("Dynamic Flow & Currency (getCurrencyInfo) - Destination detection", () => {
  // Londra / GBR -> GBP
  const gpInfo = getCurrencyInfo("Londra", "LHR");
  assert.strictEqual(gpInfo.toCurrency, "GBP");
  assert.strictEqual(gpInfo.symbol, "£");
  assert.strictEqual(gpInfo.isDomestic, false);

  // Moskova / Rusya -> RUB
  const ruInfo = getCurrencyInfo("Moskova", "MOW");
  assert.strictEqual(ruInfo.toCurrency, "RUB");
  assert.strictEqual(ruInfo.symbol, "₽");
  assert.strictEqual(ruInfo.isDomestic, false);

  // Paris / CDG / Frankurt / EUR
  const eurInfo = getCurrencyInfo("Paris", "CDG");
  assert.strictEqual(eurInfo.toCurrency, "EUR");
  assert.strictEqual(eurInfo.symbol, "€");
  assert.strictEqual(eurInfo.isDomestic, false);

  // New York / JFK / USA -> USD
  const usdInfo = getCurrencyInfo("New York", "JFK");
  assert.strictEqual(usdInfo.toCurrency, "USD");
  assert.strictEqual(usdInfo.symbol, "$");
  assert.strictEqual(usdInfo.isDomestic, false);

  // Domestic / Other -> TRY
  const domesticInfo = getCurrencyInfo("İzmir", "ADB");
  assert.strictEqual(domesticInfo.toCurrency, "TRY");
  assert.strictEqual(domesticInfo.symbol, "₺");
  assert.strictEqual(domesticInfo.isDomestic, true);
});

test("Dynamic Flow & Currency (getCurrencyInfo) - Live rates calculations", () => {
  // Test USD with live values inside currency mapping
  const rates = {
    USD: 0.025, // 1 / 0.025 = 40 TRY
    EUR: 0.022222, // 1 / 0.022222 = 45 TRY
    GBP: 0.0195, // 1 / 0.0195 = 51.28 TRY
    RUB: 2.5 // 1 / 2.5 = 0.4 TRY
  };

  const usdResult = getCurrencyInfo("Miami", "MIA", rates);
  assert.strictEqual(usdResult.toCurrency, "USD");
  assert.strictEqual(usdResult.rate, 40);

  const eurResult = getCurrencyInfo("Frankfurt", "FRA", rates);
  assert.strictEqual(eurResult.toCurrency, "EUR");
  assert.strictEqual(eurResult.rate, 45);

  const gbpResult = getCurrencyInfo("London", "LHR", rates);
  assert.strictEqual(gbpResult.toCurrency, "GBP");
  assert.strictEqual(gbpResult.rate, 51.28);

  const terminalTryResult = getCurrencyInfo("İzmir", "ADB", rates);
  assert.strictEqual(terminalTryResult.toCurrency, "TRY");
  // terminalUsdRate = 1 / 0.025 = 40
  assert.strictEqual(terminalTryResult.terminalUsdRate, 40);
});

test("Dynamic Flow & Currency (getCurrencyInfo) - Trends analysis", () => {
  const customFallbacks = {
    GBP: 0.018 // 1 / 0.018 = 55.56 (Greater than static 50.45)
  };
  const gbpResultUp = getCurrencyInfo("London", "LHR", customFallbacks);
  assert.strictEqual(gbpResultUp.trend, "up");

  const fallbackRatesLower = {
    GBP: 0.022 // 1 / 0.022 = 45.45 (Lower than static 50.45)
  };
  const gbpResultDown = getCurrencyInfo("London", "LHR", fallbackRatesLower);
  assert.strictEqual(gbpResultDown.trend, "down");
});

test("Plan B - Rule-based fallback response engine - Currency context questions", () => {
  const flight = {
    passengerName: "Mert Yılmaz",
    flightNumber: "TK-1903",
    from: "IST",
    to: "LHR",
    toCity: "Londra",
    boardingStatus: "Delayed",
    estimatedWalkTime: "8 dk",
    gate: "A-12",
    airline: "Turkish Airlines"
  };

  const currencyInfo = {
    currencyName: "İngiliz Sterlini",
    toCurrency: "GBP",
    symbol: "£",
    rate: 51.2,
    inverseRate: 0.0195,
    trend: "up",
    isDomestic: false
  };

  const responseText = getRuleBasedFallbackResponse("Para bozdurmam gerekiyor, kurlar nedir?", flight, currencyInfo);

  assert.ok(responseText.includes("Havalimanı Finansal Rehberi"));
  assert.ok(responseText.includes("İngiliz Sterlini"));
  assert.ok(responseText.includes("51.2 TRY"));
  assert.ok(responseText.includes("Döviz Bürosu Komisyonu"));
});

test("Plan B - Rule-based fallback response engine - SHY Passenger rights / Delays", () => {
  const flight = {
    passengerName: "Mert Yılmaz",
    flightNumber: "TK-1903",
    from: "IST",
    to: "LHR",
    toCity: "Londra",
    boardingStatus: "Delayed",
    estimatedWalkTime: "8 dk",
    gate: "A-12",
    airline: "Turkish Airlines"
  };

  const currencyInfo = {
    currencyName: "İngiliz Sterlini",
    toCurrency: "GBP",
    symbol: "£",
    rate: 50.45,
    inverseRate: 0.0198,
    trend: "stable",
    isDomestic: false
  };

  const responseText = getRuleBasedFallbackResponse("Uçağım rötar yaptı haklarım neler?", flight, currencyInfo);

  assert.ok(responseText.includes("Sivil Havacılık Yolcu Hakları"));
  assert.ok(responseText.includes("RÖTAR"));
  assert.ok(responseText.includes("SHY Yolcu Hakları"));
});

test("Plan B - Rule-based fallback response engine - Gate distance / walk calculations", () => {
  const flight = {
    passengerName: "Elif Demir",
    flightNumber: "PC-2026",
    from: "SAW",
    to: "ADB",
    toCity: "İzmir",
    boardingStatus: "Waiting",
    estimatedWalkTime: "12 dk",
    gate: "B-03",
    biometricVerified: true,
    airline: "Pegasus Airlines"
  };

  const currencyInfo = {
    currencyName: "Türk Lirası",
    toCurrency: "TRY",
    symbol: "₺",
    rate: 1.0,
    inverseRate: 1.0,
    trend: "stable",
    isDomestic: true
  };

  const responseText = getRuleBasedFallbackResponse("Kalkış kapısı nerede ve kaç dakikada giderim?", flight, currencyInfo);

  assert.ok(responseText.includes("Kapı ve Akıllı Geçiş Rehberi"));
  assert.ok(responseText.includes("Gate B-03"));
  assert.ok(responseText.includes("12 dk"));
  assert.ok(responseText.includes("Smart ID"));
});
