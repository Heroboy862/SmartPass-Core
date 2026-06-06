import React from "react";
import { AlertCircle } from "lucide-react";
import { FlightInfo } from "../../types";

interface KrisisAlertPanelProps {
  flightData: FlightInfo;
}

export function KrisisAlertPanel({ flightData }: KrisisAlertPanelProps) {
  return (
    <>
      {flightData.boardingStatus === "Delayed" && (
        <div className="bg-amber-50 border border-amber-200 rounded-3xl p-5 flex gap-3.5 check-alert shadow-xs text-left">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="text-[10px] font-extrabold text-amber-800 uppercase tracking-wider">AKILLI KRİZ UYARISI</h4>
            <p className="text-[10.5px] text-amber-700 leading-relaxed font-sans font-medium">
              Uçuşunuz rötar yapmıştır. {flightData.disruption?.reason ? `(Durum: ${flightData.disruption.reason})` : ""} Havalimanı mevzuatlarına göre 2 saati aşan rötarlarda havayolu size ücretsiz ikram sağlamakla yükümlüdür. AI Asistanımıza danışarak kuponlarınızı isteyebilirsiniz.
            </p>
          </div>
        </div>
      )}

      {flightData.boardingStatus === "Cancelled" && (
        <div className="bg-rose-50 border border-rose-200 rounded-3xl p-5 flex gap-3.5 shadow-xs text-left">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="text-[10px] font-extrabold text-rose-800 uppercase tracking-wider">ACİL KRİZ BİLDİRİMİ</h4>
            <p className="text-[10.5px] text-rose-700 leading-relaxed font-sans font-medium">
              Uçuşunuz iptal edilmiştir! {flightData.disruption?.reason ? `(Gerekçe: ${flightData.disruption.reason})` : ""} ŞSHY Yolcu Hakları uyarınca bilet iadesi veya ücretsiz alternatif sefer hakkınız bulunuyor. Sıradaki alternatif hatlara AI Asistanımız AeroAI ile saniyeler içinde ulaşabilirsiniz.
            </p>
          </div>
        </div>
      )}

      {flightData.securityQueueTime > 30 && (
        <div className="bg-rose-50 border border-rose-100 rounded-3xl p-5 flex gap-3.5 shadow-xs text-left">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="text-[10px] font-extrabold text-rose-800 uppercase tracking-wider">YOĞUNLUK ALARMI</h4>
            <p className="text-[10.5px] text-rose-700 leading-relaxed font-medium">
              Güvenlik kontrolünde bekleme süresi {flightData.securityQueueTime} dakikadır. Kapanış saatini kaçırmamak için kapılara hemen ilerleyin!
            </p>
          </div>
        </div>
      )}
    </>
  );
}
