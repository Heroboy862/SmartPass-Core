import React, { useState, useEffect } from "react";
import QRCode from "qrcode";
import { FlightInfo } from "../../types";

interface DigitalQrTicketModalProps {
  flightData: FlightInfo;
  onClose: () => void;
}

export function DigitalQrTicketModal({
  flightData,
  onClose
}: DigitalQrTicketModalProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [localQrUrl, setLocalQrUrl] = useState<string>("");

  useEffect(() => {
    const qrText = `M1${flightData.passengerName.toUpperCase().replace(/\s/g, "")}/${flightData.flightNumber.toUpperCase()}      E1AAAAA ${flightData.from}${flightData.to} ${flightData.airline} ${flightData.flightNumber} ${flightData.seat}`;
    QRCode.toDataURL(qrText, { margin: 1, width: 300 })
      .then(url => setLocalQrUrl(url))
      .catch(err => console.error("Error generating modal local QR code:", err));
  }, [flightData]);

  return (
    <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm flex flex-col items-center justify-center p-6 z-50">
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
              src={localQrUrl || `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=M1${flightData.passengerName.toUpperCase().replace(/\s/g, "")}/${flightData.flightNumber.toUpperCase()}      E1AAAAA ${flightData.from}${flightData.to} ${flightData.airline} ${flightData.flightNumber} ${flightData.seat}`} 
              alt="Turnike taraması ve doğrulamaları için oluşturulan bilet okuyucu uyumlu biniş QR kodu" 
              className="w-full h-full object-contain mix-blend-multiply"
              referrerPolicy="no-referrer"
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
            type="button"
            onClick={() => setDrawerOpen(!drawerOpen)}
            aria-expanded={drawerOpen}
            aria-controls="drawer-details-content"
            aria-label="Uçuş bilet kriz detayları ve bagaj bilgileri kayıt dökümü çekmecesini açın"
            className="w-full py-4 px-6 flex justify-between items-center text-slate-700 hover:text-[#111111] transition-colors focus:outline-none min-h-[48px] cursor-pointer"
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
            <div className="space-y-2.5 text-xs text-slate-600 text-left">
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
        type="button"
        onClick={onClose}
        className="mt-5 bg-white/20 hover:bg-white/30 backdrop-blur-md text-white font-extrabold text-[11px] py-2.5 px-6 rounded-full transition-all uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer min-h-[44px]"
        aria-label="Dijital turnike biniş kartından ana seyahat akış paneline geri dönün"
      >
        Arayüze Geri Dön
      </button>
    </div>
  );
}
