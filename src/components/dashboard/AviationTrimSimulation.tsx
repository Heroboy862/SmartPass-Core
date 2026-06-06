import React, { useState } from "react";
import { Plane, AlertCircle, CheckCircle } from "lucide-react";
import { FlightInfo } from "../../types";

interface AviationTrimSimulationProps {
  flightData: FlightInfo;
}

export function AviationTrimSimulation({ flightData }: AviationTrimSimulationProps) {
  const [trimStrategy, setTrimStrategy] = useState<"wilma" | "reverse" | "classic">("reverse");
  const [paxQueue, setPaxQueue] = useState([
    { id: 1, name: "Fatma S. (PRM)", seat: "29F", zone: "Aft", isWchr: true, isLoyalty: false, status: "Waiting", description: "WCHR / Sedyeli Yolcu (Özel Asansörlü Biniş)" },
    { id: 2, name: "Ahmet Y. (VIP)", seat: "02A", zone: "Forward", isWchr: false, isLoyalty: true, status: "Waiting", description: "Elite Plus Yolcu (Özel Öncelikli Geçiş)" },
    { id: 3, name: "Berrin K. (VIP)", seat: "03F", zone: "Forward", isWchr: false, isLoyalty: true, status: "Waiting", description: "Business Sınıfı Yolcu (Öncelikli Biniş)" },
    { id: 4, name: "Mehmet C.", seat: "31A", zone: "Aft", isWchr: false, isLoyalty: false, status: "Waiting", description: "Ekonomi Sınıfı (Yolcu - Arka Sıra)" },
    { id: 5, name: "Zeynep E.", seat: "30C", zone: "Aft", isWchr: false, isLoyalty: false, status: "Waiting", description: "Ekonomi Sınıfı (Yolcu - Arka Sıra)" },
    { id: 6, name: "Alp T.", seat: "15C", zone: "Center", isWchr: false, isLoyalty: false, status: "Waiting", description: "Ekonomi Sınıfı (Yolcu - Orta Sıra)" },
    { id: 7, name: "Didem O.", seat: "14E", zone: "Center", isWchr: false, isLoyalty: false, status: "Waiting", description: "Ekonomi Sınıfı (Yolcu - Orta Sıra)" }
  ]);
  const [boardingStep, setBoardingStep] = useState(0);

  const handleResetBoardingSim = () => {
    setBoardingStep(0);
    setPaxQueue(prev => prev.map(p => ({ ...p, status: "Waiting" })));
  };

  const handleAdvanceBoardingSim = () => {
    setBoardingStep(prevStep => {
      const nextStep = prevStep + 1;
      if (nextStep > 4) return prevStep;

      setPaxQueue(prevPax => {
        return prevPax.map((pax) => {
          let isBoardedThisStep = false;
          
          if (trimStrategy === "reverse") {
            if (nextStep === 1 && pax.isWchr) isBoardedThisStep = true;
            else if (nextStep === 2 && pax.isLoyalty) isBoardedThisStep = true;
            else if (nextStep === 3 && pax.zone === "Aft" && !pax.isWchr) isBoardedThisStep = true;
            else if (nextStep === 4 && pax.zone === "Center") isBoardedThisStep = true;
          } else if (trimStrategy === "classic") {
            if (nextStep === 1 && pax.zone === "Aft") isBoardedThisStep = true;
            else if (nextStep === 2 && pax.zone === "Center") isBoardedThisStep = true;
            else if (nextStep === 3 && pax.isLoyalty) isBoardedThisStep = true;
          } else { // wilma
            const seatChar = pax.seat.slice(-1);
            const isWindow = ["A", "F"].includes(seatChar);
            const isAisle = ["C", "D"].includes(seatChar);
            const isMiddle = ["B", "E"].includes(seatChar);

            if (nextStep === 1 && pax.isWchr) isBoardedThisStep = true;
            else if (nextStep === 2 && isWindow && !pax.isWchr) isBoardedThisStep = true;
            else if (nextStep === 3 && isAisle) isBoardedThisStep = true;
            else if (nextStep === 4 && isMiddle) isBoardedThisStep = true;
          }

          return {
            ...pax,
            status: pax.status === "Boarded" || isBoardedThisStep ? "Boarded" : "Waiting"
          };
        });
      });

      return nextStep;
    });
  };

  const getDynamicCG = () => {
    let cg = 50.0;
    const boardedPax = paxQueue.filter(p => p.status === "Boarded");
    boardedPax.forEach(p => {
      if (p.zone === "Aft") cg += 3.2; 
      if (p.zone === "Forward") cg -= 2.2;
      if (p.zone === "Center") cg += 0.4;
    });
    return parseFloat(cg.toFixed(1));
  };

  return (
    <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm text-left space-y-4 font-sans">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="bg-indigo-50 p-2 rounded-xl text-indigo-600">
            <Plane className="w-4.5 h-4.5" />
          </div>
          <div>
            <h3 className="text-slate-900 text-[11px] font-black uppercase tracking-wider leading-none">
              ✈️ Uçuş Biniş & Trim (Ağırlık-Denge) Analizörü
            </h3>
            <p className="text-[9.5px] text-slate-400 font-medium mt-1">IATA AHM 560 Havacılık Standartlarına Uyumlu Yerleşim Sistemi</p>
          </div>
        </div>
        <span className="text-[8.5px] font-mono bg-indigo-50 text-indigo-700 font-bold px-2 py-0.5 rounded border border-indigo-100 uppercase">
          792 / 560 STND
        </span>
      </div>

      <div className="space-y-2">
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Yolcu Dağılım ve Biniş Algoritması</span>
        <div className="grid grid-cols-2 xs:grid-cols-3 gap-1.5">
          {[
            { id: "reverse", label: "Reverse-Pyramid", desc: "Trim öncelikli dinamik denge" },
            { id: "wilma", label: "WILMA Model", desc: "Pencere kenarından koridora" },
            { id: "classic", label: "Back-to-Front", desc: "Arkadan öne klasik sıralama" }
          ].map(strat => (
            <button
              key={strat.id}
              onClick={() => {
                setTrimStrategy(strat.id as any);
                handleResetBoardingSim();
              }}
              className={`p-2.5 rounded-xl border text-left flex flex-col justify-between transition-all duration-200 cursor-pointer ${
                trimStrategy === strat.id 
                  ? "bg-indigo-600 border-indigo-600 text-white shadow-xs" 
                  : "bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700"
              }`}
            >
              <span className="text-[10.5px] font-bold leading-tight">{strat.label}</span>
              <span className={`text-[8px] leading-snug mt-1 ${trimStrategy === strat.id ? "text-indigo-200" : "text-slate-400"}`}>
                {strat.desc}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="bg-slate-50 p-4.5 rounded-2xl border border-slate-150 space-y-3.5">
        <div className="flex justify-between items-center text-[10px]">
          <div className="space-y-0.5">
            <span className="text-slate-400 font-bold block uppercase tracking-wider text-[8.5px]">AĞIRLIK MERKEZİ ANALİZİ</span>
            <span className="font-mono text-slate-800 font-black text-xs">
              % {getDynamicCG().toFixed(1)} MAC (Mean Aerodynamic Chord)
            </span>
          </div>
          <div className="text-right">
            <span className="text-slate-400 font-bold block uppercase tracking-wider text-[8.5px]">GÜVENLİK SINIRI</span>
            <span className="font-mono font-bold text-slate-600">
              %48.0 - %56.0 MAC
            </span>
          </div>
        </div>

        <div className="relative pt-2">
          <div className="w-full h-2 bg-slate-200 rounded-full relative overflow-hidden">
            <div className="absolute left-[20%] right-[20%] top-0 bottom-0 bg-emerald-500/30 border-x border-emerald-500/20"></div>
          </div>
          
          {(() => {
            const cgVal = getDynamicCG();
            const percentPos = Math.max(0, Math.min(100, ((cgVal - 44) / (60 - 44)) * 100));
            const isOutOfLimits = cgVal < 48.0 || cgVal > 56.0;
            return (
              <>
                <div 
                  className="absolute top-0 -translate-x-1/2 flex flex-col items-center transition-all duration-300 ease-out"
                  style={{ left: `${percentPos}%` }}
                >
                  <span className={`w-3 h-3 rounded-full border-2 border-white shadow-sm shrink-0 ${isOutOfLimits ? "bg-rose-500 animate-ping" : "bg-indigo-600"}`}></span>
                  <span className="w-0.5 h-3 bg-indigo-600 animate-pulse mt-0.5"></span>
                </div>
                <div className="flex justify-between text-[8px] text-slate-400 font-mono mt-2 pt-1 uppercase">
                  <span className="text-rose-600 font-bold">BURUN (48%)</span>
                  <span className="text-emerald-700 font-bold">İdeal Trim (%50-%53)</span>
                  <span className="text-rose-600 font-bold">KUYRUK (56%)</span>
                </div>
              </>
            );
          })()}
        </div>

        {(() => {
          const cgVal = getDynamicCG();
          if (cgVal > 56.0) {
            return (
              <div className="bg-rose-50/70 border border-rose-250 rounded-xl p-3 flex gap-2.5 items-start">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5 animate-bounce" />
                <div className="text-[9.5px] leading-relaxed text-rose-800">
                  <strong className="font-extrabold uppercase block text-rose-950">🚨 TRİM KİLİDİ UYARISI: KUYRUK SINIRI AŞILDI (%{cgVal} MAC)</strong>
                  Yolcular sadece arkadan öne bindiği için uçağın kuyruk ağırlığı tavan yaptı! Kuyruk üzerine çökme riski (Tail strike / tip-over) bulunmaktadır.
                </div>
              </div>
            );
          }
          if (cgVal < 48.0) {
            return (
              <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-3 flex gap-2.5 items-start">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-[9.5px] leading-relaxed text-amber-850">
                  <strong className="font-extrabold uppercase block text-amber-955">⚠️ TRİM UYARISI: BURUN SINIRI AŞILDI (%{cgVal} MAC)</strong>
                  Uçağın ön tarafı aşırı yüklü! Kalkış anında tırmanış açısı dengesizliği yaşanabilir.
                </div>
              </div>
            );
          }
          return (
            <div className="bg-emerald-50/70 border border-emerald-150 rounded-xl p-3 flex gap-2.5 items-start">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div className="text-[9.5px] leading-relaxed text-emerald-800">
                <strong className="font-semibold block text-emerald-950">✓ DENGELİ TRİM SİSTEMİ (%{cgVal} MAC)</strong>
                Ağırlık merkezi, havacılık güvenlik marjları içinde mükemmel şekilde dağılmış durumda.
              </div>
            </div>
          );
        })()}
      </div>

      <div className="space-y-2.5">
        <div className="flex justify-between items-center text-[10px]">
          <span className="font-bold text-slate-500 uppercase tracking-wider">Milisaniye Biniş Sıralama Akışı</span>
          <span className="font-mono bg-slate-100 font-bold px-1.5 py-0.5 rounded text-slate-600">
            Uygulanan Adım: {boardingStep}/4
          </span>
        </div>

        <div className="grid grid-cols-4 gap-1 text-center font-semibold text-[8px] tracking-wide">
          {[
            { step: 1, label: "1. PRM & WCHR" },
            { step: 2, label: "2. VIP & BIZ" },
            { step: 3, label: "3. ARKA TRİM" },
            { step: 4, label: "4. ORTA & ÖN" }
          ].map((s) => (
            <div 
              key={s.step} 
              className={`p-1.5 rounded-lg border uppercase ${
                boardingStep >= s.step 
                  ? "bg-indigo-50 border-indigo-200 text-indigo-700 font-extrabold" 
                  : "bg-white border-slate-200 text-slate-400"
              }`}
            >
              {s.label}
            </div>
          ))}
        </div>

        <div className="space-y-1.5 max-h-52 overflow-y-auto border border-slate-100 rounded-xl p-2.5 bg-slate-50/30">
          {paxQueue.map((p) => (
            <div 
              key={p.id} 
              className={`p-2 rounded-xl border flex justify-between items-center transition-all ${
                p.status === "Boarded" 
                  ? "bg-emerald-50/60 border-emerald-150 text-slate-800" 
                  : "bg-white border-slate-200 text-slate-600"
              }`}
            >
              <div className="space-y-1 text-[9.5px] truncate max-w-[80%]">
                <div className="flex items-center gap-1.5 flex-wrap">
                  {p.isWchr && <span className="bg-blue-100 text-blue-700 text-[7px] font-black px-1 rounded border border-blue-200 uppercase">WCHR Koridoru</span>}
                  {p.isLoyalty && <span className="bg-amber-100 text-amber-900 text-[7px] font-black px-1 rounded border border-amber-200 uppercase">VIP</span>}
                  <strong className="text-slate-800 font-semibold">{p.name}</strong>
                  <span className="font-mono text-slate-450 bg-slate-50 px-1 py-0.5 rounded text-[8px] border border-slate-150">{p.seat} ({p.zone})</span>
                </div>
                <span className="text-[8.5px] text-slate-450 block truncate">{p.description}</span>
              </div>
              
              <div>
                <span className={`text-[8px] font-extrabold px-1.5 py-0.5 rounded border inline-block ${
                  p.status === "Boarded" 
                    ? "bg-emerald-100 text-emerald-800 border-emerald-200" 
                    : "bg-amber-50 text-amber-700 border-amber-200 animate-pulse"
                }`}>
                  {p.status === "Boarded" ? "UÇAKTA ✓" : "KÖPRÜDE ⏳"}
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-2 font-sans pt-1">
          <button
            onClick={handleAdvanceBoardingSim}
            disabled={boardingStep >= 4}
            className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-100 disabled:text-slate-400 disabled:border-slate-200 border border-indigo-600 text-white font-extrabold text-[10.5px] tracking-wide py-3 px-4 rounded-xl cursor-pointer hover:scale-[1.01] active:scale-95 shadow-sm transition-all text-center focus:outline-none"
          >
            {boardingStep >= 4 ? "BİNİŞ TAMAMLANDI ✓" : "SIRADAKİ GRUBU BİNDİR (+1 ADIM)"}
          </button>
          <button
            onClick={handleResetBoardingSim}
            className="bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 font-bold text-[10.5px] py-3 px-4 rounded-xl cursor-pointer active:scale-95 transition-all text-center focus:outline-none"
          >
            SIFIRLA
          </button>
        </div>
      </div>
    </div>
  );
}
