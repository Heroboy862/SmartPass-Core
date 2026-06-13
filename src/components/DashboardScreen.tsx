import React, { useState, useEffect, lazy, Suspense } from "react";
import QRCode from "qrcode";
import { Sparkles, MessageCircleMore, ArrowRight, Gift } from "lucide-react";
import { FlightInfo, AccessibilityProfile, BoardingStatus } from "../types";

const TerminalMap = lazy(() => import("./TerminalMap"));

// Grouped subcomponents for high-cohesion bento boards
import { DashboardHeader } from "./dashboard/DashboardHeader";
import { LiveDataSourceBadge } from "./dashboard/LiveDataSourceBadge";
import { AccessibilityIndicator } from "./dashboard/AccessibilityIndicator";
import { ActiveFlightCard } from "./dashboard/ActiveFlightCard";
import { KrisisAlertPanel } from "./dashboard/KrisisAlertPanel";
import { WeatherWidget } from "./dashboard/WeatherWidget";
import { BentoStatsGrid } from "./dashboard/BentoStatsGrid";
import { TransitConsole } from "./dashboard/TransitConsole";
import { AviationTrimSimulation } from "./dashboard/AviationTrimSimulation";
import { AirportOperatorChart } from "./dashboard/AirportOperatorChart";
import { ChildSafetyLock } from "./dashboard/ChildSafetyLock";
import { PrivacyAuditReport } from "./dashboard/PrivacyAuditReport";
import { DigitalQrTicketModal } from "./dashboard/DigitalQrTicketModal";

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
  const [localQrUrl, setLocalQrUrl] = useState<string>("");

  useEffect(() => {
    const qrText = `BOARDING-${flightData.flightNumber}-${flightData.passengerName}`;
    QRCode.toDataURL(qrText, { margin: 1, width: 250 })
      .then(url => setLocalQrUrl(url))
      .catch(err => console.error("Error generating local QR code:", err));
  }, [flightData.flightNumber, flightData.passengerName]);

  // Dynamic color coding based on status
  const getStatusColor = (status: BoardingStatus) => {
    switch (status) {
      case "Boarding Now": return "bg-emerald-500 text-white animate-pulse";
      case "Waiting": return "bg-blue-500 text-white";
      case "Delayed": return "bg-amber-500 text-slate-900";
      case "Cancelled": return "bg-rose-600 text-white";
      case "Closed": return "bg-slate-500 text-white";
      default: return "bg-slate-500 text-white";
    }
  };

  const getStatusLabelText = (status: BoardingStatus) => {
    switch (status) {
      case "Boarding Now": return "Biniş Başladı";
      case "Waiting": return "Kapıda Bekleyin";
      case "Delayed": return "Ertelendi (Kriz)";
      case "Cancelled": return "İptal Edildi (Kriz)";
      case "Closed": return "Kapı Kapandı";
      default: return "Kapalı";
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#f8fafc] font-sans text-slate-900 relative overflow-hidden">
      
      {/* 1. Dynamic Header */}
      <DashboardHeader 
        biometricVerified={flightData.biometricVerified} 
        onOpenScanner={onOpenScanner} 
        onLogout={onLogout} 
      />

      <div className="flex-1 overflow-y-auto p-5 pb-28 space-y-4">
        
        {/* 2. Active operator live badge indicator */}
        <LiveDataSourceBadge 
          boardingStatus={flightData.boardingStatus} 
          airportOperator={flightData.airportOperator} 
          source={flightData.source}
        />

        {/* 3. Accessibility Profile Info Indicator */}
        <AccessibilityIndicator accessibilityProfile={accessibilityProfile} />

        {/* 4. Active Flight Card (IATA Ticket) */}
        <ActiveFlightCard 
          flightData={flightData} 
          getStatusColor={getStatusColor} 
          getStatusLabelText={getStatusLabelText} 
        />

        {/* 5. Smart Krisis Alert Warnings Panel */}
        <KrisisAlertPanel flightData={flightData} />

        {/* 5.5. Live Travel Weather Comparison Widget */}
        <WeatherWidget flightData={flightData} />

        {/* 6. Bento Metrics Widgets: Gate walks, Smart ID & Live exchange rates */}
        <BentoStatsGrid 
          flightData={flightData} 
          showGateMap={showGateMap} 
          setShowGateMap={setShowGateMap} 
        />

        {/* 7. Interactive Terminal Walk Maps */}
        {showGateMap && (
          <Suspense fallback={
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm text-center flex flex-col items-center justify-center min-h-[220px]">
              <div className="w-8 h-8 rounded-full border-4 border-indigo-600 border-t-transparent animate-spin mb-4" />
              <p className="text-xs text-slate-500 font-semibold">Terminal Haritası Yükleniyor...</p>
            </div>
          }>
            <TerminalMap flightData={flightData} accessibilityProfile={accessibilityProfile} />
          </Suspense>
        )}

        {/* 8. Regional Turkish Transit and Transfer Console */}
        <TransitConsole flightData={flightData} />

        {/* 9. Bento AI Companion Advice Card */}
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

        {/* 10. Boarding count dynamics */}
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

        {/* 11. Aircraft Boarding Trim and Balance Simulation System */}
        <AviationTrimSimulation flightData={flightData} />

        {/* 11.5 Privacy and KVKK Audit Transparency Report */}
        <PrivacyAuditReport flightData={flightData} accessibilityProfile={accessibilityProfile} />

        {/* 12. Child Safety / Guard Supervision System */}
        <ChildSafetyLock flightData={flightData} accessibilityProfile={accessibilityProfile} />

        {/* 13. Operator traffic distribution real-time collection metrics */}
        <AirportOperatorChart activeOperator={flightData?.airportOperator} />

        {/* 14. Loyalty and Duty-Free Specials */}
        <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/15 rounded-3xl p-5 relative overflow-hidden flex items-start gap-4">
          <div className="w-10 h-10 bg-amber-500/25 border border-amber-500/30 text-amber-700 rounded-2xl flex items-center justify-center shrink-0">
            <Gift className="w-5 h-5" />
          </div>
          <div className="text-left font-sans">
            <h4 className="text-[10px] font-extrabold text-amber-900 uppercase tracking-wider flex items-center gap-1.5 leading-none">
              <Sparkles className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
              {flightData.to === "LHR" ? "LONDRA SEFERİNE ÖZEL DUTY-FREE HEDİYESİ" : "HATTINIZA ÖZEL HAVALİMANI FIRSATI"}
            </h4>
            <p className="text-[11px] text-amber-950 leading-relaxed mt-2 font-semibold">
              {flightData.to === "LHR"
                ? "Canlı İGA verilerine göre pasaport geçişinden sonraki ilk Duty Free mağazasında geçerli %15 indirim kodunuz: "
                : "Uçuş öncesi seyahat asistanınız sayesinde lounge alanlarında geçerli %10 indirim kazandınız: "}
              <span className="font-mono font-black text-slate-900 bg-white border border-amber-500/30 px-2 py-0.5 rounded shadow-xs ml-1">
                TK-LHR-VIP
              </span>
            </p>
          </div>
        </div>

        {/* 15. Boarding card QR launcher */}
        <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-slate-200 relative mt-4 text-left font-sans">
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
                  src={localQrUrl || `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=BOARDING-${flightData.flightNumber}-${flightData.passengerName}`} 
                  alt="Havalimanı kapı geçiş asistanlığı ve doğrulamaları biniş kartı QR barkodu" 
                  className="w-full h-full object-contain mix-blend-multiply opacity-90"
                  referrerPolicy="no-referrer"
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
                type="button"
                onClick={() => setShowQrTicket(true)}
                className="w-full bg-slate-900 hover:bg-slate-800 active:scale-98 text-white py-3.5 px-8 rounded-2xl font-bold text-xs shadow-md transition-all uppercase tracking-wider min-h-[44px] flex items-center justify-center cursor-pointer"
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

      {/* 16. Immersive Full-screen scanning boarding pass modal */}
      {showQrTicket && (
        <DigitalQrTicketModal 
          flightData={flightData} 
          onClose={() => setShowQrTicket(false)} 
        />
      )}

      {/* Persistent Bottom Assistant Prompt CTA - Styled absolutely and padded with safe translucent fade transitions */}
      <div className="absolute bottom-0 left-0 right-0 px-4 pb-4 bg-gradient-to-t from-[#f8fafc] via-[#f8fafc]/95 to-transparent pt-8 pointer-events-none z-30">
        <button 
          type="button"
          onClick={onOpenChat}
          className="w-full bg-indigo-900 text-white py-4 px-4 rounded-3xl shadow-xl flex items-center justify-between hover:bg-indigo-805 active:scale-98 transition-all cursor-pointer pointer-events-auto shadow-indigo-900/35 min-h-[48px]"
          aria-label="AeroAI yapay zeka seyahat asistanı ve kriz masası konuşma penceresini aç"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-orange-500 font-display flex items-center justify-center text-white ring-4 ring-orange-500/20">
              <MessageCircleMore className="w-4.5 h-4.5" />
            </div>
            <div className="text-left font-sans">
              <div className="text-[11px] font-extrabold uppercase leading-none text-orange-400 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-orange-400 animate-pulse" />
                AeroAI Yapay Zekâ Asistanı
              </div>
              <div className="text-[10px] text-slate-200 mt-1.5 font-medium">Canlı kriz yönetimi desteği, rötarlar ve sss</div>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-orange-450" />
        </button>
      </div>

    </div>
  );
}
