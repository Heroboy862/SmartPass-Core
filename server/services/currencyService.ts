let ratesCache: {
  rates: Record<string, number> | null;
  lastFetched: number;
} = {
  rates: null,
  lastFetched: 0
};

export async function getLiveRates(): Promise<Record<string, number> | null> {
  const now = Date.now();
  // 1 hour cache
  if (ratesCache.rates && (now - ratesCache.lastFetched) < 3600000) {
    return ratesCache.rates;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);
    
    const response = await fetch("https://open.er-api.com/v6/latest/TRY", { signal: controller.signal });
    clearTimeout(timeoutId);

    if (response.ok) {
      const data: any = await response.json();
      if (data && data.rates) {
        ratesCache = {
          rates: data.rates,
          lastFetched: now
        };
        console.log("Döviz kurları API üzerinden güncellendi.");
        return data.rates;
      }
    }
  } catch (err: any) {
    console.warn("Canlı döviz kurları alınamadı, yerel eşleşme kullanılacak. Hata:", err.message);
  }

  return ratesCache.rates;
}

export function getCurrencyInfo(toCity: string, toCode: string, liveRates?: Record<string, number>) {
  const city = (toCity || "").toLowerCase();
  const code = (toCode || "").toUpperCase();

  // Load fallback rates from environment variables or use robust static constants
  const envFbGbp = process.env.FALLBACK_GBP ? parseFloat(process.env.FALLBACK_GBP) : 50.45;
  const envFbRub = process.env.FALLBACK_RUB ? parseFloat(process.env.FALLBACK_RUB) : 0.39;
  const envFbEur = process.env.FALLBACK_EUR ? parseFloat(process.env.FALLBACK_EUR) : 42.20;
  const envFbUsd = process.env.FALLBACK_USD ? parseFloat(process.env.FALLBACK_USD) : 38.85;

  const fbGbp = isNaN(envFbGbp) ? 50.45 : envFbGbp;
  const fbRub = isNaN(envFbRub) ? 0.39 : envFbRub;
  const fbEur = isNaN(envFbEur) ? 42.20 : envFbEur;
  const fbUsd = isNaN(envFbUsd) ? 38.85 : envFbUsd;

  let currencyCode = "TRY";
  let currencyName = "Türk Lirası";
  let symbol = "₺";
  let fallbackRate = 1.0;

  // Real-world mappings based on destination code or city descriptions
  if (code === "LHR" || city.includes("londra") || city.includes("london") || city.includes("ingiltere") || city.includes("united kingdom") || city.includes("gbr")) {
    currencyCode = "GBP";
    currencyName = "İngiliz Sterlini";
    symbol = "£";
    fallbackRate = fbGbp;
  } else if (code === "MOW" || city.includes("moskova") || city.includes("rusya") || city.includes("rus") || city.includes("rub")) {
    currencyCode = "RUB";
    currencyName = "Rus Rublesi";
    symbol = "₽";
    fallbackRate = fbRub;
  } else if (city.includes("paris") || city.includes("frankfurt") || city.includes("berlin") || city.includes("roma") || city.includes("amsterdam") || city.includes("almanya") || city.includes("fransa") || code === "CDG" || code === "FRA") {
    currencyCode = "EUR";
    currencyName = "Euro";
    symbol = "€";
    fallbackRate = fbEur;
  } else if (city.includes("new york") || city.includes("miami") || city.includes("los angeles") || city.includes("amerika") || city.includes("abd") || city.includes("usa") || code === "JFK" || code === "LAX") {
    currencyCode = "USD";
    currencyName = "Amerikan Doları";
    symbol = "$";
    fallbackRate = fbUsd;
  }

  let rate = fallbackRate;
  
  if (currencyCode === "TRY") {
    let usdRate = fbUsd;
    if (liveRates && liveRates["USD"]) {
      const apiUsdRate = 1 / liveRates["USD"];
      if (apiUsdRate > 0 && !isNaN(apiUsdRate)) {
        usdRate = Math.round(apiUsdRate * 100) / 100;
      }
    }
    return {
      fromCurrency: "TRY",
      toCurrency: "TRY",
      currencyName: "Türk Lirası",
      symbol: "₺",
      rate: 1.0,
      inverseRate: 1.0,
      trend: "stable",
      isDomestic: true,
      terminalUsdRate: usdRate // terminal convenience USD tracking for duty free shopping
    };
  }

  if (liveRates && liveRates[currencyCode]) {
    const apiRate = 1 / liveRates[currencyCode];
    if (apiRate > 0 && !isNaN(apiRate)) {
      rate = Math.round(apiRate * 100) / 100;
    }
  }

  return {
    fromCurrency: "TRY",
    toCurrency: currencyCode,
    currencyName,
    symbol,
    rate,
    inverseRate: Math.round((1 / rate) * 10000) / 10000,
    trend: rate > fallbackRate ? "up" : rate < fallbackRate ? "down" : "stable",
    isDomestic: false
  };
}
