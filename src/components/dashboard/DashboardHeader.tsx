import React from "react";
import { QrCode } from "lucide-react";

interface DashboardHeaderProps {
  biometricVerified: boolean;
  onOpenScanner: () => void;
  onLogout: () => void;
}

export function DashboardHeader({
  biometricVerified,
  onOpenScanner,
  onLogout
}: DashboardHeaderProps) {
  return (
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
        {biometricVerified && (
          <span className="bg-green-100 text-green-700 text-[8px] px-2 py-0.5 rounded-full font-bold border border-green-200 uppercase tracking-widest hidden sm:inline-flex items-center gap-1">
            ✓ BİYOMETRİK
          </span>
        )}
        <button 
          onClick={onOpenScanner}
          className="w-11 h-11 flex items-center justify-center hover:bg-slate-100 rounded-xl text-slate-700 border border-slate-300 transition-colors cursor-pointer min-w-[44px] min-h-[44px]"
          title="Bileti Yeniden Tara"
          aria-label="Uçuş barkod kamerasını açarak biniş kartını yeniden tarayın"
        >
          <QrCode className="w-5 h-5" />
        </button>
        
        <button 
          onClick={onLogout}
          className="min-w-[64px] min-h-[44px] flex items-center justify-center text-[10px] text-rose-700 font-extrabold border border-rose-350 hover:bg-rose-50 px-3.5 py-2.5 rounded-xl transition-all shadow-sm cursor-pointer"
          aria-label="Kullanıcı oturumunu sonlandırın ve biniş bilet girişi ekranına geri dönün"
        >
          Çıkış
        </button>
      </div>
    </div>
  );
}
