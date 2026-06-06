import React, { useState, useEffect } from "react";
import { Shield, CheckCircle, BellRing, AlertCircle } from "lucide-react";
import { FlightInfo, AccessibilityProfile } from "../../types";

interface ChildSafetyLockProps {
  flightData: FlightInfo;
  accessibilityProfile: AccessibilityProfile | null | undefined;
}

export function ChildSafetyLock({
  flightData,
  accessibilityProfile
}: ChildSafetyLockProps) {
  const [isUnder18, setIsUnder18] = useState<boolean>(false);
  const [guardianPhone, setGuardianPhone] = useState<string>("0555 123 4567");
  const [isEditingPhone, setIsEditingPhone] = useState<boolean>(false);
  const [phoneInput, setPhoneInput] = useState<string>("0555 123 4567");
  const [isSendingAlert, setIsSendingAlert] = useState<boolean>(false);
  const [alertSentSuccess, setAlertSentSuccess] = useState<boolean>(false);

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

  useEffect(() => {
    if (accessibilityProfile) {
      setIsUnder18(accessibilityProfile.isUnder18 || false);
      const phone = accessibilityProfile.guardianPhone || "0555 123 4567";
      setGuardianPhone(phone);
      setPhoneInput(phone);
    }
  }, [accessibilityProfile]);

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

  return (
    <div className={`rounded-3xl p-6 border shadow-sm transition-all duration-300 text-left ${isUnder18 ? "bg-slate-50 border-slate-200" : "bg-white border-slate-200 hover:border-slate-300"}`}>
      {/* Header Bento Tile */}
      <div className="flex items-center justify-between border-b border-slate-200/60 pb-3.5 mb-3.5">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-xl shrink-0 transition-transform duration-300 ${isUnder18 ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/15 scale-105" : "bg-slate-100 text-slate-400"}`}>
            <Shield className={`w-4 h-4 ${isUnder18 ? "animate-pulse" : ""}`} />
          </div>
          <div>
            <h3 className="text-slate-900 text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5 leading-none">
              🛡️ Aile Koruma Sistemi
            </h3>
            <span className={`text-[8px] font-extrabold px-1.5 py-0.5 rounded-md border tracking-wide uppercase inline-block mt-1.5 ${isUnder18 ? "bg-emerald-50 text-emerald-805 border-emerald-200" : "bg-slate-50 text-slate-500 border-slate-200"}`}>
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

      <div className="text-left font-sans">
        {isUnder18 ? (
          <div className="space-y-4">
            {/* Description capsule - Bento Info Banner */}
            <div className="bg-indigo-50/50 border border-indigo-100/45 rounded-3xl p-4 text-[10px] text-slate-700 leading-relaxed font-semibold">
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
                      className="text-[9px] text-emerald-600 hover:text-emerald-800 font-extrabold uppercase transition-colors shrink-0 ml-1.5 pointer-events-auto cursor-pointer"
                    >
                      Kaydet
                    </button>
                  ) : (
                    <button 
                      onClick={() => setIsEditingPhone(true)}
                      className="text-[9px] text-indigo-600 hover:text-indigo-900 font-extrabold uppercase transition-colors shrink-0 ml-1.5 pointer-events-auto cursor-pointer"
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
                      <span className="font-bold text-slate-700">1. Havalimanı Girişi</span>
                      <span className="text-[7.5px] bg-emerald-50 text-emerald-700 font-bold px-1 rounded border border-emerald-150 font-mono">GÖNDERİLDİ</span>
                    </div>

                    {/* Checkpoint 2 */}
                    <div className="relative flex items-center justify-between text-[9px]">
                      <div className={`absolute -left-[16px] top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full ${flightData.boardingStatus === "Delayed" || flightData.boardingStatus === "Cancelled" ? "bg-amber-500 animate-ping" : "bg-indigo-600"}`}></div>
                      <span className="font-bold text-slate-750">2. Kapı İzlenceleri</span>
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
                type="button"
                onClick={handleSendEmergencyAlert}
                disabled={isSendingAlert}
                className={`w-full font-black text-xs sm:text-sm py-4 px-6 rounded-2xl transition-all uppercase tracking-widest flex items-center justify-center gap-3 cursor-pointer shadow-md select-none transform hover:scale-[1.01] active:scale-95 outline-none duration-150 ${
                  alertSentSuccess 
                    ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-650/25" 
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
                  <span className="animate-ping w-2 h-2 rounded-full bg-emerald-505"></span>
                  <span>💬 ANLIK SMS GERİ BİLDİRİMİ</span>
                </div>
                <span className="text-[9.5px] text-slate-700 font-semibold block mb-2 leading-relaxed">
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
                  <div key={log.id} className="flex items-center justify-between text-[9px] bg-slate-50/20 border border-slate-200/30 p-2 rounded-2xl shadow-3xs hover:bg-slate-50/50 transition-colors">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-450 shrink-0">🕒</span>
                      <span className="font-mono font-bold text-slate-700 tracking-wide">{log.time}</span>
                    </div>
                    <span className={`text-[7.5px] font-bold px-2 py-0.5 rounded-full border font-mono tracking-wider flex items-center gap-1.5 ${
                      log.status === "Beklemede" 
                        ? "bg-amber-50/80 text-amber-600 border-amber-200 animate-pulse" 
                        : "bg-emerald-50/80 text-emerald-700 border-emerald-200"
                    }`}>
                      {log.status === "Beklemede" ? "BEKLEMEDE" : "BAŞARILI"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <p className="text-[10.5px] text-slate-400 font-medium leading-relaxed">
            Sistem sadece refakatsiz çocuk veya tıp koruması profilleri için anlık SMS gözetimi sağlar. Test için yukarıdaki butondan gözetimi açabilirsiniz.
          </p>
        )}
      </div>
    </div>
  );
}
