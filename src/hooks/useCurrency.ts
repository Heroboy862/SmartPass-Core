import { useState, useEffect } from "react";

export interface CurrencyData {
  fromCurrency: string;
  toCurrency: string;
  currencyName: string;
  symbol: string;
  rate: number;
  inverseRate: number;
  trend: "up" | "down" | "stable";
  isDomestic: boolean;
  terminalUsdRate?: number;
}

export function useCurrency(toCity?: string, toCode?: string) {
  const [currencyData, setCurrencyData] = useState<CurrencyData | null>(null);
  const [currencyLoading, setCurrencyLoading] = useState<boolean>(false);
  const [currencyError, setCurrencyError] = useState<string | null>(null);

  useEffect(() => {
    if (!toCity || !toCode) return;

    setCurrencyLoading(true);
    setCurrencyError(null);

    const controller = new AbortController();

    fetch(
      `/api/currency/rate?toCity=${encodeURIComponent(toCity)}&to=${encodeURIComponent(toCode)}`,
      { signal: controller.signal }
    )
      .then((res) => {
        if (!res.ok) throw new Error("Döviz kuru yüklenemedi");
        return res.json();
      })
      .then((data) => {
        setCurrencyData(data);
        setCurrencyLoading(false);
      })
      .catch((err) => {
        if (err.name !== "AbortError") {
          console.error("Döviz kuru yükleme hatası:", err);
          setCurrencyError(err.message || "Bilinmeyen bir hata oluştu");
          setCurrencyLoading(false);
        }
      });

    return () => {
      controller.abort();
    };
  }, [toCity, toCode]);

  return {
    currencyData,
    currencyLoading,
    currencyError
  };
}
