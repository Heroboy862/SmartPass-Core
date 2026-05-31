import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  MapPin, Navigation, Compass, Store, Coffee, ShieldAlert, Footprints, 
  Accessibility, RefreshCw, AlertTriangle, ArrowRight, Layers, HelpCircle,
  ZoomIn, ZoomOut, ArrowUp, ArrowDown, ArrowLeft, ChevronDown, ChevronUp, Info
} from "lucide-react";
import { FlightInfo, AccessibilityProfile } from "../types";

interface TerminalMapProps {
  flightData: FlightInfo;
  accessibilityProfile?: AccessibilityProfile | null;
}

interface Landmark {
  id: string;
  name: string;
  turkishName: string;
  x: number;
  y: number;
  icon: React.ReactNode;
  description: string;
}

export default function TerminalMap({ flightData, accessibilityProfile }: TerminalMapProps) {
  // Predefined terminal landmarks
  const landmarks = useMemo<Landmark[]>(() => [
    { 
      id: "security", 
      name: "Security Point A", 
      turkishName: "A Girişi & Güvenlik", 
      x: 70, 
      y: 175, 
      icon: <ShieldAlert className="w-3.5 h-3.5" />,
      description: "Havalimanı ana güvenlik arama noktası. Canlı kuyruk süresi: " + (flightData.securityQueueTime || 15) + " dk."
    },
    { 
      id: "lounge", 
      name: "CIP Lounge", 
      turkishName: "CIP Özel Yolcu Salonu", 
      x: 220, 
      y: 75, 
      icon: <Coffee className="w-3.5 h-3.5" />,
      description: "Ayrıcalıklı dinlenme, çalışma ve ikram koridoru. Kapıya mesafe çok yakın."
    },
    { 
      id: "dutyfree", 
      name: "Duty Free Shop", 
      turkishName: "Duty Free Alışveriş Bölgesi", 
      x: 230, 
      y: 175, 
      icon: <Store className="w-3.5 h-3.5" />,
      description: "Dev gümrüksüz mağaza ve geleneksel Türk lezzetleri istasyonları."
    },
    { 
      id: "foodcourt", 
      name: "Terminal Food Court", 
      turkishName: "Yeme & İçme Alanı", 
      x: 220, 
      y: 275, 
      icon: <Coffee className="w-3.5 h-3.5" />,
      description: "Dünya mutfakları ve yerel kahve zincirlerinin bulunduğu terminal asma katı."
    }
  ], [flightData.securityQueueTime]);

  const [startPointId, setStartPointId] = useState<string>("security");
  const [selectedLandmarkId, setSelectedLandmarkId] = useState<string | null>(null);
  const [floorPlan, setFloorPlan] = useState<"floor1" | "floor2">("floor1");
  const [useMovingWalkways, setUseMovingWalkways] = useState<boolean>(true);
  const [wheelchairOnly, setWheelchairOnly] = useState<boolean>(accessibilityProfile?.enabled || false);
  const [hoveredFloor, setHoveredFloor] = useState<"floor1" | "floor2" | null>(null);
  const [legendOpen, setLegendOpen] = useState<boolean>(false);

  // Map Zoom & Pan Control States
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [panX, setPanX] = useState<number>(0);
  const [panY, setPanY] = useState<number>(0);

  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 0.25, 3));
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => {
      const next = Math.max(prev - 0.25, 1);
      if (next === 1) {
        setPanX(0);
        setPanY(0);
      } else {
        const maxPanX = (next - 1) * 300;
        const maxPanY = (next - 1) * 175;
        setPanX(curr => Math.min(Math.max(curr, -maxPanX), maxPanX));
        setPanY(curr => Math.min(Math.max(curr, -maxPanY), maxPanY));
      }
      return next;
    });
  };

  const handleReset = () => {
    setZoomLevel(1);
    setPanX(0);
    setPanY(0);
  };

  const handlePan = (direction: "left" | "right" | "up" | "down") => {
    const step = 45;
    const maxPanX = (zoomLevel - 1) * 300;
    const maxPanY = (zoomLevel - 1) * 175;

    if (direction === "left") setPanX(prev => Math.min(prev + step, maxPanX));
    if (direction === "right") setPanX(prev => Math.max(prev - step, -maxPanX));
    if (direction === "up") setPanY(prev => Math.min(prev + step, maxPanY));
    if (direction === "down") setPanY(prev => Math.max(prev - step, -maxPanY));
  };

  // Sync state if profile changes
  React.useEffect(() => {
    if (accessibilityProfile?.enabled !== undefined) {
      setWheelchairOnly(accessibilityProfile.enabled);
    }
  }, [accessibilityProfile]);

  // Determine Destination Gate position based on gate letter/number
  const gateVal = (flightData.gate || "A-12").toUpperCase().trim();
  const gateChar = gateVal.charAt(0);
  
  const destinationGate = useMemo(() => {
    // Generate logical positions toward the right side of terminal for gates
    let x = 500;
    let y = 175;
    let desc = "";

    if (gateChar === "A") {
      y = 90;
      desc = "Kuzey Terminal Çıkışı - İGA Havalimanı A Jet Köprüsü";
    } else if (gateChar === "B") {
      y = 175;
      desc = "Merkez Terminal Çıkışı - Hızlı Geçiş B Kapısı";
    } else if (gateChar === "C") {
      y = 260;
      desc = "Güney Terminal Çıkışı - HEAŞ / TAV Otobüs Biniş Kapıları";
    } else {
      // Default / general gate
      y = 135;
      desc = "Ana Terminal Biniş Kapısı";
    }

    return {
      name: `Kapı ${gateVal}`,
      x,
      y,
      description: desc
    };
  }, [gateVal, gateChar]);

  // Find coordinates for starting point
  const startPoint = useMemo(() => {
    const found = landmarks.find(l => l.id === startPointId);
    return found ? { x: found.x, y: found.y, name: found.turkishName } : { x: 70, y: 175, name: "Güvenlik" };
  }, [startPointId, landmarks]);

  // Generate dynamic routing path points
  const routePath = useMemo(() => {
    const startX = startPoint.x;
    const startY = startPoint.y;
    const endX = destinationGate.x;
    const endY = destinationGate.y;

    if (wheelchairOnly) {
      // Wheelchair-accessible route redirects through level automatic elevator platforms
      // Uses smooth auxiliary bezier curving to show dedicated bypass transition
      const rampX = startX + (endX - startX) * 0.45;
      const rampY = startY + (endY - startY) * 0.5 + 30; // lower curve avoiding steps
      return `M ${startX} ${startY} Q ${rampX} ${rampY}, ${endX} ${endY}`;
    }

    // Use curved path to look like beautiful human navigation
    const ctrl1X = startX + (endX - startX) * 0.4;
    const ctrl1Y = useMovingWalkways ? startY + (endY - startY) * 0.1 : startY + 40;
    const ctrl2X = startX + (endX - startX) * 0.75;
    const ctrl2Y = useMovingWalkways ? endY - (endY - startY) * 0.05 : endY - 30;

    return `M ${startX} ${startY} C ${ctrl1X} ${ctrl1Y}, ${ctrl2X} ${ctrl2Y}, ${endX} ${endY}`;
  }, [startPoint, destinationGate, useMovingWalkways, wheelchairOnly]);

  // Calculated custom walking metrics
  const metrics = useMemo(() => {
    const dx = Math.abs(destinationGate.x - startPoint.x);
    const dy = Math.abs(destinationGate.y - startPoint.y);
    const distancePixels = Math.sqrt(dx * dx + dy * dy);
    
    // Scale pixels to approximate modern meters
    let meters = Math.round(distancePixels * (wheelchairOnly ? 1.55 : 1.4));
    
    // Reduce if moving walkways are used
    let speed = 80; // meters per minute (average human walking speed)
    if (useMovingWalkways && !wheelchairOnly) speed = 110; // extra boost from escalators
    if (wheelchairOnly) speed = 50; // safe wheelchair speed through ramps and wide lanes

    let mins = Math.max(1, Math.round(meters / speed));
    
    return {
      distanceMeters: meters,
      walkMinutes: mins
    };
  }, [startPoint, destinationGate, useMovingWalkways, wheelchairOnly]);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 text-white flex flex-col space-y-4 shadow-xl select-none" id="terminal-map-component">
      {/* Header and Controls */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between border-b border-slate-800 pb-4 gap-3">
        <div className="text-left">
          <span className="text-[8px] font-extrabold text-indigo-300 block tracking-widest uppercase mb-1">
            AKILLI BENTÖ CORRIDOR HARİTASI
          </span>
          <div className="flex items-center gap-2">
            <Compass className="w-5 h-5 text-indigo-400 animate-spin-slow" />
            <h3 className="text-sm font-black text-slate-100 tracking-tight">Canlı Akıllı Kapı Rehberi</h3>
          </div>
        </div>

        {/* Floor selector, Accessibility filter and Walkway toggle */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Wheelchair filter toggle */}
          <button
            onClick={() => setWheelchairOnly(!wheelchairOnly)}
            className={`text-[9px] font-bold px-2.5 py-1.5 rounded-xl border flex items-center gap-1.5 transition-all cursor-pointer ${
              wheelchairOnly 
                ? "bg-amber-950/80 border-amber-500/40 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.2)]" 
                : "bg-slate-800/40 border-slate-700/60 text-slate-400 hover:text-white"
            }`}
            aria-label="Tekerlekli sandalye erişilebilir rota seçin"
          >
            <Accessibility className="w-3.5 h-3.5" />
            <span>Tekerlekli Sandalye: {wheelchairOnly ? "Erişilebilir (Açık)" : "Pasif"}</span>
          </button>

          {/* Moving walkways state switch */}
          <button
            onClick={() => setUseMovingWalkways(!useMovingWalkways)}
            disabled={wheelchairOnly}
            className={`text-[9px] font-bold px-2.5 py-1.5 rounded-xl border flex items-center gap-1.5 transition-all cursor-pointer ${
              wheelchairOnly
                ? "opacity-40 cursor-not-allowed bg-slate-850/20 border-slate-800/20 text-slate-600"
                : useMovingWalkways 
                  ? "bg-indigo-950/80 border-indigo-500/40 text-indigo-300" 
                  : "bg-slate-800/40 border-slate-700/60 text-slate-400 hover:text-white"
            }`}
          >
            <Footprints className="w-3.5 h-3.5" />
            <span>Yürüyen Bant: {wheelchairOnly ? "Erişilemez" : useMovingWalkways ? "Açık (+%25 Hız)" : "Kapalı"}</span>
          </button>

          {/* Level floors selector toggle */}
          <div className="relative flex bg-slate-950 border border-slate-800 p-0.5 rounded-xl">
            <button
              onClick={() => setFloorPlan("floor1")}
              onMouseEnter={() => setHoveredFloor("floor1")}
              onMouseLeave={() => setHoveredFloor(null)}
              className={`text-[9.5px] font-bold px-2.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                floorPlan === "floor1" ? "bg-indigo-600 text-white shadow-xs" : "text-slate-400 hover:text-white"
              }`}
            >
              Zemin Kat
            </button>
            <button
              onClick={() => setFloorPlan("floor2")}
              onMouseEnter={() => setHoveredFloor("floor2")}
              onMouseLeave={() => setHoveredFloor(null)}
              className={`text-[9.5px] font-bold px-2.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                floorPlan === "floor2" ? "bg-indigo-600 text-white shadow-xs" : "text-slate-400 hover:text-white"
              }`}
            >
              Galeri Katı
            </button>

            {/* Micro details popup tooltip */}
            <AnimatePresence>
              {hoveredFloor && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 6, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-full mt-2 w-56 bg-slate-950/95 border border-indigo-500/25 p-3 rounded-2xl shadow-xl backdrop-blur-md z-50 text-left pointer-events-none"
                >
                  <span className="text-[7px] font-black text-indigo-400 block tracking-widest uppercase mb-1">
                    {hoveredFloor === "floor1" ? "ZEMİN KAT DETAYI" : "GALERİ KATI DETAYI"}
                  </span>
                  <p className="text-[9.5px] font-black text-slate-100 tracking-tight leading-snug">
                    {hoveredFloor === "floor1" ? "Ana Check-in & Terminal Holü" : "CIP Lounge & Özel Dinlenme Alanı"}
                  </p>
                  <div className="mt-2 space-y-1.5">
                    {hoveredFloor === "floor1" ? (
                      <>
                        <div className="flex items-center gap-1.5 text-[8.5px] text-slate-300">
                          <Store className="w-3 h-3 text-indigo-400 shrink-0" />
                          <span>Ana Duty Free & Gümrüksüz Satış</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[8.5px] text-slate-300">
                          <ShieldAlert className="w-3 h-3 text-indigo-400 shrink-0" />
                          <span>Pasaport Kontrol & Ana Güvenlik</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[8.5px] text-slate-300">
                          <Coffee className="w-3 h-3 text-indigo-400 shrink-0" />
                          <span>Yeme & İçme Alanı (Food Court)</span>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex items-center gap-1.5 text-[8.5px] text-slate-300">
                          <Coffee className="w-3 h-3 text-amber-500 shrink-0" />
                          <span>CIP Özel Yolcu Salonu (Lounge)</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[8.5px] text-slate-300">
                          <Layers className="w-3 h-3 text-amber-500 shrink-0" />
                          <span>Asma Kat Manzaralı Teras Alanı</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[8.5px] text-slate-300">
                          <RefreshCw className="w-3 h-3 text-amber-500 shrink-0" />
                          <span>Transit Bağlantı Köprüsü</span>
                        </div>
                      </>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Starting point selector options */}
      <div className="text-left">
        <label className="text-[9px] font-extrabold text-slate-400 tracking-wider uppercase block mb-2">
          Mevcut Başlangıç Noktanızı Seçin:
        </label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {landmarks.map((l) => (
            <button
              key={l.id}
              onClick={() => {
                setStartPointId(l.id);
                setSelectedLandmarkId(l.id);
              }}
              className={`text-[10px] font-bold p-2.5 rounded-2xl border text-left flex items-start gap-2 transition-all cursor-pointer ${
                startPointId === l.id 
                  ? "bg-indigo-950/90 border-indigo-500 text-indigo-200 shadow-sm" 
                  : "bg-slate-950/40 border-slate-850 hover:border-slate-800 text-slate-400 hover:text-white"
              }`}
            >
              <span className="mt-0.5 shrink-0 text-indigo-400">{l.icon}</span>
              <div className="min-w-0">
                <span className="block leading-snug font-black truncate">{l.turkishName}</span>
                <span className="text-[8px] text-slate-400 block font-mono">X:{l.x} Y:{l.y}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Dynamic Navigation Walk Summary Box */}
      <div className="bg-slate-950 border border-slate-850 p-4 rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-3 text-left">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="p-3 bg-indigo-500/10 border border-indigo-500/25 text-indigo-400 rounded-2xl">
            <Navigation className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[8px] font-extrabold bg-indigo-900/55 text-indigo-300 px-1.5 py-0.5 rounded border border-indigo-700/50 uppercase tracking-widest leading-none">
                ROTA SÜRESİ
              </span>
              {wheelchairOnly && (
                <span className="text-[8px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 px-1.5 py-0.5 rounded flex items-center gap-1 animate-pulse">
                  <Accessibility className="w-3 h-3" /> ENGELLİ KORİDORU AKTİF
                </span>
              )}
            </div>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-xl font-bold font-display tracking-tight">{startPoint.name}</span>
              <span className="text-[10px] text-slate-500">→</span>
              <span className="text-xl font-black font-display text-indigo-300 tracking-tight">{destinationGate.name}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 w-full sm:w-auto border-t sm:border-t-0 sm:border-l border-slate-800/80 pt-3 sm:pt-0 sm:pl-5 shrink-0">
          <div>
            <span className="text-[7.5px] font-extrabold text-slate-500 tracking-wider uppercase block">YAKLAŞIK SÜRE</span>
            <span className="text-lg font-black text-white font-mono">{metrics.walkMinutes} Dakika</span>
          </div>
          <div>
            <span className="text-[7.5px] font-extrabold text-slate-500 tracking-wider uppercase block">TAHMİNİ MESAFE</span>
            <span className="text-lg font-black text-indigo-300 font-mono">~{metrics.distanceMeters} Metre</span>
          </div>
        </div>
      </div>

      {/* SVG Terminal Map Drawing Stage */}
      <div className="bg-slate-950 border border-slate-850 rounded-3xl relative overflow-hidden aspect-[16/9] md:aspect-[16/8] flex items-center justify-center">
        {/* Background Grid Pattern inside terminal canvas */}
        <div className="absolute inset-0 opacity-[0.12] bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:16px_16px]"></div>

        {/* Dynamic floor label marker */}
        <div className="absolute left-4 top-4 bg-slate-900/90 border border-slate-800 text-[8px] font-bold px-2 py-1 rounded-lg text-slate-400 select-none">
          {floorPlan === "floor1" ? "Zemin Kat • Canlı Akıllı Kılavuz" : "Galeri Katı • Teras Lounge Köprüsü"}
        </div>

        {/* Airport terminal vector layout drawing with Canvas SVG */}
        <svg 
          className="w-full h-full min-h-[220px]" 
          viewBox="0 0 600 350" 
          xmlns="http://www.w3.org/2000/svg"
        >
          <motion.g
            animate={{
              scale: zoomLevel,
              x: panX,
              y: panY
            }}
            transition={{ type: "spring", stiffness: 160, damping: 22 }}
            style={{ transformOrigin: "300px 175px" }}
          >
            {/* Outer Terminal Boundary Frame */}
            <motion.rect 
              x="20" y="20" width="560" height="310" rx="20" 
              fill="none" 
              stroke={wheelchairOnly ? "rgba(245, 158, 11, 0.3)" : "#334155"} 
              strokeWidth="1" 
              strokeDasharray="3,3"
              animate={{
                stroke: wheelchairOnly ? "rgba(245, 158, 11, 0.35)" : "#334155",
                strokeWidth: wheelchairOnly ? 1.5 : 1
              }}
              transition={{ duration: 0.5 }}
            />

            {/* Hallways and architectural zones */}
            {/* Main Duty Free Area central hub */}
            <motion.circle 
              cx="230" cy="175" 
              animate={{ 
                r: floorPlan === "floor1" ? 55 : 44,
                fill: floorPlan === "floor1" ? "rgba(79, 70, 229, 0.04)" : "rgba(79, 70, 229, 0.01)",
                stroke: floorPlan === "floor1" ? "rgba(79, 70, 229, 0.15)" : "rgba(79, 70, 229, 0.08)",
              }} 
              transition={{ type: "spring", stiffness: 100, damping: 18 }}
              strokeWidth="1.5" 
            />
            <motion.text 
              x="230" y="140" fill="#6366f1" 
              animate={{
                opacity: floorPlan === "floor1" ? 0.6 : 0.3,
                y: floorPlan === "floor1" ? 140 : 148
              }}
              fontSize="7" fontWeight="bold" textAnchor="middle" letterSpacing="1"
            >
              MERKEZ DEK
            </motion.text>
            
            {/* Passageway connections */}
            {/* Main entrance lounge zone */}
            <motion.line 
              x1="70" y1="175" x2="230" y2="175" 
              animate={{ 
                stroke: wheelchairOnly ? "rgba(245, 158, 11, 0.08)" : "rgba(255, 255, 255, 0.05)",
                strokeWidth: wheelchairOnly ? 14 : 12 
              }} 
              transition={{ duration: 0.4 }}
              strokeLinecap="round" 
            />
            {/* Corridor stretching to Gate A, B, C */}
            <motion.line 
              x1="230" y1="175" x2="500" y2="175" 
              animate={{ 
                stroke: wheelchairOnly ? "rgba(245, 158, 11, 0.08)" : "rgba(255, 255, 255, 0.05)",
                strokeWidth: wheelchairOnly ? 12 : 10 
              }} 
              transition={{ duration: 0.4 }}
              strokeLinecap="round" 
            />
            <motion.line 
              x1="500" y1="90" x2="500" y2="260" 
              animate={{ 
                stroke: wheelchairOnly ? "rgba(245, 158, 11, 0.08)" : "rgba(255, 255, 255, 0.05)",
                strokeWidth: wheelchairOnly ? 10 : 8 
              }} 
              transition={{ duration: 0.4 }}
              strokeLinecap="round" 
            />

            {/* Lounges and Foodcourt areas */}
            <motion.g
              animate={{ 
                opacity: floorPlan === "floor2" ? 1 : 0.3,
                scale: floorPlan === "floor2" ? 1.02 : 0.96,
                x: floorPlan === "floor2" ? 0 : -5
              }}
              transition={{ type: "spring", stiffness: 120, damping: 18 }}
            >
              <rect x="150" y="45" width="140" height="60" rx="10" fill="rgba(15, 23, 42, 0.6)" stroke="rgba(255, 255, 255, 0.06)" />
              <text x="220" y="60" fill="#94a3b8" fontSize="7" fontWeight="semibold" textAnchor="middle">CIP Lounge &amp; Dinlenme Alanı</text>
            </motion.g>

            <motion.g
              animate={{ 
                opacity: floorPlan === "floor1" ? 1 : 0.3,
                scale: floorPlan === "floor1" ? 1.02 : 0.96,
                x: floorPlan === "floor1" ? 0 : 5
              }}
              transition={{ type: "spring", stiffness: 120, damping: 18 }}
            >
              <rect x="150" y="245" width="140" height="60" rx="10" fill="rgba(15, 23, 42, 0.6)" stroke="rgba(255, 255, 255, 0.06)" />
              <text x="220" y="295" fill="#94a3b8" fontSize="7" fontWeight="semibold" textAnchor="middle">Yeme / İçme Alanı</text>
            </motion.g>

            {/* Pre-drawn other non-flight Gate terminal terminals for rich layout */}
            <g opacity="0.35">
              <circle cx="500" cy="50" r="10" fill="#1e293b" stroke="#475569" strokeWidth="1" />
              <text x="500" y="53" fill="#94a3b8" fontSize="8" fontWeight="bold" textAnchor="middle">A-12</text>
              
              <circle cx="500" cy="130" r="10" fill="#1e293b" stroke="#475569" strokeWidth="1" />
              <text x="500" y="133" fill="#94a3b8" fontSize="8" fontWeight="bold" textAnchor="middle">B-2</text>

              <circle cx="500" cy="220" r="10" fill="#1e293b" stroke="#475569" strokeWidth="1" />
              <text x="500" y="223" fill="#94a3b8" fontSize="8" fontWeight="bold" textAnchor="middle">C-5</text>
            </g>

            {/* DYNAMIC PATH LAYOUT */}
            {/* Dynamic route shadow line */}
            <motion.path 
              d={routePath} 
              fill="none" 
              stroke="#4338ca" 
              strokeWidth="4" 
              strokeLinecap="round" 
              opacity="0.25"
              animate={{ d: routePath }}
              transition={{ type: "spring", stiffness: 75, damping: 14 }}
            />

            {/* Animated active navigation path vector (dashed guide) */}
            <motion.path 
              d={routePath} 
              fill="none" 
              stroke={wheelchairOnly ? "#F59E0B" : "#6366f1"} 
              strokeWidth={wheelchairOnly ? 3 : 2.5} 
              strokeLinecap="round" 
              strokeDasharray={wheelchairOnly ? "6,4" : "5,5"}
              animate={{ 
                d: routePath,
                stroke: wheelchairOnly ? "#F59E0B" : "#6366f1",
                strokeWidth: wheelchairOnly ? 3 : 2.5,
                strokeDashoffset: [100, 0]
              }}
              transition={{
                d: { type: "spring", stiffness: 75, damping: 14 },
                stroke: { duration: 0.3 },
                strokeDashoffset: {
                  repeat: Infinity,
                  duration: wheelchairOnly ? 5.5 : useMovingWalkways ? 2.5 : 4,
                  ease: "linear"
                }
              }}
            />

            {/* Interactive Landmark Pins */}
            {landmarks.map((l) => {
              const isSelected = selectedLandmarkId === l.id;
              const isStart = startPointId === l.id;
              
              // Highlight landmarks according to floorPlan relevance
              const isCorrectFloor = (l.id === "lounge" && floorPlan === "floor2") || (l.id !== "lounge" && floorPlan === "floor1");

              return (
                <motion.g 
                  key={l.id} 
                  className="cursor-pointer" 
                  onClick={() => {
                    setSelectedLandmarkId(l.id);
                    setStartPointId(l.id);
                  }}
                  animate={{
                    opacity: isCorrectFloor ? 1 : 0.28,
                    scale: isSelected ? 1.15 : isStart ? 1.08 : 1,
                  }}
                  transition={{ type: "spring", stiffness: 140, damping: 14 }}
                >
                  {/* Visual ripple effect for starting point */}
                  {isStart && (
                    <circle cx={l.x} cy={l.y} r="18" fill="none" stroke="#6366f1" strokeWidth="1.5" opacity="0.8">
                      <animate attributeName="r" values="8;20" dur="2s" repeatCount="indefinite" />
                      <animate attributeName="opacity" values="0.8;0" dur="2s" repeatCount="indefinite" />
                    </circle>
                  )}
                  
                  <circle 
                    cx={l.x} 
                    cy={l.y} 
                    r="10" 
                    fill={isStart ? "#6366f1" : isSelected ? "#3730a3" : "#0f172a"} 
                    stroke={isStart ? "#818cf8" : isSelected ? "#4f46e5" : "#475569"} 
                    strokeWidth="1.5" 
                  />
                  
                  {/* Active check indicator dot */}
                  {isStart ? (
                    <circle cx={l.x} cy={l.y} r="3" fill="#ffffff" />
                  ) : (
                    <circle cx={l.x} cy={l.y} r="2.5" fill="#475569" />
                  )}

                  {/* Styled simple labeling */}
                  <text 
                    x={l.x} 
                    y={l.y - 14} 
                    fill={isStart ? "#a5b4fc" : isSelected ? "#e2e8f0" : "#94a3b8"} 
                    fontSize="7.5" 
                    fontWeight="bold" 
                    textAnchor="middle"
                  >
                    {l.turkishName}
                  </text>
                </motion.g>
              );
            })}

            {/* DESTINATION GATE NODE (Beautiful Glowing Pulse Gate Object) */}
            <g>
              {/* Pulsing ring radar aura effect around destination gate */}
              <circle cx={destinationGate.x} cy={destinationGate.y} r="22" fill="none" stroke="#10b981" strokeWidth="1" opacity="0.6">
                <animate attributeName="r" values="12;26" dur="2.4s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.7;0" dur="2.4s" repeatCount="indefinite" />
              </circle>

              <motion.circle 
                cx={destinationGate.x} 
                cy={destinationGate.y} 
                r="13" 
                fill="#065f46" 
                stroke="#10b981" 
                strokeWidth="2" 
                className="cursor-pointer"
                whileHover={{ scale: 1.15 }}
                onClick={() => setSelectedLandmarkId("dest_gate")}
              />
              
              <text 
                x={destinationGate.x} 
                y={destinationGate.y + 3.5} 
                fill="#ffffff" 
                fontSize="9" 
                fontWeight="black" 
                fontFamily="monospace"
                textAnchor="middle"
                className="pointer-events-none"
              >
                {gateVal}
              </text>

              <text 
                x={destinationGate.x} 
                y={destinationGate.y - 17} 
                fill="#34d399" 
                fontSize="8.5" 
                fontWeight="extrabold" 
                textAnchor="middle"
              >
                HEDEF UÇUŞ KAPISI
              </text>
            </g>
          </motion.g>
        </svg>

        {/* Interactive Zoom and Pan Control Overlay */}
        <div className="absolute right-4 top-4 flex flex-col items-center gap-1.5 bg-slate-900/95 border border-slate-800/80 p-2 rounded-2xl shadow-xl backdrop-blur-md z-30 select-none">
          <div className="flex flex-col gap-1 items-center border-b border-slate-800/50 pb-2">
            <button
              onClick={handleZoomIn}
              className="p-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-850 hover:border-slate-700 text-slate-300 hover:text-white rounded-lg transition-all cursor-pointer"
              title="Yakınlaştır (+)"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <span className="text-[7.5px] font-bold font-mono text-indigo-400">
              %{Math.round(zoomLevel * 100)}
            </span>
            <button
              onClick={handleZoomOut}
              className="p-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-850 hover:border-slate-700 text-slate-300 hover:text-white rounded-lg transition-all cursor-pointer"
              title="Uzaklaştır (-)"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* D-Pad Pan Controller */}
          <div className="grid grid-cols-3 gap-0.5 w-[72px] h-[72px] relative mt-1">
            <div />
            <button
              onClick={() => handlePan("up")}
              disabled={zoomLevel === 1}
              className="flex items-center justify-center p-1 bg-slate-950 hover:bg-slate-800 border border-slate-850 text-slate-400 hover:text-white rounded-md transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
              title="Yukarı"
            >
              <ArrowUp className="w-3 h-3" />
            </button>
            <div />

            <button
              onClick={() => handlePan("left")}
              disabled={zoomLevel === 1}
              className="flex items-center justify-center p-1 bg-slate-950 hover:bg-slate-800 border border-slate-850 text-slate-400 hover:text-white rounded-md transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
              title="Sol"
            >
              <ArrowLeft className="w-3 h-3" />
            </button>
            <button
              onClick={handleReset}
              className="flex items-center justify-center p-1 bg-indigo-950 hover:bg-indigo-900 border border-indigo-900/60 text-indigo-300 rounded-md transition-all cursor-pointer"
              title="Sıfırla"
            >
              <RefreshCw className="w-2.5 h-2.5" />
            </button>
            <button
              onClick={() => handlePan("right")}
              disabled={zoomLevel === 1}
              className="flex items-center justify-center p-1 bg-slate-950 hover:bg-slate-800 border border-slate-850 text-slate-400 hover:text-white rounded-md transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
              title="Sağ"
            >
              <ArrowLeft className="w-3 h-3 rotate-180" />
            </button>

            <div />
            <button
              onClick={() => handlePan("down")}
              disabled={zoomLevel === 1}
              className="flex items-center justify-center p-1 bg-slate-950 hover:bg-slate-800 border border-slate-850 text-slate-400 hover:text-white rounded-md transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
              title="Aşağı"
            >
              <ArrowDown className="w-3 h-3" />
            </button>
            <div />
          </div>
        </div>

        {/* Selected Area popup card inside container overlay */}
        <div className="absolute bottom-3 left-3 right-3 bg-slate-900/95 border border-slate-800/80 p-3 rounded-2xl flex items-start gap-2.5 backdrop-blur-md shadow-lg">
          <div className="p-1.5 bg-indigo-500/10 text-indigo-400 rounded-lg shrink-0 mt-0.5">
            <HelpCircle className="w-4 h-4" />
          </div>
          <div className="min-w-0 text-left">
            <h4 className="text-[10px] font-bold text-slate-200">
              {selectedLandmarkId === "dest_gate" 
                ? `${destinationGate.name} Detayı` 
                : (landmarks.find(l => l.id === selectedLandmarkId) || landmarks[0]).turkishName
              }
            </h4>
            <p className="text-[9px] text-slate-400 leading-tight mt-0.5">
              {selectedLandmarkId === "dest_gate" 
                ? `${destinationGate.description} ${useMovingWalkways ? "Hızlı yürüyen B bandı güzergahı etkindir." : ""}` 
                : (landmarks.find(l => l.id === selectedLandmarkId) || landmarks[0]).description
              }
            </p>
          </div>
        </div>
      </div>

      {/* Collapsible Map Legend */}
      <div className="border border-slate-800 bg-slate-950/40 rounded-2xl overflow-hidden transition-all duration-300">
        <button 
          onClick={() => setLegendOpen(!legendOpen)}
          className="w-full flex items-center justify-between px-4 py-2.5 bg-slate-950/60 hover:bg-slate-950/85 transition-all text-[11px] font-semibold text-slate-300 hover:text-white cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <Info className="w-3.5 h-3.5 text-indigo-400" />
            <span>Harita Göstergeleri &amp; Simge Açıklamaları</span>
          </div>
          <motion.div
            animate={{ rotate: legendOpen ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </motion.div>
        </button>

        <AnimatePresence initial={false}>
          {legendOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
              className="overflow-hidden"
            >
              <div className="p-3.5 border-t border-slate-800/60 grid grid-cols-1 md:grid-cols-2 gap-4 text-left bg-slate-950/20">
                {/* Rota ve Yol Tipleri */}
                <div>
                  <span className="text-[7.5px] font-black tracking-widest text-indigo-400 uppercase block mb-2">
                    YOL &amp; SEVİYE GÖSTERGELERİ
                  </span>
                  <div className="space-y-2 text-[9px]">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 flex justify-center">
                        <div className="w-6 h-0.5 border-t-2 border-dashed border-[#6366f1]" />
                      </div>
                      <span className="text-slate-300 font-medium">Standart Seyahat Rotası</span>
                      <span className="text-slate-500 font-mono text-[7.5px]">(Yürüyen bantlar ve merdivenler)</span>
                    </div>

                    <div className="flex items-center gap-2.5">
                      <div className="w-8 flex justify-center">
                        <div className="w-6 h-0.5 border-t-2 border-dashed border-[#F59E0B]" />
                      </div>
                      <span className="text-amber-400 font-semibold">Engelli / Engelsiz Seyahat Koridoru</span>
                      <span className="text-slate-500 font-mono text-[7.5px]">(Rampalar ve asansörlü asma kat geçişleri)</span>
                    </div>

                    <div className="flex items-center gap-2.5">
                      <div className="w-8 flex justify-center">
                        <div className="w-6 h-0.5 border-t border-dashed border-[#334155]" />
                      </div>
                      <span className="text-slate-400">Terminal Dış Sınır Çerçevesi</span>
                      <span className="text-slate-500 font-mono text-[7.5px]">(Fiziksel mimari bölme)</span>
                    </div>
                  </div>
                </div>

                {/* Simgeler ve İşaretçiler */}
                <div>
                  <span className="text-[7.5px] font-black tracking-widest text-indigo-400 uppercase block mb-2">
                    İŞARETÇİLER VE SİMGELER
                  </span>
                  <div className="grid grid-cols-2 gap-x-2 gap-y-1.5 text-[9px]">
                    <div className="flex items-center gap-2">
                      <div className="relative w-4 h-4 flex items-center justify-center rounded-full bg-slate-900 border border-slate-700 shrink-0">
                        <div className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                      </div>
                      <span className="text-slate-300 truncate">Sıradan Durak (Landmark)</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="relative w-4 h-4 flex items-center justify-center rounded-full bg-[#1e293b] border border-[#475569] shrink-0">
                        <span className="text-[6.5px] font-bold text-[#94a3b8]">B-2</span>
                      </div>
                      <span className="text-slate-300 truncate">Bekleme Kapısı</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full bg-[#065f46] border border-[#10b981] flex items-center justify-center shrink-0">
                        <span className="text-[6.5px] font-bold text-white font-mono">G</span>
                      </div>
                      <span className="text-emerald-400 font-semibold truncate">Hedef Uçuş Kapısı</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <ShieldAlert className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                      <span className="text-slate-300 truncate">Güvenlik &amp; Pasaport Kontrolü</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Coffee className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      <span className="text-slate-300 truncate">CIP Özel Salon / Dinlenme</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Store className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                      <span className="text-slate-300 truncate">Gümrüksüz Satış (Duty Free)</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Speed corridor advice banner based on user accessibilityProfile settings */}
      {wheelchairOnly ? (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-3.5 flex items-start gap-3 text-left">
          <Accessibility className="w-4.5 h-4.5 text-amber-500 shrink-0 mt-0.5 animate-bounce" />
          <div>
            <h4 className="text-[10px] font-bold text-amber-400 uppercase tracking-wide">ÖNCELİKLİ ENGELLİ KORİDORU AKTİF</h4>
            <p className="text-[9px] text-slate-300 leading-normal mt-0.5">
              Tekerlekli sandalye / engelsiz seyahat filtresi etkinleştirildi. Sunulan {metrics.walkMinutes} dakikalık rota adımları merdivenleri, yürüyen merdivenleri ve dar turnikeleri tamamen baypas ederek; geniş rampaları, engelsiz kabin asansörlerini ve geniş otonom erişim geçitlerini takip edecek şekilde optimize edilmiştir.
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-indigo-500/5 border border-indigo-500/15 rounded-2xl p-3.5 flex items-start gap-3 text-left">
          <Footprints className="w-4.5 h-4.5 text-indigo-400 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-[10px] font-bold text-indigo-300 uppercase tracking-wide">YOL SENSÖRÜ REHBER ÖNERİSİ</h4>
            <p className="text-[9px] text-slate-400 leading-normal mt-0.5">
              Kapıya giderken duty-free merkez holünden geçerek zaman kazanabilirsiniz. Yürüyen bantlar ortalama seyahat süresini %25 oranında kısaltmaktadır.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
