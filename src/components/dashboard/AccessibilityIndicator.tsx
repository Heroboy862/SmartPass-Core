import React from "react";
import { Activity } from "lucide-react";
import { AccessibilityProfile } from "../../types";

interface AccessibilityIndicatorProps {
  accessibilityProfile: AccessibilityProfile | null | undefined;
}

export function AccessibilityIndicator({ accessibilityProfile }: AccessibilityIndicatorProps) {
  if (!accessibilityProfile || !accessibilityProfile.enabled) return null;

  return (
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
  );
}
