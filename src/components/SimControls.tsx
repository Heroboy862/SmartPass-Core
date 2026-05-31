/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { Sliders, Award, RefreshCw, Send, CheckCircle, Database, AlertTriangle, Trash2, HardDrive, ShieldCheck } from "lucide-react";
import { db } from "../firebase";
import { collection, onSnapshot, query, orderBy, deleteDoc, doc } from "firebase/firestore";

interface SimState {
  flightNumber: string;
  boardingStatus: string;
  securityQueueTime: number;
  gate: string;
  delayReason: string;
}

interface SimControlsProps {
  simState: SimState;
  onUpdateSim: (newState: Partial<SimState>) => void;
  onScanPredefined: (rawText: string) => void;
  apiLogs: string[];
}

const SAMPLE_TICKETS = [
  {
    name: "Selim Yılmaz (İstanbul)",
    airline: "Turkish Airlines (TK-1903)",
    route: "IST -> LHR",
    operator: "İGA",
    raw: "M1YILMAZ/SELIM E ABC1234 ISTLHRTK 1903 120Y012A0001 147"
  },
  {
    name: "Elif Demir (Sabiha Gökçen)",
    airline: "Pegasus Airlines (PC-2026)",
    route: "SAW -> ADB",
    operator: "HEAŞ",
    raw: "M1DEMIR/ELIF E QWS5678 SAWADAPC 2026 215F024B0002 188"
  },
  {
    name: "Dmitry Smirnov (Ankara)",
    airline: "Turkish Airlines (TK-2108)",
    route: "ESB -> MOW",
    operator: "TAV",
    raw: "M1SMIRNOV/DMITRY E XYZ9876 ESBMOWTK 2108 090Y005C0003 210"
  },
  {
    name: "Can Aksoy (İzmir)",
    airline: "Ajet Airlines (AJ-4112)",
    route: "ADB -> IST",
    operator: "DHMİ",
    raw: "M1AKSOY/CAN E MNP4321 ADBISTAJ 4112 320Y014D0004 220"
  }
];

export default function SimControls({
  simState,
  onUpdateSim,
  onScanPredefined,
  apiLogs
}: SimControlsProps) {
  const [customRaw, setCustomRaw] = React.useState("");
  const [storedUsers, setStoredUsers] = React.useState<any[]>([]);
  const [dbError, setDbError] = React.useState<string | null>(null);

  React.useEffect(() => {
    try {
      const q = query(collection(db, "users"));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const usersList: any[] = [];
        snapshot.forEach((doc) => {
          usersList.push({ id: doc.id, ...doc.data() });
        });
        // Sort by createdAt desc inside state as Firestore may not have index deployed yet
        usersList.sort((a, b) => {
          const tA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const tB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return tB - tA;
        });
        setStoredUsers(usersList);
        setDbError(null);
      }, (err) => {
        console.error("onSnapshot error:", err);
        setDbError("Firestore bağlantısı/okuma yetkisi engellendi.");
      });
      return () => unsubscribe();
    } catch (e: any) {
      console.error("Error setting up live users listener:", e);
      setDbError(e.message);
    }
  }, []);

  const handleDeleteUser = async (userId: string) => {
    try {
      await deleteDoc(doc(db, "users", userId));
    } catch (err: any) {
      console.error("Failed to delete document:", err);
    }
  };

  return (
    <div className="bg-slate-900 border-r border-slate-800 text-slate-100 h-full overflow-y-auto flex flex-col font-sans">
      {/* Title */}
      <div className="p-6 border-b border-slate-800 flex items-center gap-3">
        <Sliders className="w-6 h-6 text-indigo-400" />
        <div>
          <h2 className="text-lg font-display font-medium leading-none">Smart Boarding</h2>
          <span className="text-xs text-slate-400">Geliştirici & Otomasyon Kontrol Paneli</span>
        </div>
      </div>

      <div className="p-6 flex-1 space-y-6">
        {/* Step 1: Simulated Environment State */}
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-4">
          <div className="flex items-center gap-2 text-indigo-400 font-semibold text-sm uppercase tracking-wider">
            <Sliders className="w-4 h-4" />
            <span>Senaryo ve Kriz Yönetimi</span>
          </div>
          <p className="text-xs text-slate-400">
            Havalimanı canlı veri sistemlerini ve uçuş durumlarını değiştirerek uygulamanın tepkisini gözlemleyin.
          </p>

          <div className="space-y-4 pt-2">
            <div>
              <label className="text-xs text-slate-400 block mb-1">Uçuş Seçimi (Simülasyon Hedefi)</label>
              <select
                className="w-full bg-slate-900 text-slate-200 border border-slate-800 rounded-lg p-2 text-sm focus:outline-none focus:border-indigo-500"
                value={simState.flightNumber}
                onChange={(e) => onUpdateSim({ flightNumber: e.target.value })}
              >
                <option value="TK-1903">TK-1903 (Turkish Airlines)</option>
                <option value="PC-2026">PC-2026 (Pegasus Airlines)</option>
                <option value="TK-2108">TK-2108 (Turkish Airlines - VIP)</option>
                <option value="AJ-4112">AJ-4112 (Ajet Airlines)</option>
              </select>
            </div>

            <div>
              <label className="text-xs text-slate-400 block mb-1">Biniş Durumu (Canlı Otorite)</label>
              <div className="grid grid-cols-2 gap-2">
                {["Waiting", "Boarding Now", "Delayed", "Cancelled"].map((status) => (
                  <button
                    key={status}
                    onClick={() => onUpdateSim({ boardingStatus: status })}
                    className={`text-xs p-2 rounded-lg border font-medium ${
                      simState.boardingStatus === status
                        ? "bg-indigo-600/20 border-indigo-500 text-indigo-300"
                        : "bg-slate-900 border-slate-800 hover:bg-slate-800 text-slate-300"
                    }`}
                  >
                    {status === "Waiting" && "⏳ Bekliyor"}
                    {status === "Boarding Now" && "✈ Uçuş Binişte"}
                    {status === "Delayed" && "⚠️ Ertelendi"}
                    {status === "Cancelled" && "❌ İptal Edildi"}
                  </button>
                ))}
              </div>
            </div>

            {simState.boardingStatus === "Delayed" && (
              <div>
                <label className="text-xs text-slate-400 block mb-1">Rötar Nedeni</label>
                <input
                  type="text"
                  value={simState.delayReason}
                  onChange={(e) => onUpdateSim({ delayReason: e.target.value })}
                  className="w-full bg-slate-900 text-slate-200 border border-slate-800 rounded-lg p-2 text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Güvenlik Bekleme Süresi</label>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="2"
                    max="60"
                    value={simState.securityQueueTime}
                    onChange={(e) => onUpdateSim({ securityQueueTime: parseInt(e.target.value) })}
                    className="w-full accent-indigo-500"
                  />
                  <span className="text-xs font-mono font-bold text-slate-300 min-w-8">
                    {simState.securityQueueTime}dk
                  </span>
                </div>
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Eşleşen Kapı</label>
                <input
                  type="text"
                  value={simState.gate}
                  onChange={(e) => onUpdateSim({ gate: e.target.value })}
                  className="w-full bg-slate-900 text-slate-200 border border-slate-800 rounded-lg p-2 text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Step 2: Prefilled Boarding Passes */}
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
          <div className="flex items-center gap-2 text-teal-400 font-semibold text-sm uppercase tracking-wider">
            <Award className="w-4 h-4" />
            <span>Hızlı Biniş Kartı Simülatörü</span>
          </div>
          <p className="text-xs text-slate-400">
            Aşağıdaki yolcu ve uçuş kartlarından birini seçerek biniş kartı okuma / tarama işlemine doğrudan simüle edin.
          </p>

          <div className="space-y-2 pt-1 max-h-56 overflow-y-auto">
            {SAMPLE_TICKETS.map((ticket, idx) => (
              <button
                key={idx}
                onClick={() => {
                  onScanPredefined(ticket.raw);
                }}
                className="w-full bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-teal-500/50 p-3 rounded-lg text-left transition-all group flex justify-between items-center"
              >
                <div>
                  <div className="text-xs font-semibold text-slate-100 group-hover:text-teal-400">
                    {ticket.name}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    {ticket.airline} • {ticket.route}
                  </div>
                </div>
                <div className="text-[10px] bg-slate-800 px-2 py-1 rounded text-slate-300 font-mono">
                  {ticket.operator} Otoritesi
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Step 3: Custom Raw Scan */}
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
          <div className="text-xs font-semibold text-slate-300 uppercase tracking-wide">
            Manuel IATA Barkod Metni Gönder
          </div>
          <p className="text-[11px] text-slate-400">
            Doğrudan IATA BCBP standartlarında bir biniş kartı okuma dizesi girin.
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="M1YILMAZ/SELIM E..."
              value={customRaw}
              onChange={(e) => setCustomRaw(e.target.value)}
              className="flex-1 bg-slate-900 text-slate-200 border border-slate-850 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-teal-500 font-mono"
            />
            <button
              onClick={() => {
                if (customRaw.trim()) {
                  onScanPredefined(customRaw);
                  setCustomRaw("");
                }
              }}
              className="bg-teal-600 hover:bg-teal-500 text-white font-medium px-3 py-1.5 rounded-lg text-xs transition-colors flex items-center gap-1"
            >
              <Send className="w-3.5 h-3.5" />
              Gönder
            </button>
          </div>
        </div>

        {/* Step 4: Real-time Cloud Firestore User Database Explorer */}
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-orange-400 font-semibold text-sm uppercase tracking-wider">
              <HardDrive className="w-4 h-4" />
              <span>Bulut Veri Deposu (Firestore)</span>
            </div>
            <span className="text-[10px] bg-orange-500/20 text-orange-300 font-bold px-2 py-0.5 rounded-full border border-orange-500/30">
              {storedUsers.length} Üye Kayıtlı
            </span>
          </div>

          <p className="text-xs text-slate-400">
            SmartPass sistemine üye olan yolcuların KVKK korumalı hassas erişilebilirlik, sağlık ve refakat verileri canlı Firestore sunucularında uçtan uca şifreli kaydedilir.
          </p>

          {dbError ? (
            <div className="text-[11px] text-red-400 bg-red-950/20 border border-red-900/40 p-2.5 rounded-lg flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{dbError}</span>
            </div>
          ) : storedUsers.length === 0 ? (
            <div className="text-center py-4 border border-dashed border-slate-800 rounded-lg text-xs text-slate-500">
              Bulut veri tabanında henüz kayıt yok. Sağdaki telefondan üye kaydı oluşturarak anlık eklenmesini izleyin.
            </div>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1 scrollbar-thin">
              {storedUsers.map((u) => {
                const isAcc = u.accessibilityProfile && u.accessibilityProfile.enabled;
                const accType = u.accessibilityProfile?.type;
                let badgeLabel = "Standart";
                let badgeColor = "bg-slate-800 text-slate-350 border-slate-700";

                if (isAcc) {
                  if (accType === "wheelchair") {
                    badgeLabel = "♿ Ortopedik";
                    badgeColor = "bg-emerald-950/40 text-emerald-300 border-emerald-900/60";
                  } else if (accType === "vision") {
                    badgeLabel = "👁️ Görme Hassas";
                    badgeColor = "bg-emerald-950/40 text-emerald-305 border-emerald-900/60";
                  } else if (accType === "hearing") {
                    badgeLabel = "👂 İşitme Hassas";
                    badgeColor = "bg-emerald-950/40 text-emerald-305 border-emerald-900/60";
                  } else if (accType === "elderly") {
                    badgeLabel = "👴 Refakat / Buggy";
                    badgeColor = "bg-emerald-950/40 text-emerald-305 border-emerald-900/60";
                  } else {
                    badgeLabel = "🩺 Tıbbi Engel";
                    badgeColor = "bg-emerald-950/40 text-emerald-305 border-emerald-900/60";
                  }
                }

                return (
                  <div
                    key={u.id}
                    className="p-3 bg-slate-900 border border-slate-800/80 rounded-lg text-left text-xs relative group flex flex-col gap-1.5 transition-all hover:bg-slate-850"
                  >
                    <div className="flex justify-between items-start gap-1">
                      <div className="truncate font-semibold text-slate-100 max-w-[70%]">
                        {u.name || "İsimsiz Yolcu"}
                      </div>
                      <button
                        onClick={() => handleDeleteUser(u.id)}
                        className="text-slate-500 hover:text-red-400 p-1 rounded hover:bg-slate-800 transition-colors cursor-pointer"
                        title="Belgeyi sil"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="text-[10px] text-slate-400 font-mono truncate">
                      {u.email}
                    </div>

                    <div className="flex items-center justify-between gap-2 mt-0.5">
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded border ${badgeColor}`}>
                        {badgeLabel}
                      </span>
                      <span className="text-[8px] text-slate-500 font-mono">
                        {u.createdAt ? new Date(u.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—"}
                      </span>
                    </div>

                    {u.accessibilityProfile?.customRequest && (
                      <div className="text-[10px] text-indigo-300 italic bg-indigo-950/30 border border-indigo-900/40 p-1.5 rounded mt-1">
                        &ldquo;{u.accessibilityProfile.customRequest}&rdquo;
                      </div>
                    )}

                    {u.accessibilityProfile?.isUnder18 && (
                      <div className="flex gap-1 items-center text-[9px] text-amber-300 bg-amber-950/40 border border-amber-900/60 px-1.5 py-0.5 rounded w-max mt-1">
                        <span>🛡️ Aile Koruması (Veli SMS):</span>
                        <span className="font-mono font-bold">{u.accessibilityProfile.guardianPhone || "—"}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Footer System Auditing */}
      <div className="p-4 bg-slate-950 border-t border-slate-850">
        <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
          <span className="flex items-center gap-1.5">
            <Database className="w-3.5 h-3.5 text-teal-400" />
            Otorite API İzleyici
          </span>
          <span className="text-[10px] text-emerald-400 flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></span>
            canlı veri bağlandı
          </span>
        </div>
        <div className="mt-2 bg-slate-900 border border-slate-850 rounded p-2 max-h-32 overflow-y-auto font-mono text-[10px] text-slate-300 space-y-1">
          {apiLogs.length === 0 ? (
            <span className="text-slate-500 italic">Hiçbir API çağrısı yapılmadı.</span>
          ) : (
            apiLogs.map((log, index) => (
              <div key={index} className="border-b border-slate-850/50 pb-1">
                {log}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
