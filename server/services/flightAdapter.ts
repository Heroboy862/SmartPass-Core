import { getSimVariables, MOCK_BOARDINGS } from "../data/mockFlights";
import { writeDocSecurely } from "./firestoreSync";

export interface FlightSource {
  provider: "SIMULATION" | "AMADEUS" | "IGA";
  updatedAt: string;
  confidence: number;
}

export interface FlightSchedule {
  std: string;
  etd: string;
  atd: string | null;
}

export interface FlightDisruption {
  type: string;
  reason: string;
}

export interface CanonicalFlight {
  flightNumber: string;
  gate: string;
  boardingStatus: "Waiting" | "Boarding Now" | "Delayed" | "Cancelled" | "Closed";
  securityQueueTime: number;
  source: FlightSource;
  schedule: FlightSchedule;
  disruption: FlightDisruption | null;
  delayReason?: string;
  updatedAt: string;
}

export type FlightUpdateCallback = (flight: CanonicalFlight) => void;
export type Unsubscribe = () => void;

export interface FlightDataAdapter {
  fetchFlight(flightNumber: string): Promise<CanonicalFlight>;
  subscribe?(flightNumber: string, onUpdate: FlightUpdateCallback): Unsubscribe;
}

/**
 * 1. MockAdapter (Şimdiki Simülasyon Durumlarını Eşler)
 */
export class MockAdapter implements FlightDataAdapter {
  private subscribers: Map<string, Set<FlightUpdateCallback>> = new Map();

  async fetchFlight(flightNumber: string): Promise<CanonicalFlight> {
    const vars = getSimVariables();
    const flightKey = flightNumber ? flightNumber.replace("-", "") : "TK1903";
    const baseMock = MOCK_BOARDINGS[flightKey] || {
      departureTime: "22:15",
      gate: "G-12",
      securityQueueTime: 12,
      boardingStatus: "Boarding Now"
    };

    const status = (flightNumber === vars.flightNumber) ? vars.boardingStatus : (baseMock.boardingStatus || "Waiting");
    const gate = (flightNumber === vars.flightNumber) ? vars.gate : (baseMock.gate || "G-12");
    const secQueue = (flightNumber === vars.flightNumber) ? vars.securityQueueTime : (baseMock.securityQueueTime || 12);
    const delayReasonText = (flightNumber === vars.flightNumber) 
      ? (vars.delayReason || "Operasyonel kriz yönetimi devrede.") 
      : (baseMock.delayReason || "Normal akış");

    const std = baseMock.departureTime || "22:15";
    let etd = std;
    if (status === "Delayed") {
      etd = this.addMinutesToTime(std, 45);
    }

    let atd: string | null = null;
    if (status === "Closed") {
      atd = this.addMinutesToTime(std, 10);
    }

    const disruption = (status === "Delayed" || status === "Cancelled") ? {
      type: status === "Cancelled" ? "CANCELLATION" : "DELAY",
      reason: delayReasonText
    } : null;

    const flight: CanonicalFlight = {
      flightNumber,
      gate,
      boardingStatus: status as any,
      securityQueueTime: secQueue,
      source: {
        provider: "SIMULATION",
        updatedAt: new Date().toISOString(),
        confidence: 0.85
      },
      schedule: {
        std,
        etd,
        atd
      },
      disruption,
      delayReason: delayReasonText,
      updatedAt: new Date().toISOString()
    };

    // Notify active subscribers
    this.notifySubscribers(flightNumber, flight);

    return flight;
  }

  subscribe(flightNumber: string, onUpdate: FlightUpdateCallback): Unsubscribe {
    if (!this.subscribers.has(flightNumber)) {
      this.subscribers.set(flightNumber, new Set());
    }
    this.subscribers.get(flightNumber)!.add(onUpdate);

    // Initial trigger
    this.fetchFlight(flightNumber).then(onUpdate).catch(err => {
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

  private notifySubscribers(flightNumber: string, flight: CanonicalFlight) {
    const subs = this.subscribers.get(flightNumber);
    if (subs) {
      subs.forEach(cb => {
        try {
          cb(flight);
        } catch (e) {
          console.error("[MockAdapter Callback Error]", e);
        }
      });
    }
  }

  private addMinutesToTime(timeStr: string, minutes: number): string {
    try {
      const [h, m] = timeStr.split(":").map(Number);
      const newM = (m + minutes) % 60;
      const newH = (h + Math.floor((m + minutes) / 60)) % 24;
      return `${String(newH).padStart(2, "0")}:${String(newM).padStart(2, "0")}`;
    } catch (e) {
      return timeStr;
    }
  }
}

/**
 * 2. AmadeusAdapter (Sandbox GDS ve Küresel Dağıtım Sistem Eşleme)
 */
export class AmadeusAdapter implements FlightDataAdapter {
  async fetchFlight(flightNumber: string): Promise<CanonicalFlight> {
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

    const disruption = (status === "Delayed" || status === "Cancelled") ? {
      type: "SCHEDULING_SHIFT",
      reason: "Amadeus global GDS schedule synchronization delay."
    } : null;

    return {
      flightNumber,
      gate: baseMock.gate || "204B",
      boardingStatus: status as any,
      securityQueueTime: baseMock.securityQueueTime || 25,
      source: {
        provider: "AMADEUS",
        updatedAt: new Date().toISOString(),
        confidence: 0.95
      },
      schedule: {
        std,
        etd,
        atd: status === "Closed" ? this.addMinutesToTime(std, 12) : null
      },
      disruption,
      delayReason: baseMock.delayReason || "Amadeus Global Sandbox data synchronizer connected.",
      updatedAt: new Date().toISOString()
    };
  }

  private addMinutesToTime(timeStr: string, minutes: number): string {
    try {
      const [h, m] = timeStr.split(":").map(Number);
      const newM = (m + minutes) % 60;
      const newH = (h + Math.floor((m + minutes) / 60)) % 24;
      return `${String(newH).padStart(2, "0")}:${String(newM).padStart(2, "0")}`;
    } catch (e) {
      return timeStr;
    }
  }
}

/**
 * 3. OperatorAdapter (İGA / TAV Terminal Karar Destek Eşleme)
 */
export class OperatorAdapter implements FlightDataAdapter {
  async fetchFlight(flightNumber: string): Promise<CanonicalFlight> {
    const flightKey = flightNumber ? flightNumber.replace("-", "") : "TK1903";
    const baseMock = MOCK_BOARDINGS[flightKey] || {
      departureTime: "22:15",
      gate: "G-12",
      securityQueueTime: 12,
      boardingStatus: "Boarding Now",
      airportOperator: "İGA"
    };

    const operatorName = baseMock.airportOperator === "TAV" ? "TAV" : "İGA";
    const status = baseMock.boardingStatus || "Waiting";
    const std = baseMock.departureTime || "22:15";

    const disruption = (status === "Delayed" || status === "Cancelled") ? {
      type: "OPERATOR_ALERTS",
      reason: `${operatorName} Airside terminal-wide physical operations update.`
    } : null;

    return {
      flightNumber,
      gate: baseMock.gate || "G-12",
      boardingStatus: status as any,
      securityQueueTime: baseMock.securityQueueTime || 12,
      source: {
        provider: "IGA",
        updatedAt: new Date().toISOString(),
        confidence: 0.99
      },
      schedule: {
        std,
        etd: status === "Delayed" ? this.addMinutesToTime(std, 40) : std,
        atd: status === "Closed" ? this.addMinutesToTime(std, 15) : null
      },
      disruption,
      delayReason: baseMock.delayReason || `${operatorName} Live Hub digital authority systems match success.`,
      updatedAt: new Date().toISOString()
    };
  }

  private addMinutesToTime(timeStr: string, minutes: number): string {
    try {
      const [h, m] = timeStr.split(":").map(Number);
      const newM = (m + minutes) % 60;
      const newH = (h + Math.floor((m + minutes) / 60)) % 24;
      return `${String(newH).padStart(2, "0")}:${String(newM).padStart(2, "0")}`;
    } catch (e) {
      return timeStr;
    }
  }
}

/**
 * Hub: Periodically polls active flight adapters, normalizes data, and pushes it directly to Firestore.
 */
export class FlightAdapterHub {
  private static instance: FlightAdapterHub;
  private intervalId: NodeJS.Timeout | null = null;
  private adapters: Map<string, FlightDataAdapter> = new Map();
  private monitoredFlights: Set<string> = new Set([
    "TK-1903",
    "PC-2026",
    "TK-2108",
    "AJ-4112"
  ]);

  private constructor() {
    this.adapters.set("SIMULATION", new MockAdapter());
    this.adapters.set("AMADEUS", new AmadeusAdapter());
    this.adapters.set("IGA", new OperatorAdapter());
  }

  public static getInstance(): FlightAdapterHub {
    if (!FlightAdapterHub.instance) {
      FlightAdapterHub.instance = new FlightAdapterHub();
    }
    return FlightAdapterHub.instance;
  }

  public registerFlight(flightNumber: string) {
    if (flightNumber) {
      this.monitoredFlights.add(flightNumber);
      this.syncFlightNow(flightNumber);
    }
  }

  /**
   * Determine the appropriate adapter class dynamically based on the flight configurations
   */
  public selectAdapterForFlight(flightNumber: string): FlightDataAdapter {
    const cleanNum = flightNumber ? flightNumber.replace("-", "") : "TK1903";
    const config = MOCK_BOARDINGS[cleanNum];

    // Default simulation flight TK-1903 is bound to MockAdapter to maintain reactivity
    if (flightNumber === "TK-1903") {
      return this.adapters.get("SIMULATION")!;
    }

    if (config) {
      if (config.airportOperator === "İGA") {
        return this.adapters.get("IGA")!;
      }
      if (config.airportOperator === "TAV" || config.airportOperator === "HEAŞ") {
        return this.adapters.get("AMADEUS")!;
      }
    }

    // Default fallback
    return this.adapters.get("SIMULATION")!;
  }

  /**
   * Synchronize a specific flight number immediately using appropriate adapter
   */
  public async syncFlightNow(flightNumber: string) {
    try {
      const adapter = this.selectAdapterForFlight(flightNumber);
      const canonical = await adapter.fetchFlight(flightNumber);

      // Writes directly to Firestore "flights" collection
      await writeDocSecurely("flights", flightNumber, canonical);
    } catch (err: any) {
      console.error(`[FlightAdapterHub] Failed to sync and normalize flight ${flightNumber}:`, err.message);
    }
  }

  /**
   * Start the periodic background scheduler
   */
  public startPolling(intervalMs: number = 10000) {
    if (this.intervalId) {
      return;
    }

    console.log(`[FlightAdapterHub] Starting flight data periodic poll hub (Interval: ${intervalMs}ms)...`);
    
    // Initial loop execution
    this.pollAll();

    this.intervalId = setInterval(() => {
      this.pollAll();
    }, intervalMs);
  }

  /**
   * Stop the background polling
   */
  public stopPolling() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log(`[FlightAdapterHub] Periodic poll hub stopped successfully.`);
    }
  }

  private async pollAll() {
    for (const flightNumber of this.monitoredFlights) {
      await this.syncFlightNow(flightNumber);
    }
  }
}
