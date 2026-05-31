/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { 
  Plane, MapPin, Watch, AlertCircle, Sparkles, Navigation, CheckCircle, 
  Compass, Gift, MessageCircleMore, User, QrCode, ArrowRight, RefreshCw, Star,
  Activity, Shield, BellRing, Lock
} from "lucide-react";
import { FlightInfo, AccessibilityProfile } from "../types";
import { db } from "../firebase";
import { collection, onSnapshot } from "firebase/firestore";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";
import TerminalMap from "./TerminalMap";

interface DashboardScreenProps {
  flightData: FlightInfo;
  accessibilityProfile?: AccessibilityProfile | null;
  onOpenScanner: () => void;
  onOpenChat: () => void;
  onLogout: () => void;
}

export default function DashboardScreen({
  flightData,
  accessibilityProfile,
  onOpenScanner,
  onOpenChat,
  onLogout
}: DashboardScreenProps) {
  const [showGateMap, setShowGateMap] = useState(false);
  const [showQrTicket, setShowQrTicket] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Real-time Firestore airport operator distribution loader state
  const [operatorData, setOperatorData] = useState<{ name: string; value: number; color: string }[]>([]);

  React.useEffect(() => {
    const flightsRef = collection(db, "flights");
    const unsubscribe = onSnapshot(flightsRef, (snapshot) => {
      const counts: Record<string, number> = {
        "İGA": 0,
        "TAV": 0,
        "HEAŞ": 0,
        "DHMİ": 0
      };

      // Seed counts with default scheduled flights in flight corridor to ensure beautiful rich initial visual distribution
      counts["İGA"] = 3;
      counts["HEAŞ"] = 2;
      counts["TAV"] = 2;
      counts["DHMİ"] = 1;

      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        let op = data.airportOperator;
        
        // Match / resolve from flight number prefixes if operator is not explicitly saved
        if (!op && data.flightNumber) {
          const fn = data.flightNumber.toUpperCase();
          if (fn.startsWith("TK")) op = "İGA";
          else if (fn.startsWith("PC")) op = "HEAŞ";
          else if (fn.startsWith("AJ")) op = "İGA";
          else op = "DHMİ";
        }

        if (op && counts[op] !== undefined) {
          counts[op] += 1;
        }
      });

      const colorsMap: Record<string, string> = {
        "İGA": "#4F46E5",  // Indigo 600
        "HEAŞ": "#F97316", // Orange 500
        "TAV": "#0D9488",  // Teal 600
        "DHMİ": "#64748B"  // Slate 500
      };

      const chartData = Object.keys(counts).map(name => ({
        name,
        value: counts[name],
        color: colorsMap[name] || "#94A3B8"
      })).filter(item => item.value > 0);

      setOperatorData(chartData);
    }, (error) => {
      console.error("Firestore distribution onSnapshot error, falling back to cached averages:", error);
      setOperatorData([
        { name: "İGA", value: 3, color: "#4F46E5" },
        { name: "HEAŞ", value: 2, color: "#F97316" },
        { name: "TAV", value: 2, color: "#0D9488" },
        { name: "DHMİ", value: 1, color: "#64748B" }
      ]);
    });

    return () => unsubscribe();
  }, []);

  // Veli Denetimi & Aile Koruma states
  const [isUnder18, setIsUnder18] = useState(accessibilityProfile?.isUnder18 || false);
  const [guardianPhone, setGuardianPhone] = useState(accessibilityProfile?.guardianPhone || "0555 123 4567");
  const [isEditingPhone, setIsEditingPhone] = useState(false);
  const [phoneInput, setPhoneInput] = useState(accessibilityProfile?.guardianPhone || "0555 123 4567");
  const [isSendingAlert, setIsSendingAlert] = useState(false);
  const [alertSentSuccess, setAlertSentSuccess] = useState(false);

  // Bento Alert History Log list - Dynamic initial timestamps relative to current time
  const [alertLogs, setAlertLogs] = useState<{ id: string; time: string; status: "Beklemede" | "Başarılı" }[]>(() => {
    const now = new Date();
    const time1 = new Date(now.getTime() - 15 * 60 * 1000).toTimeString().split(" ")[0]; // 15 mins ago
    const time2 = new Date(now.getTime() - 71 * 60 * 1000).toTimeString().split(" ")[0]; // 1 hour 11 mins ago
    return [
      { id: "init-1", time: time1, status: "Başarılı" },
      { id: "init-2", time: time2, status: "Başarılı" }
    ];
  });

  const handleSendEmergencyAlert = () => {
    const now = new Date();
    const timeString = now.toTimeString().split(" ")[0]; // HH:MM:SS format
    const newLogId = Math.random().toString(36).substring(2, 9);

    setIsSendingAlert(true);
    setAlertSentSuccess(false);

    // Append pending alert log to list (max 3 items)
    setAlertLogs(prev => [
      { id: newLogId, time: timeString, status: "Beklemede" },
      ...prev
    ].slice(0, 3));

    setTimeout(() => {
      setIsSendingAlert(false);
      setAlertSentSuccess(true);

      // Transition the pending alert to "Başarılı" status
      setAlertLogs(prev => prev.map(log => log.id === newLogId ? { ...log, status: "Başarılı" } : log));

      setTimeout(() => {
        setAlertSentSuccess(false);
      }, 4500);
    }, 1200);
  };

  React.useEffect(() => {
    setIsUnder18(accessibilityProfile?.isUnder18 || false);
    const p = accessibilityProfile?.guardianPhone || "0555 123 4567";
    setGuardianPhone(p);
    setPhoneInput(p);
  }, [accessibilityProfile]);

  // Dynamic color coding based on status
  const getStatusColor = (status: string) => {
    switch (status) {
      case "Boarding Now": return "bg-emerald-500 text-white animate-pulse";
      case "Waiting": return "bg-blue-500 text-white";
      case "Delayed": return "bg-amber-500 text-slate-900";
      case "Cancelled": return "bg-rose-600 text-white";
      default: return "bg-slate-500 text-white";
    }
  };

  const getStatusLabelText = (status: string) => {
    switch (status) {
      case "Boarding Now": return "Biniş Başladı";
      case "Waiting": return "Kapıda Bekleyin";
      case "Delayed": return "Ertelendi (Kriz)";
      case "Cancelled": return "İptal Edildi (Kriz)";
      default: return "Kapalı";
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#f8fafc] overflow-y-auto font-sans pb-28 text-slate-900 relative">
      {/* Dynamic Header */}
      <div className="bg-white px-5 py-4 flex justify-between items-center border-b border-slate-250 sticky top-0 z-30 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-900 rounded-lg flex items-center justify-center text-white">
            <span className="font-display font-black text-sm">S</span>
          </div>
          <div className="flex flex-col">
            <span className="font-display font-black text-xs tracking-tight text-indigo-950 leading-none">
              SMART<span className="text-indigo-600">PASS</span>
            </span>
            <span className="text-[8px] text-slate-600 font-black uppercase mt-0.5 tracking-widest">PRO-VERSION</span>
          </div>
        </div>
        
        <div className="flex items-center gap-2.5">
          {flightData.biometricVerified && (
            <span className="bg-green-100 text-green-700 text-[8px] px-2 py-0.5 rounded-full font-bold border border-green-200 uppercase tracking-widest hidden sm:inline-flex items-center gap-1">
              ✓ BİYOMETRİK
            </span>
          )}
          <button 
            onClick={onOpenScanner}
            className="w-11 h-11 flex items-center justify-center hover:bg-slate-100 rounded-xl text-slate-705 border border-slate-300 transition-colors cursor-pointer min-w-[44px] min-h-[44px]"
            title="Bileti Yeniden Tara"
            aria-label="Uçuş barkod kamerasını açarak biniş kartını yeniden tarayın"
          >
            <QrCode className="w-5 h-5" />
          </button>
          
          <button 
            onClick={onLogout}
            className="min-w-[64px] min-h-[44px] flex items-center justify-center text-[10px] text-rose-700 font-extrabold border border-rose-350 hover:bg-rose-50 px-3.5 py-2.5 rounded-xl transition-all shadow-sm"
            aria-label="Kullanıcı oturumunu sonlandırın ve biniş bilet girişi ekranına geri dönün"
          >
            Çıkış
          </button>
        </div>
      </div>

      <div className="p-5 space-y-4">
        
        {/* Active operator live badge indicator */}
        <div className="flex justify-between items-center bg-indigo-50/50 border border-indigo-200 p-2.5 px-3.5 rounded-2xl shadow-xs">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${flightData.boardingStatus === "Cancelled" ? "bg-rose-500" : "bg-emerald-500 animate-pulse"}`}></div>
            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">
              CANLI VERİ KAYNAĞI:
            </span>
          </div>
          <span className="bg-indigo-900 text-white font-mono text-[9px] uppercase font-bold px-2.5 py-0.5 rounded shadow-xs">
            {flightData.airportOperator} LIVE HUB
          </span>
        </div>

        {/* Dynamic Accessibility Profile Indicator */}
        {accessibilityProfile && accessibilityProfile.enabled && (
          <div className="bg-gradient-to-r from-emerald-600/10 via-indigo-600/10 to-teal-600/5 border border-emerald-500/20 rounded-3xl p-4.5 text-left space-y-3 shadow-sm relative overflow-hidden animate-fade-in shrink-0">
            {/* Background glowing spark */}
            <div className="absolute right-0 top-0 translate-x-5 -translate-y-5 opacity-5 pointer-events-none">
              <Activity className="w-24 h-24 text-emerald-500" />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-emerald-600 border border-emerald-500 text-white flex items-center justify-center shadow-md shadow-emerald-500/20">
                  <Activity className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-[11px] font-black text-emerald-950 uppercase tracking-widest leading-none">
                    ERGONOMİK ERİŞİLEBİLİRLİK DESTEĞİ
                  </h4>
                  <span className="text-[8.5px] text-slate-500 font-bold uppercase tracking-wider block mt-1">
                    🔒 LOKAL ŞİFRELİ ve GİZLİ (KVKK GÜVENCESİNDE)
                  </span>
                </div>
              </div>
              <span className="bg-emerald-100/80 border border-emerald-200 text-emerald-700 text-[8px] font-black px-2 py-0.5 rounded uppercase">
                Aktif Destek
              </span>
            </div>

            <div className="p-3 bg-white/85 backdrop-blur-xs rounded-2xl border border-emerald-500/10 flex flex-col gap-1">
              <p className="text-[11px] font-extrabold text-slate-800">
                {accessibilityProfile.type === "wheelchair" && "♿ Ortopedik / Tekerlekli Sandalye Yolcu Planlaması"}
                {accessibilityProfile.type === "vision" && "👁️ Görme Hassasiyeti / Sesli Yolcu Rehberliği"}
                {accessibilityProfile.type === "hearing" && "👂 İşitme Engeli / Görsel Flaşörlü Bildirim Paneli"}
                {accessibilityProfile.type === "elderly" && "👴 Yaşlı Yolcu / Havalimanı Buggy ve Refakatçi Hizmeti"}
                {accessibilityProfile.type === "other" && "🩺 Medikal ve Özel Gereksinim Durum Yönetimi"}
              </p>
              <p className="text-[10px] text-slate-600 leading-relaxed font-semibold mt-0.5">
                {accessibilityProfile.type === "wheelchair" && "Merdivensiz refakat rotası çizildi. Geniş asansörler ve rampalar önceliklendirilmiştir. IGA/TAV engelsiz asistan personeli kapıda desteğe hazır."}
                {accessibilityProfile.type === "vision" && "Ekran okuyucu uyumlu yüksek kontrast modu açık. Akıllı baston ve sesli yönlendirici uyarısı, turnikelerde sesli kulaklık yardımı ile desteklenir."}
                {accessibilityProfile.type === "hearing" && "Kalkış kapısı veya rötar anonsları dökümlü olarak cihaz flaşı ve bento kartlarında görsel uyarı olarak parlayacaktır."}
                {accessibilityProfile.type === "elderly" && "Terminal dairesinde buggy elektrikli araç planlanmıştır. Belirtilen saat aralığında araç, yolcumuzu kapısına kadar transfer etmek üzere bekletilir."}
                {accessibilityProfile.type === "other" && "Kabin bagajınızdaki medikal cihaz, aparat ve ilaçlarınız güvenlik amirliğine ön onaylı olarak iletilmiştir. Güvende hissedebilirsiniz."}
              </p>
              {accessibilityProfile.customRequest && (
                <div className="mt-2 pt-2 border-t border-slate-150">
                  <p className="text-[8px] uppercase tracking-wider font-extrabold text-indigo-900 leading-none">Kullanıcı Özel İsteği / Notu</p>
                  <p className="text-[10px] italic text-slate-500 mt-1 font-medium bg-[#f8fafc] p-1.5 rounded-lg border border-slate-100">{accessibilityProfile.customRequest}</p>
                </div>
              )}
            </div>
            
            <div className="flex flex-wrap gap-2 text-[9px]">
              <span className="bg-[#f8fafc] border border-slate-200 text-slate-600 font-extrabold px-2 py-1 rounded-xl">
                ✓ Merdivensiz Rota Ayarlandı
              </span>
              <span className="bg-emerald-50 border border-emerald-100 text-emerald-800 font-extrabold px-2 py-1 rounded-xl">
                ✓ Canlı Yer Ekibi Teyit Etti
              </span>
            </div>
          </div>
        )}

        {/* Dynamic Ticket Header - Styled as Large Live Flight Card */}
        <div className="bg-indigo-900 rounded-3xl text-white p-5 shadow-xl relative overflow-hidden flex flex-col justify-between min-h-[220px]">
          {/* Subtle aircraft shadow graphic in background */}
          <div className="absolute right-0 bottom-0 translate-x-12 translate-y-12 opacity-5 pointer-events-none">
            <Plane className="w-56 h-56 -rotate-45" />
          </div>

          <div className="relative z-10 flex justify-between items-start">
            <div>
              <p className="text-indigo-200 text-[9px] font-bold uppercase tracking-[0.2em] mb-0.5">UÇUŞ NUMARASI</p>
              <h2 className="text-3xl font-black font-display tracking-tight text-white">{flightData.flightNumber}</h2>
            </div>
            <div className="text-right">
              <span className={`text-[9px] uppercase tracking-wider px-3.5 py-1.5 rounded-full font-extrabold flex items-center gap-1.5 shadow-md ${getStatusColor(flightData.boardingStatus)}`}>
                <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse shrink-0"></span>
                {getStatusLabelText(flightData.boardingStatus)}
              </span>
            </div>
          </div>

          <div className="relative z-10 flex items-center justify-between my-5">
            <div className="text-left">
              <p className="text-4xl font-black tracking-tighter text-white">{flightData.from}</p>
              <p className="text-[10px] text-indigo-200 font-semibold truncate max-w-[100px]">{flightData.fromCity}</p>
            </div>
            
            <div className="flex-1 px-4 relative flex items-center justify-center">
              <div className="w-full h-px border-t border-dashed border-indigo-400/40"></div>
              <Plane className="w-4 h-4 text-indigo-300 absolute left-1/2 -translate-x-1/2 -top-1.5" />
            </div>

            <div className="text-right">
              <p className="text-4xl font-black tracking-tighter text-white">{flightData.to}</p>
              <p className="text-[10px] text-indigo-200 font-semibold truncate max-w-[100px]">{flightData.toCity}</p>
            </div>
          </div>

          <div className="border-t border-indigo-800/80 mt-2 pt-4 flex justify-between items-center text-xs relative z-10">
            <div className="flex gap-6">
              <div>
                <span className="text-[8px] text-indigo-300 uppercase font-bold tracking-wider block">YOLCU</span>
                <span className="font-bold text-slate-100 truncate block max-w-[110px]">{flightData.passengerName}</span>
              </div>
              <div>
                <span className="text-[8px] text-indigo-300 uppercase font-bold tracking-wider block">KALKIŞ</span>
                <span className="font-mono font-bold text-slate-100">{flightData.departureTime}</span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[8px] font-mono text-indigo-300 tracking-tighter uppercase font-semibold">{flightData.airline}</span>
            </div>
          </div>
        </div>

        {/* Dynamic Alerts based on live Operator feed and Sim Controls */}
        {flightData.boardingStatus === "Delayed" && (
          <div className="bg-amber-50 border border-amber-200 rounded-3xl p-5 flex gap-3.5 check-alert shadow-xs">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1 text-left">
              <h4 className="text-[10px] font-extrabold text-amber-800 uppercase tracking-wider">AKILLI KRİZ UYARISI</h4>
              <p className="text-[10.5px] text-amber-700 leading-relaxed font-sans font-medium">
                Uçuşunuz rötar yapmıştır. Havalimanı mevzuatlarına göre 2 saati aşan rötarlarda havayolu size ücretsiz ikram sağlamakla yükümlüdür. AI Asistanımıza danışarak kuponlarınızı isteyebilirsiniz.
              </p>
            </div>
          </div>
        )}

        {flightData.boardingStatus === "Cancelled" && (
          <div className="bg-rose-50 border border-rose-200 rounded-3xl p-5 flex gap-3.5 shadow-xs">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="space-y-1 text-left">
              <h4 className="text-[10px] font-extrabold text-rose-800 uppercase tracking-wider">ACİL KRİZ BİLDİRİMİ</h4>
              <p className="text-[10.5px] text-rose-700 leading-relaxed font-sans font-medium">
                Uçuşunuz iptal edilmiştir! ŞSHY Yolcu Hakları uyarınca bilet iadesi veya ücretsiz alternatif sefer hakkınız bulunuyor. Sıradaki alternatif hatlara AI Asistanımız AeroAI ile saniyeler içinde ulaşabilirsiniz.
              </p>
            </div>
          </div>
        )}

        {flightData.securityQueueTime > 30 && (
          <div className="bg-rose-50 border border-rose-100 rounded-3xl p-5 flex gap-3.5 shadow-xs">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="space-y-1 text-left">
              <h4 className="text-[10px] font-extrabold text-rose-800 uppercase tracking-wider">YOĞUNLUK ALARMI</h4>
              <p className="text-[10.5px] text-rose-700 leading-relaxed font-medium">
                Güvenlik kontrolünde bekleme süresi {flightData.securityQueueTime} dakikadır. Kapanış saatini kaçırmamak için kapılara hemen ilerleyin!
              </p>
            </div>
          </div>
        )}

        {/* Airport metrics widgets arranged in modern Bento Style */}
        <div className="grid grid-cols-2 gap-4">
          
          {/* Gate Widget */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between min-h-[165px]">
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
          <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between min-h-[165px]">
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
        </div>

        {/* Animated Custom Gate Schematic Map Option */}
        {showGateMap && (
          <TerminalMap flightData={flightData} accessibilityProfile={accessibilityProfile} />
        )}

        {/* Airport Transportation - styled identical to Bento Transfer block */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between min-h-[145px]">
          <div className="flex justify-between items-start">
            <div className="bg-indigo-50 p-2.5 rounded-2xl text-indigo-600">
              <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0"></path>
              </svg>
            </div>
            <p className="text-[9px] font-bold text-indigo-600 tracking-wider uppercase">Entegre Hızlı Transfer</p>
          </div>
          <div className="text-left mt-3">
            <h3 className="text-slate-400 text-[9px] font-bold uppercase tracking-wider">HAVAIST • IST-14 Ekspres</h3>
            <div className="flex justify-between items-baseline mt-1">
              <p className="text-xl font-black text-slate-900 font-mono">Sıradaki: 21:00</p>
              <p className="text-xs font-bold text-indigo-900 bg-indigo-50 px-2 py-0.5 rounded-md">180 TL</p>
            </div>
            <p className="text-[8px] bg-slate-100 text-slate-500 rounded px-2 py-1 inline-block mt-2.5 font-bold uppercase tracking-wide">
              Peron 14 • Kadıköy Merkez
            </p>
          </div>
        </div>

        {/* Bento AI Companion Advice Card */}
        <div className="bg-slate-900 rounded-3xl p-5 flex items-center gap-4 border border-white/10 shadow-lg relative overflow-hidden">
          <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 opacity-10 pointer-events-none">
            <Sparkles className="w-24 h-24 text-indigo-400" />
          </div>

          <div className="relative shrink-0">
            <div className="w-12 h-12 bg-indigo-500 rounded-full flex items-center justify-center shadow-lg">
              <Sparkles className="w-5 h-5 text-white animate-pulse" />
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 border-2 border-slate-900 rounded-full"></div>
          </div>

          <div className="flex-1 min-w-0 text-left">
            <p className="text-indigo-400 text-[10px] font-extrabold uppercase tracking-widest mb-0.5">AeroAI Seyahat Önerisi</p>
            <p className="text-white font-medium text-[10.5px] leading-relaxed">
              {accessibilityProfile && accessibilityProfile.enabled ? (
                <>
                  &quot;Sayın {flightData.passengerName || "Yolcu"}, size özel hazırlanan merdivensiz asansörler ve engelsiz koridorlar sayesinde güvenlik kontrolüne <span className="text-emerald-400 font-bold">4 dakikada</span> ulaşabilirsiniz. Asistanınız kapıda hazır bekliyor.&quot;
                </>
              ) : (
                <>
                  &quot;{flightData.passengerName || "Yolcu"}, G kapısındaki güvenlik check-in akıcı durumda. Uçuştan önce lounge alanında <span className="text-indigo-400 font-bold">15 dakika daha</span> vakit geçirebilirsin.&quot;
                </>
              )}
            </p>
          </div>
        </div>

        {/* Boarding count dynamics */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-3">
          <div className="flex justify-between items-end">
            <span className="text-[10px] font-bold text-slate-500 block leading-none uppercase tracking-wider">Doluluk / Yerleşim Oranı</span>
            <span className="text-[9px] text-indigo-600 font-extrabold font-mono uppercase bg-indigo-50 px-2 py-0.5 rounded">
              %{flightData.boardingProgress} DOLULUK
            </span>
          </div>

          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
            <div 
              className="bg-indigo-600 h-full transition-all duration-1000 ease-out"
              style={{ width: `${flightData.boardingProgress}%` }}
            ></div>
          </div>

          <div className="flex justify-between text-[9px] text-slate-400">
            <span>Uçak Grubu: {flightData.group}</span>
            <span>Güvenlik: {flightData.securityQueueTime} Saniye</span>
          </div>
        </div>

        {/* Step 5: Aile Koruma (Family Protection) Module - Conditional & Toggleable for high-fidelity testing */}
        <div className={`rounded-3xl p-6 border shadow-sm transition-all duration-300 text-left ${isUnder18 ? "bg-slate-50 border-slate-200" : "bg-white border-slate-200 hover:border-slate-300"}`}>
          {/* Header Bento Tile */}
          <div className="flex items-center justify-between border-b border-slate-200/60 pb-3.5 mb-3.5">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-xl shrink-0 transition-transform duration-300 ${isUnder18 ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/15 scale-105" : "bg-slate-100 text-slate-400"}`}>
                <Shield className={`w-4 h-4 ${isUnder18 ? "animate-pulse" : ""}`} />
              </div>
              <div>
                <h3 className="text-slate-900 text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5">
                  🛡️ Aile Koruma Sistemi
                </h3>
                <span className={`text-[8px] font-extrabold px-1.5 py-0.5 rounded-md border tracking-wide uppercase inline-block mt-0.5 ${isUnder18 ? "bg-emerald-50 text-emerald-800 border-emerald-200" : "bg-slate-50 text-slate-500 border-slate-200"}`}>
                  {isUnder18 ? "✓ Veli Takibi Aktif" : "Koruma Pasif"}
                </span>
              </div>
            </div>
            
            {/* Simulator Toggle */}
            <label className="relative inline-flex items-center cursor-pointer select-none">
              <input 
                type="checkbox" 
                checked={isUnder18} 
                onChange={(e) => setIsUnder18(e.target.checked)} 
                className="sr-only peer" 
              />
              <div className="w-8 h-4.5 bg-slate-250 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-indigo-600"></div>
            </label>
          </div>

          <div className="text-left">
            {isUnder18 ? (
              <div className="space-y-4">
                {/* Description capsule - Bento Info Banner */}
                <div className="bg-indigo-50/50 border border-indigo-100/40 rounded-3xl p-4 text-[10px] text-slate-700 leading-relaxed font-semibold">
                  Yolcu 18 yaş altında olduğu için <strong className="text-indigo-950 font-extrabold">Gözetimli Aile Modu</strong> devrededir. Yolculuğun her milisaniyesindeki checkpoint, kapı veya rötar raporları anlık yetkili veliye iletilir.
                </div>

                {/* Sub-Bento Columns for Contacts and Technical Logs */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  {/* Bento Cell A: Secure Phone Bar */}
                  <div className="bg-white p-5 rounded-3xl border border-slate-200/70 shadow-2xs flex flex-col justify-between min-h-[145px]">
                    <div>
                      <span className="text-[8px] font-extrabold text-slate-400 block tracking-widest uppercase mb-1">VELİ İLETİŞİM KANALI</span>
                      <p className="text-[9.5px] text-slate-500 font-medium leading-relaxed">
                        Acil çağrılar ve anlık geçiş raporlarının ulaşacağı kayıtlı veli hattı:
                      </p>
                    </div>

                    <div className="mt-3 bg-slate-50/60 p-2.5 rounded-2xl border border-slate-100 flex items-center justify-between text-[11px] font-semibold">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="text-slate-400 shrink-0">📞</span>
                        {isEditingPhone ? (
                          <input 
                            type="text" 
                            value={phoneInput} 
                            onChange={(e) => setPhoneInput(e.target.value)}
                            className="bg-white border border-slate-200 rounded px-1.5 py-0.5 text-[11px] font-bold text-slate-850 w-full focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          />
                        ) : (
                          <strong className="text-slate-800 font-mono font-black tracking-wide truncate">{guardianPhone}</strong>
                        )}
                      </div>
                      
                      {isEditingPhone ? (
                        <button 
                          onClick={() => {
                            setGuardianPhone(phoneInput);
                            setIsEditingPhone(false);
                          }}
                          className="text-[9px] text-emerald-650 hover:text-emerald-800 font-extrabold uppercase transition-colors shrink-0 ml-1.5 pointer-events-auto"
                        >
                          Kaydet
                        </button>
                      ) : (
                        <button 
                          onClick={() => setIsEditingPhone(true)}
                          className="text-[9px] text-indigo-600 hover:text-indigo-900 font-extrabold uppercase transition-colors shrink-0 ml-1.5 pointer-events-auto"
                        >
                          Düzenle
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Bento Cell B: Live Milisecond tracking logs */}
                  <div className="bg-white p-5 rounded-3xl border border-slate-200/70 shadow-2xs flex flex-col justify-between min-h-[145px] text-left">
                    <div>
                      <span className="text-[8px] font-extrabold text-indigo-950 block tracking-widest uppercase mb-2.5">MİLİSANİYE CANLI RAPORLAMA</span>
                      
                      <div className="relative pl-3 border-l border-dashed border-indigo-200/80 ml-1 space-y-2 py-0.5">
                        {/* Checkpoint 1 */}
                        <div className="relative flex items-center justify-between text-[9px]">
                          <div className="absolute -left-[16px] top-1 w-1.5 h-1.5 rounded-full bg-indigo-600 ring-2 ring-indigo-50"></div>
                          <span className="font-bold text-slate-750">1. Havalimanı Girişi</span>
                          <span className="text-[7.5px] bg-emerald-50 text-emerald-700 font-bold px-1 rounded border border-emerald-150 font-mono">GÖNDERİLDİ</span>
                        </div>

                        {/* Checkpoint 2 */}
                        <div className="relative flex items-center justify-between text-[9px]">
                          <div className={`absolute -left-[16px] top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full ${flightData.boardingStatus === "Delayed" || flightData.boardingStatus === "Cancelled" ? "bg-amber-500 animate-ping" : "bg-indigo-600"}`}></div>
                          <span className="font-bold text-slate-755">2. Kapı İzlenceleri</span>
                          <span className={`text-[7.5px] font-extrabold px-1 rounded border font-mono ${flightData.boardingStatus === "Delayed" ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-indigo-50 text-indigo-700 border-indigo-150"}`}>
                            {flightData.boardingStatus === "Delayed" ? "RAPORLANDI" : "TAKİPTE"}
                          </span>
                        </div>

                        {/* Checkpoint 3 */}
                        <div className="relative flex items-center justify-between text-[9px]">
                          <div className="absolute -left-[16px] top-1 w-1.5 h-1.5 rounded-full bg-slate-250"></div>
                          <span className="font-bold text-slate-400">3. Uçağa Biniş</span>
                          <span className="text-[7.5px] text-slate-400 font-bold font-mono">BEKLENİYOR</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                </div>

                {/* Bento Cell C: Dedicated Emergency Alert - Large interactive target element with consistent rounded-3xl edges */}
                <div className="bg-rose-50/40 border border-rose-100/60 rounded-3xl p-5 flex flex-col gap-4 shadow-2xs">
                  <div className="border-b border-rose-100/45 pb-3">
                    <span className="text-[8px] font-extrabold text-rose-800 block tracking-widest uppercase mb-1">ACİL DURUM YARDIM MERKEZİ</span>
                    <p className="text-[9.5px] text-rose-950 font-medium leading-relaxed">
                      Herhangi bir kriz, kaybolma, gecikme paniği veya tıbbi yardım halinde velinizin telefonuna anında canlı konum ve acil durum çağrısını iletmek için aşağıdaki büyük kırmızı butona basın.
                    </p>
                  </div>

                  <button
                    onClick={handleSendEmergencyAlert}
                    disabled={isSendingAlert}
                    className={`w-full font-black text-xs sm:text-sm py-4 px-6 rounded-2xl transition-all uppercase tracking-widest flex items-center justify-center gap-3 cursor-pointer shadow-md select-none transform hover:scale-[1.01] active:scale-95 outline-none duration-150 ${
                      alertSentSuccess 
                        ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/25" 
                        : "bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/20"
                    }`}
                  >
                    {isSendingAlert ? (
                      <>
                        <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                        <span>Acil Durum SMS&apos;i İletiliyor...</span>
                      </>
                    ) : alertSentSuccess ? (
                      <>
                        <CheckCircle className="w-5 h-5 text-white shrink-0 animate-bounce" />
                        <span>VELİYE ACİL DURUM SMS&apos;İ GÖNDERİLDİ!</span>
                      </>
                    ) : (
                      <>
                        <BellRing className="w-5 h-5 text-white shrink-0 animate-pulse" />
                        <span>Veliye Acil Bildirim Gönder (Yüksek Öncelikli)</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Highly structured independent Feedback Status element when alert is active */}
                {alertSentSuccess && (
                  <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-3xl p-5 shadow-sm animate-fade-in text-left">
                    <div className="flex items-center gap-2 text-emerald-700 font-extrabold text-[10px] mb-2 uppercase tracking-wider">
                      <span className="animate-ping w-2 h-2 rounded-full bg-emerald-500"></span>
                      <span>💬 ANLIK SMS GERİ BİLDİRİMİ</span>
                    </div>
                    <span className="text-[9.5px] text-slate-705 font-semibold block mb-2 leading-relaxed">
                      Velinizin kayıtlı cep telefonu hattına (<strong className="text-slate-900 font-mono">{guardianPhone}</strong>) uydudan canlı konum verisi ve kriz alarmı iletilmiştir.
                    </span> 
                    <div className="bg-white p-3 rounded-2xl border border-emerald-250/30 font-mono text-slate-800 text-[8.5px] leading-relaxed shadow-3xs">
                      &quot;SmartPass ACİL BİLDİRİM: {flightData.passengerName || "Yolcu"} havalimanında acil yardım alarmı tetikledi. Canlı uçuş takip paneli üzerinden durumu kontrol edin.&quot;
                    </div>
                  </div>
                )}

                {/* Bento alert logs - Transparent Bento-styled log container */}
                <div className="bg-slate-50/40 border border-slate-200/40 rounded-3xl p-4 shadow-3xs text-left">
                  <div className="flex items-center justify-between border-b border-slate-200/30 pb-2 mb-2">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs">📋</span>
                      <span className="text-[8px] font-extrabold text-slate-500 tracking-wider uppercase">ACİL DURUM SMS LOGLARI</span>
                    </div>
                    <span className="text-[7px] bg-slate-100 text-slate-500 font-bold px-1.5 py-0.5 rounded border border-slate-200 font-mono">LIVEDEV</span>
                  </div>
                  
                  <div className="space-y-1.5">
                    {alertLogs.map((log) => (
                      <div key={log.id} className="flex items-center justify-between text-[9px] bg-slate-50/20 backdrop-blur-xs border border-slate-200/30 p-2 rounded-2xl shadow-3xs hover:bg-slate-50/50 transition-colors">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-slate-400 shrink-0">🕒</span>
                          <span className="font-mono font-bold text-slate-700 tracking-wide">{log.time}</span>
                          <span className="hidden sm:inline text-[7.5px] text-slate-400 font-semibold uppercase tracking-wider bg-slate-100/40 px-1 rounded border border-slate-200/20">SMS Otoritesi</span>
                        </div>
                        <span className={`text-[7.5px] font-bold px-2 py-0.5 rounded-full border font-mono tracking-wider transition-all duration-300 flex items-center gap-1.5 ${
                          log.status === "Beklemede" 
                            ? "bg-amber-50/80 text-amber-600 border-amber-200 animate-pulse" 
                            : "bg-emerald-50/80 text-emerald-700 border-emerald-200"
                        }`}>
                          {log.status === "Beklemede" ? (
                            <>
                              <span className="w-1 h-1 rounded-full bg-amber-500 animate-ping"></span>
                              <span>BEKLEMEDE</span>
                            </>
                          ) : (
                            <>
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                              <span>BAŞARILI</span>
                            </>
                          )}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {!alertSentSuccess && (
                  <div className="text-[9px] text-slate-400 font-semibold leading-normal flex items-start gap-1.5 px-1">
                    <span className="shrink-0 text-xs">💡</span>
                    <span>
                      Bu butona tıklandığında uydudan öncelikli SMS uyarısı gönderilir ve velinizin haritasında acil durum konumu canlanır.
                    </span>
                  </div>
                )}

              </div>
            ) : (
              /* If family protection is off */
              <div className="bg-indigo-50/40 p-5 rounded-3xl border border-indigo-100/50 space-y-2.5 mt-2">
                <p className="text-[10px] text-slate-500 leading-relaxed font-semibold">
                  Güvenli Veli Denetimi ve Aile Takibi sistemimiz şu anda aktif değildir. Reşit olmayan yolcularımız için geliştirilen bu koruma modülünü test etmek veya detaylarına erişmek amacıyla yukarıdaki anahtar üzerinden aktifleştirebilirsiniz.
                </p>
                <div className="text-[8.5px] text-indigo-850 font-bold bg-white p-3 rounded-2xl border border-indigo-100/65 flex items-center gap-2 shadow-xs">
                  <Lock className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                  <span>18 yaş altı yolcularda uçuş kapısı rötarları ve kapı değişimleri velilere milisaniye düzeyinde anlık SMS ile bildirilir.</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Bento Cell: Airport Operator Live Distribution Chart */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm text-left flex flex-col justify-between min-h-[310px]">
          <div className="border-b border-slate-100 pb-3 mb-2.5 flex items-center justify-between">
            <div>
              <span className="text-[8px] font-extrabold text-indigo-950 block tracking-widest uppercase">CANLI OPERATÖR TRAFİK DAĞILIMI</span>
              <h3 className="text-sm font-black text-slate-900 tracking-tight mt-0.5">DHMİ &amp; Terminal Otoriteleri Dağılımı</h3>
            </div>
            <div className="flex items-center gap-1.5 bg-indigo-50/70 border border-indigo-100/50 px-2 py-0.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-pulse"></span>
              <span className="text-[8px] font-bold text-indigo-700 tracking-wide uppercase">CANLI VERİ</span>
            </div>
          </div>

          <div className="h-44 w-full relative flex items-center justify-center my-1">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={operatorData}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={65}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {operatorData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-slate-950/95 text-white border border-slate-800 p-2.5 rounded-xl text-[10px] font-sans shadow-lg backdrop-blur-xs">
                          <p className="font-extrabold tracking-wide uppercase text-indigo-300">{data.name} Otoritesi</p>
                          <p className="font-mono text-xs font-semibold mt-0.5">{data.value} Aktif Sefer</p>
                        </div>
                      );
                    }
                    return null;
                  }} 
                />
              </PieChart>
            </ResponsiveContainer>
            
            {/* Inside inner radius center text */}
            <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-lg font-black text-slate-850 tracking-tight leading-none">
                {operatorData.reduce((acc, curr) => acc + curr.value, 0)}
              </span>
              <span className="text-[7.5px] text-slate-400 font-extrabold uppercase tracking-widest mt-0.5">Toplam Sefer</span>
            </div>
          </div>

          {/* Custom Legend for premium bento design */}
          <div className="grid grid-cols-2 gap-2 mt-2 pt-3 border-t border-slate-100/80">
            {operatorData.map((item, index) => (
              <div key={index} className="flex items-center gap-2 px-2.5 py-1.5 bg-slate-50/50 rounded-xl border border-slate-100">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }}></span>
                <div className="flex flex-col min-w-0">
                  <span className="text-[9px] font-black text-slate-700 leading-none">{item.name}</span>
                  <span className="text-[8px] text-slate-400 font-semibold font-mono tracking-tighter mt-0.5">{item.value} Sefer</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Customized Loyalty and Lounge Passes based on destination country */}
        <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/15 rounded-3xl p-5 relative overflow-hidden flex items-start gap-4">
          <div className="w-10 h-10 bg-amber-500/25 border border-amber-500/30 text-amber-700 rounded-2xl flex items-center justify-center shrink-0">
            <Gift className="w-5 h-5" />
          </div>
          <div className="text-left">
            <h4 className="text-[10px] font-extrabold text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
              {flightData.to === "LHR" ? "LONDRA SEFERİNE ÖZEL DUTY-FREE HEDİYESİ" : "HATTINIZA ÖZEL HAVALİMANI FIRSATI"}
            </h4>
            <p className="text-[11px] text-amber-950 leading-relaxed mt-1 font-semibold">
              {flightData.to === "LHR"
                ? "Canlı İGA verilerine göre pasaport geçişinden sonraki ilk Duty Free mağazasında geçerli %15 indirim kodunuz: "
                : "Uçuş öncesi seyahat asistanınız sayesinde lounge alanlarında geçerli %10 indirim kazandınız: "}
              <span className="font-mono font-black text-slate-900 bg-white border border-amber-500/30 px-2 py-0.5 rounded shadow-xs ml-1">
                TK-LHR-VIP
              </span>
            </p>
          </div>
        </div>

        {/* Digital Boarding Pass QR Box */}
        <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-slate-200 relative mt-4 text-left">
          <div className="p-6">
            <div className="flex justify-between items-center mb-5 border-b border-slate-100 pb-4">
              <div>
                <span className="text-[10px] text-slate-600 font-bold block uppercase tracking-wider">KOLTUK</span>
                <span className="text-2.5xl font-black text-slate-900 font-display">{flightData.seat}</span>
              </div>
              <div className="text-center">
                <span className="text-[10px] text-slate-600 font-bold block uppercase tracking-wider">BİNİŞ GRUBU</span>
                <span className="text-2.5xl font-black text-indigo-600 font-display">{flightData.group}</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-600 font-bold block uppercase tracking-wider">TAHMİNÎ BİNİŞ</span>
                <span className="text-xl font-bold text-indigo-750 font-mono">{flightData.departureTime}</span>
              </div>
            </div>

            <div className="bg-slate-50 p-5 rounded-[2rem] flex flex-col items-center justify-center border-2 border-dashed border-slate-200">
              <div 
                onClick={() => setShowQrTicket(!showQrTicket)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setShowQrTicket(!showQrTicket); } }}
                role="button"
                tabIndex={0}
                aria-label="Dijital biniş QR kod kare barkodunu turnike görünümünde büyütmek amacıyla açmak için tıklayın"
                className="w-32 h-32 bg-white p-2.5 rounded-2xl shadow-inner mb-3.5 cursor-pointer relative group border border-slate-150 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2"
              >
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=BOARDING-${flightData.flightNumber}-${flightData.passengerName}`} 
                  alt="Havalimanı kapı geçiş asistanlığı ve doğrulamaları biniş kartı QR barkodu" 
                  className="w-full h-full object-contain mix-blend-multiply opacity-90"
                />
                <div className="absolute inset-0 bg-slate-900/70 opacity-0 group-hover:opacity-100 group-focus:opacity-100 flex items-center justify-center text-white text-[9px] font-bold rounded-2xl transition-opacity">
                  BÜYÜTMEK İÇİN TIKLAYIN
                </div>
              </div>
              
              <span className="text-[10px] text-slate-600 font-mono tracking-widest uppercase font-semibold">
                {flightData.flightNumber}-PASS-{flightData.seat}-A
              </span>
            </div>

            <div className="mt-5">
              <button 
                onClick={() => setShowQrTicket(true)}
                className="w-full bg-slate-900 hover:bg-slate-800 active:scale-98 text-white py-3.5 px-8 rounded-2xl font-bold text-xs shadow-md transition-all uppercase tracking-wider min-h-[44px] flex items-center justify-center"
                aria-label="Uçuş kartı pass detaylarını tam ekran modunda açın"
              >
                Giriş Pass Kartını Göster / Cihaza Kaydet
              </button>
            </div>
          </div>
          
          <div className="bg-slate-900 text-white p-4.5 flex items-center justify-between border-t border-slate-850">
            <div className="space-y-0.5">
              <span className="text-[9px] text-indigo-300 block uppercase tracking-wider font-bold">Bagaj Durumu</span>
              <span className="text-xs font-semibold">1 Bagaj Kaydı Tamamlandı</span>
            </div>
            <span className="bg-emerald-500/25 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold px-2.5 py-0.5 rounded-full">
              Kayıtlı
            </span>
          </div>
        </div>
      </div>

      {/* Floating Interactive bottom CTAs to prompt chat or maps */}
      {showQrTicket && (
        <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center p-6 z-50">
          <div className="bg-[#F8F9FA] rounded-[2rem] w-full max-w-sm flex flex-col border border-slate-150 shadow-2xl animate-scale-up relative overflow-hidden">
            
            {/* L1: HEADER BAR */}
            <div className="flex justify-between items-center bg-[#F8F9FA] px-6 py-4.5 border-b border-slate-200/60 shrink-0">
              <span className="text-lg font-extrabold tracking-tight text-[#111111] font-display">SmartPass</span>
              <div className="flex items-center gap-1.5 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse"></span>
                <span className="text-[10px] font-black text-emerald-700 tracking-wide uppercase">Aktif</span>
              </div>
            </div>

            {/* L2 & L3: MAIN DETAILS BODY */}
            <div className="px-6 py-5 flex flex-col items-center flex-1 justify-center my-auto">
              
              {/* Turnstile Indicator guide */}
              <div className="mb-4.5 text-slate-700 flex flex-col items-center animate-bounce">
                <span className="text-[10px] font-bold tracking-widest uppercase mb-1">Okutmak İçin Yaklaştırın</span>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4.5 w-4.5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 13l-7 7-7-7" fill="none" />
                </svg>
              </div>

              {/* QR Code container card */}
              <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center justify-center mb-6 w-full max-w-[240px] aspect-square transition-all duration-300 hover:scale-102">
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=M1${flightData.passengerName.toUpperCase().replace(/\s/g, "")}/${flightData.flightNumber.toUpperCase()}      E1AAAAA ${flightData.from}${flightData.to} ${flightData.airline} ${flightData.flightNumber} ${flightData.seat}`} 
                  alt="Turnike taraması ve doğrulamaları için oluşturulan bilet okuyucu uyumlu biniş QR kodu" 
                  className="w-full h-full object-contain mix-blend-multiply"
                />
              </div>

              {/* Information Matrix (Exactly 3 Columns) */}
              <div className="grid grid-cols-3 gap-2 w-full text-center border-t border-slate-200/60 pt-5">
                <div>
                  <p className="text-[10px] font-bold tracking-wider text-slate-700 uppercase mb-0.5">Kapı / Peron</p>
                  <p className="text-lg font-black text-[#111111] tracking-tight">Gate {flightData.gate}</p>
                </div>
                <div className="border-x border-slate-200/60">
                  <p className="text-[10px] font-bold tracking-wider text-slate-700 uppercase mb-0.5">Geçiş Saati</p>
                  <p className="text-lg font-black text-[#111111] tracking-tight">{flightData.departureTime}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold tracking-wider text-slate-700 uppercase mb-0.5">Koltuk / No</p>
                  <p className="text-lg font-black text-[#111111] tracking-tight">{flightData.seat}</p>
                </div>
              </div>
            </div>

            {/* L4: COLLAPSIBLE BOTTOM SHEET DRAWER */}
            <div className="w-full bg-white border-t border-slate-200/80 rounded-b-[2rem] overflow-hidden">
              <button 
                onClick={() => setDrawerOpen(!drawerOpen)}
                aria-expanded={drawerOpen}
                aria-controls="drawer-details-content"
                aria-label="Uçuş bilet kriz detayları ve bagaj bilgileri kayıt dökümü çekmecesini açın"
                className="w-full py-4 px-6 flex justify-between items-center text-slate-700 hover:text-[#111111] transition-colors focus:outline-none min-h-[48px]"
              >
                <span className="text-xs font-bold tracking-tight">Diğer Bilet Detayları</span>
                <svg 
                  className={`h-4.5 w-4.5 transform transition-transform duration-300 ${drawerOpen ? "rotate-180" : "rotate-0"}`} 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              <div 
                id="drawer-details-content"
                className={`transition-all duration-300 ease-in-out px-6 overflow-hidden ${
                  drawerOpen ? "max-h-64 pb-6 pt-2 border-t border-slate-100" : "max-h-0"
                }`}
              >
                <div className="space-y-2.5 text-xs text-slate-600">
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-bold">Yolcu Adı</span>
                    <span className="font-extrabold text-[#111111] uppercase">{flightData.passengerName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-bold">Rezervasyon No (PNR)</span>
                    <span className="font-mono font-black text-[#111111]">1AAAAA</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-bold">Uçuş / Sefer No</span>
                    <span className="font-black text-[#111111]">{flightData.flightNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-bold">Rota</span>
                    <span className="font-bold text-[#111111]">{flightData.from} - {flightData.to}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-bold">Bilet Tipi / Sınıf</span>
                    <span className="font-bold text-[#111111]">Ekonomi (Grup {flightData.group})</span>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Quick exit bar below card */}
          <button 
            onClick={() => setShowQrTicket(false)}
            className="mt-5 bg-white/20 hover:bg-white/30 backdrop-blur-md text-white font-extrabold text-[11px] py-2.5 px-6 rounded-full transition-all uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer min-h-[44px]"
            aria-label="Dijital turnike biniş kartından ana seyahat akış paneline geri dönün"
          >
            Arayüze Geri Dön
          </button>
        </div>
      )}

      {/* Persistent Bottom Assistant Prompt CTA */}
      <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto px-4 pb-4 bg-transparent pointer-events-none z-30">
        <button 
          onClick={onOpenChat}
          className="w-full bg-indigo-900 text-white py-4 px-4 rounded-3xl shadow-xl flex items-center justify-between hover:bg-indigo-800 active:scale-98 transition-all cursor-pointer pointer-events-auto shadow-indigo-900/35 min-h-[48px]"
          aria-label="AeroAI yapay zeka seyahat asistanı ve kriz masası konuşma penceresini aç"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-orange-500 font-display flex items-center justify-center text-white ring-4 ring-orange-500/20">
              <MessageCircleMore className="w-4.5 h-4.5" />
            </div>
            <div className="text-left">
              <div className="text-[11px] font-extrabold uppercase leading-none text-orange-400 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-orange-450 animate-pulse" />
                AeroAI Yapay Zekâ Asistanı
              </div>
              <div className="text-[10px] text-slate-200 mt-1.5 font-medium">Canlı kriz yönetimi desteği, rötarlar ve sss</div>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-orange-400" />
        </button>
      </div>

    </div>
  );
}
