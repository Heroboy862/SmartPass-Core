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

// Helper to convert Julian Date to Gregorian Month Day format for 2026
export function convertJulianDate(julianStr: string): string {
  const dayNum = parseInt(julianStr, 10);
  if (isNaN(dayNum) || dayNum < 1 || dayNum > 366) {
    return "Bilinmiyor";
  }
  
  // Non-leap year 2026 months cumulative days
  const daysInMonths = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  const monthNames = [
    "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", 
    "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"
  ];
  
  let currentDays = 0;
  for (let i = 0; i < 12; i++) {
    if (dayNum <= currentDays + daysInMonths[i]) {
      const dayOfMonth = dayNum - currentDays;
      return `${dayOfMonth} ${monthNames[i]}`;
    }
    currentDays += daysInMonths[i];
  }
  return "Bilinmiyor";
}

// Helper to resolve Cabin Class and Boarding Group based on IATA compartment code
export function getCabinInfo(cabinChar: string): { name: string, group: string } {
  const char = (cabinChar || "Y").toUpperCase();
  if (["F", "A", "P"].includes(char)) {
    return { name: "First Class (Birinci Sınıf)", group: "Group A (Öncelikli Biniş)" };
  }
  if (["C", "J", "D", "I", "Z"].includes(char)) {
    return { name: "Business Class (İş Sınıfı)", group: "Group A (Öncelikli Biniş)" };
  }
  if (["W", "E"].includes(char)) {
    return { name: "Premium Economy (Premium Ekonomi)", group: "Group B (Ekonomi Sınıfı)" };
  }
  return { name: "Economy Class (Ekonomi Sınıfı)", group: "Group B (Ekonomi Sınıfı)" };
}

// Helper to remove any leading zeros from the numeric part of the seat code
export function formatSeatNumber(rawSeat: string): string {
  const cleaned = (rawSeat || "").trim().toUpperCase();
  if (!cleaned) return "15E"; 
  const match = cleaned.match(/^0*(\d+[A-Z])$/);
  if (match) {
    return match[1];
  }
  return cleaned;
}

// Helper function to extract and parse IATA BCBP or map pre-defined flight patterns
export function parseBoardingPassText(rawText: string): { flightId?: string, custom: boolean, data?: any } {
  if (!rawText) {
    return { custom: false, flightId: "TK1903" };
  }
  
  const uppercaseRaw = rawText.toUpperCase();
  const hasIataPrefix = uppercaseRaw.startsWith("M") || uppercaseRaw.startsWith("S");
  if (!hasIataPrefix) {
    if (uppercaseRaw.includes("TK1903") || uppercaseRaw.includes("TK-1903") || uppercaseRaw.includes("SELIM")) {
      return { flightId: "TK1903", custom: false };
    } else if (uppercaseRaw.includes("PC2026") || uppercaseRaw.includes("PC-2026") || uppercaseRaw.includes("ELIF")) {
      return { flightId: "PC2026", custom: false };
    } else if (uppercaseRaw.includes("TK2108") || uppercaseRaw.includes("TK-2108") || uppercaseRaw.includes("DMITRY")) {
      return { flightId: "TK2108", custom: false };
    } else if (uppercaseRaw.includes("AJ4112") || uppercaseRaw.includes("AJ-4112") || uppercaseRaw.includes("CAN")) {
      return { flightId: "AJ4112", custom: false };
    }
  }

  // Attempt IATA BCBP Standard 792 parsing
  if (hasIataPrefix) {
    let passengerName = "";
    let pnr = "";
    let from = "IST";
    let to = "LHR";
    let carrier = "TK";
    let flightNum = "1903";
    let julianDate = "120";
    let cabinClass = "Y";
    let seat = "15E";
    let sequenceNumber = "0001";

    // Strict fixed-width column parse criteria (Standard IATA 792 has size >= 58 with E-ticket sign)
    if (rawText.length >= 58 && !rawText.includes("  ") && rawText[22] === "E") {
      passengerName = rawText.substring(2, 22).replace("/", " ").trim();
      pnr = rawText.substring(23, 30).trim();
      from = rawText.substring(30, 33).trim();
      to = rawText.substring(33, 36).trim();
      carrier = rawText.substring(36, 39).trim();
      flightNum = rawText.substring(39, 44).trim();
      julianDate = rawText.substring(44, 47).trim();
      cabinClass = rawText[47] || "Y";
      seat = rawText.substring(48, 52).trim();
      sequenceNumber = rawText.substring(52, 57).trim();
    } else {
      // Loose & context-aware regex-token matching for non-padded or semi-padded strings
      const nameMatch = rawText.match(/M[1-4]([A-Z\s\/]{2,20}?)(\s+E|E\s+|\s+E\s+|\bE\b)/i) || rawText.match(/M[1-4]([A-Z\/\s]+?)(?=\s[A-Z0-9]{7}\s|$)/i);
      if (nameMatch) {
         passengerName = nameMatch[1].replace("/", " ").trim();
      } else {
         const simpleName = rawText.match(/M[1-4]([A-Z\/]+)/i);
         passengerName = simpleName ? simpleName[1].replace("/", " ").trim() : "YOLCU";
      }

      const pnrMatch = rawText.match(/(?:E\s+([A-Z0-9]{6,7})|\b([A-Z0-9]{7})\b)/i);
      if (pnrMatch) {
         pnr = (pnrMatch[1] || pnrMatch[2]).trim();
      } else {
         pnr = "ABC1234";
      }

      const routeMatch = rawText.match(/([A-Z]{3})([A-Z]{3})([A-Z]{2})\s*([0-9]{3,5})/i);
      if (routeMatch) {
         from = routeMatch[1];
         to = routeMatch[2];
         carrier = routeMatch[3];
         flightNum = routeMatch[4];
      }

      // Check details sequence like 120Y012A0001
      const detailsMatch = rawText.match(/([0-9]{3})([A-Z])([0-9]{3}[A-Z]|[0-9]{2}[A-Z])([0-9]{4,5})/i);
      if (detailsMatch) {
         julianDate = detailsMatch[1];
         cabinClass = detailsMatch[2];
         seat = detailsMatch[3];
         sequenceNumber = detailsMatch[4];
      } else {
         // Separate fallback matcher
         const julianMatch = rawText.match(/\s([0-9]{3})(Y|C|F|W)\b/i);
         if (julianMatch) {
            julianDate = julianMatch[1];
            cabinClass = julianMatch[2];
         }
         const seatSeqMatch = rawText.match(/(Y|C|F|W)([0-9]{2,3}[A-Z])([0-9]{3,5})/i);
         if (seatSeqMatch) {
            cabinClass = seatSeqMatch[1];
            seat = seatSeqMatch[2];
            sequenceNumber = seatSeqMatch[3];
         }
      }
    }

    // Sanitize values
    passengerName = passengerName.replace(/\s+/g, " ").trim();
    if (passengerName.endsWith(" E")) {
       passengerName = passengerName.substring(0, passengerName.length - 2).trim();
    }

    const cleanedSeat = formatSeatNumber(seat);
    const flightFormatted = `${carrier.toUpperCase()}-${parseInt(flightNum, 10)}`;
    const resolvedOperator = from.toUpperCase() === "IST" ? "İGA" : from.toUpperCase() === "SAW" ? "HEAŞ" : "DHMİ";
    const cabinInfo = getCabinInfo(cabinClass);
    const julianDateFormatted = convertJulianDate(julianDate);

    let resolvedAirline = "Özel Taşıyıcı";
    if (carrier.toUpperCase() === "TK") resolvedAirline = "Turkish Airlines";
    else if (carrier.toUpperCase() === "PC") resolvedAirline = "Pegasus Airlines";
    else if (carrier.toUpperCase() === "AJ") resolvedAirline = "Ajet Airlines";

    const getCityName = (code: string) => {
      const c = code.toUpperCase();
      if (c === "IST") return "İstanbul";
      if (c === "SAW") return "Sabiha Gökçen";
      if (c === "LHR") return "Londra";
      if (c === "ADB") return "İzmir";
      if (c === "CDG") return "Paris";
      if (c === "MOW") return "Moskova";
      if (c === "JFK") return "New York";
      return "Yerel Havalimanı";
    };

    const parsedData = {
      passengerName,
      pnr: pnr.toUpperCase(),
      flightNumber: flightFormatted,
      from: from.toUpperCase(),
      fromCity: getCityName(from),
      to: to.toUpperCase(),
      toCity: getCityName(to),
      gate: "A-01",
      seat: cleanedSeat,
      sequenceNumber: parseInt(sequenceNumber, 10).toString(),
      cabinClass: cabinInfo.name,
      group: cabinInfo.group === "Group A (Öncelikli Biniş)" ? "A" : "B",
      julianDateRaw: julianDate,
      julianDateFormatted,
      biometricVerified: true,
      boardingStatus: "Waiting",
      boardingProgress: 30,
      estimatedWalkTime: "5 dk",
      airline: resolvedAirline,
      airportOperator: resolvedOperator,
      departureTime: "22:45",
      securityQueueTime: 15,
      isIataStandard: true
    };

    return { custom: true, data: parsedData };
  }

  return { flightId: "TK1903", custom: false };
}

// Main parsing and database retrieval endpoint
app.post("/api/parse-boarding-pass", async (req, res) => {
  const { rawText } = req.body;
  if (!rawText) {
    return res.status(400).json({ error: "No code or string provided." });
  }

  const parseResult = parseBoardingPassText(rawText);

  if (parseResult.custom && parseResult.data) {
    const parsedData = parseResult.data;
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

  const flightId = parseResult.flightId || "TK1903";

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

export function getCurrencyInfo(toCity: string, toCode: string, liveRates?: Record<string, number>) {
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

// Rule-based fallback response engine (Plan B)
// Triggered automatically when the Gemini API is offline, quota is exceeded, or the API key is not configured.
export function getRuleBasedFallbackResponse(userMessage: string, flight: any, currencyInfo: any): string {
  const query = (userMessage || "").trim().toLowerCase();
  
  // 1. CURRENCY / DÖVİZ / BÜTÇE
  if (query.match(/(kur|döviz|para|lira|tl|sterlin|euro|dolar|ruble|bütçe|currency|money|price|fiyat|exchange|bozdur)/i)) {
    if (currencyInfo.isDomestic) {
      return `### 🪙 Havalimanı Finansal Rehberi (Yurt İçi Sefer)
Sistem verilerine göre seyahat edeceğiniz **${flight.toCity}** yurt içi sınırlarında yer aldığı için geçerli para biriminiz **Türk Lirası (TRY)**'dir.

**💡 Duty-Free & Lüks Alışveriş İpucu:**
Terminal içerisindeki bazı lüks mağazalar ve Duty-Free reyonları fiyatlarını döviz bazlı listeliyor olabilir. Sistemimizdeki güncel referans Amerikan Doları (USD) kuru:
*   **1 USD = ${currencyInfo.terminalUsdRate} TRY**
*   **1 TRY = ${Math.round((1 / currencyInfo.terminalUsdRate) * 10000) / 10000} USD**

**💰 Asistan Önerisi:**
*   Havalimanı içindeki lüks mağazalarda ödeme yaparken kredi kartınızın yerel para biriminde (TRY) çekilmesini talep ederek komisyon kayıplarını minimuma indirebilirsiniz.`;
    } else {
      return `### 🪙 Havalimanı Finansal Rehberi (Uluslararası Sefer)
Uçuş yapacağınız **${flight.toCity}** için yerel para birimi bilgileri ve canlı döviz kurları başarıyla eşitlendi:

*   **Para Birimi:** ${currencyInfo.currencyName} (${currencyInfo.toCurrency})
*   **Sembol:** \`${currencyInfo.symbol}\`
*   **Satış Kuru:** **1 ${currencyInfo.toCurrency} = ${currencyInfo.rate} TRY**
*   **Alış Kuru:** **1 TRY = ${currencyInfo.inverseRate} ${currencyInfo.toCurrency}**
*   **Kur Eğilimi:** ${currencyInfo.trend === "up" ? "📈 Yukarı Yönlü (TRY karşısında güçleniyor)" : currencyInfo.trend === "down" ? "📉 Aşağı Yönlü (TRY karşısında hafif gerileme)" : "↔️ Stabil seyrediyor"}

**💡 Akıllı Seyahat Bütçe Önerileri:**
1.  **Döviz Bürosu Komisyonu:** Havalimanı içerisindeki fiziki döviz büroları yüksek komisyon uygulayabilir. Nakit ihtiyacınız için havalimanı dışındaki yerel banka ATM'lerini komisyonsuz veya düşük ücretli seyahat kartları ile kullanmanız önerilir.
2.  **Kartla Ödeme:** Gittiğiniz ülkede POS cihazlarında ödeme yaparken her zaman yerel para birimini (**${currencyInfo.toCurrency}**) seçin. "Dinamik Para Birimi Çevrimi (DCC)" sistemleri genellikle zararlıdır.`;
    }
  }

  // 2. BOARDING STATUS / DELAY / CANCELLATION / PASSENGER RIGHTS (SHY)
  if (query.match(/(rötar|gecikme|iptal|delayed|cancelled|boarding|saat|uçuş|uçak|sefer|gecikti|shgm|shy|tazminat|iade|bilet|haklarım|haklarim)/i)) {
    const status = flight.boardingStatus;
    let mainStatusText = "";
    let actionRecommendation = "";
    
    if (status === "Delayed") {
      mainStatusText = `Uçuşunuzda **RÖTAR (Gecikme)** durumu bildirilmiştir. Güvenlik ve kapı durumlarınızı bu yeni biniş saatine göre yönetebilirsiniz.`;
      actionRecommendation = `*   **Uzak Mesafe:** ${flight.estimatedWalkTime} uzağınızdaki **Gate ${flight.gate}** kapısına gitmeden önce havalimanı danışma ekranlarından yeni saati teyit edin.
*   **SHY Yolcu Hakları (Gecikme Durumu):** 2 saati aşan gecikmelerde havayolu şirketi size sıcak/soğuk içecekler ve hafif yiyecek ikramı sunmakla yükümlüdür. Gecikme süresi arttıkça ücretsiz haberleşme ve telefon hakkı isteyebilirsiniz.`;
    } else if (status === "Cancelled") {
      mainStatusText = `🚨 **Uçuşunuz Maalesef İPTAL Edilmiştir.** Operasyonel veya meteorolojik nedenlerle uçuşunuz askıya alındı.`;
      actionRecommendation = `*   **SHY Yolcu Hakları (İptal Durumu):** Sivil Havacılık Genel Müdürlüğü SHY-YOLCU yönetmeliği uyarınca, iptal edilen uçuşlar için havayolu size:
    1.  Bilet ücretinin **tam iadesini** veya,
    2.  En yakın tarihte ücretsiz **alternatif seferle seyahat** hakkı sunmak zorundadır.
    3.  Ayrıca tazminat limitleri çerçevesinde ek haklarınız doğabilir.
*   **Sıradaki Adım:** Derhal ilgili havayolu şirketinin (örneğin **${flight.airline}**) satış ofisine veya transfer bankosuna bizzat müracaat ederek alternatif uçuş rezervasyonunuzu gerçekleştirin.`;
    } else {
      mainStatusText = `Uçuşunuz şu anda **Normal Akışında (Status: ${status})** görünüyor. Herhangi bir rötar veya iptal uyarısı bulunmamaktadır.`;
      actionRecommendation = `*   Uçuş saatiniz yaklaştığı için **Gate ${flight.gate}** numaralı kapıya tahmini **${flight.estimatedWalkTime}** içinde ulaşacak şekilde planınızı yapın.
*   Biyometrik doğrulamanız **${flight.biometricVerified ? "tamamlanmıştır" : "eksiktir, lütfen yetkililerden destek alın"}**.`;
    }

    return `### ✈️ Uçuş Durumu ve Sivil Havacılık Yolcu Hakları
Mevcut uçuş verilerinizin ve statünün analizi:

*   **Güncel Biniş Durumu:** \`${status}\`
*   **Uçuş No:** **${flight.flightNumber}** (${flight.airline})
*   **Uçuş Hattı:** ${flight.from} -> ${flight.to}

${mainStatusText}

**📋 Ne Yapmalısınız? (Öneriler):**
${actionRecommendation}
*   **Müşteri Hizmetleri:** Detaylı bilet işlemleri veya tazminat süreçleri için havayolunun çağrı merkezini arayabilirsiniz.`;
  }

  // 3. GATE / WALK TIME
  if (query.match(/(kapı|kapısı|gate|yürüme|nerede|nasıl giderim|uzaklık|mesafe|harita|biyometrik|smart id|smartpass)/i)) {
    return `### 🚶 Kapı ve Akıllı Geçiş Rehberi
Uçağınızın kalkış kapısı ve kapıya ulaşım detaylarınız canlı olarak haritalandırılmıştır:

*   **Kalkış Kapısı:** **Gate ${flight.gate}**
*   **Yürüme Süresi:** Tahmini **${flight.estimatedWalkTime}** (Yavaş yürüyüş hızıyla)
*   **Biyometrik Kimlik (Smart ID):** ${flight.biometricVerified ? "✅ Başarıyla Doğrulandı (Biyometrik geçiş kapılarını sıra beklemeden kullanabilirsiniz)" : "⚠️ Doğrulanmadı (Klasik pasaport ve kimlik kontrolünden geçmeniz gerekecektir)"}

**💡 AeroAI Akıllı Tavsiyesi:**
*   Havalimanı içindeki tüm yönlendirmeler dijital harita modülümüzde entegredir. Ekranın üst kısmındaki **"Terminal Haritası"** butonunu tıklayarak kapıya giden engelsiz rotayı interaktif olarak inceleyebilirsiniz.`;
  }

  // 4. TRANSFERS / TRANSPORT / SHUTTLES
  if (query.match(/(ulaşım|otobüs|shuttle|havaist|havaş|nasıl giderim|binerim|peron|transfer|metro|tren|tramvay)/i)) {
    return `### 🚌 Entegre Havalimanı Karayolu ve Sefer Entegrasyonu
Terminalden şehir merkezine veya çevre illere transfer planı:

*   **Kalkış Bölgesi:** ${flight.fromCity} (${flight.from})
*   **Önerilen Entegre Hat:** Bulunduğunuz konuma veya yolcu tercihlerine uygun tüm ulusal hat tarifeleri (HAVAİST, HAVAŞ vb.) seyahat asistanımızın alt kısmındaki **"Sefer Tarife Cetveli"** kartına entegre edilmiştir. 

**💡 Yolcu Önerisi:**
*   Aktif bölgenizi seçerek sonraki sefer saatlerini ve durak planlarını gerçek zamanlı inceleyebilirsiniz. İnternetin kısıtlı veya kapalı olduğu anlarda dahi saat kurguları ve peron yerleşimi yerel bellekte tutulmaktadır.`;
  }

  // 5. SECURITY & QUEUE
  if (query.match(/(güvenlik|kuyruk|sıra|pasaport|bekleme|screening|security)/i)) {
    return `### 🛡️ Güvenlik ve Pasaport Arındırılmış Alan Analizi
Mevcut güvenlik kontrol noktası verileri:

*   **Ortalama Bekleme Süresi:** **${flight.securityQueueTime} Dakika**
*   **Hattın Yoğunluk Durumu:** ${flight.securityQueueTime > 20 ? "🔴 Yoğun (Lütfen işlemlerinizi tamamlamak için kapılara erken ilerleyin)" : "🟢 Akıcı (Standart kontroller sorunsuz ilerlemektedir)"}

**💡 Zaman Yönetimi Önerisi:**
*   Biyometrik doğrulama (**Smart ID**) sayesinde biyometrik onaylı hızlı geçiş şeritlerinden saniyeler içinde geçerek klasik kuyrukları bypass edebilirsiniz. Biyometrik statünüz: **${flight.biometricVerified ? "AKTİF" : "PASİF"}**.`;
  }

  // DEFAULT CHATBOT RESPONSE
  return `### 👋 Merhaba! Ben SmartPass Seyahat Asistanınız AeroAI
Sistemimiz şu anda **Plan B (Yapay Zeka Destekli Güvenli Çevrimdışı / Statik Yardımcı)** modunda kesintisiz hizmet vermektedir. İnternet kesintileri, sunucu kotası dolulukları veya API anahtarı yokluğundan etkilenmeden uçuş verileriniz üzerinden en doğru yönlendirmeleri sağlıyorum.

Yolcumuz **Sayın ${flight.passengerName}** için aktif uçuş özet bilgileri:
*   ✈️ **Uçuşunuz:** ${flight.flightNumber} (${flight.airline}) numaralı seyahat ${flight.from} -> ${flight.to}
*   💺 **Koltuk & Kapı:** Koltuk ${flight.seat} (Grup ${flight.group}) | **Gate ${flight.gate}** (${flight.estimatedWalkTime} yürüyüş mesafesinde)
*   ⏳ **Biniş Durumu:** \`${flight.boardingStatus}\`
*   🛡️ **Güvenlik Sırası Bekleme Süresi:** ${flight.securityQueueTime} dakika
*   🪙 **Varış Para Birimi:** ${currencyInfo.currencyName} (${currencyInfo.symbol}) ve kurları yerel belleğimizde hazırdır.

**Size nasıl yardımcı olabilirim?** Aşağıdaki konular hakkında bana dilediğiniz gibi soru sorabilirsiniz:
*   *Döviz kurları, seyahat bütçeleme ve lüks alışveriş,*
*   *Gecikme (Rötar) veya İptal durumunda haklarınız (SHY),*
*   *Havalimanı ulaşım, metro, Havaş/Havaist peronları,*
*   *Güvenlik kontrolü bekleme süreleri ve kapı haritası.*`;
}

// AI Travel Assistant chat using Gemini 3.5-Flash
app.post("/api/assistant/chat", async (req, res) => {
  const { messages, flightData } = req.body;

  // Fallback if AI SDK is not present or error is encountered
  if (!ai) {
    try {
      const flight = flightData || MOCK_BOARDINGS["TK1903"];
      const liveRates = await getLiveRates();
      const currencyInfo = getCurrencyInfo(flight.toCity, flight.to, liveRates || undefined);
      const lastUserMessage = messages && messages.length > 0 ? messages[messages.length - 1].text : "";
      const text = getRuleBasedFallbackResponse(lastUserMessage, flight, currencyInfo);
      return res.status(200).json({ text });
    } catch (fallbackErr: any) {
      console.error("Critical fallback failure inside !ai condition:", fallbackErr);
      return res.status(200).json({
        text: "AeroAI seyahat asistanı şu anda güvence modu kapsamında sınırlı yanıtlar üretiyor. Lütfen uçağınızın kapı ekranlarını takip ediniz."
      });
    }
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
    console.error("Gemini Assistant Failure, falling back to Plan B:", error);
    try {
      const flight = flightData || MOCK_BOARDINGS["TK1903"];
      const liveRates = await getLiveRates();
      const currencyInfo = getCurrencyInfo(flight.toCity, flight.to, liveRates || undefined);
      const lastUserMessage = messages && messages.length > 0 ? messages[messages.length - 1].text : "";
      const text = getRuleBasedFallbackResponse(lastUserMessage, flight, currencyInfo);
      return res.status(200).json({ text });
    } catch (fallbackError: any) {
      console.error("Plan B Fallback encountered fatal error:", fallbackError);
      res.status(200).json({
        text: "AeroAI geçici hizmet kesintisi nedeniyle kısıtlı moddadır. Lütfen kapı yönlendirmelerini takip ediniz."
      });
    }
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

if (process.env.NODE_ENV !== "test") {
  startServer();
}
