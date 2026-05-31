/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { 
  Wifi, Battery, ShieldAlert, Cpu, Sparkles, AlertTriangle, Play, HelpCircle, 
  Terminal, Globe, BookOpen, Layers
} from "lucide-react";
import SimControls from "./components/SimControls";
import LoginScreen from "./components/LoginScreen";
import ScannerScreen from "./components/ScannerScreen";
import DashboardScreen from "./components/DashboardScreen";
import AssistantChat from "./components/AssistantChat";
import { FlightInfo, ChatMessage, AccessibilityProfile } from "./types";
import { db } from "./firebase";
import { doc, setDoc, onSnapshot } from "firebase/firestore";

export default function App() {
  // Shared passenger / layout flow states
  const [passengerName, setPassengerName] = useState<string | null>(null);
  const [activeScreen, setActiveScreen] = useState<"login" | "dashboard" | "scanner" | "chat">("login");
  const [accessibilityProfile, setAccessibilityProfile] = useState<AccessibilityProfile | null>(null);
  
  // Real-time Flight Ticket State loaded upon scanning
  const [flightData, setFlightData] = useState<FlightInfo>({
    passengerName: "Selim Yılmaz",
    flightNumber: "TK-1903",
    from: "IST",
    fromCity: "İstanbul",
    to: "LHR",
    toCity: "Londra",
    gate: "G-12",
    seat: "12A",
    group: "A",
    biometricVerified: true,
    boardingStatus: "Boarding Now",
    boardingProgress: 65,
    estimatedWalkTime: "6 dk",
    airline: "Turkish Airlines",
    airportOperator: "İGA",
    departureTime: "22:15",
    securityQueueTime: 12
  });

  // Simulator Variable States
  const [simState, setSimState] = useState({
    flightNumber: "TK-1903",
    boardingStatus: "Boarding Now",
    securityQueueTime: 12,
    gate: "G-12",
    delayReason: "Londra semalarındaki yoğunluk ve fırtına nedeniyle biniş ertelenmiştir."
  });

  // AI Chat message states
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      sender: "assistant",
      text: "Merhaba! Ben akıllı seyahat asistanınız AeroAI. ✈️\n\nDHMİ, İGA, TAV ve HEAŞ veri sistemlerine canlı olarak bağlıyım. Yolculuğunuzun zaman planlamasını kolaylaştırmak, rötarlar/iptaller gibi kriz durumlarında haklarınızı korumak ve kapı yolunuzu bulmak için yanınızdayım.\n\nNasıl yardımcı olabilirim?",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    }
  ]);
  const [isChatLoading, setIsChatLoading] = useState(false);

  // System diagnostic logs
  const [apiLogs, setApiLogs] = useState<string[]>([]);

  // Push new activity message to logs
  const logActivity = (message: string) => {
    const time = new Date().toLocaleTimeString([], { hour12: false });
    setApiLogs((prev) => [`[${time}] ${message}`, ...prev.slice(0, 45)]);
  };

  // Real-time Flight Tracker onSnapshot Listener
  useEffect(() => {
    if (!flightData || !flightData.flightNumber) return;

    const flightRef = doc(db, "flights", flightData.flightNumber);
    logActivity(`DHMİ Canlı takibi başlatıldı: flights/${flightData.flightNumber}`);

    const unsubscribe = onSnapshot(flightRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        logActivity(`DHMİ/Bulut veri güncellemesi alındı: Kapı ${data.gate ?? "—"}, Durum: ${data.boardingStatus ?? "—"}`);
        
        // Update local active flight state with Firestore real-time values
        setFlightData((prev) => {
          if (prev.flightNumber !== data.flightNumber) return prev;
          return {
            ...prev,
            gate: data.gate ?? prev.gate,
            boardingStatus: data.boardingStatus ?? prev.boardingStatus,
            securityQueueTime: data.securityQueueTime ?? prev.securityQueueTime,
            delayReason: data.delayReason ?? prev.delayReason
          };
        });

        // Also sync the developer panel's inputs with live Firestore updates
        setSimState((prev) => {
          if (prev.flightNumber !== data.flightNumber) return prev;
          return {
            ...prev,
            gate: data.gate ?? prev.gate,
            boardingStatus: data.boardingStatus ?? prev.boardingStatus,
            securityQueueTime: data.securityQueueTime ?? prev.securityQueueTime,
            delayReason: data.delayReason ?? prev.delayReason
          };
        });
      }
    }, (error) => {
      console.error("Firestore flights onSnapshot error:", error);
      logActivity(`DHMİ bağlantı pürüzü: ${error.message}`);
    });

    return () => unsubscribe();
  }, [flightData.flightNumber]);

  // Initial Load & sync simulator state
  useEffect(() => {
    async function fetchState() {
      try {
        const res = await fetch("/api/simulation/state");
        if (res.ok) {
          const data = await res.json();
          setSimState(data);
          logActivity("Simülatör durumu sunucudan başarıyla yüklendi.");

          // Sync initial state to Firestore flights database
          try {
            const flightRef = doc(db, "flights", data.flightNumber);
            await setDoc(flightRef, {
              flightNumber: data.flightNumber,
              boardingStatus: data.boardingStatus,
              securityQueueTime: data.securityQueueTime,
              gate: data.gate,
              delayReason: data.delayReason || "Normal operasyonel akış sağlandı.",
              updatedAt: new Date().toISOString()
            }, { merge: true });
            logActivity(`DHMİ Canlı Veri Tabanı (flights/${data.flightNumber}) başlatıldı.`);
          } catch (dbErr: any) {
            console.error("Failed to sync initial flight state:", dbErr);
          }
        }
      } catch (err) {
        logActivity("Simülatör durumu çevrimdışı önbellekten yüklendi.");
      }
    }
    fetchState();
  }, []);

  // Update simulator state and sync to Express API & Firestore
  const handleUpdateSim = async (newState: Partial<typeof simState>) => {
    const updated = { ...simState, ...newState };
    setSimState(updated);
    
    // Auto-update flight details if matches current active ticket
    if (flightData && flightData.flightNumber === updated.flightNumber) {
      setFlightData((prev) => ({
        ...prev,
        ...newState
      }));
    }

    logActivity(`Simülasyon Güncellendi: ${Object.keys(newState).join(", ")}`);

    // Sync variables with Cloud Firestore in real-time
    try {
      const flightRef = doc(db, "flights", updated.flightNumber);
      await setDoc(flightRef, {
        flightNumber: updated.flightNumber,
        boardingStatus: updated.boardingStatus,
        securityQueueTime: updated.securityQueueTime,
        gate: updated.gate,
        delayReason: updated.delayReason,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      logActivity(`Bulut Veri Tabanı (flights/${updated.flightNumber}) güncellendi.`);
    } catch (dbErr: any) {
      logActivity(`Firestore güncelleme hatası: ${dbErr.message}`);
    }
    
    try {
      await fetch("/api/simulation/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated)
      });
      logActivity("Canlı sunucu simülasyon odaları senkronize edildi.");
    } catch (err) {
      logActivity("Veri tabanı senkronizasyon rötarı.");
    }
  };

  // Triggered when a physical QR is parsed or demo ticket is clicked
  const handleScanBoardingPass = async (rawText: string) => {
    logActivity(`Biniş Kartı Okundu: ${rawText.substring(0, 25)}...`);
    
    try {
      const res = await fetch("/api/parse-boarding-pass", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rawText })
      });
      
      if (res.ok) {
        const parsed: FlightInfo = await res.json();
        setFlightData(parsed);
        setPassengerName(parsed.passengerName);
        setActiveScreen("dashboard");
        logActivity(`${parsed.airportOperator} API'sinden güncel veri başarıyla çekildi. Yolcu: ${parsed.passengerName}`);
        
        // Seed parsed flight to Firestore flights collection to guarantee document existence for snapshot listening
        try {
          const flightRef = doc(db, "flights", parsed.flightNumber);
          await setDoc(flightRef, {
            flightNumber: parsed.flightNumber,
            boardingStatus: parsed.boardingStatus,
            securityQueueTime: parsed.securityQueueTime,
            gate: parsed.gate,
            delayReason: "Uçuş kartı taramasıyla canlı sistemlere bağlandı.",
            updatedAt: new Date().toISOString()
          }, { merge: true });
          logActivity(`Bulut Veri Tabanı (flights/${parsed.flightNumber}) canlandırıldı.`);
        } catch (dbErr: any) {
          console.error("Failed to seed flight state on scan:", dbErr);
        }

        // Push initial localized assistant greet
        setMessages([
          {
            id: `scan-greet-${Date.now()}`,
            sender: "assistant",
            text: `Sayın ${parsed.passengerName}, biniş kartınız başarıyla doğrulandı!\n\n${parsed.fromCity} (${parsed.from}) havalimanındasınız. Canlı veri sağlayıcımız olan **${parsed.airportOperator}** sistemlerine göre kapınız **${parsed.gate}** olarak güncellenmiştir. Güvenlik hattı bekleme süresi ortalama **${parsed.securityQueueTime}** dakikadır.\n\nSeyahat rotanız veya size özel atanmış mağaza indirimleri için dilediğinizi sorabilirsiniz.`,
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
          }
        ]);
      } else {
        logActivity("Hata: Biniş kartı IATA standartlarına uymuyor.");
      }
    } catch (err) {
      logActivity("Bağlantı kesildi. Yerel doğrulama yapılıyor.");
    }
  };

  // Submit messages via client-side proxy to server-side Gemini 3.5-Flash
  const handleSendMessage = async (text: string) => {
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: "user",
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    };
    
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setIsChatLoading(true);
    logActivity("Kullanıcı sorgusu Gemini asistanına iletildi.");

    try {
      const res = await fetch("/api/assistant/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: updatedMessages,
          flightData: flightData,
          accessibilityProfile: accessibilityProfile
        })
      });

      if (res.ok) {
        const data = await res.json();
        const assistantMsg: ChatMessage = {
          id: `ai-${Date.now()}`,
          sender: "assistant",
          text: data.text,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        };
        setMessages((prev) => [...prev, assistantMsg]);
        logActivity("Gemini yanıtı işlendi ve yolcuya iletildi.");
      } else {
        throw new Error("Gemini response is not OK");
      }
    } catch (err: any) {
      logActivity("Hata: Gemini asistanı çağrısı başarısız oldu.");
      const errorMsg: ChatMessage = {
        id: `ai-err-${Date.now()}`,
        sender: "assistant",
        text: "Kusura bakmayın, şu anda bağlantı yoğunluğu sebebiyle isteğinizi yanıtlayamadım. Lütfen tekrar deneyiniz.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsChatLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col lg:flex-row text-slate-100 font-sans">
      
      {/* LEFT: Simulation and Operator Management Panel */}
      <div className="lg:w-[40%] xl:w-[35%] w-full flex flex-col border-t lg:border-t-0 order-2 lg:order-1 border-slate-800">
        <SimControls 
          simState={simState}
          onUpdateSim={handleUpdateSim}
          onScanPredefined={handleScanBoardingPass}
          apiLogs={apiLogs}
        />
      </div>

      {/* RIGHT: High-Fidelity Hand-crafted Smartphone Simulator Frame representing Flutter app */}
      <div className="flex-1 flex flex-col items-center justify-center p-4 lg:p-8 bg-gradient-to-br from-slate-950 to-indigo-950/20 order-1 lg:order-2 shrink-0 border-b lg:border-b-0 lg:border-r border-slate-850">
        
        {/* Concept Introduction Badge */}
        <div className="mb-6 text-center max-w-sm hidden lg:block">
          <span className="bg-indigo-950 text-indigo-300 border border-indigo-900 text-[10px] font-bold px-3 py-1.5 rounded-full uppercase tracking-wider inline-flex items-center gap-1.5 shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-orange-400" />
            Aviation MVP Demo Terminal
          </span>
          <h2 className="text-xl font-display font-bold text-slate-100 mt-2">Smart Boarding Mobil İstasyonu</h2>
          <p className="text-xs text-slate-400 mt-1">
            KVKK uyumlu yerel tarama, DHMİ, İGA, TAV, HEAŞ canlı API birleştirici ve kriz destek asistanı.
          </p>
        </div>

        {/* Handheld Smartphone Frame */}
        <div className="w-full max-w-[390px] h-[780px] bg-slate-900 rounded-[50px] p-3 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)] border-4 border-slate-800 relative flex flex-col overflow-hidden ring-1 ring-slate-700/50">
          
          {/* Smartphone Notch / Dynamic Island */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 w-28 h-5.5 bg-black rounded-full z-40 flex items-center justify-between px-3.5">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-900"></span>
            <span className="w-8 h-1 bg-slate-900 rounded-full"></span>
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-900 ring-2 ring-indigo-500/20"></span>
          </div>

          {/* Smartphone Status Bar Info */}
          <div className="h-6.5 bg-white text-slate-900 px-7 flex justify-between items-center text-[10px] font-semibold select-none z-35 relative shrink-0">
            <span>20:30</span>
            <div className="flex items-center gap-1">
              <span className="font-mono text-[9px] text-slate-600 bg-slate-150 px-1 rounded font-bold mr-1">5G</span>
              <Wifi className="w-3 h-3 text-slate-800" />
              <div className="flex items-center gap-0.5">
                <Battery className="w-4 h-4 text-emerald-500 fill-emerald-500" />
              </div>
            </div>
          </div>

          {/* Core Mobile Application Inside Notch boundaries */}
          <div className="flex-1 bg-slate-50 overflow-hidden relative rounded-b-[38px] flex flex-col text-slate-900">
            {activeScreen === "login" && (
              <LoginScreen 
                onLoginSuccess={(name, accessibility) => {
                  setPassengerName(name);
                  setFlightData((prev) => ({
                    ...prev,
                    passengerName: name
                  }));
                  if (accessibility) {
                    setAccessibilityProfile(accessibility);
                    logActivity(`Kullanıcı Girişi/Kayıt: ${name} (Fiziki/Sağlık Desteği: ${accessibility.type})`);
                    
                    // Welcome greeting optimized for accessibility
                    let greetSuffix = "";
                    if (accessibility.type === "wheelchair") greetSuffix = "\n\n♿ Ortopedik refakat profiliniz aktiftir. Havalimanına ayak bastığınızda IGA/TAV engelsiz asistan ekibi sizi karşılayacak. Rotalarınız otomatik olarak basamaksız, asansörlü ve rampalı olarak işaretlenmiştir.";
                    if (accessibility.type === "vision") greetSuffix = "\n\n👁️ Görme hassasiyeti ve sesli asistan profiliniz aktiftir. Akıllı baston ve sesli rehber hizmeti devrededir. Ekran okuyucu uyumlu arayüzümüzle her an size rehberlik etmek için buradayım.";
                    if (accessibility.type === "hearing") greetSuffix = "\n\n👂 İşitme engeli profiliniz aktiftir. Havalimanındaki tüm kapı ve rötar anonsları mobil bento kartlarımızda görsel flaşör olarak gösterilecektir.";
                    if (accessibility.type === "elderly") greetSuffix = "\n\n👴 Yaşlı/Refakat desteği profiliniz aktiftir. Buggy elektrikli transfer aracı kalkış kapınıza kolay ulaşabilmeniz için terminal dairesinde talep edilmiştir.";
                    if (accessibility.type === "other") greetSuffix = "\n\n🩺 Tıbbi ve diğer özel ihtiyaç profiliniz aktiftir. Medikal durum asistanlığı devrede; her türlü ilaç, solunum cihazı taşıma haklarınızı asistanımız üzerinden sorgulayabilirsiniz.";

                    setMessages([
                      {
                        id: `welcome-acc-${Date.now()}`,
                        sender: "assistant",
                        text: `Merhaba Sayın ${name}, kaydınız başarıyla tamamlandı. Verilerinizin gizliliği kapsamlı olarak güvence altındadır.${greetSuffix}\n\nNasıl yardımcı olabilirim?`,
                        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                      }
                    ]);
                  } else {
                    setAccessibilityProfile(null);
                    logActivity(`Kullanıcı Girişi: ${name}`);
                  }
                  setActiveScreen("dashboard");
                }} 
              />
            )}

            {activeScreen === "dashboard" && (
              <DashboardScreen 
                flightData={flightData}
                accessibilityProfile={accessibilityProfile}
                onOpenScanner={() => setActiveScreen("scanner")}
                onOpenChat={() => setActiveScreen("chat")}
                onLogout={() => {
                  setPassengerName(null);
                  setAccessibilityProfile(null);
                  setActiveScreen("login");
                  logActivity("Giriş oturumu sıfırlandı.");
                }}
              />
            )}

            {activeScreen === "scanner" && (
              <ScannerScreen 
                onScanComplete={(raw) => {
                  handleScanBoardingPass(raw);
                }}
                onClose={() => setActiveScreen("dashboard")}
              />
            )}

            {activeScreen === "chat" && (
              <AssistantChat 
                messages={messages}
                onSendMessage={handleSendMessage}
                isLoading={isChatLoading}
                onClose={() => setActiveScreen("dashboard")}
                flightData={flightData}
              />
            )}
          </div>

          {/* Smartphone Bottom Indicator bar */}
          <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-32 h-1 bg-slate-400/55 rounded-full z-40"></div>
        </div>

      </div>

    </div>
  );
}
