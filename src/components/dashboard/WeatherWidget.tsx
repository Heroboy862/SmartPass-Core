/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { 
  Sun, 
  Cloud, 
  CloudRain, 
  Wind, 
  CloudLightning, 
  CloudFog, 
  Thermometer, 
  Droplets, 
  Plane,
  AlertTriangle,
  Info
} from "lucide-react";
import { useWeather, WeatherDetail } from "../../hooks/useWeather";
import { FlightInfo } from "../../types";

interface WeatherWidgetProps {
  flightData: FlightInfo;
}

export function WeatherWidget({ flightData }: WeatherWidgetProps) {
  const { weatherData, weatherLoading, weatherError } = useWeather(
    flightData.from,
    flightData.fromCity,
    flightData.to,
    flightData.toCity
  );

  const getWeatherIcon = (iconName: string, className: string = "w-6 h-6") => {
    switch (iconName) {
      case "sunny":
        return <Sun className={`${className} text-amber-500 animate-[spin_20s_linear_infinite]`} />;
      case "cloudy":
        return <Cloud className={`${className} text-slate-400`} />;
      case "rainy":
        return <CloudRain className={`${className} text-sky-400`} />;
      case "windy":
        return <Wind className={`${className} text-teal-400 animate-pulse`} />;
      case "stormy":
        return <CloudLightning className={`${className} text-indigo-500`} />;
      case "foggy":
        return <CloudFog className={`${className} text-slate-350`} />;
      default:
        return <Cloud className={`${className} text-slate-400`} />;
    }
  };

  const getAviationStatusColor = (status: WeatherDetail["aviationStatus"]) => {
    if (status === "Normal") return "bg-emerald-50 text-emerald-800 border-emerald-100";
    return "bg-amber-50 text-amber-950 border-amber-200 animate-pulse";
  };

  if (weatherLoading) {
    return (
      <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm flex flex-col items-center justify-center min-h-[140px] text-center">
        <div className="w-6 h-6 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin mb-2" />
        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Hava Durumu Verileri Yükleniyor...</p>
      </div>
    );
  }

  if (weatherError || !weatherData) {
    return null; // Fallback gracefully if there's any network or server error to keep dashboard clean
  }

  const hasAlert = weatherData.from.aviationStatus !== "Normal" || weatherData.to.aviationStatus !== "Normal";

  return (
    <div className="bg-white rounded-3xl overflow-hidden border border-slate-200 shadow-sm flex flex-col text-left font-sans">
      <div className="p-5 space-y-4">
        {/* Header/Title block */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-1.5">
            <span className="p-1 px-1.5 bg-indigo-50 text-indigo-700 rounded-lg text-[9px] font-black uppercase tracking-wider border border-indigo-100">
              Uçuş Güzergâhı
            </span>
            <span className="text-[10px] font-extrabold text-slate-550 uppercase tracking-widest leading-none">
              Hava Durumu & Meydan Durumu
            </span>
          </div>
          <span className="text-[8px] font-mono font-medium text-slate-400">
            Güncellendi: {new Date(weatherData.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>

        {/* Both Airports Comparison Grid */}
        <div className="grid grid-cols-2 gap-4 divide-x divide-slate-100">
          
          {/* Departure Airport (Kalkış) */}
          <div className="space-y-2 text-left pr-2">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[9px] font-bold text-indigo-600 uppercase tracking-wider block">Kalkış</span>
                <span className="text-xl font-black text-slate-900 leading-none block mt-0.5">{weatherData.from.code}</span>
                <span className="text-[9.5px] font-medium text-slate-500 truncate max-w-[120px] block mt-0.5">{weatherData.from.city}</span>
              </div>
              <div className="bg-slate-50 p-2 rounded-2xl border border-slate-150">
                {getWeatherIcon(weatherData.from.icon, "w-6 h-6")}
              </div>
            </div>

            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-2.5xl font-extrabold text-slate-900 leading-none">{weatherData.from.temp}°C</span>
              <span className="text-[9.5px] text-slate-400 font-medium">Hissedilen: {weatherData.from.feelsLike}°C</span>
            </div>

            <p className="text-[10px] font-bold text-slate-700 leading-snug">{weatherData.from.condition}</p>

            <div className="grid grid-cols-2 gap-1.5 pt-1.5 text-[9px] text-slate-500 font-medium">
              <div className="flex items-center gap-1">
                <Droplets className="w-3 h-3 text-sky-400 shrink-0" />
                <span>%{weatherData.from.humidity} Nem</span>
              </div>
              <div className="flex items-center gap-1">
                <Wind className="w-3 h-3 text-slate-400 shrink-0" />
                <span>{weatherData.from.windSpeed} km/s</span>
              </div>
            </div>
          </div>

          {/* Destination Airport (Varış) */}
          <div className="space-y-2 text-left pl-4">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-wider block font-sans">Varış</span>
                <span className="text-xl font-black text-slate-900 leading-none block mt-0.5 font-display">{weatherData.to.code}</span>
                <span className="text-[9.5px] font-medium text-slate-500 truncate max-w-[120px] block mt-0.5">{weatherData.to.city}</span>
              </div>
              <div className="bg-slate-50 p-2 rounded-2xl border border-slate-150">
                {getWeatherIcon(weatherData.to.icon, "w-6 h-6")}
              </div>
            </div>

            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-2.5xl font-extrabold text-slate-900 leading-none">{weatherData.to.temp}°C</span>
              <span className="text-[9.5px] text-slate-400 font-medium">Hissedilen: {weatherData.to.feelsLike}°C</span>
            </div>

            <p className="text-[10px] font-bold text-slate-700 leading-snug">{weatherData.to.condition}</p>

            <div className="grid grid-cols-2 gap-1.5 pt-1.5 text-[9px] text-slate-500 font-medium">
              <div className="flex items-center gap-1">
                <Droplets className="w-3 h-3 text-sky-400 shrink-0" />
                <span>%{weatherData.to.humidity} Nem</span>
              </div>
              <div className="flex items-center gap-1">
                <Wind className="w-3 h-3 text-slate-400 shrink-0" />
                <span>{weatherData.to.windSpeed} km/s</span>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Advisory warnings under current flight conditions */}
      {hasAlert ? (
        <div className="bg-amber-50/70 border-t border-amber-100 p-3 px-4.5 flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5 animate-bounce" />
          <div className="text-left font-sans">
            <span className="text-[9px] font-extrabold text-amber-900 uppercase tracking-wider block">Havacılık Operasyon Uyarısı</span>
            <p className="text-[10px] text-amber-950 font-medium leading-relaxed mt-0.5">
              {weatherData.from.aviationStatus !== "Normal" && (
                <span><strong>{weatherData.from.code} Kalkış:</strong> {weatherData.from.aviationStatusDetail} </span>
              )}
              {weatherData.to.aviationStatus !== "Normal" && (
                <span><strong>{weatherData.to.code} Varış:</strong> {weatherData.to.aviationStatusDetail} </span>
              )}
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-indigo-950 text-indigo-200 p-2 px-4.5 flex items-center justify-between text-[10px] font-semibold border-t border-slate-100">
          <div className="flex items-center gap-1.5">
            <Plane className="w-3.5 h-3.5 text-indigo-400 rotate-90" />
            <span>Tüm uçuş meydanları açık ve uçuş koşulları tamamen elverişli.</span>
          </div>
          <Info className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
        </div>
      )}
    </div>
  );
}
