import fs from "fs";
import path from "path";
import { SERVER_TRANSPORT_DATA, TransportRoute } from "../data/transportSchedules";

export interface TransportDataAdapter {
  fetchRoutes(hubId: string): Promise<Record<string, TransportRoute> | null>;
}

/**
 * 1. StaticTransportAdapter - Standard built-in baseline fallback routes
 */
export class StaticTransportAdapter implements TransportDataAdapter {
  async fetchRoutes(hubId: string): Promise<Record<string, TransportRoute> | null> {
    const data = SERVER_TRANSPORT_DATA[hubId];
    return data ? { ...data } : null;
  }
}

/**
 * 2. CmsJsonTransportAdapter - Periodically watches/parses a local JSON file on disk.
 * This simulates a headless CMS or external file synchronizer updating city transport variables dynamically.
 */
export class CmsJsonTransportAdapter implements TransportDataAdapter {
  private cmsFilePath: string;
  private cache: Record<string, Record<string, TransportRoute>> | null = null;
  private lastChecked: number = 0;
  private checkIntervalMs: number = 10000; // Poll or re-verify every 10 seconds

  constructor(filePath?: string) {
    this.cmsFilePath = filePath || path.join(process.cwd(), "server", "data", "cms_transport.json");
    this.initializeCmsFile();
  }

  private initializeCmsFile() {
    try {
      // If the file doesn't exist yet, bootstrap it with current hardcoded route data
      if (!fs.existsSync(this.cmsFilePath)) {
        const parentDir = path.dirname(this.cmsFilePath);
        if (!fs.existsSync(parentDir)) {
          fs.mkdirSync(parentDir, { recursive: true });
        }
        // Write the default mock schedules as a seed template
        fs.writeFileSync(this.cmsFilePath, JSON.stringify(SERVER_TRANSPORT_DATA, null, 2), "utf8");
        console.log(`[CmsJsonTransportAdapter] JSON CMS template initialized at ${this.cmsFilePath}`);
      }
    } catch (err: any) {
      console.error("[CmsJsonTransportAdapter] Failed to initialize CMS file seed:", err.message);
    }
  }

  async fetchRoutes(hubId: string): Promise<Record<string, TransportRoute> | null> {
    const now = Date.now();
    if (this.cache && (now - this.lastChecked < this.checkIntervalMs)) {
      return this.cache[hubId] ? { ...this.cache[hubId] } : null;
    }

    try {
      if (fs.existsSync(this.cmsFilePath)) {
        const content = fs.readFileSync(this.cmsFilePath, "utf8");
        const parsed = JSON.parse(content);
        this.cache = parsed;
        this.lastChecked = now;
        console.log(`[CmsJsonTransportAdapter] Transport routes loaded and verified from JSON CMS.`);
        
        if (parsed && parsed[hubId]) {
          return { ...parsed[hubId] };
        }
      }
    } catch (err: any) {
      console.warn(`[CmsJsonTransportAdapter] Failed to load JSON CMS. Returning fallback. Error:`, err.message);
    }

    return null;
  }
}

/**
 * 3. OperatorApiAdapter - Simulates communication with modern real-time transit APIs
 * (e.g. Metro Istanbul, IETT, Havaş, Muttaş, Antray) with robust error resilience & mock remote network layers.
 */
export class OperatorApiAdapter implements TransportDataAdapter {
  // Simulates a physical gateway fetch mapping
  async fetchRoutes(hubId: string): Promise<Record<string, TransportRoute> | null> {
    try {
      // In a real production system, this would translate to:
      // const res = await fetch(`https://api.transit-operator.gov.tr/hubs/${hubId}/routes`);
      // return await res.json();
      
      // Simulating a perfect REST API endpoint return with dynamic simulated congestion pricing (+3% or +5% on pricing based on day/time)
      const staticData = SERVER_TRANSPORT_DATA[hubId];
      if (!staticData) {
        return null;
      }

      // Deep copy to simulate API object retrieval
      const fetched: Record<string, TransportRoute> = {};
      const currentHour = new Date().getHours();
      const isPeakHours = currentHour >= 8 && currentHour <= 10 || currentHour >= 17 && currentHour <= 20;

      for (const key of Object.keys(staticData)) {
        const originalRoute = staticData[key];
        // Surcharge simulation representing real-time traffic demand factors at peak hours
        const peakPriceFactor = isPeakHours ? 1.05 : 1.0; 
        
        fetched[key] = {
          ...originalRoute,
          price: Math.round(originalRoute.price * peakPriceFactor),
          stops: [...originalRoute.stops],
          times: [...originalRoute.times]
        };
      }

      return fetched;
    } catch (err: any) {
      console.error("[OperatorApiAdapter] Transit Operator API fetch failed:", err.message);
      return null;
    }
  }
}

/**
 * Unified TransportDataManager that manages which adapter is currently selected
 * (Static baseline, JSON-polling CMS, or simulated Operator REST API).
 */
export class TransportDataManager {
  private static instance: TransportDataManager;
  
  private staticAdapter: StaticTransportAdapter;
  private cmsAdapter: CmsJsonTransportAdapter;
  private apiAdapter: OperatorApiAdapter;

  private currentStrategy: "STATIC" | "CMS" | "OPERATOR_API" = "CMS"; // Default to CMS for flexible live updates

  private constructor() {
    this.staticAdapter = new StaticTransportAdapter();
    this.cmsAdapter = new CmsJsonTransportAdapter();
    this.apiAdapter = new OperatorApiAdapter();

    // Check if configuration dictates a specific strategy
    const envStrategy = process.env.TRANSPORT_PROVIDER_STRATEGY;
    if (envStrategy === "STATIC" || envStrategy === "CMS" || envStrategy === "OPERATOR_API") {
      this.currentStrategy = envStrategy;
    }
  }

  public static getInstance(): TransportDataManager {
    if (!TransportDataManager.instance) {
      TransportDataManager.instance = new TransportDataManager();
    }
    return TransportDataManager.instance;
  }

  public setStrategy(strategy: "STATIC" | "CMS" | "OPERATOR_API") {
    this.currentStrategy = strategy;
    console.log(`[TransportDataManager] Active provider strategy changed to: ${strategy}`);
  }

  public getStrategy(): "STATIC" | "CMS" | "OPERATOR_API" {
    return this.currentStrategy;
  }

  /**
   * Fetch routes using the primary selected strategy, falling back gracefully down the chain if data is unavailable.
   */
  public async getRoutes(hubId: string): Promise<Record<string, TransportRoute>> {
    let result: Record<string, TransportRoute> | null = null;
    let attemptedStrategy = this.currentStrategy;

    try {
      if (this.currentStrategy === "OPERATOR_API") {
        result = await this.apiAdapter.fetchRoutes(hubId);
      } else if (this.currentStrategy === "CMS") {
        result = await this.cmsAdapter.fetchRoutes(hubId);
      }
    } catch (e: any) {
      console.warn(`[TransportDataManager] Main strategy [${attemptedStrategy}] failed. Falling back to static definitions.`, e.message);
    }

    // Fallback cascade
    if (!result) {
      result = await this.staticAdapter.fetchRoutes(hubId);
    }

    return result || {};
  }
}
