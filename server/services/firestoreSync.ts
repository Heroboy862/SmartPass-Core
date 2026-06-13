import { initializeApp as initializeWebApp } from "firebase/app";
import { getFirestore as getWebFirestore, doc as webDoc, setDoc as webSetDoc, addDoc, collection } from "firebase/firestore";
import admin from "firebase-admin";
import { getFirestore as getAdminFirestore } from "firebase-admin/firestore";
import fs from "fs";
import path from "path";
import { MOCK_BOARDINGS } from "../data/mockFlights";

export let adminDb: any = null;
export let webDb: any = null;

try {
  const configPath = path.join(process.cwd(), "firebase-applet-config.json");
  if (fs.existsSync(configPath)) {
    const firebaseConfig = JSON.parse(fs.readFileSync(configPath, "utf-8"));
    
    // 1. Initialize Firebase Admin SDK (Privileged Bypasses Security Rules for Backend Operations)
    try {
      if (admin.apps.length === 0) {
        admin.initializeApp({
          projectId: firebaseConfig.projectId
        });
      }
      
      const firestoreDatabaseId = firebaseConfig.firestoreDatabaseId || "(default)";
      if (firestoreDatabaseId && firestoreDatabaseId !== "(default)" && firestoreDatabaseId !== "default") {
        try {
          adminDb = getAdminFirestore(admin.app(), firestoreDatabaseId);
        } catch (dbErr: any) {
          console.warn("[Admin Setup] Could not specify custom Database ID directly. Using standard fallback or default db:", dbErr.message);
          adminDb = getAdminFirestore(admin.app());
        }
      } else {
        adminDb = getAdminFirestore(admin.app());
      }
      console.log(`[DHMİ Otorite - ADMIN] Admin SDK authenticated. Database Id: ${firestoreDatabaseId}`);
    } catch (adminErr: any) {
      console.warn("[DHMİ Otorite - ADMIN] Failed to initialize Admin SDK. Using Web SDK Fallback:", adminErr.message);
    }

    // 2. Initialize Web SDK Fallback
    try {
      const fbApp = initializeWebApp(firebaseConfig);
      webDb = getWebFirestore(fbApp, firebaseConfig.firestoreDatabaseId);
      console.log(`[DHMİ Otorite - WEB] Web SDK Fallback connected.`);
    } catch (webErr: any) {
      console.error("[DHMİ Otorite - WEB] Web SDK Fallback failed to initialize:", webErr.message);
    }
  } else {
    console.warn("[DHMİ Otorite] firebase-applet-config.json not found.");
  }
} catch (err: any) {
  console.error("[DHMİ Otorite] Global Firebase bootstrap error:", err);
}

let useAdminDb = true;

/**
 * Helper to predict flight number based on passenger name for clean demo matching
 */
export function guessFlightNumber(name: string): string {
  if (!name) return "TK-1903";
  const lower = name.toLowerCase();
  if (lower.includes("selim") || lower.includes("yılmaz") || lower.includes("yilmaz")) return "TK-1903";
  if (lower.includes("elif") || lower.includes("demir")) return "PC-2026";
  if (lower.includes("dmitry") || lower.includes("smirnov")) return "TK-2108";
  if (lower.includes("can") || lower.includes("aksoy")) return "AJ-4112";
  return "TK-1903"; // Standard default fallback
}

/**
 * Universal safe document writer
 */
export async function writeDocSecurely(collectionName: string, docId: string, data: any) {
  // Option A (Preferred): Privileged Admin SDK
  if (adminDb && useAdminDb) {
    try {
      const docRef = adminDb.collection(collectionName).doc(docId);
      await docRef.set(data, { merge: true });
      console.log(`[Firestore Sync] Admin write successful on ${collectionName}/${docId}`);
      return true;
    } catch (adminErr: any) {
      // Gracefully switch to Web SDK and disable Admin SDK warning loops
      useAdminDb = false;
      console.info(`[Firestore Sync] Backend Admin access not authorized. Seamlessly falling back to secure public API client.`);
    }
  }

  // Option B (Fallback): Standard Web SDK (evaluates security rules)
  if (webDb) {
    try {
      const docRef = webDoc(webDb, collectionName, docId);
      await webSetDoc(docRef, data, { merge: true });
      console.log(`[Firestore Sync] Web API client write successful on ${collectionName}/${docId}`);
      return true;
    } catch (webErr: any) {
      console.error(`[Firestore Sync] Web API client write failed on ${collectionName}/${docId}:`, webErr.message);
    }
  }

  return false;
}

/**
 * Create secure immutable Audit Logs (KVKK requirement compliance)
 */
export async function createAuditLog(
  actor: string,
  targetUser: string,
  action: string,
  details: string
) {
  const timestamp = new Date().toISOString();
  const logData = {
    timestamp,
    actor,         // e.g., "USER_PORTAL", "AEROAI_ASSISTANT", "SYSTEM", "ADMIN"
    targetUser,    // whose profile was accessed
    action,        // e.g., "PROFILE_CREATE", "PROFILE_ACCESS", "HEALTH_DATA_READ", "AUTO_DELETE_RETENTION"
    details        // human-readable description
  };

  console.log(`[AUDIT] [${timestamp}] Actor: ${actor} | Action: ${action} | Target: ${targetUser} | Details: ${details}`);

  // Option A (Preferred): Privileged Admin SDK
  if (adminDb && useAdminDb) {
    try {
      await adminDb.collection("audit_logs").add(logData);
      console.log("[Firestore Sync] Admin audit log write successful.");
      return;
    } catch (adminErr: any) {
      // Gracefully switch to Web SDK
      useAdminDb = false;
      console.warn("[Firestore Sync] Backend Admin audit log write failed. Falling back to Web SDK:", adminErr.message);
    }
  }

  // Option B: Web SDK Fallback
  if (webDb) {
    try {
      await addDoc(collection(webDb, "audit_logs"), logData);
      console.log("[Firestore Sync] Web audit log write successful.");
    } catch (webErr: any) {
      console.error("[AUDIT LOG ERROR] Failed to write audit trail record:", webErr.message);
    }
  }
}

/**
 * Automated customer profile purge when flight departs/closes (KVKK Data Retention limitation)
 */
export async function autoCleanClosedFlightUsers(flightNumber: string) {
  try {
    console.log(`[KVKK Veri Tasfiyesi] Uçuş kapandığı için (${flightNumber}) ait yolcu profilleri taranıyor...`);
    
    if (adminDb) {
      const usersRef = adminDb.collection("users");
      const snapshot = await usersRef.where("flightNumber", "==", flightNumber).get();
      
      let count = 0;
      const batch = adminDb.batch();
      
      snapshot.forEach((doc: any) => {
        const uId = doc.id;
        batch.delete(doc.ref);
        count++;
        
        // Log auditing for KVKK deletion
        createAuditLog(
          "SYSTEM",
          uId,
          "AUTO_DELETE_RETENTION",
          `Uçuş ${flightNumber} kapandı. KVKK Veri Saklama Sınırı uyarınca hassas erişilebilirlik ve özel nitelikli sağlık verileri kalıcı olarak imha edildi.`
        );
      });

      if (count > 0) {
        await batch.commit();
        console.log(`[KVKK Veri Tasfiyesi] ${count} adet yolcu verisi başarıyla kalıcı olarak diskten silindi.`);
      } else {
        console.log(`[KVKK Veri Tasfiyesi] Aktif uçuşta temizlenecek yolcu profili bulunamadı.`);
      }
    } else {
      console.warn("[KVKK Veri Tasfiyesi] Admin SDK yetkisi olmadığından temizlik atlandı.");
    }
  } catch (err: any) {
    console.error("[KVKK Veri Tasfiyesi] Otomatik imha esnasında hata:", err.message);
  }
}

/**
 * DHMİ Canlı Uçuş Veri Simülasyonu Firestore Senkronizasyon Yardımcı Fonksiyonu
 */
export async function syncFlightToFirestore(
  flightNum: string,
  status: string,
  secQueue: number,
  gateNum: string,
  delayReasonText: string
) {
  // Clean flight key to look up template attributes
  const flightKey = flightNum ? flightNum.replace("-", "") : "TK1903";
  const mockData = MOCK_BOARDINGS[flightKey] || {
    departureTime: "22:15",
    airportOperator: "İGA"
  };

  // Determine provider - default to SIMULATION for active sandbox flight
  const provider = flightNum === "TK-1903" ? "SIMULATION" : (mockData.airportOperator === "İGA" ? "IGA" : "AMADEUS");

  // Construct schedule fields
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

  let atd: string | null = null;
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

  const disruption = (status === "Delayed" || status === "Cancelled") ? {
    type: status === "Cancelled" ? "CANCELLATION" : "DELAY",
    reason: delayReasonText || "Hava koşulları veya yoğunluk kaynaklı kriz yönetimi."
  } : null;

  await writeDocSecurely("flights", flightNum, {
    flightNumber: flightNum,
    boardingStatus: status,
    securityQueueTime: secQueue,
    gate: gateNum,
    delayReason: delayReasonText || "Normal operasyonel akış sağlandı.",
    updatedAt: new Date().toISOString(),
    source: {
      provider,
      updatedAt: new Date().toISOString(),
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


/**
 * Yolcu ve Biyo-Veri Kayıt Senkronizasyon Yardımcı Fonksiyonu
 */
export async function syncUserToFirestore(
  userId: string,
  data: {
    name: string;
    email: string;
    accessibilityProfile: any;
  }
) {
  const fNum = guessFlightNumber(data.name);
  
  await writeDocSecurely("users", userId, {
    name: data.name,
    email: data.email,
    flightNumber: fNum,
    accessibilityProfile: data.accessibilityProfile,
    createdAt: new Date().toISOString()
  });

  // Track user creation event in audit trails
  const hasAcc = data.accessibilityProfile && data.accessibilityProfile.enabled;
  const details = hasAcc 
    ? `Kullanıcı kaydı oluşturuldu. [Özel Nitelikli Sağlık Verisi Onayı Alındı: ${data.accessibilityProfile.type}]` 
    : "Standart kullanıcı kaydı oluşturuldu.";

  await createAuditLog(
    "USER_PORTAL", 
    userId, 
    hasAcc ? "HEALTH_DATA_CONSENT" : "PROFILE_CREATE", 
    details
  );
}

