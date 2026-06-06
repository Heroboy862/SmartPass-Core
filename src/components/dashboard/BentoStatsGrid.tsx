import React from "react";
import { Navigation, CheckCircle, Coins, ArrowLeftRight, RefreshCw } from "lucide-react";
import { FlightInfo } from "../../types";
import { useCurrency } from "../../hooks/useCurrency";

interface BentoStatsGridProps {
  flightData: FlightInfo;
  showGateMap: boolean;
  setShowGateMap: (val: boolean) => void;
}

export function BentoStatsGrid({
  flightData,
  showGateMap,
  setShowGateMap
}: BentoStatsGridProps) {
  const { currencyData, currencyLoading } = useCurrency(
    flightData.toCity,
    flightData.to
  );

  return (
    <div className="grid grid-cols-2 gap-4">
      {/* Gate Widget */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between min-h-[165px] text-left">
        <div className="flex justify-between items-start">
          <div className="bg-orange-100 p-2.5 rounded-2xl text-orange-600">
            <Navigation className="w-4.5 h-4.5 -rotate-45" />
          </div>
          <p className="text-[9px] font-extrabold text-orange-600 tracking-wider uppercase">Kapı</p>
        </div>
        <div className="text-left mt-3">
          <h3 className="text-slate-600 text-[10px] font-extrabold uppercase tracking-wider">Biniş Kapısı</h3>
          <p className="text-4xl font-black text-slate-900 font-display leading-none mt-1">{flightData.gate}</p>
          <button 
            onClick={() => setShowGateMap(!showGateMap)}
            className="text-[11px] text-indigo-700 hover:text-indigo-950 font-bold uppercase tracking-wider mt-3.5 flex items-center gap-1.5 cursor-pointer bg-slate-50 hover:bg-slate-100 border border-slate-200 p-3 rounded-2xl min-h-[44px] transition-all"
            aria-label="Uçuş kalkış kapısına ulaşım süresi ve canlı yönlendirme haritasını görüntüle"
          >
            🚶 {flightData.estimatedWalkTime} • Rota
          </button>
        </div>
      </div>

      {/* Secure ID Biometric Verification card */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between min-h-[165px] text-left">
        <div className="flex justify-between items-start">
          <div className={`p-2.5 rounded-2xl ${flightData.biometricVerified ? "bg-emerald-100 text-emerald-600" : "bg-slate-100 text-slate-400"}`}>
            <CheckCircle className="w-4.5 h-4.5" />
          </div>
          <p className={`text-[9px] font-extrabold tracking-wider uppercase ${flightData.biometricVerified ? "text-emerald-600" : "text-slate-400"}`}>
            Smart ID
          </p>
        </div>
        <div className="text-left mt-3">
          <h3 className="text-slate-600 text-[10px] font-extrabold uppercase tracking-wider">Biyometrik</h3>
          <p className="text-xs font-bold text-slate-700 leading-tight mt-1">
            {flightData.biometricVerified 
              ? "Biyometriniz eşleşti. Kapıdan hızla geçebilirsiniz." 
              : "Kapıda manuel kimlik kontrolü gereklidir."}
          </p>
        </div>
      </div>

      {/* Destination Exchange Rate Mini Card */}
      <div className="col-span-2 bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-3xl p-5 border border-white/10 shadow-lg relative overflow-hidden flex flex-col justify-between min-h-[145px] text-left">
        <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 opacity-10 pointer-events-none">
          <Coins className="w-24 h-24 text-amber-400" />
        </div>

        <div className="flex justify-between items-start relative z-10 font-sans">
          <div className="flex items-center gap-2">
            <div className="bg-amber-500/20 p-2 rounded-xl text-amber-450 border border-amber-500/100">
              <Coins className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <p className="text-[9px] font-black uppercase tracking-wider text-amber-400">Canlı Döviz Kuru</p>
              <p className="text-[10px] font-medium text-slate-300 leading-none mt-0.5">Finansal Yol Arkadaşı</p>
            </div>
          </div>
          
          {currencyData && !currencyLoading && (
            <span className={`text-[8.5px] font-extrabold font-mono uppercase bg-slate-800/80 px-2' py-0.5 rounded border border-white/5 flex items-center gap-1 ${
              currencyData.trend === "up" ? "text-emerald-400" : currencyData.trend === "down" ? "text-rose-400" : "text-slate-300"
            }`}>
              <ArrowLeftRight className="w-2.5 h-2.5" />
              {currencyData.trend === "up" ? "YÜKSELİŞTE" : currencyData.trend === "down" ? "DÜŞÜŞTE" : "SABİT"}
            </span>
          )}
        </div>

        {currencyLoading ? (
          <div className="py-2 flex items-center gap-2 text-slate-400 text-xs">
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            <span>Kur verileri eşitleniyor...</span>
          </div>
        ) : currencyData ? (
          <div className="mt-2.5 relative z-10 font-sans">
            {currencyData.isDomestic ? (
              <>
                <div className="flex items-baseline gap-2">
                  <p className="text-lg font-black tracking-tight text-white font-display">Yurt İçi Uçuş</p>
                </div>
                <p className="text-[9.5px] text-slate-300 mt-1 leading-relaxed">
                  Uçuş para birimi <strong className="text-amber-300">Türk Lirası (₺)</strong>. Terminal içi lüks mağazalar ve Duty-Free referans kuru: <span className="font-mono font-bold text-white">1 USD = {currencyData.terminalUsdRate} ₺</span>
                </p>
              </>
            ) : (
              <>
                <div className="flex items-baseline gap-2">
                  <p className="text-2xl font-black font-display tracking-tight text-amber-400">
                    1 {currencyData.toCurrency} = <span className="text-white">{currencyData.rate} ₺</span>
                  </p>
                </div>
                <div className="flex justify-between items-center mt-1.5 pt-1.5 border-t border-white/10 text-[9.5px] text-slate-400">
                  <span>{currencyData.currencyName} ({currencyData.symbol})</span>
                  <span className="font-mono">1 ₺ = {currencyData.inverseRate} {currencyData.toCurrency}</span>
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="py-2 text-rose-300 text-xs text-left">
            Kur verisi yüklenemedi.
          </div>
        )}
      </div>
    </div>
  );
}
