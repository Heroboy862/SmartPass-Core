/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, lazy, Suspense } from "react";
import { 
  Wifi, Battery, ShieldAlert, Cpu, Sparkles, AlertTriangle, Play, HelpCircle, 
  Terminal, Globe, BookOpen, Layers, ShieldCheck
} from "lucide-react";
import LoginScreen from "./components/LoginScreen";
import ScannerScreen from "./components/ScannerScreen";
import AssistantChat from "./components/AssistantChat";
import { useFlightStore } from "./store/useFlightStore";
import { PushNotifications } from "@capacitor/push-notifications";

const SimControls = lazy(() => import("./components/SimControls"));
const DashboardScreen = lazy(() => import("./components/DashboardScreen"));

export default function App() {
  const {
    passengerName,
    activeScreen,
    accessibilityProfile,
    flightData,
    showKvkkWipeModal,
    simState,
    apiLogs,
    messages,
    isChatLoading,
    initStore,
    setPassengerName,
    setActiveScreen,
    setAccessibilityProfile,
    setFlightData,
    setShowKvkkWipeModal,
    setMessages,
    updateSimState,
    scanBoardingPass,
    sendMessage,
    logout,
    logActivity,
    logAuditTrail
  } = useFlightStore();

  // Initialization: fetch server simulation state and start listener if needed
  useEffect(() => {
    initStore();
  }, [initStore]);

  // Synchronized Capacitor native push notification registration when deployed as a native app wrap
  useEffect(() => {
    const setupCapacitorPush = async () => {
      try {
        const cap = (window as any).Capacitor;
        // Only run native-only Push registration if running inside actual iOS/Android wrapper, not Web
        const isNativePlatform = cap && typeof cap.getPlatform === "function" && cap.getPlatform() !== "web";
        
        if (isNativePlatform) {
          let perm = await PushNotifications.checkPermissions();
          if (perm.receive === "prompt") {
            perm = await PushNotifications.requestPermissions();
          }
          if (perm.receive === "granted") {
            await PushNotifications.register();
            
            PushNotifications.addListener("registration", (token) => {
              logActivity("Native Push anlık bildirim cihaz kaydı başarılı.");
              console.log("Capacitor Push Registration Token: ", token.value);
            });

            PushNotifications.addListener("pushNotificationReceived", (notification) => {
              logActivity(`Yeni uçuş gelişme anlık bildirimi: ${notification.title}`);
              console.log("Push Received: ", notification);
            });
          }
        } else {
          // Silently pass without triggering native UI warnings
          console.log("AeroAI Running in Web/Desktop browser view. Native plugins are disabled.");
        }
      } catch (err) {
        console.warn("Capacitor Push registration ignored:", err);
      }
    };
    setupCapacitorPush();
  }, [logActivity]);

  // Record audit log when assistant accesses the passenger profile and health needs
  useEffect(() => {
    if (activeScreen === "chat" && passengerName) {
      logAuditTrail(
        "AEROAI_ASSISTANT",
        passengerName,
        "HEALTH_DATA_READ",
        "AeroAI Kriz Asistanı yerel yönlendirme hesaplamak için yolcunun özel nitelikli tıbbi yardım biletini sorguladı."
      );
    }
  }, [activeScreen, passengerName, logAuditTrail]);

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col lg:flex-row text-slate-100 font-sans">
      
      {/* LEFT: Simulation and Operator Management Panel */}
      <div className="lg:w-[40%] xl:w-[35%] w-full flex flex-col border-t lg:border-t-0 order-2 lg:order-1 border-slate-800">
        <Suspense fallback={
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-slate-400">
            <div className="w-6 h-6 border-2 border-slate-400 border-t-transparent rounded-full animate-spin mb-2" />
            <p className="text-xs font-semibold">Simülatör Kontrolleri Yükleniyor...</p>
          </div>
        }>
          <SimControls 
            simState={simState}
            onUpdateSim={updateSimState}
            onScanPredefined={scanBoardingPass}
            apiLogs={apiLogs}
          />
        </Suspense>
      </div>

      {/* RIGHT: High-Fidelity Hand-crafted Smartphone Simulator Frame representing Flutter app */}
      <div className="flex-1 flex flex-col items-center justify-center p-4 lg:p-8 bg-gradient-to-br from-slate-950 to-indigo-950/20 order-1 lg:order-2 shrink-0 border-b lg:border-b-0 lg:border-r border-slate-800">
        
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
                  if (flightData) {
                    setFlightData({
                      ...flightData,
                      passengerName: name
                    });
                  }

                  // Record login and profile load audit logs (KVKK audit compliance)
                  logAuditTrail(
                    "USER_PORTAL",
                    name,
                    accessibility && accessibility.enabled ? "HEALTH_DATA_READ" : "PROFILE_ACCESS",
                    accessibility && accessibility.enabled
                      ? `Kullanıcı sisteme giriş yaptı (${accessibility.type} sağlık destek profili başarıyla yüklendi).`
                      : "Kullanıcı sisteme giriş yaptı (Standart seyahat profili yüklendi)."
                  );

                  if (accessibility) {
                    setAccessibilityProfile(accessibility);
                    logActivity(`Kullanıcı Girişi/Kayıt: ${name} (Fiziki/Sağlık Desteği: ${accessibility.type})`);
                    
                    // Welcome greeting optimized for accessibility
                    let greetSuffix = "";
                    if (accessibility.type === "wheelchair") greetSuffix = "\n\n♿ Ortopedik refakat profiliniz aktiftir. Havalimanına ayak bastığınızda IGA/TAV engelsiz asistan ekibi sizi karşılayacak. Rotalarınız otomatik olarak basamaksız, asansörlü ve rampalı olarak işaretlenmiştir.";
                    if (accessibility.type === "vision") greetSuffix = "\n\n👁️ Görme hassasiyeti ve sesli asistan profiliniz aktiftir. Akıllı baston ve sesli rehber hizmeti devrededir. Ekran okuyucu uyumlu arayüzümüzle her an size rehberlik etmek için burayanız.";
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
              <Suspense fallback={
                <div className="flex-1 flex flex-col items-center justify-center p-6 text-slate-600 bg-white">
                  <div className="w-8 h-8 rounded-full border-4 border-indigo-600 border-t-transparent animate-spin mb-4" />
                  <p className="text-xs font-bold">Dashboard Verileri Yükleniyor...</p>
                </div>
              }>
                <DashboardScreen 
                  flightData={flightData}
                  accessibilityProfile={accessibilityProfile}
                  onOpenScanner={() => setActiveScreen("scanner")}
                  onOpenChat={() => setActiveScreen("chat")}
                  onLogout={logout}
                />
              </Suspense>
            )}

            {activeScreen === "scanner" && (
              <ScannerScreen 
                onScanComplete={scanBoardingPass}
                onClose={() => setActiveScreen("dashboard")}
              />
            )}

             {activeScreen === "chat" && (
              <AssistantChat 
                messages={messages}
                onSendMessage={sendMessage}
                isLoading={isChatLoading}
                onClose={() => setActiveScreen("dashboard")}
                flightData={flightData}
              />
            )}

            {/* Elegant full-screen KVKK Auto-Retention Wipe modal overlay */}
            {showKvkkWipeModal && (
              <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-md z-50 flex flex-col items-center justify-center p-6 text-center select-none animate-fade-in">
                <div className="w-16 h-16 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mb-5 animate-pulse">
                  <ShieldCheck className="w-8 h-8 text-rose-500" />
                </div>
                
                <h3 className="text-sm font-black text-rose-400 uppercase tracking-widest mb-2 font-display">
                  🔒 KVKK VERİ İMHASI BİLDİRİMİ
                </h3>
                
                <div className="space-y-3 max-w-xs text-[11px] text-slate-300 font-sans leading-relaxed">
                  <p className="font-extrabold text-white text-xs">
                    Uçuşunuz tamamlanmış ve uçağınız kalkış kapısından ayrılmıştır.
                  </p>
                  <p className="text-slate-400">
                    6698 sayılı KVKK <strong>Veri Saklama Sınırı ve Azaltımı Taahhüdümüz</strong> uyarınca, seyahat asistanlığı için kullandığınız tüm kişisel, biyometrik, özel nitelikli tıbbi ve sağlık yardım rızası verileriniz yerel tarayıcınızdan ve canlı bulut sunucularımızdan <strong>kalıcı olarak geri döndürülemez surette imha edilmiştir.</strong>
                  </p>
                </div>

                <button
                  onClick={() => {
                    setShowKvkkWipeModal(false);
                  }}
                  className="mt-6 bg-slate-800 hover:bg-slate-700 text-white py-2 px-5 rounded-xl text-[10px] font-bold tracking-wider uppercase transition-all shadow-md cursor-pointer border border-slate-750"
                >
                  Anladım, Kapat
                </button>
              </div>
            )}
          </div>

          {/* Smartphone Bottom Indicator bar */}
          <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-32 h-1 bg-slate-400/55 rounded-full z-40"></div>
        </div>

      </div>

    </div>
  );
}
