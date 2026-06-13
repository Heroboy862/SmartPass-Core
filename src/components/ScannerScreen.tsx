/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from "react";
import { Camera, RefreshCw, X, ShieldAlert, CheckCircle2, AlertCircle, Smartphone } from "lucide-react";
import { Camera as CapCamera, CameraResultType, CameraSource } from "@capacitor/camera";

interface ScannerProps {
  onScanComplete: (rawText: string) => void;
  onClose: () => void;
}

export default function ScannerScreen({ onScanComplete, onClose }: ScannerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraState, setCameraState] = useState<"loading" | "active" | "denied" | "unsupported">("loading");
  const [torch, setTorch] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [isCapacitor, setIsCapacitor] = useState(false);

  useEffect(() => {
    // Detect if we are actively running inside a native Capacitor wrapper (iOS/Android)
    const cap = (window as any).Capacitor;
    if (cap && typeof cap.getPlatform === "function" && cap.getPlatform() !== "web") {
      setIsCapacitor(true);
    }

    let active = true;

    async function setupCamera() {
      try {
        setCameraState("loading");
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment", width: { ideal: 640 }, height: { ideal: 640 } }
        });
        
        if (active) {
          streamRef.current = stream;
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.play();
          }
          setCameraState("active");
        }
      } catch (err) {
        console.warn("Camera could not be initiated via standard web APIs:", err);
        if (active) {
          setCameraState("denied");
        }
      }
    }

    setupCamera();

    // Simulated scan tick
    const interval = setInterval(() => {
      setScanProgress((prev) => {
        if (prev >= 100) {
          return 100;
        }
        const next = prev + 12;
        if (next >= 100) {
          clearInterval(interval);
          return 100;
        }
        return next;
      });
    }, 400);

    return () => {
      active = false;
      clearInterval(interval);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // Safe separation of state computation and side effect (KVKK-compliant local parse trigger)
  useEffect(() => {
    if (scanProgress >= 100) {
      if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
        navigator.vibrate([100, 50, 100]); // Clean double-pulse vibration on success
      }
      onScanComplete("M1YILMAZ/SELIM E ABC1234 ISTLHRTK 1903 120Y012A0001 147");
    }
  }, [scanProgress, onScanComplete]);

  // Handle hand-off to Capacitor Native Camera
  const handleCapacitorCapture = async () => {
    try {
      const photo = await CapCamera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.Base64,
        source: CameraSource.Camera
      });
      
      if (photo && photo.base64String) {
        if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
          navigator.vibrate([100, 50, 100]); // Clean double-pulse vibration on mobile capture success
        }
        // Successful acquisition triggers simulated parser decode immediately
        onScanComplete("M1YILMAZ/SELIM E ABC1234 ISTLHRTK 1903 120Y012A0001 147");
      }
    } catch (error) {
      console.warn("Capacitor camera capture cancelled or failed:", error);
    }
  };

  // Handle flash/torch toggle
  const toggleTorch = () => {
    if (streamRef.current) {
      const track = streamRef.current.getVideoTracks()[0];
      const capabilities = track.getCapabilities ? track.getCapabilities() : {};
      
      // Some browsers allow torch via constraints
      if ("torch" in capabilities) {
        track.applyConstraints({
          advanced: [{ torch: !torch } as any]
        });
        setTorch(!torch);
      } else {
        setTorch(!torch); // Local simulation visual
      }
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 text-white font-sans relative overflow-hidden">
      {/* Absolute top screen controls */}
      <div className="absolute top-4 inset-x-4 flex justify-between items-center z-20">
        <button
          onClick={onClose}
          className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white hover:bg-black/60 active:scale-95 transition-all"
        >
          <X className="w-5 h-5" />
        </button>
        
        <span className="bg-indigo-600/90 text-white text-[10px] uppercase font-bold tracking-widest px-3 py-1.5 rounded-full backdrop-blur-md flex items-center gap-1.5 shadow-lg">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          LOCAL SCAN
        </span>

        <button
          onClick={toggleTorch}
          className={`w-10 h-10 rounded-full ${
            torch ? "bg-amber-500 text-slate-950" : "bg-black/40 text-white"
          } backdrop-blur-md flex items-center justify-center hover:bg-black/60 active:scale-95 transition-all`}
        >
          <Camera className="w-5 h-5" />
        </button>
      </div>

      {/* Main scanning viewport */}
      <div className="flex-1 relative flex items-center justify-center">
        {cameraState === "active" ? (
          <div className="absolute inset-0 w-full h-full">
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              playsInline
              muted
            />
          </div>
        ) : (
          /* High-Fidelity Animated Mock Scanning Camera Feed when Permission Denied or Loading */
          <div className="absolute inset-0 w-full h-full flex flex-col items-center justify-center bg-slate-900 overflow-hidden">
            {/* Ambient animated aircraft radar dots */}
            <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px]"></div>
            
            <div className="text-center p-6 space-y-4 relative z-10 max-w-xs">
              {cameraState === "loading" ? (
                <div className="space-y-3">
                  <RefreshCw className="w-12 h-12 text-indigo-400 animate-spin mx-auto" />
                  <p className="text-sm font-semibold text-slate-300">Kamera Donanımı Hazırlanıyor...</p>
                </div>
              ) : (
                <div className="space-y-3 p-5 bg-slate-950/60 rounded-2xl border border-slate-800">
                  <ShieldAlert className="w-10 h-10 text-amber-500 mx-auto" />
                  <p className="text-xs font-semibold text-slate-200">Kamera İzni Alınamadı veya Mevcut Değil</p>
                  <p className="text-[10px] text-slate-400 leading-relaxed">
                    Güvenliğiniz için yerel kamera taramaya izin vermelisiniz. Sistem otomatik olarak simüle edilmiş taramayı başlatacaktır.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Scan Reticle & Overlay graphics */}
        <div className="absolute inset-0 bg-black/40 flex flex-col justify-between p-6 pointer-events-none z-10">
          <div className="h-20"></div> {/* Space for header */}

          {/* Centered Scanning Box */}
          <div className="self-center w-64 h-64 border-2 border-dashed border-white/20 rounded-3xl relative flex items-center justify-center shadow-[0_0_0_2000px_rgba(0,0,0,0.5)]">
            {/* Visual corner indicators */}
            <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-indigo-500 rounded-tl-xl"></div>
            <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-indigo-500 rounded-tr-xl"></div>
            <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-indigo-500 rounded-bl-xl"></div>
            <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-indigo-500 rounded-br-xl"></div>

            {/* Glowing animated scan laser line */}
            <div className="absolute inset-x-2 bg-indigo-500 shadow-[0_0_15px_4px_rgba(99,102,241,0.6)] h-1 rounded scanning-laser-line"></div>

            {/* Simulated Scanning status text */}
            <div className="text-center text-[10px] tracking-widest uppercase font-mono bg-indigo-650/80 text-white px-3 py-1 rounded-full border border-indigo-500/20">
              OKUNUYOR... {scanProgress}%
            </div>
          </div>

          <div className="space-y-4 text-center">
            <p className="text-xs text-indigo-200">
              Biniş kartının barkodunu çerçeve içerisine yerleştirin.
            </p>
            <div className="flex justify-center pointer-events-auto">
              <button
                type="button"
                onClick={handleCapacitorCapture}
                className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 active:scale-95 transition-all text-white font-black text-[9px] uppercase tracking-wider px-4 py-2.5 rounded-xl shadow-lg cursor-pointer border border-indigo-400/20"
              >
                <Smartphone className="w-3.5 h-3.5" />
                {isCapacitor ? "Native Kamera Tarayıcısı" : "Native / PWA Kamera Çekimi"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Legal KVKK Minimization Banner */}
      <div className="bg-slate-900 border-t border-slate-800 p-4.5 space-y-3 z-2 overlay bg-slate-900/90 backdrop-blur-sm">
        <div className="flex gap-2.5 items-start">
          <CheckCircle2 className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <h4 className="text-[11px] font-semibold text-slate-100 uppercase tracking-wider">Yerel Cihaz İçi Barkod Çözümleme</h4>
            <p className="text-[10px] text-slate-400 leading-relaxed">
              KVKK uyarınca bilet kodlanmış görüntüsü sunuculara gönderilmeden doğrudan tarayıcı işlemcisi tarafından çözümlenir.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
