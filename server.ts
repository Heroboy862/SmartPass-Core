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
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";

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

// Enable 'trust proxy' so Express registers client IPs correctly from the reverse proxy (X-Forwarded-For)
app.set("trust proxy", 1);

// Apply Helmet.js to automatically configure secure HTTP headers (protect against Clickjacking, basic XSS, Sniffing)
app.use(
  helmet({
    contentSecurityPolicy: false, // Off to guarantee smooth client-side loading of Vite bundle and dynamic typography/styles
    crossOriginEmbedderPolicy: false
  })
);

// Apply rate limiting across all API endpoints (/api/*) to defend the Gemini AI key from budget exhaustion (Denial of Wallet)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 mins
  limit: 180, // Allow up to 180 requests per 15 mins per IP
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: {
    status: 429,
    error: "Aşırı istek tespiti: Güvenlik koruması önlemince geçici olarak engellendiniz. Lütfen bir süre sonra tekrar deneyiniz."
  }
});
app.use("/api/", apiLimiter);

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

// Havaist, Havaş, Metro & Belko Air Transportation database matching multi-region Turkish airports
interface TransportRoute {
  name: string;
  price: number;
  stops: string[];
  times: string[];
  frequency: string;
  platform: string;
}

const SERVER_TRANSPORT_DATA: Record<string, Record<string, TransportRoute>> = {
  "istanbul-ist": {
    "hvist-14": {
      name: "HVİST-14 (Taksim - Beşiktaş)",
      price: 250,
      stops: ["İstanbul Havalimanı (IST)", "Göktürk Metro", "Nurtepe Viyadük", "Zincirlikuyu", "Beşiktaş", "Taksim Meydanı"],
      times: ["06:00", "07:00", "08:00", "08:30", "09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "12:00", "12:30", "13:00", "13:30", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00", "17:30", "18:00", "18:30", "19:00", "19:30", "20:00", "20:30", "21:00", "21:30", "22:00", "22:30", "23:00", "23:30", "00:00", "02:00", "04:00"],
      frequency: "30 dakikada bir",
      platform: "Peron 14 - Gelen Katı"
    },
    "hvist-9": {
      name: "HVİST-9 (Kadıköy - Yenisahra)",
      price: 270,
      stops: ["İstanbul Havalimanı (IST)", "Kavacık Köprüsü", "Göztepe", "Yenisahra", "Kadıköy Metro"],
      times: ["06:15", "07:15", "08:15", "08:45", "09:15", "09:45", "10:15", "10:45", "11:15", "11:45", "12:15", "12:45", "13:15", "13:45", "14:15", "14:45", "15:15", "15:45", "16:15", "16:45", "17:15", "17:45", "18:15", "18:45", "19:15", "19:45", "20:15", "20:45", "21:15", "21:45", "22:15", "23:15", "00:15", "02:15", "04:15"],
      frequency: "30 dakikada bir",
      platform: "Peron 9 - Gelen Katı"
    },
    "hvist-12": {
      name: "HVİST-12 (Aksaray - Beyazıt)",
      price: 250,
      stops: ["İstanbul Havalimanı (IST)", "Ayvansaray", "Ulubatlı", "Aksaray Metro", "Beyazıt Meydanı"],
      times: ["06:20", "07:20", "08:20", "08:50", "09:20", "09:50", "10:20", "10:50", "11:20", "11:50", "12:20", "12:50", "13:20", "13:50", "14:20", "14:50", "15:20", "15:50", "16:20", "16:50", "17:20", "17:50", "18:20", "18:50", "19:20", "19:50", "20:20", "20:50", "21:20", "21:50", "22:20", "23:20", "00:20"],
      frequency: "30 dakikada bir",
      platform: "Peron 12 - Gelen Katı"
    }
  },
  "istanbul-saw": {
    "m4-metro": {
      name: "M4 Metro (Kadıköy - Sabiha Gökçen)",
      price: 40,
      stops: ["Sabiha Gökçen Havalimanı (SAW)", "Pendik Metro", "Kartal", "Bostancı", "Yenisahra", "Kadıköy Merkez"],
      times: ["06:00", "06:30", "07:00", "07:30", "08:00", "08:30", "09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "12:00", "12:30", "13:00", "13:30", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00", "17:30", "18:00", "18:30", "19:00", "19:30", "20:00", "20:30", "21:00", "21:30", "22:00", "22:30", "23:00", "23:30", "00:00"],
      frequency: "8-10 dakikada bir",
      platform: "Havalimanı Metro İstasyon Girişi"
    },
    "iett-e11": {
      name: "İETT E-11 (Kadıköy - Ekspres Yolcu)",
      price: 60,
      stops: ["Sabiha Gökçen Havalimanı (SAW)", "Yeniahra", "Göztepe Köprüsü", "Acıbadem", "Kadıköy İskele"],
      times: ["06:10", "06:50", "07:30", "08:10", "08:50", "09:30", "10:10", "10:50", "11:30", "12:10", "12:50", "13:30", "14:10", "14:50", "15:30", "16:10", "16:50", "17:30", "18:10", "18:50", "19:30", "20:10", "20:50", "21:35", "22:20", "23:10", "00:05"],
      frequency: "40 dakikada bir",
      platform: "Sabiha Gökçen Belediye Otobüs Alanı"
    },
    "havas-saw-taksim": {
      name: "SG Havaş (Taksim - Gece ve Gündüz)",
      price: 260,
      stops: ["Sabiha Gökçen Havalimanı (SAW)", "Kavacık Köprüsü", "Zincirlikuyu Metrobüs", "Taksim Tepebaşı"],
      times: ["06:30", "07:30", "08:30", "09:30", "10:30", "11:30", "12:30", "13:30", "14:30", "15:30", "16:30", "17:30", "18:30", "19:30", "20:30", "21:30", "22:30", "23:30", "00:30", "01:30", "03:30", "05:00"],
      frequency: "60 dakikada bir",
      platform: "Gelen Yolcu Çıkışı Peron Alanı"
    }
  },
  "izmir": {
    "havas-mavi": {
      name: "Havaş Mavişehir (Alsancak - Karşıyaka)",
      price: 220,
      stops: ["Adnan Menderes Havalimanı (ADB)", "Gaziemir", "Karabağlar", "Halkapınar Metro", "Bayraklı", "Karşıyaka Çarşı", "Bostanlı İskele", "Mavişehir"],
      times: ["06:00", "07:00", "08:00", "08:30", "09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "12:00", "12:30", "13:00", "13:30", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00", "17:30", "18:00", "18:30", "19:00", "19:30", "20:00", "20:30", "21:00", "21:30", "22:00", "22:30", "23:00", "23:30", "00:00", "01:00", "02:00", "03:30", "05:00"],
      frequency: "30 dakikada bir",
      platform: "TAV ADB Dış Hatlar Çıkışı"
    },
    "havas-bornova": {
      name: "Havaş Bornova (Ege Üniversitesi)",
      price: 220,
      stops: ["Adnan Menderes Havalimanı (ADB)", "Bornova Metro", "Ege Üniversitesi Hastanesi"],
      times: ["06:30", "07:30", "08:30", "09:30", "10:30", "11:30", "12:30", "13:30", "14:30", "15:30", "16:30", "17:30", "18:30", "19:30", "20:30", "21:30", "22:30", "23:30", "00:30", "01:30", "03:00", "05:00"],
      frequency: "60 dakikada bir",
      platform: "TAV ADB İç Hatlar Çıkışı"
    },
    "havas-cesme": {
      name: "Havaş Çeşme (Otogar - Alaçatı)",
      price: 400,
      stops: ["Adnan Menderes Havalimanı (ADB)", "Alaçatı Terminali", "Çeşme Otogarı"],
      times: ["08:00", "10:00", "12:00", "14:00", "16:00", "18:00", "20:00", "22:00", "00:00"],
      frequency: "120 dakikada bir",
      platform: "TAV İzmir Çeşme Peronu"
    }
  },
  "ankara": {
    "belko-442": {
      name: "Belko Air 442 (Esenboğa - Kızılay - AŞTİ)",
      price: 120,
      stops: ["Esenboğa Havalimanı (ESB)", "Pursaklar", "Hasköy", "AKM Metro", "Kızılay", "AŞTİ Terminali"],
      times: ["06:00", "06:20", "06:40", "07:00", "07:20", "07:40", "08:00", "08:20", "08:40", "09:00", "09:20", "09:40", "10:00", "10:20", "10:40", "11:00", "11:20", "11:40", "12:00", "12:20", "12:40", "13:00", "13:20", "13:40", "14:00", "14:20", "14:40", "15:00", "15:20", "15:40", "16:00", "16:20", "16:40", "17:00", "17:20", "17:40", "18:00", "18:20", "18:40", "19:00", "19:20", "19:40", "20:00", "20:30", "21:00", "21:30", "22:00", "22:30", "23:00", "23:30", "00:00", "01:00", "02:00", "03:00", "04:30"],
      frequency: "20 dakikada bir",
      platform: "Esenboğa Gelen Yolcu Peron 2"
    },
    "havas-ankara": {
      name: "Havaş Ankara (Esenboğa - YHT Gar)",
      price: 150,
      stops: ["Esenboğa Havalimanı (ESB)", "Pursaklar", "Ankara Yüksek Hızlı Tren Garı"],
      times: ["06:30", "07:30", "08:30", "09:30", "10:30", "11:30", "12:30", "13:30", "14:30", "15:30", "16:30", "17:30", "18:30", "19:30", "20:30", "21:30", "22:30", "23:30", "00:00", "01:00", "02:30"],
      frequency: "60 dakikada bir",
      platform: "Esenboğa Gelen Yolcu Havaş Alanı"
    }
  },
  "antalya": {
    "antray-tram": {
      name: "Antray T1A Tramvay (Havalimanı - Otogar)",
      price: 40,
      stops: ["Antalya Havalimanı (AYT)", "Meydan Merkez", "Doğu Garajı", "MarkAntalya", "Fatih İstasyonu (Otogar)"],
      times: ["06:05", "06:20", "06:35", "06:50", "07:05", "07:20", "07:35", "07:50", "08:05", "08:20", "08:35", "08:50", "09:05", "09:20", "09:35", "09:50", "10:05", "10:20", "10:35", "10:50", "11:05", "11:20", "11:35", "11:50", "12:05", "12:20", "12:35", "12:50", "13:05", "13:20", "13:35", "13:50", "14:05", "14:20", "14:35", "14:50", "15:05", "15:20", "15:35", "15:50", "16:05", "16:20", "16:35", "16:50", "17:05", "17:20", "17:35", "17:50", "18:05", "18:20", "18:35", "18:50", "19:05", "19:20", "19:35", "19:50", "20:05", "20:20", "20:35", "20:50", "21:05", "21:20", "21:35", "21:50", "22:05", "22:20", "22:40", "23:00", "23:25", "23:50"],
      frequency: "15 dakikada bir",
      platform: "AYT Terminal 1 Tramvay İstasyonu"
    },
    "havas-antalya": {
      name: "Havaş Antalya (5M Migros - Konyaaltı)",
      price: 160,
      stops: ["Antalya Havalimanı (AYT)", "Gazi Bulvarı", "Çallı Kavşağı", "Otogar Terminali", "5M Migros Konyaaltı"],
      times: ["06:00", "07:00", "08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00", "20:00", "21:00", "22:00", "23:00", "00:00", "01:00", "02:30", "04:00"],
      frequency: "60 dakikada bir",
      platform: "AYT İç ve Dış Hatlar Gelen Yolcu Çıkışı"
    }
  },
  "mugla": {
    "muttas-bodrum": {
      name: "MUTTAŞ 48-24 Bodrum Merkez Otogar",
      price: 180,
      stops: ["Milas-Bodrum Havalimanı (BJV)", "Güvercinlik", "Yokuşbaşı Torba", "Bodrum Otogarı Mekez"],
      times: ["07:30", "08:30", "09:45", "11:00", "12:15", "13:30", "14:45", "16:00", "17:15", "18:30", "19:45", "21:00", "22:15", "23:30", "01:00", "02:30"],
      frequency: "Geliş/Gidiş Sefer Uyumlu",
      platform: "BJV İç Hatlar Çıkış Peronu"
    },
    "havas-dalam-fethiye": {
      name: "Havaş Dalaman (Göcek - Fethiye)",
      price: 210,
      stops: ["Dalaman Havalimanı (DLM)", "Ortaca", "Göcek Tüneli", "Günlükbaşı", "Fethiye Otogarı"],
      times: ["08:00", "10:00", "11:30", "13:00", "14:30", "16:00", "17:30", "19:00", "20:30", "22:00", "23:30", "01:00", "03:00"],
      frequency: "Uçak İnişlerini Takiben",
      platform: "Dalaman Havalimanı Gelen Yolcu Önü"
    }
  }
};

// Background query service to get dynamic transport schedules & compute auto recommendations based on safety intervals
app.get("/api/transport/schedule", (req, res) => {
  const airport = (req.query.airport as string || "IST").toUpperCase();
  const depTime = req.query.departureTime as string || "22:15";
  const toCity = (req.query.toCity as string || "Londra").toLowerCase();
  const requestedHub = req.query.hub as string || "";

  // Detect which hub to load context for:
  let hub = "istanbul-ist";
  
  if (requestedHub && SERVER_TRANSPORT_DATA[requestedHub]) {
    hub = requestedHub;
  } else {
    // Resolve based on airport query code or destination
    if (airport === "SAW") {
      hub = "istanbul-saw";
    } else if (airport === "ADB" || toCity.includes("izmir")) {
      hub = "izmir";
    } else if (airport === "ESB" || toCity.includes("ankara")) {
      hub = "ankara";
    } else if (airport === "AYT" || toCity.includes("antalya")) {
      hub = "antalya";
    } else if (airport === "BJV" || airport === "DLM" || toCity.includes("bodrum") || toCity.includes("fethiye") || toCity.includes("marmaris") || toCity.includes("muğla")) {
      hub = "mugla";
    } else {
      hub = "istanbul-ist";
    }
  }

  const routes = SERVER_TRANSPORT_DATA[hub];

  // Let's compute the recommended bus/metro departure time for each route matching safety standards
  const responseRoutes = Object.keys(routes).map((key) => {
    const route = routes[key];
    const isIntl = !toCity.includes("izmir") && !toCity.includes("ankara") && !toCity.includes("istanbul") && !toCity.includes("antalya");
    
    // Safety buffer calculations (international flight check-in closes 1hr earlier, domestic is shorter)
    const safetyBufferMins = isIntl ? 180 : 120; // 3 hours (180 mins) for intl, 2 hours (120 mins) for domestic
    const commuteDurationMins = (hub === "istanbul-ist" || hub === "mugla") ? 80 : 60; // larger commute duration for giant hubs

    // Parse flight departure (hours & minutes)
    const [fH, fM] = depTime.split(":").map(Number);
    const flightTotalMins = (isNaN(fH) ? 22 : fH) * 60 + (isNaN(fM) ? 15 : fM);

    // Target arrival at terminal is flight departure minus safety buffer
    // To get there, the bus must leave by (flightTotalMins - safetyBufferMins - commuteDurationMins)
    let targetDepartureMins = flightTotalMins - safetyBufferMins - commuteDurationMins;
    if (targetDepartureMins < 0) {
      targetDepartureMins += 24 * 60; // Handle wraps for midnight/early morning flights
    }

    // Select the best bus departure time from the timetable:
    // It should be the time closest to targetDepartureMins but before or equal to it, or if none, the closest
    let recommendedTime = route.times[0];
    let minDiff = Infinity;

    route.times.forEach((tStr) => {
      const [bH, bM] = tStr.split(":").map(Number);
      const busTotalMins = bH * 60 + bM;
      
      // Calculate delay/difference: we want the bus that gets us there on time, i.e., closest to but before targetDepartureMins
      let diff = targetDepartureMins - busTotalMins;
      if (diff < 0) {
        // If the bus leaves after the target but is on the same day, it might make us tight on time,
        // so we assign a penalty representing wrapping around the clock.
        diff += 24 * 60;
      }

      if (diff < minDiff) {
        minDiff = diff;
        recommendedTime = tStr;
      }
    });

    // Provide localized friendly Turkish airport guide tips
    let regionalTip = "";
    if (hub === "istanbul-ist") {
      regionalTip = `Uluslararası yolculuklar için en az 3 saat önce havalimanında bulunmanız gerekmektedir. İstanbul Havalimanı (IST) terminal büyüklüğü nedeniyle peronlardan check-in kontuarlarına yürüyüş süresini hesaba katarak en uygun Havaist seferi ayarlanmıştır.`;
    } else if (hub === "istanbul-saw") {
      regionalTip = `Sabiha Gökçen Havalimanı (SAW) yoğun terminal trafiğine sahiptir. Metro veya ekspres otobüs seferi ile kalkış saatinizden önce kolaylıkla kapıda olmanız için hesaplanmıştır.`;
    } else if (hub === "izmir") {
      regionalTip = `Adnan Menderes Havalimanı (ADB) uçuşunuz için İzmir Havaş konforlu ve zamanında varış sağlar.`;
    } else if (hub === "ankara") {
      regionalTip = `Ankara Esenboğa Havalimanı (ESB) yolculuğunuz için 442 Belko Air hattı veya Havaş saatleri uçuş saatinden en az 2 saat önce varış sağlayacak biçimde optimize edilmiştir.`;
    } else if (hub === "antalya") {
      regionalTip = `Antalya (AYT) uçuşunuz için Havaş sefer saatlerinin yanı sıra kesintisiz raylı sistem (Antray) alternatifi de listededir.`;
    } else if (hub === "mugla") {
      regionalTip = `BJV/DLM tatil dönüş hattı yoğunlukları nedeniyle Muttaş ve Havaş seferleri havalimanına rahat erişim için erken periyotlarda önerilmektedir.`;
    }

    return {
      id: key,
      ...route,
      recommendedTime,
      rationale: regionalTip || `Uçuş saatine adaptif güvenlik penceresi gözetilerek en uygun ulaşım sistemi planlanmıştır.`
    };
  });

  res.json({
    provider: hub,
    airport,
    flightDepartureTime: depTime,
    routes: responseRoutes
  });
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

// Currency Exchange Rates caching & service helpers for international routes
let ratesCache: {
  rates: Record<string, number> | null;
  lastFetched: number;
} = {
  rates: null,
  lastFetched: 0
};

async function getLiveRates(): Promise<Record<string, number> | null> {
  const now = Date.now();
  // 1 hour cache
  if (ratesCache.rates && (now - ratesCache.lastFetched) < 3600000) {
    return ratesCache.rates;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);
    
    const response = await fetch("https://open.er-api.com/v6/latest/TRY", { signal: controller.signal });
    clearTimeout(timeoutId);

    if (response.ok) {
      const data: any = await response.json();
      if (data && data.rates) {
        ratesCache = {
          rates: data.rates,
          lastFetched: now
        };
        console.log("Döviz kurları API üzerinden güncellendi.");
        return data.rates;
      }
    }
  } catch (err: any) {
    console.warn("Canlı döviz kurları alınamadı, yerel eşleşme kullanılacak. Hata:", err.message);
  }

  return ratesCache.rates;
}

function getCurrencyInfo(toCity: string, toCode: string, liveRates?: Record<string, number>) {
  const city = (toCity || "").toLowerCase();
  const code = (toCode || "").toUpperCase();

  let currencyCode = "TRY";
  let currencyName = "Türk Lirası";
  let symbol = "₺";
  let fallbackRate = 1.0;

  // Real-world mappings based on destination code or city descriptions
  if (code === "LHR" || city.includes("londra") || city.includes("london") || city.includes("ingiltere") || city.includes("united kingdom") || city.includes("gbr")) {
    currencyCode = "GBP";
    currencyName = "İngiliz Sterlini";
    symbol = "£";
    fallbackRate = 50.45;
  } else if (code === "MOW" || city.includes("moskova") || city.includes("rusya") || city.includes("rus") || city.includes("rub")) {
    currencyCode = "RUB";
    currencyName = "Rus Rublesi";
    symbol = "₽";
    fallbackRate = 0.39;
  } else if (city.includes("paris") || city.includes("frankfurt") || city.includes("berlin") || city.includes("roma") || city.includes("amsterdam") || city.includes("almanya") || city.includes("fransa") || code === "CDG" || code === "FRA") {
    currencyCode = "EUR";
    currencyName = "Euro";
    symbol = "€";
    fallbackRate = 42.20;
  } else if (city.includes("new york") || city.includes("miami") || city.includes("los angeles") || city.includes("amerika") || city.includes("abd") || city.includes("usa") || code === "JFK" || code === "LAX") {
    currencyCode = "USD";
    currencyName = "Amerikan Doları";
    symbol = "$";
    fallbackRate = 38.85;
  }

  let rate = fallbackRate;
  
  if (currencyCode === "TRY") {
    let usdRate = 38.85;
    if (liveRates && liveRates["USD"]) {
      const apiUsdRate = 1 / liveRates["USD"];
      if (apiUsdRate > 0 && !isNaN(apiUsdRate)) {
        usdRate = Math.round(apiUsdRate * 100) / 100;
      }
    }
    return {
      fromCurrency: "TRY",
      toCurrency: "TRY",
      currencyName: "Türk Lirası",
      symbol: "₺",
      rate: 1.0,
      inverseRate: 1.0,
      trend: "stable",
      isDomestic: true,
      terminalUsdRate: usdRate // terminal convenience USD tracking for duty free shopping
    };
  }

  if (liveRates && liveRates[currencyCode]) {
    const apiRate = 1 / liveRates[currencyCode];
    if (apiRate > 0 && !isNaN(apiRate)) {
      rate = Math.round(apiRate * 100) / 100;
    }
  }

  return {
    fromCurrency: "TRY",
    toCurrency: currencyCode,
    currencyName,
    symbol,
    rate,
    inverseRate: Math.round((1 / rate) * 10000) / 10000,
    trend: rate > fallbackRate ? "up" : rate < fallbackRate ? "down" : "stable",
    isDomestic: false
  };
}

// Endpoint to expose exchange rate information cleanly to frontends
app.get("/api/currency/rate", async (req, res) => {
  const toCity = req.query.toCity as string || "Londra";
  const toCode = req.query.to as string || "LHR";
  
  const liveRates = await getLiveRates();
  const info = getCurrencyInfo(toCity, toCode, liveRates || undefined);
  res.json(info);
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
    
    // Fetch live currency rates and construct currency info for the destination city/airport code
    const liveRates = await getLiveRates();
    const currencyInfo = getCurrencyInfo(flight.toCity, flight.to, liveRates || undefined);
    
    const currencyStr = currencyInfo.isDomestic 
      ? `Yurt içi seyahat. Türk Lirası (TRY) geçerli. Terminal içi lüks ve duty free harcamaları için güncel Amerikan Doları (USD) referans kuru: 1 USD = ${currencyInfo.terminalUsdRate} TRY.` 
      : `Varış Yeri Para Birimi: ${currencyInfo.currencyName} (${currencyInfo.toCurrency}, Sembol: ${currencyInfo.symbol}). Güncel Döviz Kuru: 1 ${currencyInfo.toCurrency} = ${currencyInfo.rate} TRY (1 TRY = ${currencyInfo.inverseRate} ${currencyInfo.toCurrency}).`;

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
      - FİNANSAL / DÖVİZ BİLGİSİ: ${currencyStr}
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
      5. Döviz/Kur Soruları & Rehberliği: Yolcu seyahat bütçesi, yerel harcamalar veya döviz kurunu sorarsa, yukarıda belirtilen ${currencyInfo.isDomestic ? "ek USD kurunu" : `${currencyInfo.toCurrency} kurunu (1 ${currencyInfo.toCurrency} = ${currencyInfo.rate} TRY)`} tam sayısal değeriyle vererek proaktif öneriler sun (örneğin döviz bürolarının komisyonları yerine havalimanı dışı ATM kullanımı, bütçeleme vb.).
      6. Cevapların kısa, mobil telefonda kolayca okunabilecek şekilde (maksimum 3-4 paragraflık, listeli, temiz Markdown) olsun.
      
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
