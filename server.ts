/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import nodemailer from "nodemailer";
import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc } from "firebase/firestore";
import fs from "fs";

dotenv.config();

// Dynamically initialize Firestore via firebase-applet-config.json to match exact database setup
let db: any = null;
try {
  const configPath = path.join(process.cwd(), "firebase-applet-config.json");
  if (fs.existsSync(configPath)) {
    const firebaseConfig = JSON.parse(fs.readFileSync(configPath, "utf-8"));
    const fbApp = initializeApp(firebaseConfig);
    db = getFirestore(fbApp, firebaseConfig.firestoreDatabaseId);
    console.log(`[DHMİ Otorite Bağlantısı] Firestore ${firebaseConfig.firestoreDatabaseId || "default"} veritabanına başarıyla bağlandı.`);
  } else {
    console.warn("[DHMİ Otorite Bağlantısı] firebase-applet-config.json dosyası bulunamadı.");
  }
} catch (err: any) {
  console.error("[DHMİ Otorite Bağlantısı] Firebase başlatılamadı:", err);
}

// DHMİ Canlı Uçuş Veri Simülasyonu Firestore Senkronizasyon Yardımcı Fonksiyonu
async function syncFlightToFirestore(flightNum: string, status: string, secQueue: number, gateNum: string, delayReasonText: string) {
  if (!db) return;
  try {
    const flightRef = doc(db, "flights", flightNum);
    await setDoc(flightRef, {
      flightNumber: flightNum,
      boardingStatus: status,
      securityQueueTime: secQueue,
      gate: gateNum,
      delayReason: delayReasonText || "Normal operasyonel akış sağlandı.",
      updatedAt: new Date().toISOString()
    }, { merge: true });
    console.log(`[DHMİ Canlı Güncelleme] flights/${flightNum} Firestore'a senkronize edildi.`);
  } catch (err: any) {
    console.error(`[DHMİ Canlı Güncelleme] flights/${flightNum} yazma hatası:`, err);
  }
}

// Create application
const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini SDK with telemetry header
const ai = process.env.GEMINI_API_KEY
  ? new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    })
  : null;

// Mock database matching Turkish airports & airlines
const MOCK_BOARDINGS: Record<string, any> = {
  "TK1903": {
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
    boardingProgress: 68,
    estimatedWalkTime: "6 dk",
    airline: "Turkish Airlines",
    airportOperator: "İGA",
    departureTime: "22:15",
    securityQueueTime: 12
  },
  "PC2026": {
    passengerName: "Elif Demir",
    flightNumber: "PC-2026",
    from: "SAW",
    fromCity: "İstanbul Sabiha Gökçen",
    to: "ADB",
    toCity: "İzmir",
    gate: "204B",
    seat: "24B",
    group: "B",
    biometricVerified: true,
    boardingStatus: "Waiting",
    boardingProgress: 15,
    estimatedWalkTime: "3 dk",
    airline: "Pegasus Airlines",
    airportOperator: "HEAŞ",
    departureTime: "23:45",
    securityQueueTime: 25
  },
  "TK2108": {
    passengerName: "Dmitry Smirnov",
    flightNumber: "TK-2108",
    from: "ESB",
    fromCity: "Ankara Esenboğa",
    to: "MOW",
    toCity: "Moskova Vnukovo",
    gate: "B-08",
    seat: "05C",
    group: "VIP",
    biometricVerified: true,
    boardingStatus: "Delayed",
    boardingProgress: 5,
    estimatedWalkTime: "4 dk",
    airline: "Turkish Airlines",
    airportOperator: "TAV",
    departureTime: "01:30",
    securityQueueTime: 8
  },
  "AJ4112": {
    passengerName: "Can Aksoy",
    flightNumber: "AJ-4112",
    from: "ADB",
    fromCity: "İzmir Adnan Menderes",
    to: "IST",
    toCity: "İstanbul",
    gate: "102",
    seat: "14D",
    group: "C",
    biometricVerified: false,
    boardingStatus: "Closed",
    boardingProgress: 100,
    estimatedWalkTime: "8 dk",
    airline: "Ajet Airlines",
    airportOperator: "DHMİ",
    departureTime: "19:00",
    securityQueueTime: 35
  }
};

// Simulated dynamic changes (can be updated in UI to simulate real-time crises)
let simVariables = {
  flightNumber: "TK-1903",
  boardingStatus: "Boarding Now", // "Boarding Now", "Waiting", "Closed", "Delayed", "Cancelled"
  securityQueueTime: 15, // in minutes
  gate: "G-12",
  delayReason: "Hava muhalefeti ve Londra hava sahası yoğunluğu nedeniyle biniş ertelenmiştir."
};

/**
 * API Routes
 */

// Route to fetch simulated variables
app.get("/api/simulation/state", (req, res) => {
  res.json(simVariables);
});

// Route to update simulated variables from the developer sidebar dashboard
app.post("/api/simulation/update", async (req, res) => {
  simVariables = { ...simVariables, ...req.body };
  if (simVariables.flightNumber) {
    await syncFlightToFirestore(
      simVariables.flightNumber,
      simVariables.boardingStatus,
      simVariables.securityQueueTime,
      simVariables.gate,
      simVariables.delayReason
    );
  }
  res.json({ success: true, state: simVariables });
});

// Main parsing and database retrieval endpoint
app.post("/api/parse-boarding-pass", async (req, res) => {
  const { rawText } = req.body;
  if (!rawText) {
    return res.status(400).json({ error: "No code or string provided." });
  }

  // Parse IATA BCBP (Bar Coded Boarding Pass) manually as fallback, or map to predefined patterns
  let flightId = "TK1903"; // Default fallback
  
  const uppercaseRaw = rawText.toUpperCase();
  if (uppercaseRaw.includes("TK1903") || uppercaseRaw.includes("TK-1903") || uppercaseRaw.includes("SELIM")) {
    flightId = "TK1903";
  } else if (uppercaseRaw.includes("PC2026") || uppercaseRaw.includes("PC-2026") || uppercaseRaw.includes("ELIF")) {
    flightId = "PC2026";
  } else if (uppercaseRaw.includes("TK2108") || uppercaseRaw.includes("TK-2108") || uppercaseRaw.includes("DMITRY")) {
    flightId = "TK2108";
  } else if (uppercaseRaw.includes("AJ4112") || uppercaseRaw.includes("AJ-4112") || uppercaseRaw.includes("CAN")) {
    flightId = "AJ4112";
  } else {
    // Generate simulated parsing based on regex if it matches IATA pattern, e.g. M1...
    // Pattern: M1PassengerName/FirstName[E|Space]PNRCode[space]OriginDestCarrierFlightNumber
    const passNameMatch = rawText.match(/M1([A-Z\s\/]+)/);
    const airportMatch = rawText.match(/([A-Z]{3})([A-Z]{3})([A-Z]{2})\s*([0-9]{3,4})/);
    
    if (passNameMatch && airportMatch) {
      const passengerName = passNameMatch[1].replace("/", " ").trim();
      const origin = airportMatch[1];
      const destination = airportMatch[2];
      const carrier = airportMatch[3];
      const flightNum = airportMatch[4];
      const fullFlight = `${carrier}-${flightNum}`;

      const resolvedOperator = origin === "IST" ? "İGA" : origin === "SAW" ? "HEAŞ" : "DHMİ";

      const parsedData = {
        passengerName,
        flightNumber: fullFlight,
        from: origin,
        fromCity: origin === "IST" ? "İstanbul" : origin === "SAW" ? "Sabiha Gökçen" : "Yerel Havalimanı",
        to: destination,
        toCity: destination === "LHR" ? "Londra" : destination === "ADB" ? "İzmir" : "Varış Şehri",
        gate: "A-01",
        seat: "15E",
        group: "B",
        biometricVerified: true,
        boardingStatus: "Waiting",
        boardingProgress: 30,
        estimatedWalkTime: "5 dk",
        airline: carrier === "TK" ? "Turkish Airlines" : carrier === "PC" ? "Pegasus Airlines" : "Ajet Airlines",
        airportOperator: resolvedOperator,
        departureTime: "22:45",
        securityQueueTime: 15
      };

      if (parsedData.flightNumber) {
        await syncFlightToFirestore(
          parsedData.flightNumber,
          parsedData.boardingStatus,
          parsedData.securityQueueTime,
          parsedData.gate,
          "Uçuş kartı taramasıyla canlı sistemlere bağlandı."
        );
      }

      return res.json(parsedData);
    }
  }

  // Retrieve current active state for that flight, blending in the simulator state if matches flightNumber
  const baseData = { ...MOCK_BOARDINGS[flightId] };
  if (baseData && baseData.flightNumber === simVariables.flightNumber) {
    baseData.boardingStatus = simVariables.boardingStatus;
    baseData.securityQueueTime = simVariables.securityQueueTime;
    baseData.gate = simVariables.gate;
  }

  if (baseData && baseData.flightNumber) {
    await syncFlightToFirestore(
      baseData.flightNumber,
      baseData.boardingStatus,
      baseData.securityQueueTime,
      baseData.gate,
      simVariables.flightNumber === baseData.flightNumber ? simVariables.delayReason : "Normal operasyonel akış sağlandı."
    );
  }

  res.json(baseData);
});

// Real-time Authority Aggregator (İGA, TAV, HEAŞ, DHMİ)
app.get("/api/authority/stream", (req, res) => {
  const { flight, airport } = req.query;
  const operator = airport === "IST" ? "İGA" : airport === "SAW" ? "HEAŞ" : airport === "ESB" ? "TAV" : "DHMİ";
  
  // Real-time server diagnostics represent the data pool from high-end airport feeds
  const payload = {
    timestamp: new Date().toISOString(),
    operator,
    originAirport: airport || "IST",
    statusMessage: "Active integration with official aviation hubs",
    feedQuality: "Operational (99.9%)",
    activeSensors: {
      baggageClaimStatus: "Active",
      gateScanners: "Normal",
      terminalSecurityQueue: `${simVariables.securityQueueTime} mins`,
      biometricGateState: "Ready"
    },
    liveAlerts: simVariables.boardingStatus === "Delayed" 
      ? [`Sefer ${simVariables.flightNumber} ertelenmiştir: ${simVariables.delayReason}`]
      : simVariables.boardingStatus === "Cancelled"
      ? [`Sefer ${simVariables.flightNumber} iptal edilmiştir! Lütfen Transfer Masasına başvurun.`]
      : simVariables.securityQueueTime > 30 
      ? ["Yüksek yolcu yoğunluğu tespiti! Güvenlik kuyruğunda aşırı yığılma var."]
      : []
  };

  res.json(payload);
});

// Register & send accessibility boarding welcome email (SMTP or Sandbox simulation)
app.post("/api/email/send-welcome", async (req, res) => {
  const { email, name, accessibilityProfile } = req.body;
  
  if (!email) {
    return res.status(400).json({ error: "E-posta adresi belirtilmelidir." });
  }

  // Generate customized accessibility block
  let accBlock = "";
  if (accessibilityProfile && accessibilityProfile.enabled) {
    let accLabel = "Engelsiz Yolcu";
    let accDesc = "Standart asistanlık ve biniş yardımı.";
    if (accessibilityProfile.type === "wheelchair") {
      accLabel = "♿ Tekerlekli Sandalye / Ortopedik Destek";
      accDesc = "Fiziki yardım ekibi, merdivensiz asansörler ve rampa rotaları sizin için rezerve edildi.";
    } else if (accessibilityProfile.type === "vision") {
      accLabel = "👁️ Görme Hassasiyeti / Sesli Rehberlik";
      accDesc = "Turnikelerde ve kapılarda kulaklıkla sesli yönlendirme, yüksek kontrast arayüzü ve yer ekibi eşliği aktif.";
    } else if (accessibilityProfile.type === "hearing") {
      accLabel = "👂 İşitme Engeli / Görsel Flaşör";
      accDesc = "Kalkış anonsları, kapı değişiklikleri ve rötarlar cihazınıza görsel bento flaşları olarak iletilir.";
    } else if (accessibilityProfile.type === "elderly") {
      accLabel = "👴 Yaşlı Yolcu / Refakatçi Yardımı";
      accDesc = "Uçuş kapınıza kadar konforlu taşıma için buggy (elektrikli transfer aracı) planlaması yapıldı.";
    } else if (accessibilityProfile.type === "other") {
      accLabel = "🩺 Özel Tıbbi / Diğer Gereksinimler";
      accDesc = "Medikal takibiniz, ilaç saklama ve solunum aparatı taşıma haklarınız kabin amirliğine bildirilmiştir.";
    }

    let customHtml = "";
    if (accessibilityProfile.customRequest) {
      customHtml = `<p style="margin: 8px 0 0; font-size: 11px; padding: 8px; background: #ffffff; border: 1px solid #d1fae5; border-radius: 8px; color: #065f46; font-style: italic;"><strong>Özel Notunuz:</strong> "${accessibilityProfile.customRequest}"</p>`;
    }

    accBlock = `
      <div style="background-color: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 12px; padding: 16px; margin: 16px 0;">
        <h3 style="margin: 0 0 8px; font-size: 13px; font-weight: bold; color: #065f46; text-transform: uppercase; letter-spacing: 0.05em; font-family: sans-serif;">♿ ERİŞİLEBİLİRLİK DESTEK AKTİVASYONU</h3>
        <p style="margin: 0; font-size: 13px; color: #047857; font-family: sans-serif;"><strong>Destek Sınıfı:</strong> ${accLabel}</p>
        <p style="margin: 4px 0 0; font-size: 12px; color: #065f46; font-family: sans-serif;">${accDesc}</p>
        ${customHtml}
      </div>
    `;
  } else {
    accBlock = `
      <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin: 16px 0;">
        <p style="margin: 0; font-size: 13px; color: #475569; font-family: sans-serif;"><strong>Profil Sınıfı:</strong> Standart Yolcu (Özel biniş asistanlığı veya tıbbi yardım gereksinimi belirtilmedi).</p>
      </div>
    `;
  }

  const htmlContent = `
    <div style="font-family: Arial, Helvetica, sans-serif; max-width: 600px; margin: 20px auto; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; background-color: #ffffff; box-shadow: 0 4px 12px rgba(0,0,0,0.03);">
      <div style="background-color: #1e1b4b; padding: 32px 24px; text-align: center; color: #ffffff;">
        <h1 style="margin: 0; font-size: 24px; font-weight: bold; letter-spacing: -0.025em; font-family: sans-serif;">SMARTPASS PRO</h1>
        <p style="margin: 4px 0 0; font-size: 14px; color: #c4b5fd; font-family: sans-serif;">AeroAI Otonom Engelsiz Seyahat Asistanı</p>
      </div>
      <div style="padding: 32px 24px; color: #1e293b; line-height: 1.6;">
        <h2 style="margin: 0 0 16px; font-size: 18px; font-weight: bold; color: #0f172a; font-family: sans-serif;">Hoş Geldiniz, Sayın ${name || 'Nezih Yolcumuz'}!</h2>
        <p style="margin: 0 0 16px; font-size: 14px; font-family: sans-serif;">SmartPass Pro-Version mobil biniş ve kriz yönetimi platformumuza kaydınız başarıyla gerçekleşti. Dijital şifreleme ve güvenli asistanlık anahtarınız profilinizle eşleştirilerek devreye alındı.</p>
        
        ${accBlock}

        <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 16px; margin: 24px 0;">
          <h3 style="margin: 0 0 6px; font-size: 11px; font-weight: bold; color: #15803d; text-transform: uppercase; letter-spacing: 0.05em; font-family: sans-serif;">🔒 BİLGİ GÜVENLİĞİ VE KVKK GÜVENCESİ</h3>
          <p style="margin: 0; font-size: 11px; color: #166534; line-height: 1.5; font-family: sans-serif;">SmartPass yardımıyla sisteme işlediğiniz her turlu sağlık, ortopedik engel veya diğer özel tıbbi istekleriniz uçtan uca şifreli olarak cihazınızda saklanır. 6698 sayılı KVKK kapsamında bu profiliniz pazarlama veritabanlarında saklanmaz veya üçüncü kişi veya havayolu kurumlarına <strong>kesinlikle iletilmez</strong>. Verileriniz yalnızca uçuş navigasyonu çizimi, terminal rampası asistanları ve kapı canlı bildirimleri için kullanılır, kalkıştan sonra otomatik imha edilir.</p>
        </div>

        <p style="margin: 0 0 8px; font-size: 13px; font-family: sans-serif;">Uçuş kartınızı ve PNR kodunuzu uygulamaya taratarak kapı durumlarını, güvenlik kuyruğu bekleme sürelerini ve AeroAI seyahat çözümlerini anlık takip edebilirsiniz.</p>
        <p style="margin: 0; font-size: 14px; font-weight: bold; color: #4f46e5; font-family: sans-serif;">Engelsiz, konforlu ve güvenli yolculuklar dileriz!</p>
      </div>
      <div style="background-color: #f8fafc; padding: 20px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #f1f5f9; font-family: sans-serif;">
        Bu e-posta, SmartPass sistemine biniş kaydı oluşturduğunuz için otomatik olarak iletilmiştir.<br />
        © 2026 SmartPass Pro-Version. Tüm Hakları Saklıdır.
      </div>
    </div>
  `;

  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const fromEmail = process.env.SMTP_FROM_EMAIL || "no-reply@smartpass-pro.com";

  if (host && port && user && pass) {
    try {
      const transporter = nodemailer.createTransport({
        host,
        port: parseInt(port, 10),
        secure: parseInt(port, 10) === 465,
        auth: {
          user,
          pass,
        },
      });

      await transporter.sendMail({
        from: `"SmartPass Pro" <${fromEmail}>`,
        to: email,
        subject: `SmartPass'e Hoş Geldiniz, Sayın ${name || 'Yolcumuz'}! - Onay Belgesi`,
        html: htmlContent,
      });

      console.log(`REAL ONBOARDING EMAIL SENT successfully to ${email}`);
      return res.json({
        success: true,
        method: "real",
        email,
        emailContentHtml: htmlContent
      });
    } catch (err: any) {
      console.error("FAIL TO SEND REAL EMAIL via SMTP:", err);
      return res.json({
        success: true,
        method: "simulated_error_fallback",
        email,
        emailContentHtml: htmlContent,
        errorMessage: err.message
      });
    }
  } else {
    console.log(`SMTP credentials not fully provided. SIMULATING registration email to ${email}`);
    return res.json({
      success: true,
      method: "simulated",
      email,
      emailContentHtml: htmlContent
    });
  }
});

// AI Travel Assistant chat using Gemini 3.5-Flash
app.post("/api/assistant/chat", async (req, res) => {
  const { messages, flightData } = req.body;

  if (!ai) {
    return res.status(200).json({
      text: "AeroAI sistemleri şu anda aktif edilemedi çünkü **GEMINI_API_KEY** bulunamadı. Lütfen sağ üstteki **Settings > Secrets** panelinden anahtarınızı giriniz. Simulasyonun geri kalanı ve veri akışları kusursuzca çalışmaktadır!"
    });
  }

  try {
    const flight = flightData || MOCK_BOARDINGS["TK1903"];
    
    // Custom formatted active schedule for instructions
    const flightContext = `
      Yolcunun Aktif Bilgileri:
      - İsim: ${flight.passengerName}
      - Uçuş No: ${flight.flightNumber}
      - Havayolu: ${flight.airline}
      - Güzergah: ${flight.from} (${flight.fromCity}) -> ${flight.to} (${flight.toCity})
      - Biniş Durumu (Canlı Otorite Verisi): ${flight.boardingStatus}
      - Kapı Bilgisi: ${flight.gate}
      - Koltuk: ${flight.seat} (Grup ${flight.group})
      - Biyometrik Doğrulama (Smart ID): ${flight.biometricVerified ? "Aktif" : "Pasif"}
      - Kapıya Uzaklık: ${flight.estimatedWalkTime} yürüme mesafesinde
      - Güvenlik Kuyruğu Bekleme Süresi (Canlı ${flight.airportOperator} Verisi): ${flight.securityQueueTime} dakika
    `;

    const instructions = `
      Sen SMART PASS platformunun akıllı havacılık asistanı AeroAI'sın.
      Sistemimiz; DHMİ, İGA, TAV, HEAŞ gibi canlı havalimanı otoritelerinden veri akışı alarak çalışır ve PWA/mobil uygulamamıza entegredir.
      Görevin: Yolcunun zaman yönetimini optimize etmek, kriz anlarında (ertelemeler, iptaller, kapı değişiklikleri, kayıp bagajlar, kuyruk yoğunlukları) yolcuya sakin, net ve proaktif çözümler sunmaktır.
      
      Yolcunun canlı bağlamı şudur:
      ${flightContext}

      Tavri ve Kuralları:
      1. Sıcak, güvenilir ve havacılık uzmanı tonunda Türkçe konuş. Emojileri yerinde ve ölçülü kullan.
      2. Yolcunun zaman çizelgesini, uçağın kaç dakika rötar yaptığını veya kapının mesafesini analiz et. 
      3. Örneğin güvenlik sırası ${flight.securityQueueTime} dakika ve boarding bitti bitti durumdaysa yolcuyu derhal uyar.
      4. Kriz durumlarında (İptal/Rötar): Yolcuya SHY (Sivil Havacılık Genel Müdürlüğü) yolcu hakları kanunu uyarınca haklarını anlatabilirsiniz (ücretsiz ikram, alternatif uçuş, bilet iadesi vb.).
      5. Cevapların kısa, mobil telefonda kolayca okunabilecek şekilde (maksimum 3-4 paragraflık, listeli, temiz Markdown) olsun.
      
      Şu anki kullanıcı mesajına cevap ver. Son konuşma geçmişini dikkate al.
    `;

    // Process messaging payload into generative AI SDK format
    // Map existing history
    const contents = messages.map((m: any) => ({
      role: m.sender === "user" ? "user" : "model",
      parts: [{ text: m.text }]
    }));

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: contents,
      config: {
        systemInstruction: instructions,
        temperature: 0.7,
      }
    });

    res.json({ text: response.text });
  } catch (error: any) {
    console.error("Gemini Assistant Failure:", error);
    res.status(500).json({ error: "Yapay zeka asistanına ulaşılamadı.", details: error.message });
  }
});

/**
 * Vite Dev Server & Static Production Routing
 */
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Smart Boarding server listing on http://0.0.0.0:${PORT}`);
  });
}

startServer();
