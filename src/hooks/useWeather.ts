/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from "react";

export interface WeatherDetail {
  code: string;
  city: string;
  temp: number;
  feelsLike: number;
  condition: string;
  icon: "sunny" | "cloudy" | "rainy" | "windy" | "stormy" | "foggy";
  humidity: number;
  windSpeed: number;
  visibility: string;
  aviationStatus: "Normal" | "Caution - crosswinds" | "Caution - low visibility" | "Caution - rainy runway";
  aviationStatusDetail: string;
}

export interface FlightWeather {
  from: WeatherDetail;
  to: WeatherDetail;
  updatedAt: string;
}

export function useWeather(
  from?: string,
  fromCity?: string,
  to?: string,
  toCity?: string
) {
  const [weatherData, setWeatherData] = useState<FlightWeather | null>(null);
  const [weatherLoading, setWeatherLoading] = useState<boolean>(false);
  const [weatherError, setWeatherError] = useState<string | null>(null);

  useEffect(() => {
    if (!from || !to) return;

    setWeatherLoading(true);
    setWeatherError(null);

    const controller = new AbortController();

    const url = `/api/weather/info?from=${encodeURIComponent(
      from
    )}&fromCity=${encodeURIComponent(fromCity || "")}&to=${encodeURIComponent(
      to
    )}&toCity=${encodeURIComponent(toCity || "")}`;

    fetch(url, { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error("Hava durumu bilgisi yüklenemedi.");
        return res.json();
      })
      .then((data) => {
        setWeatherData(data);
        setWeatherLoading(false);
      })
      .catch((err) => {
        if (err.name !== "AbortError") {
          console.error("Hava durumu hatası:", err);
          setWeatherError(err.message || "Bilinmeyen bir hata oluştu");
          setWeatherLoading(false);
        }
      });

    return () => {
      controller.abort();
    };
  }, [from, fromCity, to, toCity]);

  return {
    weatherData,
    weatherLoading,
    weatherError,
  };
}
