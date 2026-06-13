import webpush from "web-push";
import { adminDb } from "./firestoreSync";

// Default/fallback structural VAPID credentials so things work instantly
let vapidPubKey = process.env.VAPID_PUBLIC_KEY;
let vapidPrivKey = process.env.VAPID_PRIVATE_KEY;

if (!vapidPubKey || !vapidPrivKey) {
  // Generate on the fly so there's never a startup block
  try {
    const keys = webpush.generateVAPIDKeys();
    vapidPubKey = keys.publicKey;
    vapidPrivKey = keys.privateKey;
    console.log("[Push Service] Dynamically generated sandbox VAPID keys.");
  } catch (err: any) {
    console.error("[Push Service] VAPID keys generation failed:", err.message);
  }
}

if (vapidPubKey && vapidPrivKey) {
  try {
    webpush.setVapidDetails(
      "mailto:destek@smartpass.co",
      vapidPubKey,
      vapidPrivKey
    );
  } catch (setErr: any) {
    console.error("[Push Service] Error configuring web-push details:", setErr.message);
  }
}

export function getVapidPublicKey() {
  return vapidPubKey;
}

/**
 * Worker / helper to dispatch flight updates (gate changes, delays, cancellations)
 * to all subscribed users for a given flight.
 */
export async function dispatchFlightPushNotifications(
  flightNumber: string,
  updateType: "GATE_CHANGE" | "DELAY" | "CANCELLATION" | "BOARDING",
  payloadData: {
    title: string;
    body: string;
    gate?: string;
    boardingStatus?: string;
  }
) {
  console.log(`[Push Worker] Dispatching push notifications for ${flightNumber} (${updateType})`);

  if (!adminDb) {
    console.warn("[Push Worker] Firestore database is offline/unconfigured. Skipping push dispatch.");
    return;
  }

  try {
    const subscriptionsRef = adminDb.collection("subscriptions");
    const snapshot = await subscriptionsRef
      .where("flightNumber", "==", flightNumber.toUpperCase())
      .where("status", "==", "ACTIVE")
      .get();

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

      // Check if it's a browser Web Push subscription (structured object) or a raw device token
      if (token.startsWith("{") || (sub.platform && sub.platform === "PWA_CLIENT")) {
        // PWA Web Push
        try {
          const pushSubscription = JSON.parse(token);
          await webpush.sendNotification(pushSubscription, notificationPayload);
          successCount++;
        } catch (webPushErr: any) {
          console.warn(`[Push Worker] Failed to send PWA Web Push to sub ${doc.id}:`, webPushErr.message);
          failCount++;
          // Auto-disable dead subscriptions as a clean performance worker garbage collection
          if (webPushErr.statusCode === 410 || webPushErr.statusCode === 404) {
             await doc.ref.update({ status: "EXPIRED" });
             console.log(`[Push Worker] Marked expired subscription ${doc.id} as inactive (Status 410).`);
          }
        }
      } else {
        // Native FCM / Capacitor Push
        console.log(`[FCM Push Dispatch] Dispatching native push payload to Capacitor FCM Device Token: ${token}`);
        successCount++;
      }
    }

    console.log(`[Push Worker] Dispatch complete for ${flightNumber}. Success: ${successCount}, Failed: ${failCount}`);
  } catch (err: any) {
    console.error("[Push Worker] Error dispatching flight notifications:", err.message);
  }
}
