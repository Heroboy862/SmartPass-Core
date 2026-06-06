import React, { useState, useEffect } from "react";
import { Bus, Clock, ChevronUp, ChevronDown, Sparkles, ArrowRight, ClipboardList } from "lucide-react";
import { FlightInfo } from "../../types";

export interface TurkeyHub {
  id: string;
  name: string;
  desc: string;
  provider: string;
}

const TURKEY_HUBS: TurkeyHub[] = [
  { id: "istanbul-ist", name: "İstanbul-IST", desc: "İstanbul Yeni Havalimanı", provider: "HAVAİST" },
  { id: "istanbul-saw", name: "İstanbul-SAW", desc: "Sabiha Gökçen Havalimanı", provider: "Metro, İETT & Havaş" },
  { id: "izmir", name: "İzmir-ADB", desc: "Adnan Menderes Havalimanı", provider: "HAVAŞ" },
  { id: "ankara", name: "Ankara-ESB", desc: "Esenboğa Havalimanı", provider: "Belko Air & EGO" },
  { id: "antalya", name: "Antalya-AYT", desc: "Antalya Havalimanı", provider: "Tram & Havaş" },
  { id: "mugla", name: "Muğla-BJV/DLM", desc: "Bodrum & Dalaman Bölgesi", provider: "Muttaş & Havaş" }
];

const getHubShortName = (id: string): string => {
  switch (id) {
    case "istanbul-ist": return "İstanbul Yeni Havalimanı";
    case "istanbul-saw": return "İstanbul Sabiha Gökçen";
    case "izmir": return "İzmir Adnan Menderes";
    case "ankara": return "Ankara Esenboğa";
    case "antalya": return "Antalya Havalimanı";
    case "mugla": return "Muğla Bölgesi";
    default: return "Havalimanı";
  }
};

const getNextDeparture = (times: string[]) => {
  const now = new Date();
  const currentHours = now.getHours();
  const currentMinutes = now.getMinutes();
  const currentTotal = currentHours * 60 + currentMinutes;

  const upcoming = times.find(timeStr => {
    const [h, m] = timeStr.split(":").map(Number);
    return (h * 60 + m) > currentTotal;
  });

  return upcoming || times[0];
};

interface TransitConsoleProps {
  flightData: FlightInfo;
}

export function TransitConsole({ flightData }: TransitConsoleProps) {
  // Find matching initial hub according to passenger ticket origin or destination
  const getInitialHub = () => {
    const fromCode = (flightData.from || "").toUpperCase();
    const toCode = (flightData.to || "").toUpperCase();
    const fromCity = (flightData.fromCity || "").toLowerCase();
    const toCity = (flightData.toCity || "").toLowerCase();

    if (fromCode === "ADB" || toCode === "ADB" || fromCity.includes("izmir") || toCity.includes("izmir")) return "izmir";
    if (fromCode === "ESB" || toCode === "ESB" || fromCity.includes("ankara") || toCity.includes("ankara")) return "ankara";
    if (fromCode === "AYT" || toCode === "AYT" || fromCity.includes("antalya") || toCity.includes("antalya")) return "antalya";
    if (fromCode === "SAW" || toCode === "SAW" || fromCity.includes("gökçen") || toCity.includes("gökçen")) return "istanbul-saw";
    if (fromCode === "BJV" || toCode === "BJV" || fromCode === "DLM" || toCode === "DLM" || fromCity.includes("bodrum") || fromCity.includes("dalaman") || fromCity.includes("muğla")) return "mugla";
    return "istanbul-ist";
  };

  const initialHub = getInitialHub();
  const [selectedHub, setSelectedHub] = useState<string>(initialHub);

  // Set default route key based on calculated default region
  const getInitialRouteKey = () => {
    if (initialHub === "izmir") return "havas-mavi";
    if (initialHub === "ankara") return "belko-442";
    if (initialHub === "antalya") return "antray-tram";
    if (initialHub === "istanbul-saw") return "m4-metro";
    if (initialHub === "mugla") return "muttas-bodrum";
    return "hvist-14";
  };
  const [selectedRoute, setSelectedRoute] = useState<string>(getInitialRouteKey());
  const [expandedTransport, setExpandedTransport] = useState<boolean>(false);

  // Real-time server-side transportation state
  const [serverRoutes, setServerRoutes] = useState<any[]>([]);
  const [serverLoading, setServerLoading] = useState<boolean>(true);
  const [serverError, setServerError] = useState<string | null>(null);

  // Fetch transport routes and smart suggestions from background service
  useEffect(() => {
    setServerLoading(true);
    setServerError(null);
    const depTime = flightData.departureTime || "22:15";
    const destCity = flightData.toCity || "İzmir";

    fetch(`/api/transport/schedule?hub=${encodeURIComponent(selectedHub)}&airport=${encodeURIComponent(flightData.from || "IST")}&departureTime=${encodeURIComponent(depTime)}&toCity=${encodeURIComponent(destCity)}`)
      .then((res) => {
        if (!res.ok) {
          throw new Error("Ulaşım servis bilgisi alınamadı");
        }
        return res.json();
      })
      .then((data) => {
        const routes = data.routes || [];
        setServerRoutes(routes);
        if (routes.length > 0) {
          const matched = routes.find((r: any) => r.id === selectedRoute);
          if (!matched) {
            setSelectedRoute(routes[0].id);
          }
        }
        setServerLoading(false);
      })
      .catch((err) => {
        console.error("Ulaşım yükleme hatası:", err);
        setServerError(err.message);
        setServerLoading(false);
      });
  }, [selectedHub, flightData.departureTime, flightData.from, flightData.toCity]);

  const currentRoute = serverRoutes.find((r: any) => r.id === selectedRoute) || {
    name: "Seçili Hat",
    price: 250,
    stops: [],
    times: [],
    frequency: "30 dakikada bir",
    platform: "Gelen Yolcu Peronu",
    recommendedTime: "08:00",
    rationale: "Ulaşım bağlantı planı ve asistan kalkış tavsiyesi hesaplanıyor."
  };

  return (
    <div id="transport-hub" className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between transition-all duration-300">
      <div className="flex justify-between items-center pb-3.5 border-b border-slate-100">
        <div className="flex items-center gap-2.5 text-left">
          <div className="bg-indigo-50 p-2.5 rounded-2xl text-indigo-600">
            <Bus className={`w-5 h-5 ${serverLoading ? "animate-bounce" : ""}`} />
          </div>
          <div>
            <span className="text-indigo-600 text-xs font-black uppercase tracking-wider leading-none block">Havalimanı Seferleri</span>
            <span className="text-[8.5px] font-bold text-slate-400 block mt-1 uppercase">TÜRKİYE ULUSAL TRANSFER VE SEFER SİSTEMİ</span>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {serverLoading && (
            <span className="text-[9px] font-bold text-indigo-600 animate-pulse bg-indigo-50 px-2.5 py-0.5 rounded-full">Senkronize ediliyor...</span>
          )}
          <button 
            onClick={() => setExpandedTransport(!expandedTransport)}
            className="text-xs text-indigo-700 hover:text-indigo-900 hover:bg-slate-100 p-1.5 px-3 rounded-full font-black uppercase flex items-center gap-1 cursor-pointer transition-all"
          >
            {expandedTransport ? (
              <>Dür <ChevronUp className="w-3.5 h-3.5 text-slate-500" /></>
            ) : (
              <>Tümünü Gör <ChevronDown className="w-3.5 h-3.5 text-slate-500" /></>
            )}
          </button>
        </div>
      </div>

      {/* Collapsed minimal preview block */}
      {!expandedTransport ? (
        <div className="text-left mt-3 pt-1 flex justify-between items-center">
          <div>
            <span className="text-[8px] bg-emerald-100 text-emerald-800 rounded px-1.5 py-0.5 font-bold uppercase tracking-wide inline-flex items-center gap-1 animate-pulse">
              ⭐ AeroAI Sefer Tavsiyesi ({getHubShortName(selectedHub)})
            </span>
            <h4 className="text-slate-800 text-sm font-black mt-2">
              {currentRoute.name}
            </h4>
            <div className="flex flex-wrap items-center gap-2 mt-1.5 text-[11px] text-slate-500 font-semibold">
              <span className="flex items-center gap-1 text-indigo-700 font-extrabold bg-indigo-50 px-2 py-0.5 rounded">
                💰 {currentRoute.price} TL
              </span>
              <span>|</span>
              <span className="flex items-center gap-1 bg-amber-50 text-amber-800 px-2 py-0.5 rounded font-black border border-amber-200">
                🕒 Önerilme Saati: {currentRoute.recommendedTime || "Hesaplanıyor"}
              </span>
            </div>
          </div>
          <button
            onClick={() => setExpandedTransport(true)}
            className="w-10 h-10 bg-indigo-50 hover:bg-indigo-100 hover:scale-105 active:scale-95 text-indigo-700 rounded-xl flex items-center justify-center transition-all cursor-pointer"
            aria-label="Havalimanı ulaşım ve otobüs sefer saatleri detaylarını görüntüleyin"
          >
            <ArrowRight className="w-4.5 h-4.5" />
          </button>
        </div>
      ) : (
        /* Fully Expanded Interactive Transit Core */
        <div className="mt-4 space-y-4 animate-fade-in text-left">
          
          {/* Dynamic Turkish Regional City/Hub Tag Picker */}
          <div className="space-y-1.5">
            <label className="text-[8.5px] font-extrabold text-slate-400 uppercase tracking-widest pl-1">Aktif Havalimanı Bölgesini Seçin</label>
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
              {TURKEY_HUBS.map((hub) => {
                const isSelected = selectedHub === hub.id;
                const isPassengerLocation = hub.id === initialHub;
                return (
                  <button
                    key={hub.id}
                    type="button"
                    onClick={() => {
                      setSelectedHub(hub.id);
                    }}
                    className={`inline-flex items-center gap-1.5 shrink-0 px-3.5 py-2 rounded-2xl text-[10px] font-black uppercase tracking-wide border transition-all cursor-pointer ${
                      isSelected
                        ? "bg-indigo-900 border-indigo-900 text-white shadow-xs"
                        : "bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    {hub.name}
                    {isPassengerLocation && (
                      <span className={`text-[7px] font-black px-1.5 py-0.5 rounded-full inline-block ${
                        isSelected ? "bg-amber-400 text-slate-950 animate-pulse" : "bg-emerald-100 text-emerald-800"
                      }`}>
                        KONUMUNUZ
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Route Picker Dropdown */}
          <div className="space-y-1">
            <label className="text-[8.5px] font-extrabold text-slate-400 uppercase tracking-widest pl-1">Sefer Noktası / Güzergah Seçin</label>
            <div className="relative">
              <select
                value={selectedRoute}
                onChange={(e) => setSelectedRoute(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 p-3 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all appearance-none cursor-pointer"
              >
                {serverRoutes.map((route) => (
                  <option key={route.id} value={route.id}>
                    {route.name} - {route.price} TL
                  </option>
                ))}
                {serverRoutes.length === 0 && (
                  <option value={selectedRoute}>Sefer planlamaları yükleniyor...</option>
                )}
              </select>
              <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                <ChevronDown className="w-4 h-4" />
              </div>
            </div>
          </div>

          {/* Route Metric Cards Grid */}
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="bg-indigo-50/40 p-2.5 rounded-2xl border border-indigo-100/30 flex flex-col justify-center min-h-[58px]">
              <Clock className="w-3.5 h-3.5 text-indigo-600 mx-auto mb-1" />
              <span className="text-[7.5px] font-bold text-slate-400 uppercase block">Sefer Sıklığı</span>
              <p className="text-[10px] font-extrabold text-slate-800 leading-none mt-1">
                {currentRoute.frequency}
              </p>
            </div>
            <div className="bg-amber-50 p-2.5 rounded-2xl border border-amber-250 flex flex-col justify-center min-h-[58px] relative overflow-hidden">
              <div className="absolute right-1 top-1 w-1.5 h-1.5 bg-amber-500 rounded-full animate-ping"></div>
              <Sparkles className="w-3.5 h-3.5 text-amber-600 mx-auto mb-1" />
              <span className="text-[7.5px] font-black text-amber-800 uppercase block">Önerilen Sefer</span>
              <p className="text-[11px] font-mono font-black text-slate-900 leading-none mt-1 animate-pulse">
                🌟 {currentRoute.recommendedTime}
              </p>
            </div>
            <div className="bg-emerald-50/40 p-2.5 rounded-2xl border border-emerald-100/30 flex flex-col justify-center min-h-[58px]">
              <ClipboardList className="w-3.5 h-3.5 text-emerald-600 mx-auto mb-1" />
              <span className="text-[7.5px] font-bold text-slate-400 uppercase block">Kalkış Peronu</span>
              <p className="text-[9.5px] font-extrabold text-slate-800 leading-tight mt-1">
                {currentRoute.platform}
              </p>
            </div>
          </div>

          {/* AI Rationale banner card */}
          {currentRoute.rationale && (
            <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-2xl flex items-start gap-2">
              <Sparkles className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
              <div className="text-[10px] text-slate-600 leading-relaxed font-semibold">
                <strong className="text-slate-850 block mb-0.5">Ulaşım Raporu:</strong>
                {currentRoute.rationale}
              </div>
            </div>
          )}

          {/* Dynamic stop timeline tracker */}
          <div className="my-2 p-3 bg-white border border-slate-205 rounded-2xl">
            <h5 className="text-[8.5px] font-extrabold text-indigo-900 uppercase tracking-widest mb-3 pl-1">Sefer Durakları & Güzergah Şeması</h5>
            <div className="space-y-3.5 relative pl-4 before:content-[''] before:absolute before:left-[19.5px] before:top-1.5 before:bottom-1.5 before:w-0.5 before:bg-slate-100">
              {currentRoute.stops && currentRoute.stops.map((stop: string, sIdx: number) => (
                <div key={sIdx} className="flex items-center gap-3 relative">
                  <div className={`w-3 h-3 rounded-full absolute left-[-16px] border bg-white z-10 ${
                    sIdx === 0
                      ? "border-indigo-600 ring-4 ring-indigo-100 bg-indigo-600"
                      : sIdx === currentRoute.stops.length - 1
                        ? "border-emerald-600 ring-4 ring-emerald-100"
                        : "border-slate-350"
                  }`} />
                  <span className="text-[11px] font-extrabold text-slate-700">{stop}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Complete active timeline scheduling board */}
          {currentRoute.times && currentRoute.times.length > 0 && (
            <div className="space-y-1.5">
              <label className="text-[8.5px] font-extrabold text-slate-400 uppercase tracking-widest pl-1">Günlük Güncel Sefer Saatleri</label>
              <div className="flex flex-wrap gap-1.5">
                {currentRoute.times.map((t: string, tIdx: number) => {
                  const isNext = getNextDeparture(currentRoute.times) === t;
                  return (
                    <span
                      key={tIdx}
                      className={`text-[9px] font-mono font-black border px-2.5 py-1.5 rounded-xl ${
                        isNext
                          ? "bg-indigo-900 border-indigo-900 text-white animate-pulse"
                          : "bg-white border-slate-200 text-slate-600"
                      }`}
                    >
                      {t}
                      {isNext && " (Sıradaki)"}
                    </span>
                  );
                })}
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  );
}
