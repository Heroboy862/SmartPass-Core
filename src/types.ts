/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface FlightInfo {
  passengerName: string;
  flightNumber: string;
  from: string;
  fromCity: string;
  to: string;
  toCity: string;
  gate: string;
  boardingStatus: string; // "Waiting" | "Boarding" | "Closed" | "Delayed" | "Cancelled"
  seat: string;
  group: string;
  biometricVerified: boolean;
  boardingProgress: number; // Percent count
  estimatedWalkTime: string; // "4 min", etc.
  airline: string;
  airportOperator: "İGA" | "TAV" | "HEAŞ" | "DHMİ"; // Operators
  departureTime: string;
  securityQueueTime: number; // minutes
}

export interface AutomationResponse {
  flight: string;
  airport: string;
  liveInfo: {
    gate: string;
    status: string;
    source: string;
    walkingTime: string;
    securityQueue: number;
    delayMinutes: number;
  };
  services: {
    id: string;
    active: boolean;
    title: string;
    desc: string;
    icon: string;
  }[];
  alert: string | null;
}

export interface ChatMessage {
  id: string;
  sender: "user" | "assistant";
  text: string;
  timestamp: string;
}

export interface AccessibilityProfile {
  enabled: boolean;
  type: "wheelchair" | "vision" | "hearing" | "elderly" | "other" | "none";
  customRequest?: string;
  kvkkChecked: boolean;
  isUnder18?: boolean;
  guardianPhone?: string;
}
