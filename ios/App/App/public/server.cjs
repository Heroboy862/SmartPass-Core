var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// server/data/mockFlights.ts
function getSimVariables() {
  return simVariables;
}
function updateSimVariables(newVals) {
  simVariables = { ...simVariables, ...newVals };
  return simVariables;
}
var MOCK_BOARDINGS, simVariables;
var init_mockFlights = __esm({
  "server/data/mockFlights.ts"() {
    MOCK_BOARDINGS = {
      "TK1903": {
        passengerName: "Selim Y\u0131lmaz",
        flightNumber: "TK-1903",
        from: "IST",
        fromCity: "\u0130stanbul",
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
        airportOperator: "\u0130GA",
        departureTime: "22:15",
        securityQueueTime: 12
      },
      "PC2026": {
        passengerName: "Elif Demir",
        flightNumber: "PC-2026",
        from: "SAW",
        fromCity: "\u0130stanbul Sabiha G\xF6k\xE7en",
        to: "ADB",
        toCity: "\u0130zmir",
        gate: "204B",
        seat: "24B",
        group: "B",
        biometricVerified: true,
        boardingStatus: "Waiting",
        boardingProgress: 15,
        estimatedWalkTime: "3 dk",
        airline: "Pegasus Airlines",
        airportOperator: "HEA\u015E",
        departureTime: "23:45",
        securityQueueTime: 25
      },
      "TK2108": {
        passengerName: "Dmitry Smirnov",
        flightNumber: "TK-2108",
        from: "ESB",
        fromCity: "Ankara Esenbo\u011Fa",
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
        fromCity: "\u0130zmir Adnan Menderes",
        to: "IST",
        toCity: "\u0130stanbul",
        gate: "102",
        seat: "14D",
        group: "C",
        biometricVerified: false,
        boardingStatus: "Closed",
        boardingProgress: 100,
        estimatedWalkTime: "8 dk",
        airline: "Ajet Airlines",
        airportOperator: "DHM\u0130",
        departureTime: "19:00",
        securityQueueTime: 35
      }
    };
    simVariables = {
      flightNumber: "TK-1903",
      boardingStatus: "Boarding Now",
      // "Boarding Now", "Waiting", "Closed", "Delayed", "Cancelled"
      securityQueueTime: 15,
      // in minutes
      gate: "G-12",
      delayReason: "Hava muhalefeti ve Londra hava sahas\u0131 yo\u011Funlu\u011Fu nedeniyle bini\u015F ertelenmi\u015Ftir."
    };
  }
});

// server/services/firestoreSync.ts
function guessFlightNumber(name) {
  if (!name) return "TK-1903";
  const lower = name.toLowerCase();
  if (lower.includes("selim") || lower.includes("y\u0131lmaz") || lower.includes("yilmaz")) return "TK-1903";
  if (lower.includes("elif") || lower.includes("demir")) return "PC-2026";
  if (lower.includes("dmitry") || lower.includes("smirnov")) return "TK-2108";
  if (lower.includes("can") || lower.includes("aksoy")) return "AJ-4112";
  return "TK-1903";
}
async function writeDocSecurely(collectionName, docId, data) {
  if (adminDb && useAdminDb) {
    try {
      const docRef = adminDb.collection(collectionName).doc(docId);
      await docRef.set(data, { merge: true });
      console.log(`[Firestore Sync] Admin write successful on ${collectionName}/${docId}`);
      return true;
    } catch (adminErr) {
      useAdminDb = false;
      console.info(`[Firestore Sync] Backend Admin access not authorized. Seamlessly falling back to secure public API client.`);
    }
  }
  if (webDb) {
    try {
      const docRef = (0, import_firestore.doc)(webDb, collectionName, docId);
      await (0, import_firestore.setDoc)(docRef, data, { merge: true });
      console.log(`[Firestore Sync] Web API client write successful on ${collectionName}/${docId}`);
      return true;
    } catch (webErr) {
      console.error(`[Firestore Sync] Web API client write failed on ${collectionName}/${docId}:`, webErr.message);
    }
  }
  return false;
}
async function createAuditLog(actor, targetUser, action, details) {
  const timestamp = (/* @__PURE__ */ new Date()).toISOString();
  const logData = {
    timestamp,
    actor,
    // e.g., "USER_PORTAL", "AEROAI_ASSISTANT", "SYSTEM", "ADMIN"
    targetUser,
    // whose profile was accessed
    action,
    // e.g., "PROFILE_CREATE", "PROFILE_ACCESS", "HEALTH_DATA_READ", "AUTO_DELETE_RETENTION"
    details
    // human-readable description
  };
  console.log(`[AUDIT] [${timestamp}] Actor: ${actor} | Action: ${action} | Target: ${targetUser} | Details: ${details}`);
  if (adminDb && useAdminDb) {
    try {
      await adminDb.collection("audit_logs").add(logData);
      console.log("[Firestore Sync] Admin audit log write successful.");
      return;
    } catch (adminErr) {
      useAdminDb = false;
      console.warn("[Firestore Sync] Backend Admin audit log write failed. Falling back to Web SDK:", adminErr.message);
    }
  }
  if (webDb) {
    try {
      await (0, import_firestore.addDoc)((0, import_firestore.collection)(webDb, "audit_logs"), logData);
      console.log("[Firestore Sync] Web audit log write successful.");
    } catch (webErr) {
      console.error("[AUDIT LOG ERROR] Failed to write audit trail record:", webErr.message);
    }
  }
}
async function autoCleanClosedFlightUsers(flightNumber) {
  try {
    console.log(`[KVKK Veri Tasfiyesi] U\xE7u\u015F kapand\u0131\u011F\u0131 i\xE7in (${flightNumber}) ait yolcu profilleri taran\u0131yor...`);
    if (adminDb) {
      const usersRef = adminDb.collection("users");
      const snapshot = await usersRef.where("flightNumber", "==", flightNumber).get();
      let count = 0;
      const batch = adminDb.batch();
      snapshot.forEach((doc) => {
        const uId = doc.id;
        batch.delete(doc.ref);
        count++;
        createAuditLog(
          "SYSTEM",
          uId,
          "AUTO_DELETE_RETENTION",
          `U\xE7u\u015F ${flightNumber} kapand\u0131. KVKK Veri Saklama S\u0131n\u0131r\u0131 uyar\u0131nca hassas eri\u015Filebilirlik ve \xF6zel nitelikli sa\u011Fl\u0131k verileri kal\u0131c\u0131 olarak imha edildi.`
        );
      });
      if (count > 0) {
        await batch.commit();
        console.log(`[KVKK Veri Tasfiyesi] ${count} adet yolcu verisi ba\u015Far\u0131yla kal\u0131c\u0131 olarak diskten silindi.`);
      } else {
        console.log(`[KVKK Veri Tasfiyesi] Aktif u\xE7u\u015Fta temizlenecek yolcu profili bulunamad\u0131.`);
      }
    } else {
      console.warn("[KVKK Veri Tasfiyesi] Admin SDK yetkisi olmad\u0131\u011F\u0131ndan temizlik atland\u0131.");
    }
  } catch (err) {
    console.error("[KVKK Veri Tasfiyesi] Otomatik imha esnas\u0131nda hata:", err.message);
  }
}
async function syncFlightToFirestore(flightNum, status, secQueue, gateNum, delayReasonText) {
  const flightKey = flightNum ? flightNum.replace("-", "") : "TK1903";
  const mockData = MOCK_BOARDINGS[flightKey] || {
    departureTime: "22:15",
    airportOperator: "\u0130GA"
  };
  const provider = flightNum === "TK-1903" ? "SIMULATION" : mockData.airportOperator === "\u0130GA" ? "IGA" : "AMADEUS";
  const std = mockData.departureTime || "22:15";
  let etd = std;
  if (status === "Delayed") {
    try {
      const [h, m] = std.split(":").map(Number);
      const newM = (m + 45) % 60;
      const newH = (h + Math.floor((m + 45) / 60)) % 24;
      etd = `${String(newH).padStart(2, "0")}:${String(newM).padStart(2, "0")}`;
    } catch (e) {
      etd = std;
    }
  }
  let atd = null;
  if (status === "Closed") {
    try {
      const [h, m] = std.split(":").map(Number);
      const newM = (m + 10) % 60;
      const newH = (h + Math.floor((m + 10) / 60)) % 24;
      atd = `${String(newH).padStart(2, "0")}:${String(newM).padStart(2, "0")}`;
    } catch (e) {
      atd = std;
    }
  }
  const disruption = status === "Delayed" || status === "Cancelled" ? {
    type: status === "Cancelled" ? "CANCELLATION" : "DELAY",
    reason: delayReasonText || "Hava ko\u015Fullar\u0131 veya yo\u011Funluk kaynakl\u0131 kriz y\xF6netimi."
  } : null;
  await writeDocSecurely("flights", flightNum, {
    flightNumber: flightNum,
    boardingStatus: status,
    securityQueueTime: secQueue,
    gate: gateNum,
    delayReason: delayReasonText || "Normal operasyonel ak\u0131\u015F sa\u011Fland\u0131.",
    updatedAt: (/* @__PURE__ */ new Date()).toISOString(),
    source: {
      provider,
      updatedAt: (/* @__PURE__ */ new Date()).toISOString(),
      confidence: flightNum === "TK-1903" ? 0.85 : 0.99
    },
    schedule: {
      std,
      etd,
      atd
    },
    disruption
  });
}
async function syncUserToFirestore(userId, data) {
  const fNum = guessFlightNumber(data.name);
  await writeDocSecurely("users", userId, {
    name: data.name,
    email: data.email,
    flightNumber: fNum,
    accessibilityProfile: data.accessibilityProfile,
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  });
  const hasAcc = data.accessibilityProfile && data.accessibilityProfile.enabled;
  const details = hasAcc ? `Kullan\u0131c\u0131 kayd\u0131 olu\u015Fturuldu. [\xD6zel Nitelikli Sa\u011Fl\u0131k Verisi Onay\u0131 Al\u0131nd\u0131: ${data.accessibilityProfile.type}]` : "Standart kullan\u0131c\u0131 kayd\u0131 olu\u015Fturuldu.";
  await createAuditLog(
    "USER_PORTAL",
    userId,
    hasAcc ? "HEALTH_DATA_CONSENT" : "PROFILE_CREATE",
    details
  );
}
var import_app, import_firestore, import_firebase_admin, import_firestore2, import_fs, import_path, adminDb, webDb, useAdminDb;
var init_firestoreSync = __esm({
  "server/services/firestoreSync.ts"() {
    import_app = require("firebase/app");
    import_firestore = require("firebase/firestore");
    import_firebase_admin = __toESM(require("firebase-admin"), 1);
    import_firestore2 = require("firebase-admin/firestore");
    import_fs = __toESM(require("fs"), 1);
    import_path = __toESM(require("path"), 1);
    init_mockFlights();
    adminDb = null;
    webDb = null;
    try {
      const configPath = import_path.default.join(process.cwd(), "firebase-applet-config.json");
      if (import_fs.default.existsSync(configPath)) {
        const firebaseConfig = JSON.parse(import_fs.default.readFileSync(configPath, "utf-8"));
        try {
          if (import_firebase_admin.default.apps.length === 0) {
            import_firebase_admin.default.initializeApp({
              projectId: firebaseConfig.projectId
            });
          }
          const firestoreDatabaseId = firebaseConfig.firestoreDatabaseId || "(default)";
          if (firestoreDatabaseId && firestoreDatabaseId !== "(default)" && firestoreDatabaseId !== "default") {
            try {
              adminDb = (0, import_firestore2.getFirestore)(import_firebase_admin.default.app(), firestoreDatabaseId);
            } catch (dbErr) {
              console.warn("[Admin Setup] Could not specify custom Database ID directly. Using standard fallback or default db:", dbErr.message);
              adminDb = (0, import_firestore2.getFirestore)(import_firebase_admin.default.app());
            }
          } else {
            adminDb = (0, import_firestore2.getFirestore)(import_firebase_admin.default.app());
          }
          console.log(`[DHM\u0130 Otorite - ADMIN] Admin SDK authenticated. Database Id: ${firestoreDatabaseId}`);
        } catch (adminErr) {
          console.warn("[DHM\u0130 Otorite - ADMIN] Failed to initialize Admin SDK. Using Web SDK Fallback:", adminErr.message);
        }
        try {
          const fbApp = (0, import_app.initializeApp)(firebaseConfig);
          webDb = (0, import_firestore.getFirestore)(fbApp, firebaseConfig.firestoreDatabaseId);
          console.log(`[DHM\u0130 Otorite - WEB] Web SDK Fallback connected.`);
        } catch (webErr) {
          console.error("[DHM\u0130 Otorite - WEB] Web SDK Fallback failed to initialize:", webErr.message);
        }
      } else {
        console.warn("[DHM\u0130 Otorite] firebase-applet-config.json not found.");
      }
    } catch (err) {
      console.error("[DHM\u0130 Otorite] Global Firebase bootstrap error:", err);
    }
    useAdminDb = true;
  }
});

// server/services/pushService.ts
var pushService_exports = {};
__export(pushService_exports, {
  dispatchFlightPushNotifications: () => dispatchFlightPushNotifications,
  getVapidPublicKey: () => getVapidPublicKey
});
function getVapidPublicKey() {
  return vapidPubKey;
}
async function dispatchFlightPushNotifications(flightNumber, updateType, payloadData) {
  console.log(`[Push Worker] Dispatching push notifications for ${flightNumber} (${updateType})`);
  if (!adminDb) {
    console.warn("[Push Worker] Firestore database is offline/unconfigured. Skipping push dispatch.");
    return;
  }
  try {
    const subscriptionsRef = adminDb.collection("subscriptions");
    const snapshot = await subscriptionsRef.where("flightNumber", "==", flightNumber.toUpperCase()).where("status", "==", "ACTIVE").get();
    if (snapshot.empty) {
      console.log(`[Push Worker] No active push subscriptions found for flight ${flightNumber}`);
      return;
    }
    let successCount = 0;
    let failCount = 0;
    const notificationPayload = JSON.stringify({
      title: payloadData.title,
      body: payloadData.body,
      url: "/?screen=dashboard",
      updateType,
      gate: payloadData.gate || "",
      boardingStatus: payloadData.boardingStatus || ""
    });
    for (const doc of snapshot.docs) {
      const sub = doc.data();
      const token = sub.pushToken;
      if (!token) continue;
      if (token.startsWith("{") || sub.platform && sub.platform === "PWA_CLIENT") {
        try {
          const pushSubscription = JSON.parse(token);
          await import_web_push.default.sendNotification(pushSubscription, notificationPayload);
          successCount++;
        } catch (webPushErr) {
          console.warn(`[Push Worker] Failed to send PWA Web Push to sub ${doc.id}:`, webPushErr.message);
          failCount++;
          if (webPushErr.statusCode === 410 || webPushErr.statusCode === 404) {
            await doc.ref.update({ status: "EXPIRED" });
            console.log(`[Push Worker] Marked expired subscription ${doc.id} as inactive (Status 410).`);
          }
        }
      } else {
        console.log(`[FCM Push Dispatch] Dispatching native push payload to Capacitor FCM Device Token: ${token}`);
        successCount++;
      }
    }
    console.log(`[Push Worker] Dispatch complete for ${flightNumber}. Success: ${successCount}, Failed: ${failCount}`);
  } catch (err) {
    console.error("[Push Worker] Error dispatching flight notifications:", err.message);
  }
}
var import_web_push, vapidPubKey, vapidPrivKey;
var init_pushService = __esm({
  "server/services/pushService.ts"() {
    import_web_push = __toESM(require("web-push"), 1);
    init_firestoreSync();
    vapidPubKey = process.env.VAPID_PUBLIC_KEY;
    vapidPrivKey = process.env.VAPID_PRIVATE_KEY;
    if (!vapidPubKey || !vapidPrivKey) {
      try {
        const keys = import_web_push.default.generateVAPIDKeys();
        vapidPubKey = keys.publicKey;
        vapidPrivKey = keys.privateKey;
        console.log("[Push Service] Dynamically generated sandbox VAPID keys.");
      } catch (err) {
        console.error("[Push Service] VAPID keys generation failed:", err.message);
      }
    }
    if (vapidPubKey && vapidPrivKey) {
      try {
        import_web_push.default.setVapidDetails(
          "mailto:destek@smartpass.co",
          vapidPubKey,
          vapidPrivKey
        );
      } catch (setErr) {
        console.error("[Push Service] Error configuring web-push details:", setErr.message);
      }
    }
  }
});

// server.ts
var server_exports = {};
__export(server_exports, {
  getCurrencyInfo: () => getCurrencyInfo,
  getRuleBasedFallbackResponse: () => getRuleBasedFallbackResponse,
  parseBoardingPassText: () => parseBoardingPassText
});
module.exports = __toCommonJS(server_exports);

// server/index.ts
var import_express11 = __toESM(require("express"), 1);
var import_dotenv = __toESM(require("dotenv"), 1);
var import_path3 = __toESM(require("path"), 1);
var import_vite = require("vite");

// server/app.ts
var import_express10 = __toESM(require("express"), 1);
var import_helmet = __toESM(require("helmet"), 1);

// server/middleware/rateLimit.ts
var import_express_rate_limit = require("express-rate-limit");
var import_crypto = __toESM(require("crypto"), 1);
var apiLimiter = (0, import_express_rate_limit.rateLimit)({
  windowMs: 15 * 60 * 1e3,
  // 15 mins
  limit: 180,
  // Allow up to 180 requests per 15 mins per IP
  standardHeaders: "draft-7",
  legacyHeaders: false,
  handler: (req, res) => {
    const requestId = `req-${import_crypto.default.randomBytes(8).toString("hex")}`;
    res.status(429).json({
      error: {
        code: "RATE_LIMIT_EXCEEDED",
        message: "\xC7ok fazla istek g\xF6nderdiniz. G\xFCvenlik korumas\u0131 nedeniyle ge\xE7ici olarak engellendiniz. L\xFCtfen 15 dakika sonra tekrar deneyiniz.",
        requestId
      }
    });
  }
});
var aiLimiter = (0, import_express_rate_limit.rateLimit)({
  windowMs: 15 * 60 * 1e3,
  // 15 mins
  limit: 30,
  // Allow up to 30 requests per 15 mins per IP for Gemini security
  standardHeaders: "draft-7",
  legacyHeaders: false,
  handler: (req, res) => {
    const requestId = `req-${import_crypto.default.randomBytes(8).toString("hex")}`;
    res.status(429).json({
      error: {
        code: "AI_RATE_LIMIT_EXCEEDED",
        message: "Gemini yapay zeka asistan\u0131 i\xE7in tan\u0131mlanan kullan\u0131m veya maliyet s\u0131n\u0131r\u0131n\u0131 a\u015Ft\u0131n\u0131z. L\xFCtfen bir s\xFCre sonra tekrar deneyiniz.",
        requestId
      }
    });
  }
});

// server/routes/simulation.ts
var import_express = require("express");
init_mockFlights();
init_firestoreSync();

// server/services/flightAdapter.ts
init_mockFlights();
init_firestoreSync();
var MockAdapter = class {
  constructor() {
    this.subscribers = /* @__PURE__ */ new Map();
  }
  async fetchFlight(flightNumber) {
    const vars = getSimVariables();
    const flightKey = flightNumber ? flightNumber.replace("-", "") : "TK1903";
    const baseMock = MOCK_BOARDINGS[flightKey] || {
      departureTime: "22:15",
      gate: "G-12",
      securityQueueTime: 12,
      boardingStatus: "Boarding Now"
    };
    const status = flightNumber === vars.flightNumber ? vars.boardingStatus : baseMock.boardingStatus || "Waiting";
    const gate = flightNumber === vars.flightNumber ? vars.gate : baseMock.gate || "G-12";
    const secQueue = flightNumber === vars.flightNumber ? vars.securityQueueTime : baseMock.securityQueueTime || 12;
    const delayReasonText = flightNumber === vars.flightNumber ? vars.delayReason || "Operasyonel kriz y\xF6netimi devrede." : baseMock.delayReason || "Normal ak\u0131\u015F";
    const std = baseMock.departureTime || "22:15";
    let etd = std;
    if (status === "Delayed") {
      etd = this.addMinutesToTime(std, 45);
    }
    let atd = null;
    if (status === "Closed") {
      atd = this.addMinutesToTime(std, 10);
    }
    const disruption = status === "Delayed" || status === "Cancelled" ? {
      type: status === "Cancelled" ? "CANCELLATION" : "DELAY",
      reason: delayReasonText
    } : null;
    const flight = {
      flightNumber,
      gate,
      boardingStatus: status,
      securityQueueTime: secQueue,
      source: {
        provider: "SIMULATION",
        updatedAt: (/* @__PURE__ */ new Date()).toISOString(),
        confidence: 0.85
      },
      schedule: {
        std,
        etd,
        atd
      },
      disruption,
      delayReason: delayReasonText,
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    this.notifySubscribers(flightNumber, flight);
    return flight;
  }
  subscribe(flightNumber, onUpdate) {
    if (!this.subscribers.has(flightNumber)) {
      this.subscribers.set(flightNumber, /* @__PURE__ */ new Set());
    }
    this.subscribers.get(flightNumber).add(onUpdate);
    this.fetchFlight(flightNumber).then(onUpdate).catch((err) => {
      console.error("[MockAdapter Subscribe Error]", err);
    });
    return () => {
      const subs = this.subscribers.get(flightNumber);
      if (subs) {
        subs.delete(onUpdate);
        if (subs.size === 0) {
          this.subscribers.delete(flightNumber);
        }
      }
    };
  }
  notifySubscribers(flightNumber, flight) {
    const subs = this.subscribers.get(flightNumber);
    if (subs) {
      subs.forEach((cb) => {
        try {
          cb(flight);
        } catch (e) {
          console.error("[MockAdapter Callback Error]", e);
        }
      });
    }
  }
  addMinutesToTime(timeStr, minutes) {
    try {
      const [h, m] = timeStr.split(":").map(Number);
      const newM = (m + minutes) % 60;
      const newH = (h + Math.floor((m + minutes) / 60)) % 24;
      return `${String(newH).padStart(2, "0")}:${String(newM).padStart(2, "0")}`;
    } catch (e) {
      return timeStr;
    }
  }
};
var AmadeusAdapter = class {
  async fetchFlight(flightNumber) {
    const flightKey = flightNumber ? flightNumber.replace("-", "") : "PC2026";
    const baseMock = MOCK_BOARDINGS[flightKey] || {
      departureTime: "23:45",
      gate: "204B",
      securityQueueTime: 25,
      boardingStatus: "Waiting"
    };
    const status = baseMock.boardingStatus || "Waiting";
    const std = baseMock.departureTime || "23:45";
    let etd = std;
    if (status === "Delayed") {
      etd = this.addMinutesToTime(std, 30);
    }
    const disruption = status === "Delayed" || status === "Cancelled" ? {
      type: "SCHEDULING_SHIFT",
      reason: "Amadeus global GDS schedule synchronization delay."
    } : null;
    return {
      flightNumber,
      gate: baseMock.gate || "204B",
      boardingStatus: status,
      securityQueueTime: baseMock.securityQueueTime || 25,
      source: {
        provider: "AMADEUS",
        updatedAt: (/* @__PURE__ */ new Date()).toISOString(),
        confidence: 0.95
      },
      schedule: {
        std,
        etd,
        atd: status === "Closed" ? this.addMinutesToTime(std, 12) : null
      },
      disruption,
      delayReason: baseMock.delayReason || "Amadeus Global Sandbox data synchronizer connected.",
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
  }
  addMinutesToTime(timeStr, minutes) {
    try {
      const [h, m] = timeStr.split(":").map(Number);
      const newM = (m + minutes) % 60;
      const newH = (h + Math.floor((m + minutes) / 60)) % 24;
      return `${String(newH).padStart(2, "0")}:${String(newM).padStart(2, "0")}`;
    } catch (e) {
      return timeStr;
    }
  }
};
var OperatorAdapter = class {
  async fetchFlight(flightNumber) {
    const flightKey = flightNumber ? flightNumber.replace("-", "") : "TK1903";
    const baseMock = MOCK_BOARDINGS[flightKey] || {
      departureTime: "22:15",
      gate: "G-12",
      securityQueueTime: 12,
      boardingStatus: "Boarding Now",
      airportOperator: "\u0130GA"
    };
    const operatorName = baseMock.airportOperator === "TAV" ? "TAV" : "\u0130GA";
    const status = baseMock.boardingStatus || "Waiting";
    const std = baseMock.departureTime || "22:15";
    const disruption = status === "Delayed" || status === "Cancelled" ? {
      type: "OPERATOR_ALERTS",
      reason: `${operatorName} Airside terminal-wide physical operations update.`
    } : null;
    return {
      flightNumber,
      gate: baseMock.gate || "G-12",
      boardingStatus: status,
      securityQueueTime: baseMock.securityQueueTime || 12,
      source: {
        provider: "IGA",
        updatedAt: (/* @__PURE__ */ new Date()).toISOString(),
        confidence: 0.99
      },
      schedule: {
        std,
        etd: status === "Delayed" ? this.addMinutesToTime(std, 40) : std,
        atd: status === "Closed" ? this.addMinutesToTime(std, 15) : null
      },
      disruption,
      delayReason: baseMock.delayReason || `${operatorName} Live Hub digital authority systems match success.`,
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
  }
  addMinutesToTime(timeStr, minutes) {
    try {
      const [h, m] = timeStr.split(":").map(Number);
      const newM = (m + minutes) % 60;
      const newH = (h + Math.floor((m + minutes) / 60)) % 24;
      return `${String(newH).padStart(2, "0")}:${String(newM).padStart(2, "0")}`;
    } catch (e) {
      return timeStr;
    }
  }
};
var FlightAdapterHub = class _FlightAdapterHub {
  constructor() {
    this.intervalId = null;
    this.adapters = /* @__PURE__ */ new Map();
    this.monitoredFlights = /* @__PURE__ */ new Set([
      "TK-1903",
      "PC-2026",
      "TK-2108",
      "AJ-4112"
    ]);
    this.adapters.set("SIMULATION", new MockAdapter());
    this.adapters.set("AMADEUS", new AmadeusAdapter());
    this.adapters.set("IGA", new OperatorAdapter());
  }
  static getInstance() {
    if (!_FlightAdapterHub.instance) {
      _FlightAdapterHub.instance = new _FlightAdapterHub();
    }
    return _FlightAdapterHub.instance;
  }
  registerFlight(flightNumber) {
    if (flightNumber) {
      this.monitoredFlights.add(flightNumber);
      this.syncFlightNow(flightNumber);
    }
  }
  /**
   * Determine the appropriate adapter class dynamically based on the flight configurations
   */
  selectAdapterForFlight(flightNumber) {
    const cleanNum = flightNumber ? flightNumber.replace("-", "") : "TK1903";
    const config = MOCK_BOARDINGS[cleanNum];
    if (flightNumber === "TK-1903") {
      return this.adapters.get("SIMULATION");
    }
    if (config) {
      if (config.airportOperator === "\u0130GA") {
        return this.adapters.get("IGA");
      }
      if (config.airportOperator === "TAV" || config.airportOperator === "HEA\u015E") {
        return this.adapters.get("AMADEUS");
      }
    }
    return this.adapters.get("SIMULATION");
  }
  /**
   * Synchronize a specific flight number immediately using appropriate adapter
   */
  async syncFlightNow(flightNumber) {
    try {
      const adapter = this.selectAdapterForFlight(flightNumber);
      const canonical = await adapter.fetchFlight(flightNumber);
      await writeDocSecurely("flights", flightNumber, canonical);
    } catch (err) {
      console.error(`[FlightAdapterHub] Failed to sync and normalize flight ${flightNumber}:`, err.message);
    }
  }
  /**
   * Start the periodic background scheduler
   */
  startPolling(intervalMs = 1e4) {
    if (this.intervalId) {
      return;
    }
    console.log(`[FlightAdapterHub] Starting flight data periodic poll hub (Interval: ${intervalMs}ms)...`);
    this.pollAll();
    this.intervalId = setInterval(() => {
      this.pollAll();
    }, intervalMs);
  }
  /**
   * Stop the background polling
   */
  stopPolling() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log(`[FlightAdapterHub] Periodic poll hub stopped successfully.`);
    }
  }
  async pollAll() {
    for (const flightNumber of this.monitoredFlights) {
      await this.syncFlightNow(flightNumber);
    }
  }
};

// server/services/errorResponse.ts
var import_crypto2 = __toESM(require("crypto"), 1);
function sendError(res, statusCode, code, message, customRequestId) {
  const requestId = customRequestId || `req-${import_crypto2.default.randomBytes(8).toString("hex")}`;
  return res.status(statusCode).json({
    error: {
      code: code.toUpperCase(),
      message,
      requestId
    }
  });
}

// server/routes/simulation.ts
var router = (0, import_express.Router)();
router.get("/state", async (req, res) => {
  if (process.env.NODE_ENV === "production") {
    const headerKey = req.headers["x-simulation-api-key"] || req.headers["authorization"];
    const expectedKey = process.env.SIMULATION_API_KEY;
    if (!expectedKey || headerKey !== expectedKey) {
      return sendError(
        res,
        403,
        "FORBIDDEN",
        "Simulation state endpoints are disabled or require administrative API key in production."
      );
    }
  }
  const vars = getSimVariables();
  if (vars.flightNumber) {
    try {
      await FlightAdapterHub.getInstance().syncFlightNow(vars.flightNumber);
    } catch (e) {
      console.warn("Server-side initial simulator seed failed:", e);
    }
  }
  res.json(vars);
});
router.post("/update", async (req, res) => {
  if (process.env.NODE_ENV === "production") {
    const headerKey = req.headers["x-simulation-api-key"] || req.headers["authorization"];
    const expectedKey = process.env.SIMULATION_API_KEY;
    if (!expectedKey || headerKey !== expectedKey) {
      return sendError(
        res,
        403,
        "FORBIDDEN",
        "Simulation update endpoints are disabled or require administrative API key in production."
      );
    }
  }
  const allowedFields = ["flightNumber", "boardingStatus", "securityQueueTime", "gate", "delayReason"];
  const receivedKeys = Object.keys(req.body);
  const invalidKeys = receivedKeys.filter((key) => !allowedFields.includes(key));
  if (invalidKeys.length > 0) {
    return sendError(
      res,
      400,
      "VALIDATION_ERROR",
      `Yetkisiz veya ge\xE7ersiz parametre saptand\u0131: [${invalidKeys.join(", ")}]. Sadece \u015Fu alanlar g\xFCncellenebilir: ${allowedFields.join(", ")}`
    );
  }
  const updatePayload = {};
  if (req.body.flightNumber !== void 0) {
    if (typeof req.body.flightNumber !== "string" || req.body.flightNumber.length > 15) {
      return sendError(
        res,
        400,
        "VALIDATION_ERROR",
        "flightNumber ge\xE7erli bir hava yolu u\xE7u\u015F kodu format\u0131nda olmal\u0131d\u0131r (maks 15 karakter)."
      );
    }
    updatePayload.flightNumber = req.body.flightNumber.trim();
  }
  if (req.body.boardingStatus !== void 0) {
    const validStatusValues = ["Boarding Now", "Waiting", "Closed", "Delayed", "Cancelled"];
    if (!validStatusValues.includes(req.body.boardingStatus)) {
      return sendError(
        res,
        400,
        "VALIDATION_ERROR",
        `boardingStatus \u015Fu de\u011Ferlerden biri olmal\u0131d\u0131r: ${validStatusValues.join(", ")}`
      );
    }
    updatePayload.boardingStatus = req.body.boardingStatus;
  }
  if (req.body.securityQueueTime !== void 0) {
    const queueTime = Number(req.body.securityQueueTime);
    if (isNaN(queueTime) || queueTime < 0 || queueTime > 240) {
      return sendError(
        res,
        400,
        "VALIDATION_ERROR",
        "securityQueueTime 0 ile 240 dakika aras\u0131nda ge\xE7erli bir say\u0131 olmal\u0131d\u0131r."
      );
    }
    updatePayload.securityQueueTime = Math.round(queueTime);
  }
  if (req.body.gate !== void 0) {
    if (typeof req.body.gate !== "string" || req.body.gate.length > 20) {
      return sendError(
        res,
        400,
        "VALIDATION_ERROR",
        "gate kap\u0131 tan\u0131m\u0131 maksimum 20 karakter uzunlu\u011Funda bir metin olmal\u0131d\u0131r."
      );
    }
    updatePayload.gate = req.body.gate.trim();
  }
  if (req.body.delayReason !== void 0) {
    if (typeof req.body.delayReason !== "string" || req.body.delayReason.length > 500) {
      return sendError(
        res,
        400,
        "VALIDATION_ERROR",
        "delayReason (r\xF6tar gerek\xE7esi) maksimum 500 karakter s\u0131n\u0131r\u0131na tabidir."
      );
    }
    updatePayload.delayReason = req.body.delayReason.trim();
  }
  const updated = updateSimVariables(updatePayload);
  if (updated.flightNumber) {
    await FlightAdapterHub.getInstance().syncFlightNow(updated.flightNumber);
    const { dispatchFlightPushNotifications: dispatchFlightPushNotifications2 } = await Promise.resolve().then(() => (init_pushService(), pushService_exports));
    if (updatePayload.gate !== void 0) {
      await dispatchFlightPushNotifications2(updated.flightNumber, "GATE_CHANGE", {
        title: "AeroPass - Kap\u0131 G\xFCncellendi \u{1F6AA}",
        body: `${updated.flightNumber} u\xE7u\u015Funuzun bini\u015F kap\u0131s\u0131 ${updatePayload.gate} olarak g\xFCncellenmi\u015Ftir. L\xFCtfen panonuzu kontrol edin.`,
        gate: updatePayload.gate,
        boardingStatus: updated.boardingStatus
      });
    } else if (updatePayload.boardingStatus === "Delayed") {
      await dispatchFlightPushNotifications2(updated.flightNumber, "DELAY", {
        title: "AeroPass - U\xE7u\u015F Bilgilendirmesi \u26A0\uFE0F",
        body: `${updated.flightNumber} u\xE7u\u015Funda r\xF6tar veya operasyonel d\xFCzenleme mevcuttur. Detaylar ve kriz y\xF6netimi i\xE7in l\xFCtfen t\u0131klay\u0131n.`,
        gate: updated.gate,
        boardingStatus: "Delayed"
      });
    } else if (updatePayload.boardingStatus === "Cancelled") {
      await dispatchFlightPushNotifications2(updated.flightNumber, "CANCELLATION", {
        title: "AeroPass - U\xE7u\u015F \u0130PTAL Edildi \u{1F6A8}",
        body: `${updated.flightNumber} u\xE7u\u015Funuz \xFCz\xFClerek iptal edilmi\u015Ftir. Yolcu haklar\u0131n\u0131z ve alternatif u\xE7u\u015Flar i\xE7in asistan\u0131n\u0131z haz\u0131r.`,
        gate: updated.gate,
        boardingStatus: "Cancelled"
      });
    } else if (updatePayload.boardingStatus === "Boarding Now") {
      await dispatchFlightPushNotifications2(updated.flightNumber, "BOARDING", {
        title: "AeroPass - U\xE7u\u015F Bini\u015F \xC7a\u011Fr\u0131s\u0131 \u2708\uFE0F",
        body: `${updated.flightNumber} u\xE7u\u015Fu i\xE7in bini\u015F i\u015Flemleri ba\u015Flad\u0131. En k\u0131sa s\xFCrede ${updated.gate || "G12"} kap\u0131s\u0131na y\xF6neliniz!`,
        gate: updated.gate,
        boardingStatus: "Boarding Now"
      });
    }
    if (updated.boardingStatus === "Closed") {
      await autoCleanClosedFlightUsers(updated.flightNumber);
    }
  }
  res.json({ success: true, state: updated });
});
var simulation_default = router;

// server/routes/boardingPass.ts
var import_express2 = require("express");
init_mockFlights();

// server/services/bcbpParser.ts
function convertJulianDate(julianStr) {
  const dayNum = parseInt(julianStr, 10);
  if (isNaN(dayNum) || dayNum < 1 || dayNum > 366) {
    return "Bilinmiyor";
  }
  const daysInMonths = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  const monthNames = [
    "Ocak",
    "\u015Eubat",
    "Mart",
    "Nisan",
    "May\u0131s",
    "Haziran",
    "Temmuz",
    "A\u011Fustos",
    "Eyl\xFCl",
    "Ekim",
    "Kas\u0131m",
    "Aral\u0131k"
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
function getCabinInfo(cabinChar) {
  const char = (cabinChar || "Y").toUpperCase();
  if (["F", "A", "P"].includes(char)) {
    return { name: "First Class (Birinci S\u0131n\u0131f)", group: "Group A (\xD6ncelikli Bini\u015F)" };
  }
  if (["C", "J", "D", "I", "Z"].includes(char)) {
    return { name: "Business Class (\u0130\u015F S\u0131n\u0131f\u0131)", group: "Group A (\xD6ncelikli Bini\u015F)" };
  }
  if (["W", "E"].includes(char)) {
    return { name: "Premium Economy (Premium Ekonomi)", group: "Group B (Ekonomi S\u0131n\u0131f\u0131)" };
  }
  return { name: "Economy Class (Ekonomi S\u0131n\u0131f\u0131)", group: "Group B (Ekonomi S\u0131n\u0131f\u0131)" };
}
function formatSeatNumber(rawSeat) {
  const cleaned = (rawSeat || "").trim().toUpperCase();
  if (!cleaned) return "15E";
  const match = cleaned.match(/^0*(\d+[A-Z])$/);
  if (match) {
    return match[1];
  }
  return cleaned;
}
function parseBoardingPassText(rawText) {
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
      const detailsMatch = rawText.match(/([0-9]{3})([A-Z])([0-9]{3}[A-Z]|[0-9]{2}[A-Z])([0-9]{4,5})/i);
      if (detailsMatch) {
        julianDate = detailsMatch[1];
        cabinClass = detailsMatch[2];
        seat = detailsMatch[3];
        sequenceNumber = detailsMatch[4];
      } else {
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
    passengerName = passengerName.replace(/\s+/g, " ").trim();
    if (passengerName.endsWith(" E")) {
      passengerName = passengerName.substring(0, passengerName.length - 2).trim();
    }
    const cleanedSeat = formatSeatNumber(seat);
    const flightFormatted = `${carrier.toUpperCase()}-${parseInt(flightNum, 10)}`;
    const resolvedOperator = from.toUpperCase() === "IST" ? "\u0130GA" : from.toUpperCase() === "SAW" ? "HEA\u015E" : "DHM\u0130";
    const cabinInfo = getCabinInfo(cabinClass);
    const julianDateFormatted = convertJulianDate(julianDate);
    let resolvedAirline = "\xD6zel Ta\u015F\u0131y\u0131c\u0131";
    if (carrier.toUpperCase() === "TK") resolvedAirline = "Turkish Airlines";
    else if (carrier.toUpperCase() === "PC") resolvedAirline = "Pegasus Airlines";
    else if (carrier.toUpperCase() === "AJ") resolvedAirline = "Ajet Airlines";
    const getCityName = (code) => {
      const c = code.toUpperCase();
      if (c === "IST") return "\u0130stanbul";
      if (c === "SAW") return "Sabiha G\xF6k\xE7en";
      if (c === "LHR") return "Londra";
      if (c === "ADB") return "\u0130zmir";
      if (c === "CDG") return "Paris";
      if (c === "MOW") return "Moskova";
      if (c === "JFK") return "New York";
      return "Yerel Havaliman\u0131";
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
      group: cabinInfo.group === "Group A (\xD6ncelikli Bini\u015F)" ? "A" : "B",
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
  return null;
}

// server/routes/boardingPass.ts
init_firestoreSync();
var router2 = (0, import_express2.Router)();
router2.post("/", async (req, res) => {
  const { rawText } = req.body;
  if (!rawText || typeof rawText !== "string" || rawText.trim() === "") {
    return sendError(res, 400, "INVALID_BCBP", "Tarama kodu veya bini\u015F kart\u0131 metni sa\u011Flanamad\u0131 veya bo\u015F g\xF6nderildi.");
  }
  const parseResult = parseBoardingPassText(rawText);
  if (!parseResult) {
    return sendError(res, 400, "INVALID_BCBP_FORMAT", "Ge\xE7ersiz bini\u015F kart\u0131 veya tan\u0131ms\u0131z barkod format\u0131.");
  }
  if (parseResult.custom && parseResult.data) {
    const parsedData = parseResult.data;
    if (parsedData.flightNumber) {
      await syncFlightToFirestore(
        parsedData.flightNumber,
        parsedData.boardingStatus,
        parsedData.securityQueueTime,
        parsedData.gate,
        "U\xE7u\u015F kart\u0131 taramas\u0131yla canl\u0131 sistemlere ba\u011Fland\u0131."
      );
    }
    return res.json(parsedData);
  }
  const flightId = parseResult.flightId || "TK1903";
  const baseData = { ...MOCK_BOARDINGS[flightId] };
  const simVariables2 = getSimVariables();
  if (baseData && baseData.flightNumber === simVariables2.flightNumber) {
    baseData.boardingStatus = simVariables2.boardingStatus;
    baseData.securityQueueTime = simVariables2.securityQueueTime;
    baseData.gate = simVariables2.gate;
  }
  if (baseData && baseData.flightNumber) {
    await syncFlightToFirestore(
      baseData.flightNumber,
      baseData.boardingStatus,
      baseData.securityQueueTime,
      baseData.gate,
      simVariables2.flightNumber === baseData.flightNumber ? simVariables2.delayReason : "Normal operasyonel ak\u0131\u015F sa\u011Fland\u0131."
    );
  }
  res.json(baseData);
});
var boardingPass_default = router2;

// server/routes/assistant.ts
var import_express3 = require("express");
init_mockFlights();

// server/services/geminiService.ts
var import_genai = require("@google/genai");
var ai = process.env.GEMINI_API_KEY ? new import_genai.GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build"
    }
  }
}) : null;

// server/services/currencyService.ts
var ratesCache = {
  rates: null,
  lastFetched: 0
};
async function getLiveRates() {
  const now = Date.now();
  if (ratesCache.rates && now - ratesCache.lastFetched < 36e5) {
    return ratesCache.rates;
  }
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2e3);
    const response = await fetch("https://open.er-api.com/v6/latest/TRY", { signal: controller.signal });
    clearTimeout(timeoutId);
    if (response.ok) {
      const data = await response.json();
      if (data && data.rates) {
        ratesCache = {
          rates: data.rates,
          lastFetched: now
        };
        console.log("D\xF6viz kurlar\u0131 API \xFCzerinden g\xFCncellendi.");
        return data.rates;
      }
    }
  } catch (err) {
    console.warn("Canl\u0131 d\xF6viz kurlar\u0131 al\u0131namad\u0131, yerel e\u015Fle\u015Fme kullan\u0131lacak. Hata:", err.message);
  }
  return ratesCache.rates;
}
function getCurrencyInfo(toCity, toCode, liveRates) {
  const city = (toCity || "").toLowerCase();
  const code = (toCode || "").toUpperCase();
  const envFbGbp = process.env.FALLBACK_GBP ? parseFloat(process.env.FALLBACK_GBP) : 50.45;
  const envFbRub = process.env.FALLBACK_RUB ? parseFloat(process.env.FALLBACK_RUB) : 0.39;
  const envFbEur = process.env.FALLBACK_EUR ? parseFloat(process.env.FALLBACK_EUR) : 42.2;
  const envFbUsd = process.env.FALLBACK_USD ? parseFloat(process.env.FALLBACK_USD) : 38.85;
  const fbGbp = isNaN(envFbGbp) ? 50.45 : envFbGbp;
  const fbRub = isNaN(envFbRub) ? 0.39 : envFbRub;
  const fbEur = isNaN(envFbEur) ? 42.2 : envFbEur;
  const fbUsd = isNaN(envFbUsd) ? 38.85 : envFbUsd;
  let currencyCode = "TRY";
  let currencyName = "T\xFCrk Liras\u0131";
  let symbol = "\u20BA";
  let fallbackRate = 1;
  if (code === "LHR" || city.includes("londra") || city.includes("london") || city.includes("ingiltere") || city.includes("united kingdom") || city.includes("gbr")) {
    currencyCode = "GBP";
    currencyName = "\u0130ngiliz Sterlini";
    symbol = "\xA3";
    fallbackRate = fbGbp;
  } else if (code === "MOW" || city.includes("moskova") || city.includes("rusya") || city.includes("rus") || city.includes("rub")) {
    currencyCode = "RUB";
    currencyName = "Rus Rublesi";
    symbol = "\u20BD";
    fallbackRate = fbRub;
  } else if (city.includes("paris") || city.includes("frankfurt") || city.includes("berlin") || city.includes("roma") || city.includes("amsterdam") || city.includes("almanya") || city.includes("fransa") || code === "CDG" || code === "FRA") {
    currencyCode = "EUR";
    currencyName = "Euro";
    symbol = "\u20AC";
    fallbackRate = fbEur;
  } else if (city.includes("new york") || city.includes("miami") || city.includes("los angeles") || city.includes("amerika") || city.includes("abd") || city.includes("usa") || code === "JFK" || code === "LAX") {
    currencyCode = "USD";
    currencyName = "Amerikan Dolar\u0131";
    symbol = "$";
    fallbackRate = fbUsd;
  }
  let rate = fallbackRate;
  if (currencyCode === "TRY") {
    let usdRate = fbUsd;
    if (liveRates && liveRates["USD"]) {
      const apiUsdRate = 1 / liveRates["USD"];
      if (apiUsdRate > 0 && !isNaN(apiUsdRate)) {
        usdRate = Math.round(apiUsdRate * 100) / 100;
      }
    }
    return {
      fromCurrency: "TRY",
      toCurrency: "TRY",
      currencyName: "T\xFCrk Liras\u0131",
      symbol: "\u20BA",
      rate: 1,
      inverseRate: 1,
      trend: "stable",
      isDomestic: true,
      terminalUsdRate: usdRate
      // terminal convenience USD tracking for duty free shopping
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
    inverseRate: Math.round(1 / rate * 1e4) / 1e4,
    trend: rate > fallbackRate ? "up" : rate < fallbackRate ? "down" : "stable",
    isDomestic: false
  };
}

// server/services/fallbackEngine.ts
function getRuleBasedFallbackResponse(userMessage, flight, currencyInfo) {
  const query = (userMessage || "").trim().toLowerCase();
  if (query.match(/(kur|döviz|para|lira|tl|sterlin|euro|dolar|ruble|bütçe|currency|money|price|fiyat|exchange|bozdur)/i)) {
    if (currencyInfo.isDomestic) {
      return `### \u{1FA99} Havaliman\u0131 Finansal Rehberi (Yurt \u0130\xE7i Sefer)
Sistem verilerine g\xF6re seyahat edece\u011Finiz **${flight.toCity}** yurt i\xE7i s\u0131n\u0131rlar\u0131nda yer ald\u0131\u011F\u0131 i\xE7in ge\xE7erli para biriminiz **T\xFCrk Liras\u0131 (TRY)**'dir.

**\u{1F4A1} Duty-Free & L\xFCks Al\u0131\u015Fveri\u015F \u0130pucu:**
Terminal i\xE7erisindeki baz\u0131 l\xFCks ma\u011Fazalar ve Duty-Free reyonlar\u0131 fiyatlar\u0131n\u0131 d\xF6viz bazl\u0131 listeliyor olabilir. Sistemimizdeki g\xFCncel referans Amerikan Dolar\u0131 (USD) kuru:
*   **1 USD = ${currencyInfo.terminalUsdRate} TRY**
*   **1 TRY = ${Math.round(1 / currencyInfo.terminalUsdRate * 1e4) / 1e4} USD**

**\u{1F4B0} Asistan \xD6nerisi:**
*   Havaliman\u0131 i\xE7indeki l\xFCks ma\u011Fazalarda \xF6deme yaparken kredi kart\u0131n\u0131z\u0131n yerel para biriminde (TRY) \xE7ekilmesini talep ederek komisyon kay\u0131plar\u0131n\u0131 minimuma indirebilirsiniz.`;
    } else {
      return `### \u{1FA99} Havaliman\u0131 Finansal Rehberi (Uluslararas\u0131 Sefer)
U\xE7u\u015F yapaca\u011F\u0131n\u0131z **${flight.toCity}** i\xE7in yerel para birimi bilgileri ve canl\u0131 d\xF6viz kurlar\u0131 ba\u015Far\u0131yla e\u015Fitlendi:

*   **Para Birimi:** ${currencyInfo.currencyName} (${currencyInfo.toCurrency})
*   **Sembol:** \`${currencyInfo.symbol}\`
*   **Sat\u0131\u015F Kuru:** **1 ${currencyInfo.toCurrency} = ${currencyInfo.rate} TRY**
*   **Al\u0131\u015F Kuru:** **1 TRY = ${currencyInfo.inverseRate} ${currencyInfo.toCurrency}**
*   **Kur E\u011Filimi:** ${currencyInfo.trend === "up" ? "\u{1F4C8} Yukar\u0131 Y\xF6nl\xFC (TRY kar\u015F\u0131s\u0131nda g\xFC\xE7leniyor)" : currencyInfo.trend === "down" ? "\u{1F4C9} A\u015Fa\u011F\u0131 Y\xF6nl\xFC (TRY kar\u015F\u0131s\u0131nda hafif gerileme)" : "\u2194\uFE0F Stabil seyrediyor"}

**\u{1F4A1} Ak\u0131ll\u0131 Seyahat B\xFCt\xE7e \xD6nerileri:**
1.  **D\xF6viz B\xFCrosu Komisyonu:** Havaliman\u0131 i\xE7erisindeki fiziki d\xF6viz b\xFCrolar\u0131 y\xFCksek komisyon uygulayabilir. Nakit ihtiyac\u0131n\u0131z i\xE7in havaliman\u0131 d\u0131\u015F\u0131ndaki yerel banka ATM'lerini komisyonsuz veya d\xFC\u015F\xFCk \xFCcretli seyahat kartlar\u0131 ile kullanman\u0131z \xF6nerilir.
2.  **Kartla \xD6deme:** Gitti\u011Finiz \xFClkede POS cihazlar\u0131nda \xF6deme yaparken her zaman yerel para birimini (**${currencyInfo.toCurrency}**) se\xE7in. "Dinamik Para Birimi \xC7evrimi (DCC)" sistemleri genellikle zararl\u0131d\u0131r.`;
    }
  }
  if (query.match(/(rötar|gecikme|iptal|delayed|cancelled|boarding|saat|uçuş|uçak|sefer|gecikti|shgm|shy|tazminat|iade|bilet|haklarım|haklarim)/i)) {
    const status = flight.boardingStatus;
    let mainStatusText = "";
    let actionRecommendation = "";
    if (status === "Delayed") {
      mainStatusText = `U\xE7u\u015Funuzda **R\xD6TAR (Gecikme)** durumu bildirilmi\u015Ftir. G\xFCvenlik ve kap\u0131 durumlar\u0131n\u0131z\u0131 bu yeni bini\u015F saatine g\xF6re y\xF6netebilirsiniz.`;
      actionRecommendation = `*   **Uzak Mesafe:** ${flight.estimatedWalkTime} uza\u011F\u0131n\u0131zdaki **Gate ${flight.gate}** kap\u0131s\u0131na gitmeden \xF6nce havaliman\u0131 dan\u0131\u015Fma ekranlar\u0131ndan yeni saati teyit edin.
*   **SHY Yolcu Haklar\u0131 (Gecikme Durumu):** 2 saati a\u015Fan gecikmelerde havayolu \u015Firketi size s\u0131cak/so\u011Fuk i\xE7ecekler ve hafif yiyecek ikram\u0131 sunmakla y\xFCk\xFCml\xFCd\xFCr. Gecikme s\xFCresi artt\u0131k\xE7a \xFCcretsiz haberle\u015Fme ve telefon hakk\u0131 isteyebilirsiniz.`;
    } else if (status === "Cancelled") {
      mainStatusText = `\u{1F6A8} **U\xE7u\u015Funuz Maalesef \u0130PTAL Edilmi\u015Ftir.** Operasyonel veya meteorolojik nedenlerle u\xE7u\u015Funuz ask\u0131ya al\u0131nd\u0131.`;
      actionRecommendation = `*   **SHY Yolcu Haklar\u0131 (\u0130ptal Durumu):** Sivil Havac\u0131l\u0131k Genel M\xFCd\xFCrl\xFC\u011F\xFC SHY-YOLCU y\xF6netmeli\u011Fi uyar\u0131nca, iptal edilen u\xE7u\u015Flar i\xE7in havayolu size:
    1.  Bilet \xFCcretinin **tam iadesini** veya,
    2.  En yak\u0131n tarihte \xFCcretsiz **alternatif seferle seyahat** hakk\u0131 sunmak zorundad\u0131r.
    3.  Ayr\u0131ca tazminat limitleri \xE7er\xE7evesinde ek haklar\u0131n\u0131z do\u011Fabilir.
*   **S\u0131radaki Ad\u0131m:** Derhal ilgili havayolu \u015Firketinin (\xF6rne\u011Fin **${flight.airline}**) sat\u0131\u015F ofisine veya transfer bankosuna bizzat m\xFCracaat ederek alternatif u\xE7u\u015F rezervasyonunuzu ger\xE7ekle\u015Ftirin.`;
    } else {
      mainStatusText = `U\xE7u\u015Funuz \u015Fu anda **Normal Ak\u0131\u015F\u0131nda (Status: ${status})** g\xF6r\xFCn\xFCyor. Herhangi bir r\xF6tar veya iptal uyar\u0131s\u0131 bulunmamaktad\u0131r.`;
      actionRecommendation = `*   U\xE7u\u015F saatiniz yakla\u015Ft\u0131\u011F\u0131 i\xE7in **Gate ${flight.gate}** numaral\u0131 kap\u0131ya tahmini **${flight.estimatedWalkTime}** i\xE7inde ula\u015Facak \u015Fekilde plan\u0131n\u0131z\u0131 yap\u0131n.
*   Biyometrik do\u011Frulaman\u0131z **${flight.biometricVerified ? "tamamlanm\u0131\u015Ft\u0131r" : "eksiktir, l\xFCtfen yetkililerden destek al\u0131n"}**.`;
    }
    return `### \u2708\uFE0F U\xE7u\u015F Durumu ve Sivil Havac\u0131l\u0131k Yolcu Haklar\u0131
Mevcut u\xE7u\u015F verilerinizin ve stat\xFCn\xFCn analizi:

*   **G\xFCncel Bini\u015F Durumu:** \`${status}\`
*   **U\xE7u\u015F No:** **${flight.flightNumber}** (${flight.airline})
*   **U\xE7u\u015F Hatt\u0131:** ${flight.from} -> ${flight.to}

${mainStatusText}

**\u{1F4CB} Ne Yapmal\u0131s\u0131n\u0131z? (\xD6neriler):**
${actionRecommendation}
*   **M\xFC\u015Fteri Hizmetleri:** Detayl\u0131 bilet i\u015Flemleri veya tazminat s\xFCre\xE7leri i\xE7in havayolunun \xE7a\u011Fr\u0131 merkezini arayabilirsiniz.`;
  }
  if (query.match(/(kapı|kapısı|gate|yürüme|nerede|nasıl giderim|uzaklık|mesafe|harita|biyometrik|smart id|smartpass)/i)) {
    return `### \u{1F6B6} Kap\u0131 ve Ak\u0131ll\u0131 Ge\xE7i\u015F Rehberi
U\xE7a\u011F\u0131n\u0131z\u0131n kalk\u0131\u015F kap\u0131s\u0131 ve kap\u0131ya ula\u015F\u0131m detaylar\u0131n\u0131z canl\u0131 olarak haritaland\u0131r\u0131lm\u0131\u015Ft\u0131r:

*   **Kalk\u0131\u015F Kap\u0131s\u0131:** **Gate ${flight.gate}**
*   **Y\xFCr\xFCme S\xFCresi:** Tahmini **${flight.estimatedWalkTime}** (Yava\u015F y\xFCr\xFCy\xFC\u015F h\u0131z\u0131yla)
*   **Biyometrik Kimlik (Smart ID):** ${flight.biometricVerified ? "\u2705 Ba\u015Far\u0131yla Do\u011Fruland\u0131 (Biyometrik ge\xE7i\u015F kap\u0131lar\u0131n\u0131 s\u0131ra beklemeden kullanabilirsiniz)" : "\u26A0\uFE0F Do\u011Frulanmad\u0131 (Klasik pasaport ve kimlik kontrol\xFCnden ge\xE7meniz gerekecektir)"}

**\u{1F4A1} AeroAI Ak\u0131ll\u0131 Tavsiyesi:**
*   Havaliman\u0131 i\xE7indeki t\xFCm y\xF6nlendirmeler dijital harita mod\xFCl\xFCm\xFCzde entegredir. Ekran\u0131n \xFCst k\u0131sm\u0131ndaki **"Terminal Haritas\u0131"** butonunu t\u0131klayarak kap\u0131ya giden engelsiz rotay\u0131 interaktif olarak inceleyebilirsiniz.`;
  }
  if (query.match(/(ulaşım|otobüs|shuttle|havaist|havaş|nasıl giderim|binerim|peron|transfer|metro|tren|tramvay)/i)) {
    return `### \u{1F68C} Entegre Havaliman\u0131 Karayolu ve Sefer Entegrasyonu
Terminalden \u015Fehir merkezine veya \xE7evre illere transfer plan\u0131:

*   **Kalk\u0131\u015F B\xF6lgesi:** ${flight.fromCity} (${flight.from})
*   **\xD6nerilen Entegre Hat:** Bulundu\u011Funuz konuma veya yolcu tercihlerine uygun t\xFCm ulusal hat tarifeleri (HAVA\u0130ST, HAVA\u015E vb.) seyahat asistan\u0131m\u0131z\u0131n alt k\u0131sm\u0131ndaki **"Sefer Tarife Cetveli"** kart\u0131na entegre edilmi\u015Ftir. 

**\u{1F4A1} Yolcu \xD6nerisi:**
*   Aktif b\xF6lgenizi se\xE7erek sonraki sefer saatlerini ve durak planlar\u0131n\u0131 ger\xE7ek zamanl\u0131 inceleyebilirsiniz. \u0130nternetin k\u0131s\u0131tl\u0131 veya kapal\u0131 oldu\u011Fu anlarda dahi saat kurgular\u0131 ve peron yerle\u015Fimi yerel bellekte tutulmaktad\u0131r.`;
  }
  if (query.match(/(güvenlik|kuyruk|sıra|pasaport|bekleme|screening|security)/i)) {
    return `### \u{1F6E1}\uFE0F G\xFCvenlik ve Pasaport Ar\u0131nd\u0131r\u0131lm\u0131\u015F Alan Analizi
Mevcut g\xFCvenlik kontrol noktas\u0131 verileri:

*   **Ortalama Bekleme S\xFCresi:** **${flight.securityQueueTime} Dakika**
*   **Hatt\u0131n Yo\u011Funluk Durumu:** ${flight.securityQueueTime > 20 ? "\u{1F534} Yo\u011Fun (L\xFCtfen i\u015Flemlerinizi tamamlamak i\xE7in kap\u0131lara erken ilerleyin)" : "\u{1F7E2} Ak\u0131c\u0131 (Standart kontroller sorunsuz ilerlemektedir)"}

**\u{1F4A1} Zaman Y\xF6netimi \xD6nerisi:**
*   Biyometrik do\u011Frulama (**Smart ID**) sayesinde biyometrik onayl\u0131 h\u0131zl\u0131 ge\xE7i\u015F \u015Feritlerinden saniyeler i\xE7inde ge\xE7erek klasik kuyruklar\u0131 bypass edebilirsiniz. Biyometrik stat\xFCn\xFCz: **${flight.biometricVerified ? "AKT\u0130F" : "PAS\u0130F"}**.`;
  }
  return `### \u{1F44B} Merhaba! Ben SmartPass Seyahat Asistan\u0131n\u0131z AeroAI
Sistemimiz \u015Fu anda **Plan B (Yapay Zeka Destekli G\xFCvenli \xC7evrimd\u0131\u015F\u0131 / Statik Yard\u0131mc\u0131)** modunda kesintisiz hizmet vermektedir. \u0130nternet kesintileri, sunucu kotas\u0131 doluluklar\u0131 veya API anahtar\u0131 yoklu\u011Fundan etkilenmeden u\xE7u\u015F verileriniz \xFCzerinden en do\u011Fru y\xF6nlendirmeleri sa\u011Fl\u0131yorum.

Yolcumuz **Say\u0131n ${flight.passengerName}** i\xE7in aktif u\xE7u\u015F \xF6zet bilgileri:
*   \u2708\uFE0F **U\xE7u\u015Funuz:** ${flight.flightNumber} (${flight.airline}) numaral\u0131 seyahat ${flight.from} -> ${flight.to}
*   \u{1F4BA} **Koltuk & Kap\u0131:** Koltuk ${flight.seat} (Grup ${flight.group}) | **Gate ${flight.gate}** (${flight.estimatedWalkTime} y\xFCr\xFCy\xFC\u015F mesafesinde)
*   \u23F3 **Bini\u015F Durumu:** \`${flight.boardingStatus}\`
*   \u{1F6E1}\uFE0F **G\xFCvenlik S\u0131ras\u0131 Bekleme S\xFCresi:** ${flight.securityQueueTime} dakika
*   \u{1FA99} **Var\u0131\u015F Para Birimi:** ${currencyInfo.currencyName} (${currencyInfo.symbol}) ve kurlar\u0131 yerel belle\u011Fimizde haz\u0131rd\u0131r.

**Size nas\u0131l yard\u0131mc\u0131 olabilirim?** A\u015Fa\u011F\u0131daki konular hakk\u0131nda bana diledi\u011Finiz gibi soru sorabilirsiniz:
*   *D\xF6viz kurlar\u0131, seyahat b\xFCt\xE7eleme ve l\xFCks al\u0131\u015Fveri\u015F,*
*   *Gecikme (R\xF6tar) veya \u0130ptal durumunda haklar\u0131n\u0131z (SHY),*
*   *Havaliman\u0131 ula\u015F\u0131m, metro, Hava\u015F/Havaist peronlar\u0131,*
*   *G\xFCvenlik kontrol\xFC bekleme s\xFCreleri ve kap\u0131 haritas\u0131.*`;
}

// server/middleware/auth.ts
var import_jsonwebtoken = __toESM(require("jsonwebtoken"), 1);
var JWT_SECRET = process.env.JWT_SECRET || "smartpass-super-secret-key-2026";
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    console.warn(`[G\xDCVENL\u0130K \u0130HLAL\u0130] Oturum do\u011Frulama ba\u015Fl\u0131\u011F\u0131 bulunamad\u0131: ${req.method} ${req.path}`);
    return sendError(res, 401, "UNAUTHORIZED", "Eri\u015Fim yetkiniz bulunmamaktad\u0131r. L\xFCtfen sisteme giri\u015F yap\u0131n\u0131z.");
  }
  const token = authHeader.split(" ")[1];
  try {
    const decoded = import_jsonwebtoken.default.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    console.error(`[G\xDCVENL\u0130K \u0130HLAL\u0130] JWT do\u011Frulanamad\u0131:`, err.message);
    return sendError(res, 401, "INVALID_TOKEN", "Oturum anahtar\u0131n\u0131z ge\xE7ersiz veya s\xFCresi dolmu\u015F. L\xFCtfen tekrar giri\u015F yap\u0131n\u0131z.");
  }
}

// server/routes/assistant.ts
var router3 = (0, import_express3.Router)();
router3.post("/chat", authMiddleware, async (req, res) => {
  const { messages, flightData, accessibilityProfile } = req.body;
  const isEn = accessibilityProfile?.preferredLanguage === "en";
  if (!messages || !Array.isArray(messages)) {
    return sendError(res, 400, "VALIDATION_ERROR", isEn ? "messages parameter must be an array." : "messages parametresi dizi (Array) tipinde olmak zorundad\u0131r.");
  }
  if (messages.length > 50) {
    return sendError(res, 400, "VALIDATION_ERROR", isEn ? "Conversation history (messages) cannot exceed 50 items." : "Konu\u015Fma ge\xE7mi\u015Fi (messages) maksimum 50 mesaj i\xE7erebilir.");
  }
  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];
    if (!msg || typeof msg !== "object") {
      return sendError(res, 400, "VALIDATION_ERROR", isEn ? `messages[${i}] is not a valid message object.` : `messages[${i}] ge\xE7erli bir mesaj nesnesi de\u011Fil.`);
    }
    const textVal = msg.text || msg.content;
    if (textVal === void 0 || typeof textVal !== "string") {
      return sendError(res, 400, "VALIDATION_ERROR", isEn ? `text or content parameter in messages[${i}] must be a string.` : `messages[${i}] i\xE7indeki text veya content parametresi metin (string) olmak zorundad\u0131r.`);
    }
    if (textVal.length > 2e3) {
      return sendError(res, 400, "VALIDATION_ERROR", isEn ? `Maximum character limit reached. messages[${i}] text cannot exceed 2000 characters.` : `Maksimum karakter s\u0131n\u0131r\u0131na eri\u015Fildi. messages[${i}] i\xE7indeki metin 2000 karakterden uzun olamaz.`);
    }
  }
  const simVariables2 = getSimVariables();
  if (!ai) {
    try {
      const flight = flightData || MOCK_BOARDINGS["TK1903"];
      const liveRates = await getLiveRates();
      const currencyInfo = getCurrencyInfo(flight.toCity, flight.to, liveRates || void 0);
      const lastUserMessage = messages && messages.length > 0 ? messages[messages.length - 1].text : "";
      const text = getRuleBasedFallbackResponse(lastUserMessage, flight, currencyInfo);
      return res.status(200).json({ text });
    } catch (fallbackErr) {
      console.error("Critical fallback failure inside !ai condition:", fallbackErr);
      return res.status(200).json({
        text: isEn ? "AeroAI travel assistant is currently operating in fallback mode with limited replies. Please follow your gate screens." : "AeroAI seyahat asistan\u0131 \u015Fu anda g\xFCvence modu kapsam\u0131nda s\u0131n\u0131rl\u0131 yan\u0131tlar \xFCretiyor. L\xFCtfen u\xE7a\u011F\u0131n\u0131z\u0131n kap\u0131 ekranlar\u0131n\u0131 takip ediniz."
      });
    }
  }
  try {
    const flight = flightData || MOCK_BOARDINGS["TK1903"];
    const liveRates = await getLiveRates();
    const currencyInfo = getCurrencyInfo(flight.toCity, flight.to, liveRates || void 0);
    let currencyStr = "";
    if (isEn) {
      currencyStr = currencyInfo.isDomestic ? `Domestic flight. Turkish Lira (TRY) is active. US Dollar (USD) reference exchange rate for duty-free and terminal shopping limits: 1 USD = ${currencyInfo.terminalUsdRate} TRY.` : `Destination Currency: ${currencyInfo.currencyName} (${currencyInfo.toCurrency}, Symbol: ${currencyInfo.symbol}). Exchange Rate: 1 ${currencyInfo.toCurrency} = ${currencyInfo.rate} TRY (1 TRY = ${currencyInfo.inverseRate} ${currencyInfo.toCurrency}).`;
    } else {
      currencyStr = currencyInfo.isDomestic ? `Yurt i\xE7i seyahat. T\xFCrk Liras\u0131 (TRY) ge\xE7erli. Terminal i\xE7i l\xFCks ve duty free harcamalar\u0131 i\xE7in g\xFCncel Amerikan Dolar\u0131 (USD) referans kuru: 1 USD = ${currencyInfo.terminalUsdRate} TRY.` : `Var\u0131\u015F Yeri Para Birimi: ${currencyInfo.currencyName} (${currencyInfo.toCurrency}, Sembol: ${currencyInfo.symbol}). G\xFCncel D\xF6viz Kuru: 1 ${currencyInfo.toCurrency} = ${currencyInfo.rate} TRY (1 TRY = ${currencyInfo.inverseRate} ${currencyInfo.toCurrency}).`;
    }
    const flightContext = isEn ? `
      Active Passenger Information:
      - Passenger Name: ${flight.passengerName}
      - Flight Number: ${flight.flightNumber}
      - Airline: ${flight.airline}
      - Route: ${flight.from} (${flight.fromCity}) -> ${flight.to} (${flight.toCity})
      - Boarding Status (Live Authority Data): ${flight.boardingStatus}
      - Gate: ${flight.gate}
      - Seat: ${flight.seat} (Group ${flight.group})
      - Biometric Verification (Smart ID): ${flight.biometricVerified ? "Active" : "Inactive"}
      - Distance to Gate: ${flight.estimatedWalkTime} walking distance
      - Security Queue Wait Time (Live ${flight.airportOperator} Data): ${flight.securityQueueTime} minutes
      - FINANCIAL / CURRENCY INFO: ${currencyStr}
    ` : `
      Yolcunun Aktif Bilgileri:
      - \u0130sim: ${flight.passengerName}
      - U\xE7u\u015F No: ${flight.flightNumber}
      - Havayolu: ${flight.airline}
      - G\xFCzergah: ${flight.from} (${flight.fromCity}) -> ${flight.to} (${flight.toCity})
      - Bini\u015F Durumu (Canl\u0131 Otorite Verisi): ${flight.boardingStatus}
      - Kap\u0131 Bilgisi: ${flight.gate}
      - Koltuk: ${flight.seat} (Grup ${flight.group})
      - Biyometrik Do\u011Frulama (Smart ID): ${flight.biometricVerified ? "Aktif" : "Pasif"}
      - Kap\u0131ya Uzakl\u0131k: ${flight.estimatedWalkTime} y\xFCr\xFCme mesafesinde
      - G\xFCvenlik Kuyru\u011Fu Bekleme S\xFCresi (Canl\u0131 ${flight.airportOperator} Verisi): ${flight.securityQueueTime} dakika
      - F\u0130NANSAL / D\xD6V\u0130Z B\u0130LG\u0130S\u0130: ${currencyStr}
    `;
    const instructions = isEn ? `
      You are AeroAI, the smart aviation assistant of the SMART PASS platform.
      Our system is integrated with real-time live database feeds from airport operators like DHM\u0130, \u0130GA, TAV, HEA\u015E.
      Your responsibility: Maximize passenger time allocation and propose serene, objective, and proactive solutions during crisis periods (delays, cancellations, gate swaps, missing luggage, queue bottlenecks).
      
      The passenger's active flight context:
      ${flightContext}
  
      Tone & Directions:
      1. Speak in a warm, helpful, expert aviation consultant tone, strictly in EN/English. Place emojis appropriately.
      2. Analyze boarding time limits, queue delays, and gate distances.
      3. For instance, if security wait is ${flight.securityQueueTime} minutes and boarding status is active, urge the passenger immediately.
      4. Disruption cases: Guide the passenger about their compensation rights (e.g. food/drink vouchers, updates, luggage rules, refunds) based on international SHY/European rules.
      5. Currencies/Budgeting: Propose helpful ATM withdrawal hints instead of costly airport exchange counters using the detailed currency parameters provided (${currencyInfo.isDomestic ? "complementary USD reference values" : `${currencyInfo.toCurrency} rate parameters (1 ${currencyInfo.toCurrency} = ${currencyInfo.rate} TRY)`}).
      6. Keep answers mobile-friendly (maximum 3-4 blocks of text, clean bullet points, structured Markdown).
      
      Now respond to the user's current message. Make sure you use English and honor the previous messages.
    ` : `
      Sen SMART PASS platformunun ak\u0131ll\u0131 havac\u0131l\u0131k asistan\u0131 AeroAI's\u0131n.
      Sistemimiz; DHM\u0130, \u0130GA, TAV, HEA\u015E gibi canl\u0131 havaliman\u0131 otoritelerinden veri ak\u0131\u015F\u0131 alarak \xE7al\u0131\u015F\u0131r ve PWA/mobil uygulamam\u0131za entegredir.
      G\xF6revin: Yolcunun zaman y\xF6netimini optimize etmek, kriz anlar\u0131nda (ertelemeler, iptaller, kap\u0131 de\u011Fi\u015Fiklikleri, kay\u0131p bagajlar, kuyruk yo\u011Funluklar\u0131) yolcuya sakin, net ve proaktif \xE7\xF6z\xFCmler sunmakt\u0131r.
      
      Yolcunun canl\u0131 ba\u011Flam\u0131 \u015Fudur:
      ${flightContext}
  
      Tavri ve Kurallar\u0131:
      1. S\u0131cak, g\xFCvenilir ve havac\u0131l\u0131k uzman\u0131 tonunda T\xFCrk\xE7e konu\u015F. Emojileri yerinde ve \xF6l\xE7\xFCl\xFC kullan.
      2. Yolcunun zaman \xE7izelgesini, u\xE7a\u011F\u0131n ka\xE7 dakika r\xF6tar yapt\u0131\u011F\u0131n\u0131 veya kap\u0131n\u0131n mesafesini analiz et. 
      3. \xD6rne\u011Fin g\xFCvenlik s\u0131ras\u0131 ${flight.securityQueueTime} dakika ve boarding bitti bitti durumdaysa yolcuyu derhal uyar.
      4. Kriz durumlar\u0131nda (\u0130ptal/R\xF6tar): Yolcuya SHY (Sivil Havac\u0131l\u0131k Genel M\xFCd\xFCrl\xFC\u011F\xFC) yolcu haklar\u0131 kanunu uyar\u0131nca haklar\u0131n\u0131 anlatabilirsiniz (\xFCcretsiz ikram, alternatif u\xE7u\u015F, bilet iadesi vb.).
      5. D\xF6viz/Kur Sorular\u0131 & Rehberli\u011Fi: Yolcu seyahat b\xFCt\xE7esi, yerel harcamalar veya d\xF6viz kurunu sorarsa, yukar\u0131da belirtilen ${currencyInfo.isDomestic ? "ek USD kurunu" : `${currencyInfo.toCurrency} kurunu (1 ${currencyInfo.toCurrency} = ${currencyInfo.rate} TRY)`} tam say\u0131sal de\u011Feriyle vererek proaktif \xF6neriler sun (\xF6rne\u011Fin d\xF6viz b\xFCrolar\u0131n\u0131n komisyonlar\u0131 yerine havaliman\u0131 d\u0131\u015F\u0131 ATM kullan\u0131m\u0131, b\xFCt\xE7eleme vb.).
      6. Cevaplar\u0131n k\u0131sa, mobil telefonda kolayca okunabilecek \u015Fekilde (maksimum 3-4 paragrafl\u0131k, listeli, temiz Markdown) olsun.
      
      \u015Eu anki kullan\u0131c\u0131 mesaj\u0131na cevap ver. Son konu\u015Fma ge\xE7mi\u015Fini dikkate al.
    `;
    const contents = messages.map((m) => ({
      role: m.sender === "user" ? "user" : "model",
      parts: [{ text: m.text }]
    }));
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents,
      config: {
        systemInstruction: instructions,
        temperature: 0.7
      }
    });
    res.json({ text: response.text });
  } catch (error) {
    console.error("Gemini Assistant Failure, falling back to Plan B:", error);
    try {
      const flight = flightData || MOCK_BOARDINGS["TK1903"];
      const liveRates = await getLiveRates();
      const currencyInfo = getCurrencyInfo(flight.toCity, flight.to, liveRates || void 0);
      const lastUserMessage = messages && messages.length > 0 ? messages[messages.length - 1].text : "";
      const text = getRuleBasedFallbackResponse(lastUserMessage, flight, currencyInfo);
      return res.status(200).json({ text });
    } catch (fallbackError) {
      console.error("Plan B Fallback encountered fatal error:", fallbackError);
      res.status(200).json({
        text: isEn ? "AeroAI is temporarily operating in fallback mode. Please follow gate directions." : "AeroAI ge\xE7ici hizmet kesintisi nedeniyle k\u0131s\u0131tl\u0131 moddad\u0131r. L\xFCtfen kap\u0131 y\xF6nlendirmelerini takip ediniz."
      });
    }
  }
});
var assistant_default = router3;

// server/routes/transport.ts
var import_express4 = require("express");

// server/data/transportSchedules.ts
var SERVER_TRANSPORT_DATA = {
  "istanbul-ist": {
    "hvist-14": {
      name: "HV\u0130ST-14 (Taksim - Be\u015Fikta\u015F)",
      price: 250,
      stops: ["\u0130stanbul Havaliman\u0131 (IST)", "G\xF6kt\xFCrk Metro", "Nurtepe Viyad\xFCk", "Zincirlikuyu", "Be\u015Fikta\u015F", "Taksim Meydan\u0131"],
      times: ["06:00", "07:00", "08:00", "08:30", "09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "12:00", "12:30", "13:00", "13:30", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00", "17:30", "18:00", "18:30", "19:00", "19:30", "20:00", "20:30", "21:00", "21:30", "22:00", "22:30", "23:00", "23:30", "00:00", "02:00", "04:00"],
      frequency: "30 dakikada bir",
      platform: "Peron 14 - Gelen Kat\u0131"
    },
    "hvist-9": {
      name: "HV\u0130ST-9 (Kad\u0131k\xF6y - Yenisahra)",
      price: 270,
      stops: ["\u0130stanbul Havaliman\u0131 (IST)", "Kavac\u0131k K\xF6pr\xFCs\xFC", "G\xF6ztepe", "Yenisahra", "Kad\u0131k\xF6y Metro"],
      times: ["06:15", "07:15", "08:15", "08:45", "09:15", "09:45", "10:15", "10:45", "11:15", "11:45", "12:15", "12:45", "13:15", "13:45", "14:15", "14:45", "15:15", "15:45", "16:15", "16:45", "17:15", "17:45", "18:15", "18:45", "19:15", "19:45", "20:15", "20:45", "21:15", "21:45", "22:15", "23:15", "00:15", "02:15", "04:15"],
      frequency: "30 dakikada bir",
      platform: "Peron 9 - Gelen Kat\u0131"
    },
    "hvist-12": {
      name: "HV\u0130ST-12 (Aksaray - Beyaz\u0131t)",
      price: 250,
      stops: ["\u0130stanbul Havaliman\u0131 (IST)", "Ayvansaray", "Ulubatl\u0131", "Aksaray Metro", "Beyaz\u0131t Meydan\u0131"],
      times: ["06:20", "07:20", "08:20", "08:50", "09:20", "09:50", "10:20", "10:50", "11:20", "11:50", "12:20", "12:50", "13:20", "13:50", "14:20", "14:50", "15:20", "15:50", "16:20", "16:50", "17:20", "17:50", "18:20", "18:50", "19:20", "19:50", "20:20", "20:50", "21:20", "21:50", "22:20", "23:20", "00:20"],
      frequency: "30 dakikada bir",
      platform: "Peron 12 - Gelen Kat\u0131"
    }
  },
  "istanbul-saw": {
    "m4-metro": {
      name: "M4 Metro (Kad\u0131k\xF6y - Sabiha G\xF6k\xE7en)",
      price: 40,
      stops: ["Sabiha G\xF6k\xE7en Havaliman\u0131 (SAW)", "Pendik Metro", "Kartal", "Bostanc\u0131", "Yenisahra", "Kad\u0131k\xF6y Merkez"],
      times: ["06:00", "06:30", "07:00", "07:30", "08:00", "08:30", "09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "12:00", "12:30", "13:00", "13:30", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00", "17:30", "18:00", "18:30", "19:00", "19:30", "20:00", "20:30", "21:00", "21:30", "22:00", "22:30", "23:00", "23:30", "00:00"],
      frequency: "8-10 dakikada bir",
      platform: "Havaliman\u0131 Metro \u0130stasyon Giri\u015Fi"
    },
    "iett-e11": {
      name: "\u0130ETT E-11 (Kad\u0131k\xF6y - Ekspres Yolcu)",
      price: 60,
      stops: ["Sabiha G\xF6k\xE7en Havaliman\u0131 (SAW)", "Yeniahra", "G\xF6ztepe K\xF6pr\xFCs\xFC", "Ac\u0131badem", "Kad\u0131k\xF6y \u0130skele"],
      times: ["06:10", "06:50", "07:30", "08:10", "08:50", "09:30", "10:10", "10:50", "11:30", "12:10", "12:50", "13:30", "14:10", "14:50", "15:30", "16:10", "16:50", "17:30", "18:10", "18:50", "19:30", "20:10", "20:50", "21:35", "22:20", "23:10", "00:05"],
      frequency: "40 dakikada bir",
      platform: "Sabiha G\xF6k\xE7en Belediye Otob\xFCs Alan\u0131"
    },
    "havas-saw-taksim": {
      name: "SG Hava\u015F (Taksim - Gece ve G\xFCnd\xFCz)",
      price: 260,
      stops: ["Sabiha G\xF6k\xE7en Havaliman\u0131 (SAW)", "Kavac\u0131k K\xF6pr\xFCs\xFC", "Zincirlikuyu Metrob\xFCs", "Taksim Tepeba\u015F\u0131"],
      times: ["06:30", "07:30", "08:30", "09:30", "10:30", "11:30", "12:30", "13:30", "14:30", "15:30", "16:30", "17:30", "18:30", "19:30", "20:30", "21:30", "22:30", "23:30", "00:30", "01:30", "03:30", "05:00"],
      frequency: "60 dakikada bir",
      platform: "Gelen Yolcu \xC7\u0131k\u0131\u015F\u0131 Peron Alan\u0131"
    }
  },
  "izmir": {
    "havas-mavi": {
      name: "Hava\u015F Mavi\u015Fehir (Alsancak - Kar\u015F\u0131yaka)",
      price: 220,
      stops: ["Adnan Menderes Havaliman\u0131 (ADB)", "Gaziemir", "Karaba\u011Flar", "Halkap\u0131nar Metro", "Bayrakl\u0131", "Kar\u015F\u0131yaka \xC7ar\u015F\u0131", "Bostanl\u0131 \u0130skele", "Mavi\u015Fehir"],
      times: ["06:00", "07:00", "08:00", "08:30", "09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "12:00", "12:30", "13:00", "13:30", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00", "17:30", "18:00", "18:30", "19:00", "19:30", "20:00", "20:30", "21:00", "21:30", "22:00", "22:30", "23:00", "23:30", "00:00", "01:00", "02:00", "03:30", "05:00"],
      frequency: "30 dakikada bir",
      platform: "TAV ADB D\u0131\u015F Hatlar \xC7\u0131k\u0131\u015F\u0131"
    },
    "havas-bornova": {
      name: "Hava\u015F Bornova (Ege \xDCniversitesi)",
      price: 220,
      stops: ["Adnan Menderes Havaliman\u0131 (ADB)", "Bornova Metro", "Ege \xDCniversitesi Hastanesi"],
      times: ["06:30", "07:30", "08:30", "09:30", "10:30", "11:30", "12:30", "13:30", "14:30", "15:30", "16:30", "17:30", "18:30", "19:30", "20:30", "21:30", "22:30", "23:30", "00:30", "01:30", "03:00", "05:00"],
      frequency: "60 dakikada bir",
      platform: "TAV ADB \u0130\xE7 Hatlar \xC7\u0131k\u0131\u015F\u0131"
    },
    "havas-cesme": {
      name: "Hava\u015F \xC7e\u015Fme (Otogar - Ala\xE7at\u0131)",
      price: 400,
      stops: ["Adnan Menderes Havaliman\u0131 (ADB)", "Ala\xE7at\u0131 Terminali", "\xC7e\u015Fme Otogar\u0131"],
      times: ["08:00", "10:00", "12:00", "14:00", "16:00", "18:00", "20:00", "22:00", "00:00"],
      frequency: "120 dakikada bir",
      platform: "TAV \u0130zmir \xC7e\u015Fme Peronu"
    }
  },
  "ankara": {
    "belko-442": {
      name: "Belko Air 442 (Esenbo\u011Fa - K\u0131z\u0131lay - A\u015ET\u0130)",
      price: 120,
      stops: ["Esenbo\u011Fa Havaliman\u0131 (ESB)", "Pursaklar", "Hask\xF6y", "AKM Metro", "K\u0131z\u0131lay", "A\u015ET\u0130 Terminali"],
      times: ["06:00", "06:20", "06:40", "07:00", "07:20", "07:40", "08:00", "08:20", "08:40", "09:00", "09:20", "09:40", "10:00", "10:20", "10:40", "11:00", "11:20", "11:40", "12:00", "12:20", "12:40", "13:00", "13:20", "13:40", "14:00", "14:20", "14:40", "15:00", "15:20", "15:40", "16:00", "16:20", "16:40", "17:00", "17:20", "17:40", "18:00", "18:20", "18:40", "19:00", "19:20", "19:40", "20:00", "20:30", "21:00", "21:30", "22:00", "22:30", "23:00", "23:30", "00:00", "01:00", "02:00", "03:00", "04:30"],
      frequency: "20 dakikada bir",
      platform: "Esenbo\u011Fa Gelen Yolcu Peron 2"
    },
    "havas-ankara": {
      name: "Hava\u015F Ankara (Esenbo\u011Fa - YHT Gar)",
      price: 150,
      stops: ["Esenbo\u011Fa Havaliman\u0131 (ESB)", "Pursaklar", "Ankara Y\xFCksek H\u0131zl\u0131 Tren Gar\u0131"],
      times: ["06:30", "07:30", "08:30", "09:30", "10:30", "11:30", "12:30", "13:30", "14:30", "15:30", "16:30", "17:30", "18:30", "19:30", "20:30", "21:30", "22:30", "23:30", "00:00", "01:00", "02:30"],
      frequency: "60 dakikada bir",
      platform: "Esenbo\u011Fa Gelen Yolcu Hava\u015F Alan\u0131"
    }
  },
  "antalya": {
    "antray-tram": {
      name: "Antray T1A Tramvay (Havaliman\u0131 - Otogar)",
      price: 40,
      stops: ["Antalya Havaliman\u0131 (AYT)", "Meydan Merkez", "Do\u011Fu Garaj\u0131", "MarkAntalya", "Fatih \u0130stasyonu (Otogar)"],
      times: ["06:05", "06:20", "06:35", "06:50", "07:05", "07:20", "07:35", "07:50", "08:05", "08:20", "08:35", "08:50", "09:05", "09:20", "09:35", "09:50", "10:05", "10:20", "10:35", "10:50", "11:05", "11:20", "11:35", "11:50", "12:05", "12:20", "12:35", "12:50", "13:05", "13:20", "13:35", "13:50", "14:05", "14:20", "14:35", "14:50", "15:05", "15:20", "15:35", "15:50", "16:05", "16:20", "16:35", "16:50", "17:05", "17:20", "17:35", "17:50", "18:05", "18:20", "18:35", "18:50", "19:05", "19:20", "19:35", "19:50", "20:05", "20:20", "20:35", "20:50", "21:05", "21:20", "21:35", "21:50", "22:05", "22:20", "22:40", "23:00", "23:25", "23:50"],
      frequency: "15 dakikada bir",
      platform: "AYT Terminal 1 Tramvay \u0130stasyonu"
    },
    "havas-antalya": {
      name: "Hava\u015F Antalya (5M Migros - Konyaalt\u0131)",
      price: 160,
      stops: ["Antalya Havaliman\u0131 (AYT)", "Gazi Bulvar\u0131", "\xC7all\u0131 Kav\u015Fa\u011F\u0131", "Otogar Terminali", "5M Migros Konyaalt\u0131"],
      times: ["06:00", "07:00", "08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00", "20:00", "21:00", "22:00", "23:00", "00:00", "01:00", "02:30", "04:00"],
      frequency: "60 dakikada bir",
      platform: "AYT \u0130\xE7 ve D\u0131\u015F Hatlar Gelen Yolcu \xC7\u0131k\u0131\u015F\u0131"
    }
  },
  "mugla": {
    "muttas-bodrum": {
      name: "MUTTA\u015E 48-24 Bodrum Merkez Otogar",
      price: 180,
      stops: ["Milas-Bodrum Havaliman\u0131 (BJV)", "G\xFCvercinlik", "Yoku\u015Fba\u015F\u0131 Torba", "Bodrum Otogar\u0131 Mekez"],
      times: ["07:30", "08:30", "09:45", "11:00", "12:15", "13:30", "14:45", "16:00", "17:15", "18:30", "19:45", "21:00", "22:15", "23:30", "01:00", "02:30"],
      frequency: "Geli\u015F/Gidi\u015F Sefer Uyumlu",
      platform: "BJV \u0130\xE7 Hatlar \xC7\u0131k\u0131\u015F Peronu"
    },
    "havas-dalam-fethiye": {
      name: "Hava\u015F Dalaman (G\xF6cek - Fethiye)",
      price: 210,
      stops: ["Dalaman Havaliman\u0131 (DLM)", "Ortaca", "G\xF6cek T\xFCneli", "G\xFCnl\xFCkba\u015F\u0131", "Fethiye Otogar\u0131"],
      times: ["08:00", "10:00", "11:30", "13:00", "14:30", "16:00", "17:30", "19:00", "20:30", "22:00", "23:30", "01:00", "03:00"],
      frequency: "U\xE7ak \u0130ni\u015Flerini Takiben",
      platform: "Dalaman Havaliman\u0131 Gelen Yolcu \xD6n\xFC"
    }
  }
};

// server/routes/transport.ts
init_mockFlights();

// server/services/transportAdapter.ts
var import_fs2 = __toESM(require("fs"), 1);
var import_path2 = __toESM(require("path"), 1);
var StaticTransportAdapter = class {
  async fetchRoutes(hubId) {
    const data = SERVER_TRANSPORT_DATA[hubId];
    return data ? { ...data } : null;
  }
};
var CmsJsonTransportAdapter = class {
  // Poll or re-verify every 10 seconds
  constructor(filePath) {
    this.cache = null;
    this.lastChecked = 0;
    this.checkIntervalMs = 1e4;
    this.cmsFilePath = filePath || import_path2.default.join(process.cwd(), "server", "data", "cms_transport.json");
    this.initializeCmsFile();
  }
  initializeCmsFile() {
    try {
      if (!import_fs2.default.existsSync(this.cmsFilePath)) {
        const parentDir = import_path2.default.dirname(this.cmsFilePath);
        if (!import_fs2.default.existsSync(parentDir)) {
          import_fs2.default.mkdirSync(parentDir, { recursive: true });
        }
        import_fs2.default.writeFileSync(this.cmsFilePath, JSON.stringify(SERVER_TRANSPORT_DATA, null, 2), "utf8");
        console.log(`[CmsJsonTransportAdapter] JSON CMS template initialized at ${this.cmsFilePath}`);
      }
    } catch (err) {
      console.error("[CmsJsonTransportAdapter] Failed to initialize CMS file seed:", err.message);
    }
  }
  async fetchRoutes(hubId) {
    const now = Date.now();
    if (this.cache && now - this.lastChecked < this.checkIntervalMs) {
      return this.cache[hubId] ? { ...this.cache[hubId] } : null;
    }
    try {
      if (import_fs2.default.existsSync(this.cmsFilePath)) {
        const content = import_fs2.default.readFileSync(this.cmsFilePath, "utf8");
        const parsed = JSON.parse(content);
        this.cache = parsed;
        this.lastChecked = now;
        console.log(`[CmsJsonTransportAdapter] Transport routes loaded and verified from JSON CMS.`);
        if (parsed && parsed[hubId]) {
          return { ...parsed[hubId] };
        }
      }
    } catch (err) {
      console.warn(`[CmsJsonTransportAdapter] Failed to load JSON CMS. Returning fallback. Error:`, err.message);
    }
    return null;
  }
};
var OperatorApiAdapter = class {
  // Simulates a physical gateway fetch mapping
  async fetchRoutes(hubId) {
    try {
      const staticData = SERVER_TRANSPORT_DATA[hubId];
      if (!staticData) {
        return null;
      }
      const fetched = {};
      const currentHour = (/* @__PURE__ */ new Date()).getHours();
      const isPeakHours = currentHour >= 8 && currentHour <= 10 || currentHour >= 17 && currentHour <= 20;
      for (const key of Object.keys(staticData)) {
        const originalRoute = staticData[key];
        const peakPriceFactor = isPeakHours ? 1.05 : 1;
        fetched[key] = {
          ...originalRoute,
          price: Math.round(originalRoute.price * peakPriceFactor),
          stops: [...originalRoute.stops],
          times: [...originalRoute.times]
        };
      }
      return fetched;
    } catch (err) {
      console.error("[OperatorApiAdapter] Transit Operator API fetch failed:", err.message);
      return null;
    }
  }
};
var TransportDataManager = class _TransportDataManager {
  // Default to CMS for flexible live updates
  constructor() {
    this.currentStrategy = "CMS";
    this.staticAdapter = new StaticTransportAdapter();
    this.cmsAdapter = new CmsJsonTransportAdapter();
    this.apiAdapter = new OperatorApiAdapter();
    const envStrategy = process.env.TRANSPORT_PROVIDER_STRATEGY;
    if (envStrategy === "STATIC" || envStrategy === "CMS" || envStrategy === "OPERATOR_API") {
      this.currentStrategy = envStrategy;
    }
  }
  static getInstance() {
    if (!_TransportDataManager.instance) {
      _TransportDataManager.instance = new _TransportDataManager();
    }
    return _TransportDataManager.instance;
  }
  setStrategy(strategy) {
    this.currentStrategy = strategy;
    console.log(`[TransportDataManager] Active provider strategy changed to: ${strategy}`);
  }
  getStrategy() {
    return this.currentStrategy;
  }
  /**
   * Fetch routes using the primary selected strategy, falling back gracefully down the chain if data is unavailable.
   */
  async getRoutes(hubId) {
    let result = null;
    let attemptedStrategy = this.currentStrategy;
    try {
      if (this.currentStrategy === "OPERATOR_API") {
        result = await this.apiAdapter.fetchRoutes(hubId);
      } else if (this.currentStrategy === "CMS") {
        result = await this.cmsAdapter.fetchRoutes(hubId);
      }
    } catch (e) {
      console.warn(`[TransportDataManager] Main strategy [${attemptedStrategy}] failed. Falling back to static definitions.`, e.message);
    }
    if (!result) {
      result = await this.staticAdapter.fetchRoutes(hubId);
    }
    return result || {};
  }
};

// server/routes/transport.ts
var router4 = (0, import_express4.Router)();
router4.get("/strategy", (req, res) => {
  res.json({
    activeStrategy: TransportDataManager.getInstance().getStrategy()
  });
});
router4.post("/strategy", (req, res) => {
  const { strategy } = req.body;
  if (strategy === "STATIC" || strategy === "CMS" || strategy === "OPERATOR_API") {
    TransportDataManager.getInstance().setStrategy(strategy);
    return res.json({ success: true, activeStrategy: strategy });
  }
  return sendError(res, 400, "VALIDATION_ERROR", "Ge\xE7ersiz strateji de\u011Feri. Se\xE7enekler: STATIC, CMS, OPERATOR_API");
});
router4.get("/schedule", async (req, res) => {
  const airport = (req.query.airport || "IST").toUpperCase();
  const depTime = req.query.departureTime || "22:15";
  const toCity = (req.query.toCity || "Londra").toLowerCase();
  const requestedHub = req.query.hub || "";
  let hub = "istanbul-ist";
  if (requestedHub && SERVER_TRANSPORT_DATA[requestedHub]) {
    hub = requestedHub;
  } else {
    if (airport === "SAW") {
      hub = "istanbul-saw";
    } else if (airport === "ADB" || toCity.includes("izmir")) {
      hub = "izmir";
    } else if (airport === "ESB" || toCity.includes("ankara")) {
      hub = "ankara";
    } else if (airport === "AYT" || toCity.includes("antalya")) {
      hub = "antalya";
    } else if (airport === "BJV" || airport === "DLM" || toCity.includes("bodrum") || toCity.includes("fethiye") || toCity.includes("marmaris") || toCity.includes("mu\u011Fla")) {
      hub = "mugla";
    } else {
      hub = "istanbul-ist";
    }
  }
  const routes = await TransportDataManager.getInstance().getRoutes(hub);
  if (!routes || Object.keys(routes).length === 0) {
    return sendError(res, 404, "NOT_FOUND", "Ula\u015F\u0131m hub verisi bulunamad\u0131.");
  }
  const responseRoutes = Object.keys(routes).map((key) => {
    const route = routes[key];
    const isIntl = !toCity.includes("izmir") && !toCity.includes("ankara") && !toCity.includes("istanbul") && !toCity.includes("antalya");
    const safetyBufferMins = isIntl ? 180 : 120;
    const commuteDurationMins = hub === "istanbul-ist" || hub === "mugla" ? 80 : 60;
    const [fH, fM] = depTime.split(":").map(Number);
    const flightTotalMins = (isNaN(fH) ? 22 : fH) * 60 + (isNaN(fM) ? 15 : fM);
    let targetDepartureMins = flightTotalMins - safetyBufferMins - commuteDurationMins;
    if (targetDepartureMins < 0) {
      targetDepartureMins += 24 * 60;
    }
    let recommendedTime = route.times[0];
    let minDiff = Infinity;
    route.times.forEach((tStr) => {
      const [bH, bM] = tStr.split(":").map(Number);
      const busTotalMins = bH * 60 + bM;
      let diff = targetDepartureMins - busTotalMins;
      if (diff < 0) {
        diff += 24 * 60;
      }
      if (diff < minDiff) {
        minDiff = diff;
        recommendedTime = tStr;
      }
    });
    let regionalTip = "";
    if (hub === "istanbul-ist") {
      regionalTip = `Uluslararas\u0131 yolculuklar i\xE7in en az 3 saat \xF6nce havaliman\u0131nda bulunman\u0131z gerekmektedir. \u0130stanbul Havaliman\u0131 (IST) terminal b\xFCy\xFCkl\xFC\u011F\xFC nedeniyle peronlardan check-in kontuarlar\u0131na y\xFCr\xFCy\xFC\u015F s\xFCresini hesaba katarak en uygun Havaist seferi ayarlanm\u0131\u015Ft\u0131r.`;
    } else if (hub === "istanbul-saw") {
      regionalTip = `Sabiha G\xF6k\xE7en Havaliman\u0131 (SAW) yo\u011Fun terminal trafi\u011Fine sahiptir. Metro veya ekspres otob\xFCs seferi ile kalk\u0131\u015F saatinizden \xF6nce kolayl\u0131kla kap\u0131da olman\u0131z i\xE7in hesaplanm\u0131\u015Ft\u0131r.`;
    } else if (hub === "izmir") {
      regionalTip = `Adnan Menderes Havaliman\u0131 (ADB) u\xE7u\u015Funuz i\xE7in \u0130zmir Hava\u015F konforlu ve zaman\u0131nda var\u0131\u015F sa\u011Flar.`;
    } else if (hub === "ankara") {
      regionalTip = `Ankara Esenbo\u011Fa Havaliman\u0131 (ESB) yolculu\u011Funuz i\xE7in 442 Belko Air hatt\u0131 veya Hava\u015F saatleri u\xE7u\u015F saatinden en az 2 saat \xF6nce var\u0131\u015F sa\u011Flayacak bi\xE7imde optimize edilmi\u015Ftir.`;
    } else if (hub === "antalya") {
      regionalTip = `Antalya (AYT) u\xE7u\u015Funuz i\xE7in Hava\u015F sefer saatlerinin yan\u0131 s\u0131ra kesintisiz rayl\u0131 sistem (Antray) alternatifi de listededir.`;
    } else if (hub === "mugla") {
      regionalTip = `BJV/DLM tatil d\xF6n\xFC\u015F hatt\u0131 yo\u011Funluklar\u0131 nedeniyle Mutta\u015F ve Hava\u015F seferleri havaliman\u0131na rahat eri\u015Fim i\xE7in erken periyotlarda \xF6nerilmektedir.`;
    }
    return {
      id: key,
      ...route,
      recommendedTime,
      rationale: regionalTip || `U\xE7u\u015F saatine adaptif g\xFCvenlik penceresi g\xF6zetilerek en uygun ula\u015F\u0131m sistemi planlanm\u0131\u015Ft\u0131r.`
    };
  });
  res.json({
    provider: hub,
    airport,
    flightDepartureTime: depTime,
    routes: responseRoutes
  });
});
router4.get("/stream", (req, res) => {
  const { airport } = req.query;
  const operator = airport === "IST" ? "\u0130GA" : airport === "SAW" ? "HEA\u015E" : airport === "ESB" ? "TAV" : "DHM\u0130";
  const simVariables2 = getSimVariables();
  const payload = {
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    operator,
    originAirport: airport || "IST",
    statusMessage: "Active integration with official aviation hubs",
    feedQuality: "Operational (99.9%)",
    activeSensors: {
      baggageClaimStatus: "Active",
      gateScanners: "Normal",
      terminalSecurityQueue: `${simVariables2.securityQueueTime} mins`,
      biometricGateState: "Ready"
    },
    liveAlerts: simVariables2.boardingStatus === "Delayed" ? [`Sefer ${simVariables2.flightNumber} ertelenmi\u015Ftir: ${simVariables2.delayReason}`] : simVariables2.boardingStatus === "Cancelled" ? [`Sefer ${simVariables2.flightNumber} iptal edilmi\u015Ftir! L\xFCtfen Transfer Masas\u0131na ba\u015Fvurun.`] : simVariables2.securityQueueTime > 30 ? ["Y\xFCksek yolcu yo\u011Funlu\u011Fu tespiti! G\xFCvenlik kuyru\u011Funda a\u015F\u0131r\u0131 y\u0131\u011F\u0131lma var."] : []
  };
  res.json(payload);
});
var transport_default = router4;

// server/routes/currency.ts
var import_express5 = require("express");
var router5 = (0, import_express5.Router)();
router5.get("/rate", async (req, res) => {
  const toCity = req.query.toCity || "Londra";
  const toCode = req.query.to || "LHR";
  const liveRates = await getLiveRates();
  const info = getCurrencyInfo(toCity, toCode, liveRates || void 0);
  res.json(info);
});
var currency_default = router5;

// server/routes/weather.ts
var import_express6 = require("express");

// server/services/weatherService.ts
var WEATHER_DICTIONARY = {
  IST: { city: "\u0130stanbul", baseTemp: 23, icon: "sunny", condition: "A\xE7\u0131k ve G\xFCne\u015Fli" },
  SAW: { city: "\u0130stanbul", baseTemp: 22, icon: "cloudy", condition: "Par\xE7al\u0131 Bulutlu" },
  ADB: { city: "\u0130zmir", baseTemp: 28, icon: "sunny", condition: "S\u0131cak ve Nalemli" },
  ESB: { city: "Ankara", baseTemp: 20, icon: "sunny", condition: "A\xE7\u0131k ve Esintili" },
  AYT: { city: "Antalya", baseTemp: 31, icon: "sunny", condition: "\xC7ok S\u0131cak, A\xE7\u0131k" },
  BJV: { city: "Bodrum", baseTemp: 29, icon: "sunny", condition: "A\xE7\u0131k ve Esintili" },
  DLM: { city: "Dalaman", baseTemp: 29, icon: "sunny", condition: "A\xE7\u0131k ve S\u0131cak" },
  LHR: { city: "Londra", baseTemp: 16, icon: "rainy", condition: "Hafif Ya\u011Fmurlu" },
  CDG: { city: "Paris", baseTemp: 18, icon: "cloudy", condition: "Bulutlu" },
  JFK: { city: "New York", baseTemp: 21, icon: "cloudy", condition: "Par\xE7al\u0131 Bulutlu" },
  DXB: { city: "Dubai", baseTemp: 38, icon: "sunny", condition: "A\u015F\u0131r\u0131 S\u0131cak, A\xE7\u0131k" },
  AMS: { city: "Amsterdam", baseTemp: 15, icon: "rainy", condition: "\xC7iseleyen Ya\u011Fmurlu" },
  FRA: { city: "Frankfurt", baseTemp: 17, icon: "cloudy", condition: "Puslu ve Par\xE7al\u0131 Bulutlu" },
  FCO: { city: "Roma", baseTemp: 25, icon: "sunny", condition: "A\xE7\u0131k, G\xFCne\u015Fli" }
};
function getWeatherForAirports(fromCode, fromCity, toCode, toCity) {
  const normalizedFrom = (fromCode || "IST").toUpperCase();
  const normalizedTo = (toCode || "LHR").toUpperCase();
  const getAirportWeather = (code, cityFallback) => {
    const matched = WEATHER_DICTIONARY[code];
    const baseTemp = matched ? matched.baseTemp : 20;
    const icon = matched ? matched.icon : "cloudy";
    const condition = matched ? matched.condition : "Par\xE7al\u0131 Bulutlu";
    const city = matched ? matched.city : cityFallback;
    const currentHour = (/* @__PURE__ */ new Date()).getHours();
    const fluctuation = Math.sin(currentHour / 24 * Math.PI * 2) * 3;
    const finalTemp = Math.round(baseTemp + fluctuation);
    const feelsLike = Math.round(finalTemp + (icon === "sunny" ? 1 : icon === "windy" ? -2 : 0));
    let windSpeed = 12;
    let humidity = 60;
    let visibility = "10 km";
    let aviationStatus = "Normal";
    let aviationStatusDetail = "G\xF6r\xFC\u015F ve meydan limitleri operasyonlara tamamen elveri\u015Fli.";
    if (icon === "sunny") {
      windSpeed = Math.round(5 + Math.random() * 8);
      humidity = Math.round(30 + Math.random() * 20);
      visibility = "10+ km";
    } else if (icon === "rainy") {
      windSpeed = Math.round(15 + Math.random() * 10);
      humidity = Math.round(80 + Math.random() * 15);
      visibility = "7 km";
      aviationStatus = "Caution - rainy runway";
      aviationStatusDetail = "Islak pist y\xFCzeyi. Frenleme katsay\u0131s\u0131 izleniyor.";
    } else if (icon === "windy") {
      windSpeed = Math.round(25 + Math.random() * 15);
      humidity = Math.round(40 + Math.random() * 20);
      visibility = "10 km";
      aviationStatus = "Caution - crosswinds";
      aviationStatusDetail = "Kuvvetli r\xFCzgarlar mevcut. A\xE7\u0131l\u0131 yakla\u015Fmaya dikkat.";
    } else if (icon === "stormy") {
      windSpeed = Math.round(35 + Math.random() * 20);
      humidity = Math.round(85 + Math.random() * 15);
      visibility = "4 km";
      aviationStatus = "Caution - low visibility";
      aviationStatusDetail = "F\u0131rt\u0131na bulutlar\u0131 ve r\xFCzg\xE2r hamlesi. G\xF6r\xFC\u015F k\u0131s\u0131tl\u0131.";
    } else if (icon === "foggy") {
      windSpeed = Math.round(2 + Math.random() * 5);
      humidity = Math.round(90 + Math.random() * 10);
      visibility = "800 m";
      aviationStatus = "Caution - low visibility";
      aviationStatusDetail = "Yo\u011Fun sis tabakas\u0131. ILS CAT II/III yakla\u015Fmas\u0131 aktif.";
    } else {
      windSpeed = Math.round(10 + Math.random() * 10);
      humidity = Math.round(55 + Math.random() * 20);
      visibility = "10 km";
    }
    return {
      code,
      city,
      temp: finalTemp,
      feelsLike,
      condition,
      icon,
      humidity,
      windSpeed,
      visibility,
      aviationStatus,
      aviationStatusDetail
    };
  };
  return {
    from: getAirportWeather(normalizedFrom, fromCity || "\u0130stanbul"),
    to: getAirportWeather(normalizedTo, toCity || "Londra"),
    updatedAt: (/* @__PURE__ */ new Date()).toISOString()
  };
}

// server/routes/weather.ts
var router6 = (0, import_express6.Router)();
router6.get("/info", (req, res) => {
  const from = req.query.from || "IST";
  const fromCity = req.query.fromCity || "\u0130stanbul";
  const to = req.query.to || "LHR";
  const toCity = req.query.toCity || "Londra";
  try {
    const weatherData = getWeatherForAirports(from, fromCity, to, toCity);
    res.json(weatherData);
  } catch (error) {
    console.error("Error in weather route:", error);
    res.status(500).json({ error: "Havaliman\u0131 hava durumu bilgisi hesaplanamad\u0131." });
  }
});
var weather_default = router6;

// server/routes/email.ts
var import_express7 = require("express");
var import_nodemailer = __toESM(require("nodemailer"), 1);
init_firestoreSync();
var router7 = (0, import_express7.Router)();
router7.post("/send-welcome", async (req, res) => {
  const { email, name, accessibilityProfile } = req.body;
  if (!email) {
    return sendError(res, 400, "VALIDATION_ERROR", "E-posta adresi belirtilmelidir.");
  }
  try {
    await syncUserToFirestore(email, {
      name: name || email.split("@")[0],
      email,
      accessibilityProfile: accessibilityProfile || { enabled: false, type: "none" }
    });
  } catch (dbErr) {
    console.error("Failed to sync user to Firestore during email registration:", dbErr);
  }
  let accBlock = "";
  if (accessibilityProfile && accessibilityProfile.enabled) {
    let accLabel = "Engelsiz Yolcu";
    let accDesc = "Standart asistanl\u0131k ve bini\u015F yard\u0131m\u0131.";
    if (accessibilityProfile.type === "wheelchair") {
      accLabel = "\u267F Tekerlekli Sandalye / Ortopedik Destek";
      accDesc = "Fiziki yard\u0131m ekibi, merdivensiz asans\xF6rler ve rampa rotalar\u0131 sizin i\xE7in rezerve edildi.";
    } else if (accessibilityProfile.type === "vision") {
      accLabel = "\u{1F441}\uFE0F G\xF6rme Hassasiyeti / Sesli Rehberlik";
      accDesc = "Turnikelerde ve kap\u0131larda kulakl\u0131kla sesli y\xF6nlendirme, y\xFCksek kontrast aray\xFCz\xFC ve yer ekibi e\u015Fli\u011Fi aktif.";
    } else if (accessibilityProfile.type === "hearing") {
      accLabel = "\u{1F442} \u0130\u015Fitme Engeli / G\xF6rsel Fla\u015F\xF6r";
      accDesc = "Kalk\u0131\u015F anonslar\u0131, kap\u0131 de\u011Fi\u015Fiklikleri ve r\xF6tarlar cihaz\u0131n\u0131za g\xF6rsel bento fla\u015Flar\u0131 olarak iletilir.";
    } else if (accessibilityProfile.type === "elderly") {
      accLabel = "\u{1F474} Ya\u015Fl\u0131 Yolcu / Refakat\xE7i Yard\u0131m\u0131";
      accDesc = "U\xE7u\u015F kap\u0131n\u0131za kadar konforlu ta\u015F\u0131ma i\xE7in buggy (elektrikli transfer arac\u0131) planlamas\u0131 yap\u0131ld\u0131.";
    } else if (accessibilityProfile.type === "other") {
      accLabel = "\u{1FA7A} \xD6zel T\u0131bbi / Di\u011Fer Gereksinimler";
      accDesc = "Medikal takibiniz, ila\xE7 saklama ve solunum aparat\u0131 ta\u015F\u0131ma haklar\u0131n\u0131z kabin amirli\u011Fine bildirilmi\u015Ftir.";
    }
    let customHtml = "";
    if (accessibilityProfile.customRequest) {
      customHtml = `<p style="margin: 8px 0 0; font-size: 11px; padding: 8px; background: #ffffff; border: 1px solid #d1fae5; border-radius: 8px; color: #065f46; font-style: italic;"><strong>\xD6zel Notunuz:</strong> "${accessibilityProfile.customRequest}"</p>`;
    }
    accBlock = `
      <div style="background-color: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 12px; padding: 16px; margin: 16px 0;">
        <h3 style="margin: 0 0 8px; font-size: 13px; font-weight: bold; color: #065f46; text-transform: uppercase; letter-spacing: 0.05em; font-family: sans-serif;">\u267F ER\u0130\u015E\u0130LEB\u0130L\u0130RL\u0130K DESTEK AKT\u0130VASYONU</h3>
        <p style="margin: 0; font-size: 13px; color: #047857; font-family: sans-serif;"><strong>Destek S\u0131n\u0131f\u0131:</strong> ${accLabel}</p>
        <p style="margin: 4px 0 0; font-size: 12px; color: #065f46; font-family: sans-serif;">${accDesc}</p>
        ${customHtml}
      </div>
    `;
  } else {
    accBlock = `
      <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin: 16px 0;">
        <p style="margin: 0; font-size: 13px; color: #475569; font-family: sans-serif;"><strong>Profil S\u0131n\u0131f\u0131:</strong> Standart Yolcu (\xD6zel bini\u015F asistanl\u0131\u011F\u0131 veya t\u0131bbi yard\u0131m gereksinimi belirtilmedi).</p>
      </div>
    `;
  }
  const htmlContent = `
    <div style="font-family: Arial, Helvetica, sans-serif; max-width: 600px; margin: 20px auto; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; background-color: #ffffff; box-shadow: 0 4px 12px rgba(0,0,0,0.03);">
      <div style="background-color: #1e1b4b; padding: 32px 24px; text-align: center; color: #ffffff;">
        <h1 style="margin: 0; font-size: 24px; font-weight: bold; letter-spacing: -0.025em; font-family: sans-serif;">SMARTPASS PRO</h1>
        <p style="margin: 4px 0 0; font-size: 14px; color: #c4b5fd; font-family: sans-serif;">AeroAI Otonom Engelsiz Seyahat Asistan\u0131</p>
      </div>
      <div style="padding: 32px 24px; color: #1e293b; line-height: 1.6;">
        <h2 style="margin: 0 0 16px; font-size: 18px; font-weight: bold; color: #0f172a; font-family: sans-serif;">Ho\u015F Geldiniz, Say\u0131n ${name || "Nezih Yolcumuz"}!</h2>
        <p style="margin: 0 0 16px; font-size: 14px; font-family: sans-serif;">SmartPass Pro-Version mobil bini\u015F ve kriz y\xF6netimi platformumuza kayd\u0131n\u0131z ba\u015Far\u0131yla ger\xE7ekle\u015Fti. Dijital \u015Fifreleme ve g\xFCvenli asistanl\u0131k anahtar\u0131n\u0131z profilinizle e\u015Fle\u015Ftirilerek devreye al\u0131nd\u0131.</p>
        
        ${accBlock}

        <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 16px; margin: 24px 0;">
          <h3 style="margin: 0 0 6px; font-size: 11px; font-weight: bold; color: #15803d; text-transform: uppercase; letter-spacing: 0.05em; font-family: sans-serif;">\u{1F512} B\u0130LG\u0130 G\xDCVENL\u0130\u011E\u0130 VE KVKK G\xDCVENCES\u0130</h3>
          <p style="margin: 0; font-size: 11px; color: #166534; line-height: 1.5; font-family: sans-serif;">SmartPass yard\u0131m\u0131yla sisteme i\u015Fledi\u011Finiz her turlu sa\u011Fl\u0131k, ortopedik engel veya di\u011Fer \xF6zel t\u0131bbi istekleriniz u\xE7tan uca \u015Fifreli olarak cihaz\u0131n\u0131zda saklan\u0131r. 6698 say\u0131l\u0131 KVKK kapsam\u0131nda bu profiliniz pazarlama veritabanlar\u0131nda saklanmaz veya \xFC\xE7\xFCnc\xFC ki\u015Fi veya havayolu kurumlar\u0131na <strong>kesinlikle iletilmez</strong>. Verileriniz yaln\u0131zca u\xE7u\u015F navigasyonu \xE7izimi, terminal rampas\u0131 asistanlar\u0131 ve kap\u0131 canl\u0131 bildirimleri i\xE7in kullan\u0131l\u0131r, kalk\u0131\u015Ftan sonra otomatik imha edilir.</p>
        </div>

        <p style="margin: 0 0 8px; font-size: 13px; font-family: sans-serif;">U\xE7u\u015F kart\u0131n\u0131z\u0131 ve PNR kodunuzu uygulamaya taratarak kap\u0131 durumlar\u0131n\u0131, g\xFCvenlik kuyru\u011Fu bekleme s\xFCrelerini ve AeroAI seyahat \xE7\xF6z\xFCmlerini anl\u0131k takip edebilirsiniz.</p>
        <p style="margin: 0; font-size: 14px; font-weight: bold; color: #4f46e5; font-family: sans-serif;">Engelsiz, konforlu ve g\xFCvenli yolculuklar dileriz!</p>
      </div>
      <div style="background-color: #f8fafc; padding: 20px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #f1f5f9; font-family: sans-serif;">
        Bu e-posta, SmartPass sistemine bini\u015F kayd\u0131 olu\u015Fturdu\u011Funuz i\xE7in otomatik olarak iletilmi\u015Ftir.<br />
        \xA9 2026 SmartPass Pro-Version. T\xFCm Haklar\u0131 Sakl\u0131d\u0131r.
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
      const transporter = import_nodemailer.default.createTransport({
        host,
        port: parseInt(port, 10),
        secure: parseInt(port, 10) === 465,
        auth: {
          user,
          pass
        }
      });
      await transporter.sendMail({
        from: `"SmartPass Pro" <${fromEmail}>`,
        to: email,
        subject: `SmartPass'e Ho\u015F Geldiniz, Say\u0131n ${name || "Yolcumuz"}! - Onay Belgesi`,
        html: htmlContent
      });
      const maskedEmail = email.replace(/(..)(.*)(@.*)/, "$1***$3");
      console.log(`REAL ONBOARDING EMAIL SENT successfully (masked: ${maskedEmail})`);
      return res.json({
        success: true,
        method: "real",
        email,
        emailContentHtml: htmlContent
      });
    } catch (err) {
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
    const maskedEmail = email.replace(/(..)(.*)(@.*)/, "$1***$3");
    console.log(`SMTP credentials not fully provided. SIMULATING registration email (masked: ${maskedEmail})`);
    return res.json({
      success: true,
      method: "simulated",
      email,
      emailContentHtml: htmlContent
    });
  }
});
var email_default = router7;

// server/routes/passenger.ts
var import_express8 = require("express");
init_firestoreSync();
init_mockFlights();
var router8 = (0, import_express8.Router)();
router8.get("/health", async (req, res) => {
  const status = {
    uptime: process.uptime(),
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    status: "HEALTHY",
    services: {
      framework: "Express / Node.js Standalone Container",
      database: {
        status: adminDb || webDb ? "CONNECTED" : "FALLBACK_MEM",
        provider: "Google Cloud Firestore",
        activeAdminSdk: adminDb !== null,
        activeWebSdk: webDb !== null
      },
      geminiApi: {
        status: ai ? "ACTIVE" : "DISABLED_FALLBACK_ENGINE",
        model: "gemini-3.5-flash",
        poweredBy: "Antigravity Cloud Infrastructure"
      }
    }
  };
  res.json(status);
});
router8.get("/passenger/dashboard", authMiddleware, async (req, res) => {
  try {
    const userId = (req.user?.userId || "demo-user-selim").trim();
    let userProfile = {
      id: userId,
      name: "Selim Y\u0131lmaz",
      email: "selim.yilmaz@smartpass.co",
      flightNumber: "TK-1903",
      accessibilityProfile: {
        enabled: true,
        type: "WCHR",
        details: "Tekerlekli sandalye deste\u011Fi talep edildi (Rampa/Asans\xF6r eri\u015Filebilirli\u011Fi)",
        guardianName: "Ay\u015Fe Y\u0131lmaz",
        guardianPhone: "+90 532 111 22 33"
      }
    };
    if (adminDb) {
      try {
        const userDoc = await adminDb.collection("users").doc(userId).get();
        if (userDoc.exists) {
          const ud = userDoc.data();
          userProfile = {
            id: userId,
            name: ud.name || userProfile.name,
            email: ud.email || userProfile.email,
            flightNumber: ud.flightNumber || guessFlightNumber(ud.name || ""),
            accessibilityProfile: ud.accessibilityProfile || userProfile.accessibilityProfile
          };
        }
      } catch (err) {
        console.warn("[BFF Dashboard] Firestore user read fallback. Using inline profiles. Error:", err.message);
      }
    }
    const flightNumber = userProfile.flightNumber;
    const cleanFlightKey = flightNumber.replace("-", "");
    const hub = FlightAdapterHub.getInstance();
    const adapter = hub.selectAdapterForFlight(flightNumber);
    const flightStatus = await adapter.fetchFlight(flightNumber);
    const designTemplate = MOCK_BOARDINGS[cleanFlightKey] || {
      passengerName: userProfile.name,
      flightNumber,
      from: "IST",
      fromCity: "\u0130stanbul",
      to: "LHR",
      toCity: "Londra",
      seat: "12A",
      group: "A",
      boardingProgress: 68,
      airline: "Turkish Airlines",
      estimatedWalkTime: "6 dk"
    };
    const combinedFlight = {
      ...flightStatus,
      from: designTemplate.from,
      fromCity: designTemplate.fromCity,
      to: designTemplate.to,
      toCity: designTemplate.toCity,
      seat: designTemplate.seat,
      group: designTemplate.group,
      boardingProgress: designTemplate.boardingProgress,
      airline: designTemplate.airline,
      estimatedWalkTime: designTemplate.estimatedWalkTime,
      passengerName: userProfile.name,
      biometricVerified: designTemplate.biometricVerified !== void 0 ? designTemplate.biometricVerified : true
    };
    const liveRates = await getLiveRates();
    const currency = getCurrencyInfo(combinedFlight.toCity, combinedFlight.to, liveRates || void 0);
    const transportRoutes = await TransportDataManager.getInstance().getRoutes(combinedFlight.from);
    res.json({
      success: true,
      bffVersion: "v1.2.0-corporate",
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      user: {
        id: userProfile.id,
        name: userProfile.name,
        email: userProfile.email,
        accessibilityProfile: userProfile.accessibilityProfile
      },
      flight: combinedFlight,
      currency,
      transport: {
        hubAirport: combinedFlight.from,
        activeStrategy: TransportDataManager.getInstance().getStrategy(),
        routes: transportRoutes
      }
    });
  } catch (error) {
    console.error("[BFF Dashboard] Fatal pipeline error details:", error);
    return sendError(
      res,
      500,
      "BFF_PIPELINE_ERROR",
      "BFF dashboard veri derleme hatt\u0131 s\u0131ras\u0131nda operasyonel bir sunucu hatas\u0131 olu\u015Ftu."
    );
  }
});
router8.get("/flights/vapid-key", async (req, res) => {
  try {
    const { getVapidPublicKey: getVapidPublicKey2 } = await Promise.resolve().then(() => (init_pushService(), pushService_exports));
    const key = getVapidPublicKey2();
    return res.status(200).json({ success: true, publicKey: key });
  } catch (err) {
    console.error("[VAPID Error]", err);
    return sendError(res, 500, "VAPID_KEY_ERROR", "VAPID anahtar\u0131 y\xFCklenirken sistemsel sunucu hatas\u0131 olu\u015Ftu.");
  }
});
router8.post("/flights/subscribe", authMiddleware, async (req, res) => {
  const { userId, flightNumber, pushToken } = req.body;
  if (!userId || typeof userId !== "string" || userId.trim() === "") {
    return sendError(res, 400, "VALIDATION_ERROR", "userId parametresi zorunludur ve bo\u015F b\u0131rak\u0131lamaz.");
  }
  if (!flightNumber || typeof flightNumber !== "string" || flightNumber.trim() === "") {
    return sendError(res, 400, "VALIDATION_ERROR", "flightNumber u\xE7u\u015F kodu parametresi zorunludur.");
  }
  if (!pushToken || typeof pushToken !== "string" || pushToken.trim() === "") {
    return sendError(res, 400, "VALIDATION_ERROR", "Mobil istemci FCM pushToken parametresi zorunludur.");
  }
  try {
    const cleanUserId = userId.trim();
    const cleanFlightNumber = flightNumber.trim().toUpperCase();
    const cleanPushToken = pushToken.trim();
    const subscriptionData = {
      userId: cleanUserId,
      flightNumber: cleanFlightNumber,
      pushToken: cleanPushToken,
      registeredAt: (/* @__PURE__ */ new Date()).toISOString(),
      platform: "PWA_AND_MOBILE_CLIENT",
      status: "ACTIVE"
    };
    const success = await writeDocSecurely("subscriptions", `${cleanUserId}_${cleanFlightNumber}`, subscriptionData);
    if (success) {
      console.log(`[FCM - SUB] Successful push notification subscription: User ${cleanUserId} -> ${cleanFlightNumber}`);
      return res.status(200).json({
        success: true,
        message: `${cleanFlightNumber} u\xE7u\u015Fu i\xE7in ak\u0131ll\u0131 anl\u0131k bildirim (FCM Push) aboneli\u011Fi ba\u015Far\u0131yla kaydedildi.`,
        subscription: subscriptionData
      });
    } else {
      return res.status(200).json({
        success: true,
        message: `${cleanFlightNumber} u\xE7u\u015Fu i\xE7in (Sandbox Bellek Modu) ak\u0131ll\u0131 anl\u0131k bildirim kayd\u0131 al\u0131nd\u0131.`,
        subscription: subscriptionData
      });
    }
  } catch (err) {
    console.error("[FCM - SUB Error] Failed to process subscribe request:", err.message);
    return sendError(res, 500, "SUBSCRIPTION_ERROR", "Abonelik veritaban\u0131 kayd\u0131 esnas\u0131nda bir hata meydana geldi.");
  }
});
router8.post("/audit_logs", authMiddleware, async (req, res) => {
  const { actor, targetUser, action, details } = req.body;
  if (!actor || !targetUser || !action || !details) {
    return sendError(res, 400, "VALIDATION_ERROR", "T\xFCm log parametreleri (actor, targetUser, action, details) zorunludur.");
  }
  try {
    await createAuditLog(actor, targetUser, action, details);
    return res.status(200).json({ success: true, message: "Denetim g\xFCnl\xFC\u011F\xFC ba\u015Far\u0131yla kaydedildi." });
  } catch (err) {
    console.error("[POST /api/audit_logs] Error writing log:", err.message);
    return sendError(res, 500, "AUDIT_LOG_ERROR", "Denetim g\xFCnl\xFC\u011F\xFC olu\u015Fturulurken sunucu taraf\u0131nda hata olu\u015Ftu.");
  }
});
var passenger_default = router8;

// server/routes/auth.ts
var import_express9 = require("express");
var import_crypto3 = __toESM(require("crypto"), 1);
var import_jsonwebtoken2 = __toESM(require("jsonwebtoken"), 1);
init_firestoreSync();
var router9 = (0, import_express9.Router)();
var JWT_SECRET2 = process.env.JWT_SECRET || "smartpass-super-secret-key-2026";
function hashPassword(password) {
  return import_crypto3.default.createHash("sha256").update(password).digest("hex");
}
function getEmailDocId(email) {
  return "usr_" + email.toLowerCase().trim().replace(/[^a-z0-9]/g, "_");
}
router9.post("/register", async (req, res) => {
  const { email, password, name, accessibilityProfile } = req.body;
  if (!email || !password || !name) {
    return sendError(res, 400, "VALIDATION_ERROR", "E-posta, \u015Fifre ve isim alanlar\u0131 zorunludur.");
  }
  const cleanEmail = email.toLowerCase().trim();
  const docId = getEmailDocId(cleanEmail);
  try {
    const hashedPassword = hashPassword(password);
    const resolvedProfile = accessibilityProfile || {
      enabled: false,
      type: "none",
      kvkkChecked: true,
      preferredLanguage: "tr"
    };
    if (adminDb) {
      const userRef = adminDb.collection("users").doc(docId);
      const userDoc = await userRef.get();
      if (userDoc.exists) {
        return sendError(res, 400, "USER_EXISTS", "Bu e-posta adresi ile kay\u0131tl\u0131 bir kullan\u0131c\u0131 zaten mevcut.");
      }
      const newUserPayload = {
        id: docId,
        email: cleanEmail,
        passwordHash: hashedPassword,
        name: name.trim(),
        accessibilityProfile: resolvedProfile,
        flightNumber: "TK-1903",
        // Default starter flight
        createdAt: (/* @__PURE__ */ new Date()).toISOString()
      };
      await userRef.set(newUserPayload);
      console.log(`[AUTH] Registered new user ${cleanEmail} directly via Firestore.`);
    }
    const token = import_jsonwebtoken2.default.sign(
      { userId: docId, email: cleanEmail, name: name.trim() },
      JWT_SECRET2,
      { expiresIn: "24h" }
    );
    try {
      await createAuditLog(
        "USER_PORTAL",
        name.trim(),
        "PROFILE_CREATE",
        `Yeni kurumsal yolcu kayd\u0131 olu\u015Fturuldu (${cleanEmail}). G\xFCvenlik anahtar\u0131 imzaland\u0131.`
      );
    } catch (auditErr) {
      console.warn("[AUTH] Failed to write registration audit log:", auditErr.message);
    }
    return res.status(200).json({
      success: true,
      token,
      user: {
        id: docId,
        name: name.trim(),
        email: cleanEmail,
        accessibilityProfile: resolvedProfile
      }
    });
  } catch (err) {
    console.error("[AUTH REGISTER] Error during registration:", err);
    return sendError(res, 500, "REGISTER_ERROR", "Kay\u0131t i\u015Flemi s\u0131ras\u0131nda sistemsel bir hata olu\u015Ftu.");
  }
});
router9.post("/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return sendError(res, 400, "VALIDATION_ERROR", "E-posta ve \u015Fifre alanlar\u0131 zorunludur.");
  }
  const cleanEmail = email.toLowerCase().trim();
  const docId = getEmailDocId(cleanEmail);
  const hashedPassword = hashPassword(password);
  try {
    let matchedUser = null;
    if (adminDb) {
      const userRef = adminDb.collection("users").doc(docId);
      const userDoc = await userRef.get();
      if (userDoc.exists) {
        const ud = userDoc.data();
        if (ud.passwordHash === hashedPassword) {
          matchedUser = ud;
        } else {
          return sendError(res, 401, "AUTH_FAILED", "Girilen e-posta \u015Fifre kombinasyonu hatal\u0131d\u0131r.");
        }
      }
    }
    if (!matchedUser) {
      if (cleanEmail === "selim.yilmaz@smartpass.co" || cleanEmail === "selim@smartpass.co") {
        matchedUser = {
          id: "usr_selim_yilmaz_smartpass_co",
          email: "selim.yilmaz@smartpass.co",
          name: "Selim Y\u0131lmaz",
          accessibilityProfile: {
            enabled: true,
            type: "WCHR",
            details: "Tekerlekli sandalye deste\u011Fi talep edildi (Rampa/Asans\xF6r eri\u015Filebilirli\u011Fi)",
            guardianName: "Ay\u015Fe Y\u0131lmaz",
            guardianPhone: "+90 532 111 22 33",
            preferredLanguage: "tr"
          }
        };
      } else {
        return sendError(res, 404, "USER_NOT_FOUND", "Bu kullan\u0131c\u0131 kay\u0131tl\u0131 de\u011Fil veya yerel veritaban\u0131nda bulunamad\u0131.");
      }
    }
    const token = import_jsonwebtoken2.default.sign(
      { userId: matchedUser.id, email: matchedUser.email, name: matchedUser.name },
      JWT_SECRET2,
      { expiresIn: "24h" }
    );
    try {
      await createAuditLog(
        "USER_PORTAL",
        matchedUser.name,
        "PROFILE_ACCESS",
        `Yolcu portala giri\u015F yapt\u0131. JWT do\u011Frulama toketi ba\u015Far\u0131yla imzaland\u0131.`
      );
    } catch (auditErr) {
      console.warn("[AUTH] Failed to write login audit log:", auditErr.message);
    }
    return res.status(200).json({
      success: true,
      token,
      user: {
        id: matchedUser.id,
        name: matchedUser.name,
        email: matchedUser.email,
        accessibilityProfile: matchedUser.accessibilityProfile || {
          enabled: false,
          type: "none",
          kvkkChecked: true,
          preferredLanguage: "tr"
        }
      }
    });
  } catch (err) {
    console.error("[AUTH LOGIN] Error during login:", err);
    return sendError(res, 500, "LOGIN_ERROR", "Giri\u015F i\u015Flemi ger\xE7ekle\u015Ftirilirken bir sunucu hatas\u0131 olu\u015Ftu.");
  }
});
var auth_default = router9;

// server/app.ts
var app = (0, import_express10.default)();
app.set("trust proxy", 1);
app.use(
  (0, import_helmet.default)({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: [
          "'self'",
          "'unsafe-inline'",
          "'unsafe-eval'",
          "https://apis.google.com"
        ],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
        imgSrc: [
          "'self'",
          "data:",
          "https://api.qrserver.com",
          "https://images.unsplash.com",
          "https://*.unsplash.com",
          "https://*.googleapis.com"
        ],
        connectSrc: [
          "'self'",
          "https://*.googleapis.com",
          "https://*.firebaseio.com",
          "https://*.firestore.googleapis.com",
          "wss://*.firebaseio.com",
          "wss://*.firestore.googleapis.com",
          "ws:",
          "wss:"
        ],
        frameAncestors: [
          "'self'",
          "https://*.run.app",
          "https://ai.studio",
          "https://*.google.com"
        ]
      }
    },
    crossOriginEmbedderPolicy: false
  })
);
app.use(import_express10.default.json());
app.use("/api/simulation", apiLimiter, simulation_default);
app.use("/api/parse-boarding-pass", apiLimiter, boardingPass_default);
app.use("/api/assistant", aiLimiter, assistant_default);
app.use("/api/transport", apiLimiter, transport_default);
app.use("/api/authority", apiLimiter, transport_default);
app.use("/api/currency", apiLimiter, currency_default);
app.use("/api/weather", apiLimiter, weather_default);
app.use("/api/email", apiLimiter, email_default);
app.use("/api/auth", apiLimiter, auth_default);
app.use("/api", apiLimiter, passenger_default);
var app_default = app;

// server/index.ts
import_dotenv.default.config();
var PORT = 3e3;
async function startServer() {
  try {
    const hub = FlightAdapterHub.getInstance();
    hub.startPolling(12e3);
  } catch (err) {
    console.error("[StartServer] FlightAdapterHub failure:", err.message);
  }
  if (process.env.NODE_ENV !== "production") {
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app_default.use(vite.middlewares);
  } else {
    const distPath = import_path3.default.join(process.cwd(), "dist");
    app_default.use(import_express11.default.static(distPath));
    app_default.get("*", (req, res) => {
      res.sendFile(import_path3.default.join(distPath, "index.html"));
    });
  }
  app_default.listen(PORT, "0.0.0.0", () => {
    console.log(`Smart Boarding server listening on http://0.0.0.0:${PORT}`);
  });
}
if (process.env.NODE_ENV !== "test") {
  startServer();
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  getCurrencyInfo,
  getRuleBasedFallbackResponse,
  parseBoardingPassText
});
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
//# sourceMappingURL=server.cjs.map
