import { create } from "zustand";
import { doc, onSnapshot, addDoc, collection } from "firebase/firestore";
import { db } from "../firebase";
import { FlightInfo, AccessibilityProfile, ChatMessage, BoardingStatus } from "../types";

export interface SimulatorState {
  flightNumber: string;
  boardingStatus: BoardingStatus;
  securityQueueTime: number;
  gate: string;
  delayReason: string;
}

interface FlightState {
  // Session State
  passengerName: string | null;
  activeScreen: "login" | "dashboard" | "scanner" | "chat";
  accessibilityProfile: AccessibilityProfile | null;
  flightData: FlightInfo | null;
  showKvkkWipeModal: boolean;

  // Simulator State
  simState: SimulatorState;
  apiLogs: string[];
  syncLogs: string[];

  // Chat State
  messages: ChatMessage[];
  isChatLoading: boolean;

  // Unsubscribe function for active listener
  flightUnsubscribe: (() => void) | null;

  // Setters
  initStore: () => Promise<void>;
  setPassengerName: (name: string | null) => void;
  setActiveScreen: (screen: "login" | "dashboard" | "scanner" | "chat") => void;
  setAccessibilityProfile: (profile: AccessibilityProfile | null) => void;
  setFlightData: (data: FlightInfo | null) => void;
  setShowKvkkWipeModal: (show: boolean) => void;
  setMessages: (messages: ChatMessage[] | ((prev: ChatMessage[]) => ChatMessage[])) => void;
  setIsChatLoading: (loading: boolean) => void;

  // Logs
  logActivity: (message: string) => void;
  addSyncLog: (message: string) => void;
  logAuditTrail: (actor: string, targetUser: string, action: string, details: string) => Promise<void>;

  // Simulation Updates
  updateSimState: (newState: Partial<SimulatorState>) => Promise<void>;
  scanBoardingPass: (rawText: string) => Promise<void>;
  sendMessage: (text: string) => Promise<void>;

  // Sync controls
  startFlightSync: (flightNumber: string) => void;
  stopFlightSync: () => void;
  logout: () => void;
}

export const useFlightStore = create<FlightState>((set, get) => {
  // Safe parsing helper from sessionStorage
  const getSessionItem = (key: string) => {
    try {
      return sessionStorage.getItem(key);
    } catch {
      return null;
    }
  };

  const getSessionJsonItem = (key: string) => {
    const item = getSessionItem(key);
    if (!item) return null;
    try {
      return JSON.parse(item);
    } catch {
      return null;
    }
  };

  const initialFlightData = getSessionJsonItem("secure_flightData") || {
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
    boardingProgress: 65,
    estimatedWalkTime: "6 dk",
    airline: "Turkish Airlines",
    airportOperator: "İGA",
    departureTime: "22:15",
    securityQueueTime: 12,
    boardingStatus: "Boarding Now" as BoardingStatus,
    source: {
      provider: "SIMULATION",
      updatedAt: new Date().toISOString(),
      confidence: 0.85
    },
    schedule: {
      std: "22:15",
      etd: "22:15",
      atd: null
    },
    disruption: null
  };

  return {
    passengerName: getSessionItem("secure_passengerName"),
    activeScreen: (getSessionItem("secure_activeScreen") as any) || "login",
    accessibilityProfile: getSessionJsonItem("secure_accessibilityProfile"),
    flightData: getSessionJsonItem("secure_flightData") ? initialFlightData : null,
    showKvkkWipeModal: false,

    simState: {
      flightNumber: "TK-1903",
      boardingStatus: "Boarding Now",
      securityQueueTime: 12,
      gate: "G-12",
      delayReason: "Londra semalarındaki yoğunluk ve fırtına nedeniyle biniş ertelenmiştir."
    },
    apiLogs: [],
    syncLogs: [],

    messages: [
      {
        id: "welcome",
        sender: "assistant",
        text: "Merhaba! Ben akıllı seyahat asistanınız AeroAI. ✈️\n\nDHMİ, İGA, TAV ve HEAŞ veri sistemlerine canlı olarak bağlıyım. Yolculuğunuzun zaman planlamasını kolaylaştırmak, rötarlar/iptaller gibi kriz durumlarında haklarınızı korumak ve kapı yolunuzu bulmak için yanınızdayım.\n\nNasıl yardımcı olabilirim?",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      }
    ],
    isChatLoading: false,
    flightUnsubscribe: null,

    initStore: async () => {
      const { logActivity } = get();
      try {
        const res = await fetch("/api/simulation/state");
        if (res.ok) {
          const data = await res.json();
          set({ simState: data });
          logActivity("Simülatör durumu sunucudan başarıyla yüklendi.");
        }
      } catch (err) {
        logActivity("Simülatör durumu çevrimdışı önbellekten yüklendi.");
      }

      // Start real-time sync if we have ticket data loaded
      const savedFlight = getSessionJsonItem("secure_flightData") || initialFlightData;
      if (savedFlight && savedFlight.flightNumber) {
        set({ flightData: savedFlight });
        get().startFlightSync(savedFlight.flightNumber);
      }
    },

    setPassengerName: (name) => {
      if (name) {
        sessionStorage.setItem("secure_passengerName", name);
      } else {
        sessionStorage.removeItem("secure_passengerName");
      }
      set({ passengerName: name });
    },

    setActiveScreen: (screen) => {
      sessionStorage.setItem("secure_activeScreen", screen);
      set({ activeScreen: screen });
    },

    setAccessibilityProfile: (profile) => {
      if (profile) {
        sessionStorage.setItem("secure_accessibilityProfile", JSON.stringify(profile));
      } else {
        sessionStorage.removeItem("secure_accessibilityProfile");
      }
      set({ accessibilityProfile: profile });
    },

    setFlightData: (data) => {
      if (data) {
        sessionStorage.setItem("secure_flightData", JSON.stringify(data));
      } else {
        sessionStorage.removeItem("secure_flightData");
      }
      set({ flightData: data });
    },

    setShowKvkkWipeModal: (show) => set({ showKvkkWipeModal: show }),

    setMessages: (newMessages) => {
      set((state) => ({
        messages: typeof newMessages === "function" ? newMessages(state.messages) : newMessages
      }));
    },

    setIsChatLoading: (loading) => set({ isChatLoading: loading }),

    logActivity: (message) => {
      const time = new Date().toLocaleTimeString([], { hour12: false });
      set((state) => ({
        apiLogs: [`[${time}] ${message}`, ...state.apiLogs.slice(0, 45)]
      }));
    },

    addSyncLog: (message) => {
      const time = new Date().toLocaleTimeString([], { hour12: false });
      set((state) => ({
        syncLogs: [`[${time}] ${message}`, ...state.syncLogs.slice(0, 45)]
      }));
      get().logActivity(message);
    },

    logAuditTrail: async (actor, targetUser, action, details) => {
      try {
        await addDoc(collection(db, "audit_logs"), {
          timestamp: new Date().toISOString(),
          actor,
          targetUser,
          action,
          details
        });
      } catch (err) {
        console.warn("Audit logs collection registration failed:", err);
      }
    },

    updateSimState: async (newState) => {
      const { simState, flightData, logActivity } = get();
      const updated = { ...simState, ...newState };
      set({ simState: updated });

      // Propagate update to local flight data if it's the current active flight
      if (flightData && flightData.flightNumber === updated.flightNumber) {
        const updatedFlight = {
          ...flightData,
          ...newState
        };
        get().setFlightData(updatedFlight);
      }

      logActivity(`Simülasyon Güncellendi: ${Object.keys(newState).join(", ")}`);

      try {
        const res = await fetch("/api/simulation/update", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updated)
        });
        if (res.ok) {
          logActivity("Canlı sunucu simülasyon odaları senkronize edildi.");
        } else {
          logActivity("Simülasyon güncelleme sunucu reddi (Kilitli veya yetkisiz).");
        }
      } catch (err) {
        logActivity("Veri tabanı senkronizasyon rötarı.");
      }
    },

    scanBoardingPass: async (rawText) => {
      const { logActivity, addSyncLog, logAuditTrail } = get();
      logActivity(`Biniş Kartı Okundu: ${rawText.substring(0, 25)}...`);

      try {
        const res = await fetch("/api/parse-boarding-pass", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ rawText })
        });
        if (res.ok) {
          const parsed: FlightInfo = await res.json();
          
          get().setFlightData(parsed);
          get().setPassengerName(parsed.passengerName);
          get().setActiveScreen("dashboard");
          logActivity(`${parsed.airportOperator} API'sinden güncel veri başarıyla çekildi. Yolcu: ${parsed.passengerName}`);

          // Record scan audit log
          await logAuditTrail(
            "USER_PORTAL",
            parsed.passengerName,
            "PROFILE_ACCESS",
            `Biniş kartı tarandı. Havalimanı Canlı Veri Birleştiricisi (${parsed.airportOperator}) biniş profiline erişti.`
          );

          // Greet on success
          set({
            messages: [
              {
                id: `scan-greet-${Date.now()}`,
                sender: "assistant",
                text: `Sayın ${parsed.passengerName}, biniş kartınız başarıyla doğrulandı!\n\n${parsed.fromCity} (${parsed.from}) havalimanındasınız. Canlı veri sağlayıcımız olan **${parsed.airportOperator}** sistemlerine göre kapınız **${parsed.gate}** olarak güncellenmiştir. Güvenlik hattı bekleme süresi ortalama **${parsed.securityQueueTime}** dakikadır.\n\nSeyahat rotanız veya size özel atanmış mağaza indirimleri için dilediğinizi sorabilirsiniz.`,
                timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
              }
            ]
          });

          // Begin real-time Sync
          get().startFlightSync(parsed.flightNumber);
        } else {
          logActivity("Hata: Biniş kartı IATA standartlarına uymuyor.");
        }
      } catch (err) {
        logActivity("Bağlantı kesildi. Yerel doğrulama yapılıyor.");
      }
    },

    sendMessage: async (text) => {
      const { messages, flightData, accessibilityProfile, logActivity } = get();
      if (!flightData) return;

      const userMsg: ChatMessage = {
        id: `user-${Date.now()}`,
        sender: "user",
        text,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      };

      const updatedMessages = [...messages, userMsg];
      set({ messages: updatedMessages, isChatLoading: true });
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
          set((state) => ({ messages: [...state.messages, assistantMsg] }));
          logActivity("Gemini yanıtı işlendi ve yolcuya iletildi.");
        } else {
          throw new Error("Gemini response is not OK");
        }
      } catch (err) {
        logActivity("Hata: Gemini asistanı çağrısı başarısız oldu.");
        const errorMsg: ChatMessage = {
          id: `ai-err-${Date.now()}`,
          sender: "assistant",
          text: "Kusura bakmayın, şu anda bağlantı yoğunluğu sebebiyle isteğinizi yanıtlayamadım. Lütfen tekrar deneyiniz.",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        };
        set((state) => ({ messages: [...state.messages, errorMsg] }));
      } finally {
        set({ isChatLoading: false });
      }
    },

    startFlightSync: (flightNumber) => {
      const { stopFlightSync, addSyncLog } = get();
      stopFlightSync();

      const flightRef = doc(db, "flights", flightNumber);
      addSyncLog(`DHMİ Canlı takibi başlatıldı: flights/${flightNumber}`);

      const unsubscribe = onSnapshot(flightRef, (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          addSyncLog(`DHMİ/Bulut veri güncellemesi alındı: Kapı ${data.gate ?? "—"}, Durum: ${data.boardingStatus ?? "—"}`);
          
          set((state) => {
            const prev = state.flightData;
            if (!prev || prev.flightNumber !== data.flightNumber) return {};

            const updatedFlight = {
              ...prev,
              gate: data.gate ?? prev.gate,
              boardingStatus: data.boardingStatus ?? prev.boardingStatus,
              securityQueueTime: data.securityQueueTime ?? prev.securityQueueTime,
              delayReason: data.delayReason ?? (prev as any).delayReason,
              source: data.source ?? (prev as any).source,
              schedule: data.schedule ?? (prev as any).schedule,
              disruption: data.disruption !== undefined ? data.disruption : (prev as any).disruption
            };

            // Trigger KVKK check inline
            if (updatedFlight.boardingStatus === "Closed") {
              sessionStorage.clear();
              setTimeout(() => {
                set({
                  passengerName: null,
                  accessibilityProfile: null,
                  flightData: null,
                  showKvkkWipeModal: true,
                  activeScreen: "login",
                  messages: [
                    {
                      id: "welcome",
                      sender: "assistant",
                      text: "Merhaba! Ben akıllı seyahat asistanınız AeroAI. ✈️\n\nDHMİ, İGA, TAV ve HEAŞ veri sistemlerine canlı olarak bağlıyım. Yolculuğunuzun zaman planlamasını kolaylaştırmak, rötarlar/iptaller gibi kriz durumlarında haklarınızı korumak ve kapı yolunuzu bulmak için yanınızdayım.\n\nNasıl yardımcı olabilirim?",
                      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                    }
                  ]
                });
                get().logActivity("Uçuş tamamlandı. KVKK veri saklama limiti uyarınca tarayıcıdaki tüm kişisel veriler kalıcı olarak imha edildi.");
              }, 10);
            }

            // Save to storage
            sessionStorage.setItem("secure_flightData", JSON.stringify(updatedFlight));
            return { flightData: updatedFlight };
          });
        }
      }, (error) => {
        console.error("Firestore flights onSnapshot error:", error);
        addSyncLog(`DHMİ bağlantı pürüzü: ${error.message}`);
      });

      set({ flightUnsubscribe: unsubscribe });
    },

    stopFlightSync: () => {
      const { flightUnsubscribe } = get();
      if (flightUnsubscribe) {
        flightUnsubscribe();
        set({ flightUnsubscribe: null });
      }
    },

    logout: () => {
      const { stopFlightSync, logActivity } = get();
      stopFlightSync();
      sessionStorage.clear();
      set({
        passengerName: null,
        accessibilityProfile: null,
        flightData: null,
        activeScreen: "login"
      });
      logActivity("Giriş oturumu sıfırlandı.");
    }
  };
});
